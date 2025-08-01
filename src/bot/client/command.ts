import { proto } from "@whiskeysockets/baileys";
import { Client, CommandType } from "../type/client";
import path from "path";
import fs from "fs";

export class ClientCommand {

    private commands: Map<string, CommandType> = new Map<string, CommandType>();

    constructor(private client: Client) { 
    }

    public addCommand(command: CommandType): void {
        this.commands.set(command.name, command);
    }

    public getCommand(name: string): CommandType | undefined {
        return this.commands.get(name);
    }

    public getCommands(): CommandType[] {
        return Array.from(this.commands.values());
    }

    public executeCommand(name: string, message: proto.IWebMessageInfo): void {
        const command = this.getCommand(name);
        if (command) {
            command.execute(message, this.client);
        } else {
            console.warn(`Command ${name} not found.`);
        }
    }

    public getCommandList(): string[] {
        return Array.from(this.commands.keys());
    }

    public getCommandCount(): number {
        return this.commands.size;
    }

    public async intializeCommands() {

        let total = 0;
        const commandPath = path.resolve(process.cwd(), 'src', 'bot', 'command');

        const commands = fs.readdirSync(commandPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

        for (const file of commands) {
            const command = (await import(path.join(commandPath, file))).default;
            this.commands.set(command.name, command);
            total++
        }

        this.client.logger.info(`Total commands initialized: ${total}`);
    }
}