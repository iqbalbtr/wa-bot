import NodeCache from "@cacheable/node-cache";
import makeWASocket, { CacheStore, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, proto, useMultiFileAuthState, WASocket } from "@whiskeysockets/baileys";
import P from "pino";
import qrcode from "qrcode-terminal";
import logger from "../../shared/lib/logger";
import { Boom } from "@hapi/boom";
import path from "path";
import fs from "fs";
import { ClientEvent } from "../type/client";
import didYouMean from "didyoumean";
import { ClientLimiter } from "./limiter";
import { ClientCommand } from "./command";
import { UserSessionClient } from "./user-session";

export type WhatsappClientType = WASocket;

export class WhatsappClient {

    logger = logger;
    private session: WhatsappClientType | null = null;
    private msgRetryCounterCache = new NodeCache();
    command: ClientCommand;
    userActiveSession: UserSessionClient;
    limiter: ClientLimiter;

    constructor() { 
        this.command = new ClientCommand(this);
        this.userActiveSession = new UserSessionClient(this);
        this.limiter = new ClientLimiter(this);
    }

    async createSession() {
        if (this.session) {
            this.logger.info('Session already exists, skipping creation.');
            return;
        }

        const { state, saveCreds } = await useMultiFileAuthState('.wa-auth');
        const { version, isLatest } = await fetchLatestBaileysVersion();
        this.logger.info(`Using Baileys version: ${version.join('.')}, isLatest: ${isLatest}`);

        this.session = makeWASocket({
            version,
            logger: P({ level: "silent" }),
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys),
            },
            msgRetryCounterCache: this.msgRetryCounterCache as CacheStore,
            generateHighQualityLinkPreview: true,
        });

        this.attachMainHandlers();
        this.session.ev.on('creds.update', saveCreds);
    }

    private attachMainHandlers() {
        if (!this.session) return;

        this.session.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                this.logger.info('QR Code received, please scan.');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                this.logger.info(`Connection closed. Reconnecting: ${shouldReconnect}`);

                if (shouldReconnect) {
                    this.createSession().catch(err => this.logger.error("Failed to reconnect:", err));
                } else {
                    this.logger.warn("Not reconnecting because of logout.");
                }

            } else if (connection === 'open') {
                this.logger.info("Connection established successfully.");

                this.intializeEvents().catch(err => this.logger.error("Failed to initialize events:", err));
                this.command.intializeCommands().catch(err => this.logger.error("Failed to initialize commands:", err));

            }
        });
    }

    async destroySession() {
        if (!this.session) {
            throw new Error("User is not logged in");
        }
        await this.session.logout();
        this.session = null;
        this.logger.info("Success logout");
    }

    private async intializeEvents() {

        let total = 0
        const eventPath = path.resolve(process.cwd(), 'src', 'bot', 'event');

        const events = fs.readdirSync(eventPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

        for (const file of events) {
            const event = (await import(path.join(eventPath, file))).default as ClientEvent;
            if (this.session) {
                this.session.ev.on(event.event, (e: any) => event.listener(e, this));
                total++;
            }
        }

        this.logger.info(`Total events initialized: ${total}`);
    }

    public getSession(): WhatsappClientType | null {
        if (!this.session) {
            this.logger.warn("Session is not initialized.");
            return null;
        }
        return this.session;
    }

    public getPrefix(): string {
        return process.env.PREFIX || '!';
    }

    public defaultMessageReply(message: proto.IWebMessageInfo) {

        if (!this.session || !message.key) {
            this.logger.warn("Session or message key is not available.");
            return;
        }

        if (!message.message?.conversation) {

            this.session?.sendMessage(message.key.remoteJid!, {
                text: "Pesan kosong, tidak dapat memproses perintah."
            }, {
                quoted: message
            })

            return
        }

        const prefix = process.env.PREFIX || '!';
        const command = message.message.conversation.split(' ')[0];
        const allCommands = this.command.getCommandList().map(cmd => `${prefix}${cmd}`);

        if (allCommands.includes(command)) return;

        const suggestions = didYouMean(command, allCommands);

        if (suggestions && suggestions.length > 0) {

            this.session?.sendMessage(message.key.remoteJid!, {
                text: `Mungkin yang anda maksud adalah: *\`${suggestions}\`*. Gunakan *\`${prefix}help\`* untuk melihat daftar perintah yang tersedia.`
            }, {
                quoted: message
            })
            return
        }

        return this.session?.sendMessage(message.key.remoteJid!, {
            text: `Perintah tidak ditemukan. Gunakan *\`${prefix}help\`* untuk melihat daftar perintah yang tersedia.`
        }, {
            quoted: message
        });
    }
}