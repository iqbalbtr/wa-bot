import { Message, MessageMedia } from "whatsapp-web.js";
import { ClientType, CommandType } from "../types/client";
import sharp from "sharp";
import { removeLimiterUser } from "../middleware/limiter";

function base64ToImage(base64String: string) {
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
}

module.exports = {
    name: "sticker",
    description: "Mengonversi gambar yang dikirim menjadi stiker WhatsApp.",
    execute: async (message: Message, client: ClientType) => {

        try {
            const img = await message.downloadMedia();

            if (!img) {
                return message.reply("Gambar tidak ditemukan dalam pesan");
            }

            if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(img.mimetype)) {
                return message.reply('Waduh format tidak didukung nih. pastikan format gambar jpge, png, jpg, atau webp');
            }

            if (base64ToImage(img.data).length >= 5 * 1024 * 1024) {
                return message.reply("Ukuran gambarnya terlalu besar")
            }


            const formatToWebp = await sharp(base64ToImage(img.data)).resize({
                width: 256,
                height: 256,
                fit: "contain"
            }).toFormat("webp", {
                quality: 85
            }).toBuffer();

            const media = new MessageMedia("image/webp", formatToWebp.toString('base64'), img.filename)

            message.reply(media, message.from, {
                sendMediaAsSticker: true,
                stickerAuthor: "@ion/iqbalbtr",
                stickerName: img.filename?.split(".").slice(-1).toString() || 'sticker'
            })
        } catch (error) {
            console.error(error);
            message.reply('Terjadi kesalahan saat mengkonversi gambar')
        }
    }
} as CommandType