import changelog from "../../../assets/change-log.json"
import { Client, CommandType } from "../type/client";

export default {
    name: "cl",
    description: "Deskripsi daftar perubahan yang terjadi",
    execute: async (msg, client) => {

        const session = client.getSession()

        const lastChangeLog = changelog[changelog.length - 1]

        let content = `Change Log ${lastChangeLog.date}\n`;

        lastChangeLog.changes.forEach((change, index) => {
            content += `\n${++index}. ${change}`
        });

        await session?.sendMessage(msg.key.remoteJid!, {
            text: content
        });
    }
} as CommandType