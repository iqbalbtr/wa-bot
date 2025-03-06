import { CommandType } from "../types/client";

module.exports = {
    name: "!notes",
    description: "List of notes",
    execute(message, client) {
        let content = '';
        message.reply(content);
    },
} as CommandType