import { BaileysEventMap, proto } from "@whiskeysockets/baileys";
import { WhatsappClient } from "../core/whatsaap";

export type Client = WhatsappClient

export type ClientEvent = {
  [K in keyof BaileysEventMap]: {
    event: K;
    listener: (payload: BaileysEventMap[K], session: Client) => void;
  };
}[keyof BaileysEventMap];

export type CommandType = {
  name: string;
  description: string;
  usage?: string;
  execute: (
    message: proto.IWebMessageInfo,
    client: Client,
    payload: PayloadMessage,
    data?: object | any
  ) => void,
  commands?: CommandType[]
}

export type SessionUserType = {
    current: string[]
    session: CommandType;
    data: object | any,
}

export type ClientContextType<T> = {
    client: Client,
    params: T
}

export type PayloadMessage = {
  from: string;
  text: string;
  timestamp: number;
  message: proto.IMessage;
  isGroup: boolean;
  mentionedIds: string[];
}

export type ClientMiddlewareType<T> = (context: ClientContextType<T>, next: () => void) => any