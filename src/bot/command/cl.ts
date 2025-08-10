import fs from 'fs';
import path from 'path';
import { prefix } from "../../shared/constant/env"; 
import { CommandType } from "../type/client";

export default {
    name: "cl",
    usage: `${prefix}cl`,
    description: "Deskripsi daftar perubahan yang terjadi",
    execute: async (msg, client) => {

        const session = client.getSession()

        const changelogPath = path.resolve(process.cwd(), 'assets', 'change-log.json');
        if (!fs.existsSync(changelogPath)) {
            await session?.sendMessage(msg.key.remoteJid!, { text: 'Change log file not found.' });
            return;
        }

        let changelog: any[] = [];
        try {
            changelog = JSON.parse(fs.readFileSync(changelogPath, 'utf-8'));
        } catch (e) {
            await session?.sendMessage(msg.key.remoteJid!, { text: 'Failed to parse change log.' });
            return;
        }

        if (!Array.isArray(changelog) || changelog.length === 0) {
            await session?.sendMessage(msg.key.remoteJid!, { text: 'No change logs available.' });
            return;
        }

        const lastChangeLog = changelog[changelog.length - 1];

        let content = `Change Log ${lastChangeLog.date}\n`;

        (lastChangeLog.changes as string[]).forEach((change: string, index: number) => {
            content += `\n${index + 1}. ${change}`;
        });

        await session?.sendMessage(msg.key.remoteJid!, {
            text: content
        });
    }
} as CommandType