import { Client, LocalAuth } from "whatsapp-web.js";
import { ClientType, CommandType, SessionUserType } from "../types/client";
import { initializeComands, initializeEvents } from "../lib/util";
import 'dotenv/config'

const client = new Client({
    puppeteer: {
        headless: true, 
        args: [
            "--no-sandbox", 
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage", 
            "--disable-gpu", 
            "--single-process"
        ]
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

export function restartApp(){
    client.destroy()
    .then(() => {
        console.log("restarting");
        client.initialize()
    })
}
