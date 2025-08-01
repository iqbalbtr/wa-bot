import { Client, CommandType, SessionUserType } from "../type/client";

export class UserSessionClient {
    private userSessions: Map<string, SessionUserType> = new Map<string, SessionUserType>();

    constructor(private client: Client) {
    }

    public addUserSession(userId: string, session: SessionUserType): void {
        this.userSessions.set(userId, session);
    }

    public getUserSession(userId: string): SessionUserType | undefined {
        return this.userSessions.get(userId);
    }

    public removeUserSession(userId: string): void {
        this.userSessions.delete(userId);
    }

    public clearAllSessions(): void {
        this.userSessions.clear();
    }
}