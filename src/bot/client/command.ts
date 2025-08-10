import { BaileysEventMap, proto } from "@whiskeysockets/baileys";
import { Client, CommandSessionContentType, CommandType, SessionUserType } from "../type/client";
import path from "path";
import fs from "fs";
import { extractCommandFromPrefix, extractContactId, extractLid, extractMessageFromGroupMessage, middlewareApplier } from "../lib/util";
import logger from "../../shared/lib/logger";
import { blockUserMiddleware } from "../middleware/block-user";
import { limiterMiddleware } from "../middleware/limiter";

export class ClientCommand {
    private commands: Map<string, CommandType> = new Map<string, CommandType>();

    constructor(private client: Client) { }

    public addCommand(command: CommandType): void {
        this.commands.set(command.name, command);
    }

    public getCommand(name: string): CommandType | undefined {
        return this.commands.get(name);
    }

    public getCommands(): CommandType[] {

        return Array.from(this.commands.values());
    }

    public getCommandCount(): number {
        return this.commands.size;
    }

    public async initialize() {
        await this.loadCommandsFromDirectory();
    }


    private async loadCommandsFromDirectory() {
        // Resolve relative to current file so it works from dist or src
        const baseDir = path.resolve(__dirname, '..', 'command');
        try {
            if (!fs.existsSync(baseDir)) {
                this.client.logger.warn(`Command directory not found: ${baseDir}`);
                return;
            }
            const commandFiles = fs.readdirSync(baseDir).filter(file => file.endsWith('.js'));
            let total = 0;
            for (const file of commandFiles) {
                const fullPath = path.join(baseDir, file);
                let mod: any;
                try {
                    // Prefer require in CJS environments
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    mod = require(fullPath);
                    mod = mod?.default || mod;
                } catch (reqErr) {
                    try {
                        mod = (await import(fullPath)).default;
                    } catch (impErr) {
                        this.client.logger.error(`Failed to load command module ${file}:`, impErr);
                        continue;
                    }
                }
                if (mod && mod.name) {
                    this.addCommand(mod as CommandType);
                    total++;
                }
            }
            this.client.logger.info(`Total commands initialized: ${total}`);
        } catch (error) {
            this.client.logger.error("Failed to load commands:", error);
        }
    }


    public async handleCommandEvent(data: BaileysEventMap["messages.upsert"]): Promise<void> {
        const msg = data.messages[0];


        if (msg.key.fromMe || !msg.message || !msg.key.remoteJid) {
            return;
        }

        msg.message = { ...msg.message, ...this.parseMessageEphemeral(msg) };

        const from = msg.key.remoteJid.endsWith("@g.us") ? msg.key.participant || "" : msg.key.remoteJid || "";
        const text = extractMessageFromGroupMessage(this.getMessageText(msg))

        msg.message.conversation = text;

        try {
            await middlewareApplier(
                { client: this.client, params: msg },
                [blockUserMiddleware, limiterMiddleware],
                () => this.processMessage(msg, from)
            );
        } catch (error) {
            logger.error(`Error executing command or middleware for ${from}:`, error);
        } finally {
            this.client.limiter.removeUser(from);
        }
    }


    private async processMessage(msg: proto.IWebMessageInfo, from: string) {
        const userInSession = this.client.userActiveSession.getUserSession(from);

        if (userInSession) {
            this.handleSessionUser(msg, userInSession);
        } else {
            this.handleNormalUser(msg);
        }
    }

    private handleSessionUser(msg: proto.IWebMessageInfo, userInSession: SessionUserType) {

        if (!this.shouldProcess(msg)) return;

        const commandName = extractCommandFromPrefix(msg.message?.conversation || "") || "";

        if (this.handleSessionExitOrInvalid(msg, commandName, userInSession)) {
            const sessionCommand = this.findSessionCommand(commandName, userInSession.session.commands);
            sessionCommand?.execute(msg, this.client, userInSession.data);
        }
    }

    private handleNormalUser(msg: proto.IWebMessageInfo) {
        if (!this.shouldProcess(msg)) return;

        const commandName = extractCommandFromPrefix(msg.message?.conversation || "");
        const command = this.getCommand(commandName || "");

        if (command) {
            command.execute(msg, this.client);
        } else {

            this.client.defaultMessageReply(msg);
        }
    }

    private parseMessageEphemeral(msg: proto.IWebMessageInfo) {
        const content = msg.message?.ephemeralMessage?.message || msg.message;
        return content
    }

    private getMessageText(msg: proto.IWebMessageInfo): string {
        const content = msg.message?.ephemeralMessage?.message || msg.message;

        if (!content) return "";

        return content.buttonsResponseMessage?.selectedDisplayText ||
            content.documentWithCaptionMessage?.message?.documentMessage?.caption ||
            content.listResponseMessage?.singleSelectReply?.selectedRowId ||
            content.templateButtonReplyMessage?.selectedDisplayText ||
            content.extendedTextMessage?.text ||
            content.imageMessage?.caption ||
            content.videoMessage?.caption ||
            content.documentMessage?.caption ||
            content.conversation || "";
    }

    private extractMentionedJids(message: proto.IWebMessageInfo): string[] {
        const msg = message.message;
        if (!msg) return [];

        if (msg.conversation && message.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            return message.message.extendedTextMessage.contextInfo.mentionedJid;
        }

        if (msg.extendedTextMessage?.contextInfo?.mentionedJid) {
            return msg.extendedTextMessage.contextInfo.mentionedJid;
        }

        for (const key of Object.keys(msg)) {
            const mediaMsg = (msg as any)[key];
            if (mediaMsg?.contextInfo?.mentionedJid) {
                return mediaMsg.contextInfo.mentionedJid;
            }
        }

        return [];
    }

    private shouldProcess(msg: proto.IWebMessageInfo): boolean {
        const isGroup = msg.key.remoteJid?.endsWith("@g.us") || false;
        if (!isGroup) return true;

        let isGroupAccepted = false;
        const clientId = this.client.getInfoClient()

        this.extractMentionedJids(msg).forEach(txt => {

            if (isGroupAccepted) return;

            if (txt.endsWith("@lid") && extractLid(txt).includes(clientId?.lid || "")) {
                isGroupAccepted = true;
            } else {
                if (extractContactId(txt) == clientId?.phone) {
                    isGroupAccepted = true;
                }
            }

        })

        return isGroupAccepted;
    }

    private handleSessionExitOrInvalid(msg: proto.IWebMessageInfo, commandName: string, session: SessionUserType): boolean {
        const commands = session.session.commands || [];

        if (commandName.toLowerCase() === '/exit') {
            this.client.userActiveSession.removeUserSession(msg);
            this.client.getSession()?.sendMessage(msg.key.remoteJid!, { text: `Sesi *${session.session.name}* telah diakhiri.` }, { quoted: msg });
            return false;
        }

        const isValidCommand = commands.some(c => c.name === commandName);
        if (!isValidCommand) {
            const helpText = this.buildSessionHelpText(session.session.name);
            this.client.getSession()?.sendMessage(msg.key.remoteJid!, { text: helpText }, { quoted: msg });
            return false;
        }

        return true;
    }

    private buildSessionHelpText(sessionName: string): string {
        const mainCommand = this.getCommand(sessionName);
        if (!mainCommand?.commands) return 'Command sesi tidak ditemukan.';

        let content = 'Perintah tidak valid. Gunakan salah satu perintah berikut:';
        mainCommand.commands.forEach(cmd => {
            content += `\n- *\`${cmd.name}\`* ${cmd.description}`;
        });
        content += "\n- *`/exit`* untuk keluar dari sesi ini.";
        return content;
    }

    private findSessionCommand(commandName: string, sessionCommands: CommandSessionContentType[] = []): CommandSessionContentType | undefined {
        return sessionCommands.find(cmd => cmd.name === commandName);
    }
}