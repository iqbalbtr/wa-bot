import { proto } from "@whiskeysockets/baileys";
import { Client, SessionUserType } from "../type/client";
import logger from "../../shared/lib/logger";

export class UserSessionClient {
    private userSessions: Map<string, SessionUserType> = new Map<string, SessionUserType>();

    constructor(private client: Client) {
    }

    public addUserSession(msg: proto.IWebMessageInfo, sessionName: string, data?: object): void {
        const clientSession = this.client.getSession();

        const user = msg.key.remoteJid?.endsWith("@g.us") ? msg.key.participant || "" : msg.key.remoteJid || "";

        const session = this.client.command.getCommand(sessionName);

        if (!session) {

            clientSession?.sendMessage(msg.key.remoteJid || "", {
                text: "Maaf terjadi kesalahan tidak dikenali"
            }, {
                quoted: msg
            });

            return
        }

        logger.warn("Session not found for user:", user);

        this.userSessions.set(user, {
            session,
            data: data || {}
        })

        return
    }

    public getUserSession(userId: string): SessionUserType | undefined {
                return this.userSessions.get(userId);
    }

    public removeUserSession(msg: proto.IWebMessageInfo): void {
        const userId = msg.key.remoteJid?.endsWith("@g.us") ? msg.key.participant || "" : msg.key.remoteJid || "";
        this.userSessions.delete(userId);
    }

    public clearAllSessions(): void {
        this.userSessions.clear();
    }

    public getUserSessions() {
        return Array.from(this.userSessions.keys())
    }
}