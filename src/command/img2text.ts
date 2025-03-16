import Tesseract, { createWorker } from "tesseract.js";
import { Message } from "whatsapp-web.js";
import { ClientType } from "../types/client";
import { prefix } from "../constant/env";
import { resolve } from 'path'
import sharp from 'sharp'


function base64ToImage(base64String: string) {
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
}


module.exports = {
    name: "img2text",
    description: "Mngekonversi gambar yang terdapat text menjadi text",
    usage: `\`${prefix}img2text\``,
    execute: async (message: Message) => {
        try {
            const img = await message.downloadMedia()

            if (!img) return message.reply("Pastikan gambar juga dikirim bersama commandnya");

            if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(img.mimetype)) {
                return message.reply('Waduh format tidak didukung nih. pastikan format gambar jpge, png, jpg, atau webp');
            }

            const worker = await createWorker()

            const converting = await sharp(base64ToImage(img.data))
                .grayscale() 
                .normalize() 
                .toBuffer();

            const text = await worker.recognize(converting)

            message.reply(text.data.text)

        } catch (error) {
            return message.reply("Terjadi masalah saat mengkonversi")
        }
    }
}