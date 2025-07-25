import { Client, LocalAuth } from "whatsapp-web.js";
import 'dotenv/config'
import { ClientType, CommandType, SessionUserType } from "./type/client";
import { initializeComands, initializeEvents } from "./lib/util";

const client = new Client({
    puppeteer: {
        headless: true, 
        args: [
            "--no-sandbox", 
            "--disable-setuid-sandbox"
        ]
    },
    authStrategy: new LocalAuth(),
}) as ClientType;

// Menambahkan instance command BOT kedalam client
client.commands = new Map<string, CommandType>();

// Memasukan nilai limiter dari middleware kedalam client
client.limiter = {
    max: +process.env.MAX_PROCESS! || 5 as number,
    users: new Map(),
    userTotal: 0,
    startTime: Date.now()
}

// Menambahkan instance sesi untuk mengatur pengguna kedalam client
client.session = {
    users: new Map<string, SessionUserType>()
}

export default client;

initializeComands("/bot/command");
initializeEvents("/bot/event");