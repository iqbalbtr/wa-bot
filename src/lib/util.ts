import didyoumean from "didyoumean";
import path, { join } from "path";
import fs, { mkdirSync, writeFileSync } from "fs"
import client from "../app/bot";
import { ClientContextType, ClientMiddlewareType, ClientType } from "../types/client";
import { Message } from "whatsapp-web.js";
import { spawn } from "child_process"

export function initializeEvents() {
    const eventsPath = path.join(path.resolve(__dirname, "../"), "event");
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

export function initializeComands() {
    const commandsPath = path.join(__dirname, '../command');
    const commandFiles = readFilesRecursively(commandsPath).filter((file) => file.endsWith('.js') || file.endsWith('.ts'));

    for (const file of commandFiles) {
        const command = require(file);
        client.commands?.set(command.name, command);
    }
}

export function saveFileToTemp(data: string | NodeJS.ArrayBufferView, output: string[], ext: string, cb?: (isDelete: () => void) => void) {

    const outputFolder = join('temp', ...output, Date.now().toString());

    mkdirSync(outputFolder, { recursive: true })

    const filename = Date.now() + ext;

    writeFileSync(path.join(outputFolder, filename), data)

    const result = {
        outputFolder,
        filename,
        outputFolderFile: path.join(outputFolder, filename)
    }

    function deleteFile() {
        try {
            fs.unlinkSync(result.outputFolderFile);
            fs.rmdirSync(outputFolder, { recursive: true });
        } catch (error) {
            console.error("Error deleting file:", error);
        }
    }

    cb && cb(deleteFile)

    return  result
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
    middlewares: ClientMiddlewareType[],
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

export async function childProcessCallback(cmd: string, ...args: string[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const process = spawn(cmd, args);

        let output: string[] = [];

        process.stdout.on('data', data => {
            output.push(data.toString());
        });

        process.stderr.on("data", (data) => {
            console.log(`stderr: ${data}`);
        });

        process.on('exit', code => {
            console.log(`Process ended with ${code}`);
            resolve(output);
        });

        process.on('error', (error) => {
            console.error(`Error: ${error}`);
            reject(error);
        });
    });
}