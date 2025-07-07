import didyoumean from "didyoumean";
import path from "path";
import fs from "fs"
import client from "../../bot";
import { Message } from "whatsapp-web.js";
import { ClientContextType, ClientMiddlewareType, ClientType } from "../type/client";


export function initializeEvents(eventPath: string) {
    const eventsPath = path.resolve(path.join(path.dirname(''), "src", eventPath));
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    eventFiles.forEach(file => {
        const filePath = path.join(eventsPath, file);
        require(filePath)
    })
}

export function getUserIdFromMessage(message: Message): string {
    return message.from.endsWith("@c.us") ? message.from : message.author!
}

function readFilesRecursively(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);

    list.forEach((file) => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);

        if (stat && stat.isDirectory()) {
            results = results.concat(readFilesRecursively(file));
        } else {
            results.push(file);
        }
    });

    return results;
}

export function initializeComands(commandPath: string) {
    const commandsPath = path.resolve(path.join(path.dirname(''), 'src', commandPath));

    const commandFiles = readFilesRecursively(commandsPath).filter((file) => file.endsWith('.js') || file.endsWith('.ts'));

    for (const file of commandFiles) {
        const command = require(file);
        client.commands?.set(command.name, command);
    }
}

export function extractMessageFromCommand(body: string) {
    return body.split(" ")[1]
}

export function messageAutoReply(message: Message, client: ClientType) {
    if (!message.body) return message.reply('Pesan kosong, tidak dapat memproses perintah.');

    const prefix = process.env.PREFIX || '!';
    const command = message.body.split(' ')[0];
    const allCommands = [...client.commands.keys()].map(cmd => `${prefix}${cmd}`);

    if (allCommands.includes(command)) return;

    const suggestions = didyoumean(command, allCommands);

    if (suggestions && suggestions.length > 0) {
        return message.reply(
            `Mungkin yang anda maksud adalah: *\`${suggestions}\`*. Gunakan *\`${prefix}help\`* untuk melihat daftar perintah yang tersedia.`
        );
    }

    return message.reply(`Anda bisa menggunakan *\`${prefix}help\`* untuk melihat daftar perintah atau *\`${prefix}req\`* untuk memberi masukan`);
}

export function extractUserNumber(message: Message): string {
    return message.from.endsWith("@c.us") ? message.from : message.author!
}

export async function middlewareApplier(
    context: ClientContextType<any>,
    middlewares: ClientMiddlewareType<any>[],
    finalFn: () => void
) {

    let index = -1;

    async function next(i: number) {

        if (i <= index)
            throw new Error("next() called multiple times");

        index = i;

        if (i == middlewares.length) {
            return finalFn()
        }

        const middleware = middlewares[i];

        if (middleware) {
            await middleware(context, () => next(i + 1));
        }
    }

    await next(0);

}
