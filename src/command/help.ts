import { CommandType } from "../types/client";

module.exports = {
    name: "help",
    description: "Menampilkan daftar perintah yang tersedia dan cara menggunakannya.",
    execute(message, client) {
        let content = '';
        const prefix = process.env.PREFIX

        for (const cmd of client?.commands.values() || []) {
            content += `\nNama : *${cmd.name}*\n- Deskripsi : ${cmd.description}\n- Penggunaan : ${prefix}${cmd.name}\n`
        }

        content += `\n\nIngin berkontribusi?\nRepository : ${"https://github.com/iqbalbtr/wa-bot"}`

        content += `\n\n*Jangan lupa untuk mention jika sedang didalam grup*`

        message.reply(content);
    },
} as CommandType