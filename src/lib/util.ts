import didyoumean from "didyoumean";
import path, { join } from "path";
import fs, { mkdirSync, writeFileSync } from "fs"
import client from "../bot/bot";
import { ClientType } from "../types/client";
import { Message } from "whatsapp-web.js";

export function initializeEvents() {
    const eventsPath = path.join(path.resolve(__dirname, "../"), "event");
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    eventFiles.forEach(file => {
        const filePath = path.join(eventsPath, file);
        require(filePath)
    })
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

export function initializeComands() {
    const commandsPath = path.join(__dirname, '../command');
    const commandFiles = readFilesRecursively(commandsPath).filter((file) => file.endsWith('.js') || file.endsWith('.ts'));

    for (const file of commandFiles) {
        const command = require(file);
        client.commands?.set(command.name, command);
    }
}

export function saveFileToTemp(data: string | NodeJS.ArrayBufferView, output: string[], ext: string) {

    const outputFolder = join('temp', ...output, Date.now().toString());

    mkdirSync(outputFolder, { recursive: true })

    const filename = Date.now() + ext;

    writeFileSync(path.join(outputFolder, filename), data)

    return {
        outputFolder,
        filename,
        outputFolderFile: path.join(outputFolder, filename)
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