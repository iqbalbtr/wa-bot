import { prefix } from "../../shared/constant/env"
import { generateSessionFooterContent } from "../lib/util";
import { Client, CommandType } from "../type/client";

export default {
    name: "help",
    description: "Menampilkan daftar perintah yang tersedia dan cara menggunakannya.",
    usage: `\`${prefix}help\``,
    execute(message, client) {

        const limit = 5
        const page = 1;
        const totalItem = client.commandManager.getCommandCount();
        const totalPage = Math.ceil(totalItem / limit)

        let content = '';

        content += getDataHelpWithPagination(client, page, limit, totalPage);

        content += generateSessionFooterContent('help')

        client.sessionManager.startOrAdvanceSession(message, 'help', { page })
        client.messageClient.sendMessage((message.key.remoteJid || ""), {
            text: content
        });
    },
    commands: [
        {
            name: "/next",
            description: "Halaman berikutnya",
            execute: (message, client, payload, data) => {

                const limit = 5
                const totalItem = client.commandManager.getCommandCount();
                const totalPage = Math.ceil(totalItem / limit)
                let page = data.page;

                if (page >= totalPage) {
                    return client.messageClient.sendMessage((message.key.remoteJid || ""), {
                        text: "Halaman mencapai batas"
                    });
                }

                let content = getDataHelpWithPagination(client, ++page, limit, totalPage);
                content += generateSessionFooterContent('help')

                client.sessionManager.updateSessionData(message, { page })
                return client.messageClient.sendMessage((message.key.remoteJid || ""), {
                    text: content
                });
            }
        },
        {
            name: "/prev",
            description: "Kembali ke halaman sebelumnya",
            execute: (message, client, payload, data) => {

                const limit = 5
                const totalItem = client.commandManager.getCommandCount();
                const totalPage = Math.ceil(totalItem / limit)
                let page = data.page;

                if (page == 1) {
                    return client.messageClient.sendMessage((message.key.remoteJid || ""), {
                        text: "Halaman mencapai batas"
                    });
                }

                let content = getDataHelpWithPagination(client, --page, limit, totalPage);
                content += generateSessionFooterContent('help')

                client.sessionManager.updateSessionData(message, { page })
                return client.messageClient.sendMessage((message.key.remoteJid || ""), {
                    text: content
                });
            }
        }
    ]
} as CommandType


function getDataHelpWithPagination(client: Client, page: number, limit: number, totalPage: number) {

    const skip = (page - 1) * limit
    const allCommand = [...client.commandManager.getAllCommands()].slice(skip, skip + limit);

    let content = `Daftar Perintah\n\nHal : ${page}\nTotal Hal : ${totalPage}`;

    for (const command of allCommand) {
        content += `\n|-----------------|\n- Nama : ${command.name}\n- Deskripsi : ${command.description}${command.usage ? `\n- Penggunaan : ${command.usage}` : ''}`
    }

    content += `\n\n*Jangan lupa untuk mention jika sedang didalam grup*`;
    return content
}