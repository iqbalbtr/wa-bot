import { Message } from "whatsapp-web.js";
import changelog from "../../../assets/change-log.json"
import { CommandType } from "../type/client";

module.exports = {
    name: "cl",
    description: "Deskripsi daftar perubahan yang terjadi",
    execute: async (message: Message) => {

        const lastChangeLog = changelog[changelog.length - 1]

        let content = `Change Log ${lastChangeLog.date}\n`;

        lastChangeLog.changes.forEach((change, index) => {
            content += `\n${++index}. ${change}`
        });

        return message.reply(content)
    }
} as CommandType