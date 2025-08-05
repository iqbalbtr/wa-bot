import { BaileysEventMap, proto } from "@whiskeysockets/baileys";
import { Client, CommandSessionContentType, CommandType, SessionUserType } from "../type/client";
import path from "path";
import fs from "fs";
import { extractCommandFromPrefix, extractContactId, middlewareApplier } from "../lib/util";
import logger from "../../shared/lib/logger";
import { blockUserMiddleware } from "../middleware/block-user";
import { limiterMiddleware } from "../middleware/limiter";

/**
 * Mengelola, memuat, dan mengeksekusi semua command untuk client Baileys.
 */
export class ClientCommand {
    private commands: Map<string, CommandType> = new Map<string, CommandType>();

    constructor(private client: Client) { }

    // --- Metode Publik untuk Manajemen Command ---

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
    // --- Inisialisasi dan Event Handler Utama ---

    /**
     * Memuat semua file command dari direktori dan mendaftarkan event handler utama.
     */
    public async initialize() {
        await this.loadCommandsFromDirectory();
        this.client.getSession()?.ev.on("messages.upsert", this.onMessagesUpsert.bind(this));
    }

    /**
     * Memuat command dari file secara dinamis.
     */
    private async loadCommandsFromDirectory() {
        const commandPath = path.resolve(process.cwd(), 'src', 'bot', 'command');
        try {
            const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
            let total = 0;
            for (const file of commandFiles) {
                const commandModule = (await import(path.join(commandPath, file))).default;
                if (commandModule && commandModule.name) {
                    this.addCommand(commandModule as CommandType);
                    total++;
                }
            }
            this.client.logger.info(`Total commands initialized: ${total}`);
        } catch (error) {
            this.client.logger.error("Failed to load commands:", error);
        }
    }

    /**
     * Handler utama yang dipicu setiap kali ada pesan masuk.
     * @param data Data event 'messages.upsert' dari Baileys.
     */
    private async onMessagesUpsert(data: BaileysEventMap["messages.upsert"]): Promise<void> {
        const msg = data.messages[0];

        // Guard clause untuk mengabaikan pesan yang tidak relevan
        if (msg.key.fromMe || !msg.message || !msg.key.remoteJid) {
            return;
        }

        const from = extractContactId(msg.key.remoteJid);
        const text = this.getMessageText(msg);

        // Normalisasi pesan agar `msg.message.conversation` selalu berisi teks utama
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

    // --- Logika Pemrosesan Pesan ---

    /**
     * Memproses pesan setelah melewati middleware.
     */
    private async processMessage(msg: proto.IWebMessageInfo, from: string) {
        const userInSession = this.client.userActiveSession.getUserSession(from);

        if (userInSession) {
            this.handleSessionUser(msg, userInSession);
        } else {
            this.handleNormalUser(msg);
        }
    }
    
    /**
     * Menangani logika untuk pengguna yang sedang dalam sesi command.
     */
    private handleSessionUser(msg: proto.IWebMessageInfo, userInSession: SessionUserType) {
        if (!this.shouldProcess(msg)) return;

        const commandName = msg.message?.conversation?.split(" ")[0] || "";
        
        // Cek apakah user ingin keluar dari sesi atau command tidak valid
        if (this.handleSessionExitOrInvalid(msg, commandName, userInSession)) {
             const sessionCommand = this.findSessionCommand(commandName, userInSession.session.commands);
             sessionCommand?.execute(msg, this.client, userInSession.data);
        }
    }

    /**
     * Menangani logika untuk pengguna normal (tidak dalam sesi).
     */
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

    // --- Metode Helper & Utilitas ---

    /**
     * Mengekstrak teks dari berbagai jenis format pesan.
     */
    private getMessageText(msg: proto.IWebMessageInfo): string {
        const content = msg.message;
        if (!content) return "";

        return content.buttonsResponseMessage?.selectedDisplayText ||
            content.listResponseMessage?.singleSelectReply?.selectedRowId ||
            content.templateButtonReplyMessage?.selectedDisplayText ||
            content.extendedTextMessage?.text ||
            content.imageMessage?.caption ||
            content.videoMessage?.caption ||
            content.documentMessage?.caption ||
            content.conversation || "";
    }

    /**
     * Memeriksa apakah pesan harus diproses (bukan dari grup atau di-mention).
     */
    private shouldProcess(msg: proto.IWebMessageInfo): boolean {
        const isGroup = msg.key.remoteJid?.endsWith("@g.us") || false;
        if (!isGroup) return true; // Selalu proses jika ini private chat

        const clientId = this.client.getInfoClient()?.phone || "";
        const isMentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid
            ?.map(extractContactId)
            .includes(clientId) || false;
        
        return isMentioned; // Proses jika di grup dan bot di-mention
    }

    /**
     * Menangani kasus keluar sesi atau command tidak valid dalam sesi.
     * @returns `true` jika command valid dan bisa dieksekusi, `false` sebaliknya.
     */
    private handleSessionExitOrInvalid(msg: proto.IWebMessageInfo, commandName: string, session: SessionUserType): boolean {
        const commands = session.session.commands || [];

        if (commandName.toLowerCase() === '/exit') {
            this.client.userActiveSession.removeUserSession(msg.key.remoteJid || '');
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

    /**
     * Membuat teks bantuan yang berisi daftar command dalam sebuah sesi.
     */
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

    /**
     * Mencari command spesifik dari daftar command sesi.
     */
    private findSessionCommand(commandName: string, sessionCommands: CommandSessionContentType[] = []): CommandSessionContentType | undefined {
        return sessionCommands.find(cmd => cmd.name === commandName);
    }
}