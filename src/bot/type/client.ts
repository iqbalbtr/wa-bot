import { BaileysEventMap, proto } from "@whiskeysockets/baileys";
import { WhatsappClient } from "../client/whatsaap";

export type Client = WhatsappClient

export type ClientEvent = {
  [K in keyof BaileysEventMap]: {
    event: K;
    listener: (payload: BaileysEventMap[K], session: Client) => void;
  };
}[keyof BaileysEventMap];

export type CommandSessionContentType = {
    name: string;
    description: string;
    execute: (message: proto.IWebMessageInfo, client: Client, data: object | any,) => void
}

export type CommandType = {
    name: string;
    description: string;
    usage?: string;
    execute: (message: proto.IWebMessageInfo, client: Client) => void,
    commands?: CommandSessionContentType[]
}

export type SessionUserType = {
    session: CommandType;
    data: object | any,
}

export type ClientContextType<T> = {
    client: Client,
    params: T
}

export type ClientMiddlewareType<T> = (context: ClientContextType<T>, next: () => void) => any