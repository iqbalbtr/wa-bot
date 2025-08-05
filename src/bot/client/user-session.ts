import { proto } from "@whiskeysockets/baileys";
import { extractContactId } from "../lib/util";
import { Client, CommandType, SessionUserType } from "../type/client";
import logger from "../../shared/lib/logger";

export class UserSessionClient {
    private userSessions: Map<string, SessionUserType> = new Map<string, SessionUserType>();

    constructor(private client: Client) {
    }

    public addUserSession(msg: proto.IWebMessageInfo, sessionName: string, data?: object): void {
        const clientSession = this.client.getSession();

        const user = msg.key.remoteJid || ""

        const session = this.client.command.getCommand(sessionName);

        if (!session) {

            clientSession?.sendMessage(msg.key.remoteJid || "", {
                text: "Maaf terjadi kesalahan tidak dikenali"
            }, {
                quoted: msg
            });

            return
        }

        this.userSessions.set(user, {
            session,
            data: data || {}
        })

        logger.info("all user session", this.userSessions)
        
        return
    }
    
    public getUserSession(userId: string): SessionUserType | undefined {
        logger.info("all user session", this.userSessions)
        return this.userSessions.get(userId);
    }

    public removeUserSession(userId: string): void {
        this.userSessions.delete(userId);

    }

    public clearAllSessions(): void {
        this.userSessions.clear();
    }

    public getUserSessions(){
        return Array.from(this.userSessions.keys())
    }
}