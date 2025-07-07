import { Client, Message } from "whatsapp-web.js";

export type CommandSessionContentType = {
    name: string;
    description: string;
    execute: (message: Message, client: ClientType, data: object | any,) => void
}

export type CommandType = {
    name: string;
    description: string;
    usage?: string;
    execute: (message: Message, client: ClientType) => void,
    commands?: CommandSessionContentType[]
}

export type SessionUserType = {
    session: CommandType;
    data: object | any,
}

export interface ClientType extends Client {
    commands: Map<string, CommandType>,
    limiter: {
        max: number;
        users: Map<string, number>;
        userTotal: number;
        startTime: number
    },
    session: {
        users: Map<string, SessionUserType>
    },
    isLoggedIn: boolean
}

export type ClientContextType<T> = {
    client: ClientType,
    params: T
}

export type ClientMiddlewareType<T> = (context: ClientContextType<T>, next: () => void) => any