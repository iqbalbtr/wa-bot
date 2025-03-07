import { removeLimiterUser } from "../middleware/limiter";
import { CommandType } from "../types/client";

module.exports = {
    name: "!help",
    description: "Menampilkan daftar perintah yang tersedia dan cara menggunakannya.",
    execute(message, client) {
        let content = '';

        client?.commands.forEach(cmd => {
            content = content + `*${cmd.name}*\n• ${cmd.description}\n`
        })

        message.reply(content);
        removeLimiterUser(client, message)
    },
} as CommandType