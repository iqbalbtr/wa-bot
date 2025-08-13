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

export type ClientContextType = {
  client: Client,
  message: proto.IWebMessageInfo,
  payload: PayloadMessage
}

export type PayloadMessage = {
  from: string;
  command: string;
  text: string;
  originalText: string;
  timestamp: number;
  message: proto.IMessage;
  isGroup: boolean;
  mentionedIds: string[];
  isMentioned: boolean
}

export type ClientMiddlewareType = (context: ClientContextType, next: () => void) => any
