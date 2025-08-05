import NodeCache from "@cacheable/node-cache";
import makeWASocket, {
    CacheStore,
    DisconnectReason,
    fetchLatestBaileysVersion,
    GroupMetadata,
    makeCacheableSignalKeyStore,
    proto,
    useMultiFileAuthState,
    WASocket,
} from "@whiskeysockets/baileys";
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
import { MessageClient } from "./message";


/**
 * Kelas utama yang mengelola koneksi, sesi, dan modul-modul inti dari bot WhatsApp.
 */
export class WhatsappClient {

    public command: ClientCommand;
    public userActiveSession: UserSessionClient;
    public limiter: ClientLimiter;
    public message: MessageClient;
    public readonly logger = logger;

    private session: WASocket | null = null;
    private readonly msgRetryCounterCache = new NodeCache();
    private readonly groupCache = new NodeCache<GroupMetadata>();
    private readonly authFolderPath = path.resolve(process.cwd(), '.wa-auth');
    private startTime: number | null = null;

    constructor() {
        this.command = new ClientCommand(this);
        this.userActiveSession = new UserSessionClient(this);
        this.limiter = new ClientLimiter(this);
        this.message = new MessageClient(this);
    }

    // --- Lifecycle Management ---

    /**
     * Membuat dan menginisialisasi sesi baru dengan WhatsApp.
     */
    public async createSession(): Promise<void> {
        if (this.session) {
            this.logger.info('Session already exists, skipping creation.');
            return;
        }

        const { state, saveCreds } = await useMultiFileAuthState(this.authFolderPath);
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
            cachedGroupMetadata: async (jid) => this.groupCache.get(jid),
        });

        this.attachMainHandlers();
        this.session.ev.on('creds.update', saveCreds);
    }

    /**
     * Menghancurkan sesi aktif dan membersihkan file autentikasi jika diminta.
     */
    public async destroySession(deleteAuthFolder = false): Promise<void> {
        try {
            if (this.session) {
                await this.session.logout();
                this.logger.info("Session logged out successfully.");
            }
            if (deleteAuthFolder && fs.existsSync(this.authFolderPath)) {
                await fs.promises.rm(this.authFolderPath, { recursive: true, force: true });
                this.logger.info("Authentication folder deleted.");
            }
        } catch (error) {
            this.logger.error("Error during session destruction:", error);
        } finally {
            this.session = null;
        }
    }

    // --- Event Handlers ---

    /**
     * Mendaftarkan handler utama untuk koneksi dan grup.
     */
    private attachMainHandlers(): void {
        if (!this.session) return;

        this.session.ev.on('connection.update', (update) => this.handleConnectionUpdate(update));
        this.session.ev.on("groups.update", ([event]) => this.updateGroupCache(event.id!));
        this.session.ev.on('group-participants.update', (event) => this.updateGroupCache(event.id));
    }

    /**
     * Menangani pembaruan status koneksi.
     */
    private async handleConnectionUpdate(update: { connection?: any; lastDisconnect?: any; qr?: any; }): Promise<void> {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            this.logger.info('QR Code received, please scan.');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            await this.handleConnectionClose(lastDisconnect);
        } else if (connection === 'open') {
            await this.handleConnectionOpen();
        }
    }

    /**
     * Logika yang dijalankan saat koneksi berhasil terbuka.
     */
    private async handleConnectionOpen(): Promise<void> {
        this.startTime = Date.now();
        this.logger.info("Connection established successfully.");
        try {
            await this.initializeEvents();
            await this.command.initialize();
            await this.message.initializeMessageStore(this);
        } catch (error) {
            this.logger.error("Failed during post-connection initialization:", error);
        }
    }

    /**
     * Logika yang dijalankan saat koneksi tertutup.
     */
    private async handleConnectionClose(lastDisconnect: any): Promise<void> {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;

        if (statusCode === DisconnectReason.loggedOut) {
            this.logger.warn("Connection logged out. Please delete the auth folder and restart.");
            await this.destroySession(true); // Hancurkan sesi dan hapus folder auth
            return;
        }

        this.logger.info(`Connection closed (Reason: ${DisconnectReason[statusCode as number] || 'Unknown'}). Attempting to reconnect...`);
        this.session = null;
        this.startTime = null;
        await this.createSession().catch(err => this.logger.error("Failed to re-create session:", err));
    }

    // --- Dynamic Module Loaders ---

    /**
     * Memuat semua file event dari direktori secara dinamis.
     */
    private async initializeEvents(): Promise<void> {
        const eventPath = path.resolve(process.cwd(), 'src', 'bot', 'event');
        let total = 0;
        await this.loadModulesFromDirectory<ClientEvent>(eventPath, (event) => {
            this.session?.ev.on(event.event, (e: any) => event.listener(e, this));
            total++;
        });
        this.logger.info(`Total events initialized: ${total}`);
    }

    /**
     * Utilitas generik untuk memuat modul dari sebuah direktori.
     */
    private async loadModulesFromDirectory<T>(dirPath: string, onModuleLoad: (module: T) => void): Promise<void> {
        try {
            if (!fs.existsSync(dirPath)) return;
            const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

            for (const file of files) {
                const modulePath = path.join(dirPath, file);
                const module = (await import(modulePath)).default as T;
                if (module) {
                    onModuleLoad(module);
                }
            }
        } catch (error) {
            this.logger.error(`Failed to load modules from ${dirPath}:`, error);
        }
    }

    // --- Utilities and Getters ---

    public getSession(): WASocket | null {
        if (!this.session) this.logger.warn("Attempted to get a non-existent session.");
        return this.session;
    }

    public getPrefix(): string {
        return process.env.PREFIX || '!';
    }

    public getInfoClient(): { name: string; phone: string } | null {
        if (!this.session?.user) {
            this.logger.warn("Session or user info is not available.");
            return null;
        }
        return {
            name: this.session.user.name || "Unknown",
            phone: this.session.user.id.split(":")[0] || "Unknown",
        };
    }

    /**
     * Mengirim balasan default jika command tidak ditemukan.
     */
    public async defaultMessageReply(message: proto.IWebMessageInfo): Promise<void> {
        const session = this.getSession();
        const remoteJid = message.key?.remoteJid;
        if (!session || !remoteJid) return;

        const commandText = message.message?.conversation?.split(' ')[0] || "";
        if (!commandText) return; 

        const prefix = this.getPrefix();
        const commandName = commandText.replace(prefix, '');
        const allCommandNames = this.command.getCommands().map(cmd => cmd.name);

        if (allCommandNames.includes(commandName)) return;

        const suggestions = didYouMean(commandName, allCommandNames) as string | string[] | false;
        let replyText = `Perintah tidak ditemukan. Gunakan *${prefix}help* untuk melihat daftar perintah.`;

        if (suggestions) {
            const suggestion = Array.isArray(suggestions) ? suggestions[0] : suggestions;
            replyText = `Mungkin yang Anda maksud adalah: *${prefix}${suggestion}*`;
        }

        await session.sendMessage(remoteJid, { text: replyText }, { quoted: message });
    }

    /**
     * Memperbarui cache metadata grup.
     */
    private async updateGroupCache(groupId: string): Promise<void> {
        if (!this.session || !groupId) return;
        try {
            const metadata = await this.session.groupMetadata(groupId);
            this.groupCache.set(groupId, metadata);
        } catch (error) {
            this.logger.warn(`Failed to update cache for group ${groupId}:`, error);
        }
    }

    public getStartTime(): number {
        return this.startTime || 0;
    }
}