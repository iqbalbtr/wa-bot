import NodeCache from "@cacheable/node-cache";
import makeWASocket, {
    CacheStore,
    fetchLatestBaileysVersion,
    GroupMetadata,
    makeCacheableSignalKeyStore,
    proto,
    useMultiFileAuthState,
    WASocket,
} from "@whiskeysockets/baileys";
import P from "pino";
import logger from "../../shared/lib/logger";
import path from "path";
import fs from "fs";
import { ClientEvent, PayloadMessage } from "../type/client";
import didYouMean from "didyoumean";
import { ClientLimiter } from "./limiter";
import { ClientCommand } from "./command";
import { UserSessionClient } from "./user-session";
import { MessageClient } from "./message";
import { ContactClient } from "./contact";


/**
 * Kelas utama yang mengelola koneksi, sesi, dan modul-modul inti dari bot WhatsApp.
 */
export class WhatsappClient {

    public command: ClientCommand;
    public userActiveSession: UserSessionClient;
    public limiter: ClientLimiter;
    public message: MessageClient;
    public readonly logger = logger;
    public readonly groupCache = new NodeCache<GroupMetadata>();
    public startTime: number | null = null;
    public contact = new ContactClient(this);

    private session: WASocket | null = null;
    private readonly msgRetryCounterCache = new NodeCache();
    private readonly authFolderPath = path.resolve(process.cwd(), '.wa-auth');

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

        this.session.ev.on('creds.update', saveCreds);
        this.initializeEvents()
        this.command.initialize()
        this.contact.initialize()
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

    /**
     * Memuat semua file event dari direktori secara dinamis.
     */
    async initializeEvents(): Promise<void> {
        // Resolve relative to current compiled/source location so it works in both src and dist
        const eventPath = path.resolve(__dirname, '..', 'event');
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
            const files = fs.readdirSync(dirPath).filter(file => /\.(js|ts)$/.test(file));

            for (const file of files) {
                const rawPath = path.join(dirPath, file);
                // Prefer .js counterpart if running from dist and both exist
                let modulePath = rawPath;
                if (file.endsWith('.ts')) {
                    const jsCandidate = rawPath.replace(/\.ts$/, '.js');
                    if (fs.existsSync(jsCandidate)) modulePath = jsCandidate;
                }

                let loaded: any;
                try {
                    // Use require for CJS environment; fallback to dynamic import if needed
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    loaded = require(modulePath);
                    loaded = loaded?.default || loaded;
                } catch (inner) {
                    try {
                        loaded = (await import(modulePath)).default;
                    } catch (impErr) {
                        this.logger.error(`Failed to import module: ${modulePath}`, impErr);
                        continue;
                    }
                }

                if (loaded) onModuleLoad(loaded as T);
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

    public getInfoClient() {
        if (!this.session?.user) {
            this.logger.warn("Session or user info is not available.");
            return null;
        }
        return {
            name: this.session.user.name || "Unknown",
            phone: this.session.user.id.split(":")[0] || "Unknown",
            lid: this.session.user.lid?.split(":")[0] || "Unknown",
        };
    }

    /**
     * Mengirim balasan default jika command tidak ditemukan.
     */
    public async defaultMessageReply(message: proto.IWebMessageInfo, payload: PayloadMessage): Promise<void> {

        const session = this.getSession();
        const remoteJid = message.key?.remoteJid;
        if (!session || !remoteJid) return;

        const commandText = payload.text.split(' ')[0] || "";
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

        await session.sendMessage(remoteJid, { text: replyText });
    }

    public getStartTime(): number {
        return this.startTime || 0;
    }
}