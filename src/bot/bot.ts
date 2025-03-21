import { Client, LocalAuth } from "whatsapp-web.js";
import { ClientType, CommandType, SessionUserType } from "../types/client";
import { initializeComands, initializeEvents } from "../lib/util";
import 'dotenv/config'

const client = new Client({
    puppeteer: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ],
    },
    authStrategy: new LocalAuth(),
}) as ClientType;

// registering command
client.commands = new Map<string, CommandType>();

// registering limiter
client.limiter = {
    max: +process.env.MAX_PROCESS! as number,
    users: new Map(),
    userTotal: 0,
    startTime: Date.now()
}

// registering session
client.session = {
    users: new Map<string, SessionUserType>()
}

export default client;

initializeComands();
initializeEvents();
