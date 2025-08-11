import { BaileysEventMap, proto } from "@whiskeysockets/baileys";
import { Client, CommandType, PayloadMessage, SessionUserType } from "../type/client";
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

            const commandFiles = fs.readdirSync(baseDir).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
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

    private normalizeAttachment(msg: proto.IMessage) {
        if (msg?.documentWithCaptionMessage?.message) {
            const docMsg = msg.documentWithCaptionMessage.message.documentMessage;
            if (docMsg) {
                msg.documentMessage = docMsg;
                if (docMsg.caption) {
                    msg.conversation = docMsg.caption;
                }
            }
            delete msg.documentWithCaptionMessage;
        }
        return msg!;
    }

    public async handleCommandEvent(data: BaileysEventMap["messages.upsert"]): Promise<void> {
        const msg = data.messages[0];


        if (msg.key.fromMe || !msg.message || !msg.key.remoteJid) {
            return;
        }

        const from = msg.key.remoteJid.endsWith("@g.us") ? msg.key.participant || "" : msg.key.remoteJid || "";

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
        const message = this.normalizeAttachment({ ...msg.message, ...this.parseMessageEphemeral(msg) });
        const text = extractMessageFromGroupMessage(this.getMessageText(msg))

        const payload: PayloadMessage = {
            from,
            text,
            timestamp: Date.now(),
            message,
            isGroup: msg.key.remoteJid?.endsWith("@g.us") || false,
            metionsIds: this.extractMentionedJids(msg)
        }

        console.log(JSON.stringify(payload, null, 2));


        if (userInSession) {
            this.handleSessionUser(payload, msg, userInSession);
        } else {
            this.handleNormalUser(payload, msg);
        }
    }

    private handleSessionUser(payload: PayloadMessage, msg: proto.IWebMessageInfo, userInSession: SessionUserType) {

        if (!this.shouldProcess(payload)) return;

        const commandName = extractCommandFromPrefix(payload.text || "") || "";

        if (this.handleSessionExitOrInvalid(msg, commandName, userInSession)) {
            let sessionCommand = userInSession.session.commands?.find(c => c.name === commandName);

            if (sessionCommand) {
                sessionCommand.execute(msg, this.client, payload, userInSession.data);
            } else {
                this.client.defaultMessageReply(msg, payload);
            }
        }
    }

    private handleNormalUser(payload: PayloadMessage, msg: proto.IWebMessageInfo) {
        if (!this.shouldProcess(payload)) return;

        const commandName = extractCommandFromPrefix(payload.text || "");
        const command = this.getCommand(commandName || "");

        if (command) {
            command.execute(msg, this.client, payload);
        } else {
            this.client.defaultMessageReply(msg, payload);
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

        if (msg.documentWithCaptionMessage?.message) {
            const subMsg = msg.documentWithCaptionMessage.message;
            for (const key of Object.keys(subMsg)) {
                const contextInfo = (subMsg as any)[key]?.contextInfo;
                if (contextInfo?.mentionedJid) {
                    return contextInfo.mentionedJid;
                }
            }
        }

        for (const key of Object.keys(msg)) {
            const mediaMsg = (msg as any)[key];
            if (mediaMsg?.contextInfo?.mentionedJid) {
                return mediaMsg.contextInfo.mentionedJid;
            }
        }

        return [];
    }

    private shouldProcess(payload: PayloadMessage): boolean {

        if (!payload.isGroup) return true;

        let isGroupAccepted = false;
        const clientId = this.client.getInfoClient()

        payload.metionsIds?.forEach(txt => {

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
            this.client.getSession()?.sendMessage(msg.key.remoteJid!, { text: `Sesi *${session.session.name}* telah diakhiri.` });
            return false;
        }

        if (commandName.toLowerCase() === '/back' && session.current.length > 1) {
            this.client.userActiveSession.backUserSession(msg, 1);

            let command = null;
            for (const name of session.current.slice(-1)) {
                if (!command) {
                    command = this.client.command.getCommand(name);
                } else {
                    command = command.commands?.find(c => c.name === name);
                }
            }

            session.session = command!;

            const helpText = this.buildSessionHelpText(command!, (session.current.length - 1) > 1);
            this.client.getSession()?.sendMessage(msg.key.remoteJid!, { text: helpText });
            return false
        }

        const isValidCommand = commands.some(c => c.name === commandName);
        if (!isValidCommand) {
            const helpText = this.buildSessionHelpText(session.session, session.current.length > 1);
            this.client.getSession()?.sendMessage(msg.key.remoteJid!, { text: helpText });
            return false;
        }

        return true;
    }

    private buildSessionHelpText(command: CommandType, isBack: boolean): string {

        let content = 'Perintah tidak valid. Gunakan salah satu perintah berikut:';

        if (!command.commands || !command.commands.length) {
            return "Perintah tidak dikenali silakan *`/exit`* ";
        }

        command.commands?.forEach(cmd => {
            content += `\n- *\`${cmd.name}\`* ${cmd.description}`;
        });
        if (isBack) {
            content += "\n- *`/back`* untuk kembali ke sesi sebelumnya.";
        }
        content += "\n- *`/exit`* untuk keluar dari sesi ini.";
        return content;
    }
}