import { Client } from "whatsapp-web.js";
import { ClientType, CommandType } from "../types/client";
import { initializeComands, initializeEvents } from "../lib/util";

const client = new Client({}) as ClientType;

client.commands = new Map<string, CommandType>();
client.limiter = {
    max: 5,
    users: new Map(),
    userTotal: 0,
    startTime: Date.now()
}

export default client;

initializeComands();
initializeEvents();
