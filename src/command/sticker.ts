import { Message, MessageMedia } from "whatsapp-web.js";
import { CommandType } from "../types/client";
import sharp from "sharp";
import fs from 'fs'
import { extractMessageFromCommand } from "../lib/util";
import { prefix } from "../constant/env";

function base64ToImage(base64String: string) {
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
}

module.exports = {
    name: "sticker",
    description: "Mengonversi gambar yang dikirim menjadi stiker WhatsApp",
    usage: `\`${prefix}sticker [nama sticker]\``,
    execute: async (message: Message) => {

        try {

            const name = message.body.split(" ").slice(1).join(" ") || "sticker";

            if (!message.hasMedia) {
                return message.reply("Pastikan gambar dikirim bersama pesannya");
            }

            const img = await message.downloadMedia();

            fs.writeFileSync('test.mp4', img.data)


            if (message.type == 'video') {
                return message.reply(new MessageMedia("image/png", img.data, img.filename), message.from, {
                    sendVideoAsGif: true,
                    sendMediaAsSticker: true,
                    stickerAuthor: "@ion/iqbalbtr",
                    stickerName: img.filename?.split(".").slice(-1).toString() || 'sticker'
                })
            }

            if (base64ToImage(img.data).length >= 5 * 1024 * 1024) {
                return message.reply("Ukuran gambarnya terlalu besar")
            }

            if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(img.mimetype)) {
                return message.reply('Waduh format tidak didukung nih. pastikan format gambar jpge, png, jpg, atau webp');
            }

            const metadata = await sharp(base64ToImage(img.data)).metadata();
            const maxSize = Math.max(metadata.width!, metadata.height!);

            const resizedImage = await sharp(base64ToImage(img.data))
                .resize({
                    width: metadata.width! >= metadata.height! ? 256 : undefined,
                    height: metadata.height! > metadata.width! ? 256 : undefined,
                    fit: 'contain'
                })
                .toFormat('webp', {
                    quality: 85
                })
                .extend({
                    top: Math.max(0, Math.floor((256 - (metadata.height! * 256 / maxSize)) / 2)),
                    bottom: Math.max(0, Math.floor((256 - (metadata.height! * 256 / maxSize)) / 2)),
                    left: Math.max(0, Math.floor((256 - (metadata.width! * 256 / maxSize)) / 2)),
                    right: Math.max(0, Math.floor((256 - (metadata.width! * 256 / maxSize)) / 2)),
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .toBuffer();

            const media = new MessageMedia("image/webp", resizedImage.toString('base64'), img.filename)

            message.reply(media, message.from, {
                sendMediaAsSticker: true,
                stickerAuthor: "@mcc/sticker",
                stickerName: name
            })
        } catch (error) {
            console.log(error);

            message.reply('Terjadi kesalahan saat mengkonversi gambar')
        }
    }
} as CommandType