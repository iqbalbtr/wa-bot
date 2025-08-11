import { proto } from "@whiskeysockets/baileys";
import { Client, CommandType, SessionUserType } from "../type/client";

export class UserSessionClient {
    private userSessions: Map<string, SessionUserType> = new Map<string, SessionUserType>();

    constructor(private client: Client) {
    }

    public addUserSession(msg: proto.IWebMessageInfo, sessionName: string, data?: object): void {
        const clientSession = this.client.getSession();

        const user = msg.key.remoteJid?.endsWith("@g.us") ? msg.key.participant || "" : msg.key.remoteJid || "";

        const existingSession = this.userSessions.get(user);

        let session: CommandType | undefined = this.client.command.getCommand(sessionName);

        if (existingSession) {
            for (const cmd of [...(existingSession?.current as string[]), sessionName]) {
                if (!session) {
                    session = this.client.command.getCommand(cmd);
                } else {
                    session = session.commands?.find(c => c.name === cmd);
                }
            }
        }

        if (!session) {

            clientSession?.sendMessage(msg.key.remoteJid || "", {
                text: "Maaf terjadi kesalahan tidak dikenali"
            }, {
                quoted: msg
            });

            return
        }


        this.userSessions.set(user, {
            current: existingSession ? [...existingSession.current, sessionName] : [sessionName],
            session,
            data: data || {}
        })

        return
    }

    public backUserSession(msg: proto.IWebMessageInfo, stepBack: number): void {
        const userId = msg.key.remoteJid?.endsWith("@g.us") ? msg.key.participant || "" : msg.key.remoteJid || "";
        const session = this.userSessions.get(userId);

        if (!session || stepBack <= 0) return;

        const newLength = Math.max(0, session.current.length - stepBack);
        session.current = session.current.slice(0, newLength);

        let command = null;
        for (const name of session.current.slice(-stepBack)) {
            if (!command) {
                command = this.client.command.getCommand(name);
            } else {
                command = command.commands?.find(c => c.name === name);
            }
        }

        session.session = command!;

        if (session.current.length === 0) {
            this.userSessions.delete(userId);
        } else {
            this.userSessions.set(userId, session);
        }
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