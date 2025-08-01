import { Client } from "../type/client";

export class ClientLimiter {
    private users: Map<string, number> = new Map();
    private max: number = 10;
    private userTotal: number = 0;

    constructor(private client: Client, maxUsers?: number) {
        if (maxUsers && maxUsers > 0) {
            this.max = maxUsers;
        }
    }

    public addUser(userId: string): void {
        const now = Date.now();
        this.users.set(userId, now);
        this.userTotal += 1;
    }

    public removeUser(userId: string): void {
        this.users.delete(userId);
    }

    public isUserLimitReached(): boolean {
        return this.users.size >= this.max;
    }

    public getUserCount(): number {
        return this.users.size;
    }
}