import { prefix } from "../../shared/constant/env"
import { createSessionUser, generateSessionFooterContent } from "../lib/session";
import { extractContactId } from "../lib/util";
import { Client, CommandType } from "../type/client";
// import { ClientType, CommandType } from "../type/client";

export default {
    name: "help",
    description: "Menampilkan daftar perintah yang tersedia dan cara menggunakannya.",
    usage: `\`${prefix}help\``,
    execute(message, client) {

        const session = client.getSession()

        const limit = 5
        const page = 1;
        const totalItem = client.command.getCommandCount();
        const totalPage = Math.ceil(totalItem / limit)

        let content = '';

        content += getDataHelpWithPagination(client, page, limit, totalPage);

        content += generateSessionFooterContent('help')

        createSessionUser(message, 'help', { page })
        session?.sendMessage((message.key.remoteJid || ""), {
            text: content
        }, {
            quoted: message
        });
    },
    commands: [
        {
            name: "/next",
            description: "Halaman berikutnya",
            execute: (message, client, data) => {

                const session = client.getSession()

                const limit = 5
                const totalItem = client.command.getCommandCount();
                const totalPage = Math.ceil(totalItem / limit)
                let page = data.page;

                if (page >= totalPage) {
                    return session?.sendMessage((message.key.remoteJid || ""), {
                        text: "Halaman mencapai batas"
                    }, {
                        quoted: message
                    });
                }

                let content = getDataHelpWithPagination(client, ++page, limit, totalPage);
                content += generateSessionFooterContent('help')

                createSessionUser(message, 'help', { page })
                return session?.sendMessage((message.key.remoteJid || ""), {
                    text: content
                }, {
                    quoted: message
                });
            }
        },
        {
            name: "/prev",
            description: "Kembali ke halaman sebelumnya",
            execute: (message, client, data) => {

                const session = client.getSession()

                const limit = 5
                const totalItem = client.command.getCommandCount();
                const totalPage = Math.ceil(totalItem / limit)
                let page = data.page;

                if (page == 1) {
                    return session?.sendMessage((message.key.remoteJid || ""), {
                        text: "Halaman mencapai batas"
                    }, {
                        quoted: message
                    });
                }

                let content = getDataHelpWithPagination(client, --page, limit, totalPage);
                content += generateSessionFooterContent('help')

                createSessionUser(message, 'help', { page })
                return session?.sendMessage((message.key.remoteJid || ""), {
                    text: content
                }, {
                    quoted: message
                });
            }
        }
    ]
} as CommandType


function getDataHelpWithPagination(client: Client, page: number, limit: number, totalPage: number) {

    const skip = (page - 1) * limit
    const allCommand = [...client.command.getCommands()].slice(skip, skip + limit);

    let content = `Daftar Perintah\n\nHal : ${page}\nTotal Hal : ${totalPage}`;

    for (const command of allCommand) {
        content += `\n|-----------------|\n- Nama : ${command.name}\n- Deskripsi : ${command.description}${command.usage ? `\n- Penggunaan : ${command.usage}` : ''}`
    }

    content += `\n\n*Jangan lupa untuk mention jika sedang didalam grup*`;
    return content
}