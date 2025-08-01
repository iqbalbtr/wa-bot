// import { MessageMedia } from "whatsapp-web.js";
// import { devId, prefix } from "../../shared/constant/env";
// import { CommandType } from "../type/client";
// import { createSessionUser, generateSessionFooterContent } from "../lib/session";

// module.exports = {
//     name: "req",
//     description: "Kirim masukan ke developer",
//     async execute(message, client) {
//         let content = 'Pesan akan diforward ke developer\nHarap tidak melakukan spam\n'
//         content += generateSessionFooterContent('req');
//         createSessionUser(message, 'req')
//         message.reply(content)
//     },
//     commands: [
//         {
//             name: "/bug",
//             description: `${prefix}bug [pesan] | Kirim pesan jika menemukan bug, anda bisa menyertakan gambar jika ada`,
//             execute: async (message, client) => {

//                 const media = await message.downloadMedia();

//                 let content = `Type : Bug\nPesan dari : ${message.from}\nIsi : ${message.body.split('/bug')[1]}`;

//                 const body = media ? new MessageMedia(media.mimetype, media.data, media.filename) : content;

//                 client.sendMessage(devId, body, media && { caption: content })

//                 message.reply('Pesan Berhasil dikirim')
//             }
//         },
//         {
//             name: "/req",
//             description: `${prefix}req [pesan] |Kirim pesan jika memiliki masukan`,
//             execute: async (message, client) => {
//                 const media = await message.downloadMedia();

//                 let content = `Type : Masukan\nPesan dari : ${message.from}\nIsi : ${message.body.split('/req')[1]}`;

//                 const body = media ? new MessageMedia(media.mimetype, media.data, media.filename) : content;

//                 client.sendMessage(devId, body, media && { caption: content })

//                 message.reply('Pesan Berhasil dikirim')
//             }
//         }
//     ]
// } as CommandType