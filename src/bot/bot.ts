import { Client } from "whatsapp-web.js";
import { ClientType, CommandType } from "../types/client";
import { initializeComands, initializeEvents } from "../lib/util";
import 'dotenv/config'

const client = new Client({
    puppeteer: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    }
}) as ClientType;

client.commands = new Map<string, CommandType>();
client.limiter = {
    max: +process.env.MAX_PROCESS! as number,
    users: new Map(),
    userTotal: 0,
    startTime: Date.now()
}

export default client;

initializeComands();
initializeEvents();
