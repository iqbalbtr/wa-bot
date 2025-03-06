import { Client, Message } from "whatsapp-web.js";

export type CommandType = {
    name: string;
    description: string;
    execute: (message: Message, client?: ClientType) => void
}

export interface ClientType extends Client {
    commands: Map<string, CommandType>,
    limiter: {
        max: number;
        users: Map<string, number>;
    }
} 