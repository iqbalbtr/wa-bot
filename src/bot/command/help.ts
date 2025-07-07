import { prefix } from "../../shared/constant/env"
import { createSessionUser, generateSessionFooterContent } from "../lib/session";
import { ClientType, CommandType } from "../type/client";

module.exports = {
    name: "help",
    description: "Menampilkan daftar perintah yang tersedia dan cara menggunakannya.",
    usage: `\`${prefix}help\``,
    execute(message, client) {

        const limit = 5
        const page = 1;
        const totalItem = client.commands.size;
        const totalPage = Math.ceil(totalItem / limit)

        let content = '';

        content += getDataHelpWithPagination(client, page, limit, totalPage);

        content += generateSessionFooterContent('help')

        createSessionUser(message, 'help', { page })
        message.reply(content);
    },
    commands: [
        {
            name: "/next",
            description: "Halaman berikutnya",
            execute: (message, client, data) => {

                const limit = 5
                const totalItem = client.commands.size;
                const totalPage = Math.ceil(totalItem / limit)
                let page = data.page;

                if (page >= totalPage) {
                    return message.reply("Halaman melibihi batas")
                }

                let content = getDataHelpWithPagination(client, ++page, limit, totalPage);
                content += generateSessionFooterContent('help')

                createSessionUser(message, 'help', { page })
                return message.reply(content)
            }
        },
        {
            name: "/prev",
            description: "Kembali ke halaman sebelumnya",
            execute: (message, client, data) => {

                const limit = 5
                const totalItem = client.commands.size;
                const totalPage = Math.ceil(totalItem / limit)
                let page = data.page;

                if (page == 1) {
                    return message.reply("Halaman mencapai batas")
                }

                let content = getDataHelpWithPagination(client, --page, limit, totalPage);
                content += generateSessionFooterContent('help')

                createSessionUser(message, 'help', { page })
                return message.reply(content)
            }
        }
    ]
} as CommandType


function getDataHelpWithPagination(client: ClientType, page: number, limit: number, totalPage: number) {

    const skip = (page - 1) * limit
    const allCommand = Array.from(client.commands.values() || []).slice(skip, skip + limit);

    let content = `Daftar Perintah\n\nHal : ${page}\nTotal Hal : ${totalPage}`;

    for (const command of allCommand) {
        content += `\n|-----------------|\n- Nama : ${command.name}\n- Deskripsi : ${command.description}${command.usage ? `\n- Penggunaan : ${command.usage}` : ''}`
    }

    content += `\n\n*Jangan lupa untuk mention jika sedang didalam grup*`;
    return content
}