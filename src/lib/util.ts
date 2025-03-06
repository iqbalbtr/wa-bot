import path, { join } from "path"
import fs, { mkdirSync, writeFileSync } from "fs"
import client from "../bot/bot";

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