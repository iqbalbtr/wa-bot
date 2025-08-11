import { createWorker } from "tesseract.js";
import { prefix } from "../../shared/constant/env";
import sharp from "sharp";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { CommandType } from "../type/client";
import logger from "../../shared/lib/logger";

export default {
    name: "img2text",
    description: "Mengonversi gambar yang terdapat text menjadi text",
    usage: `\`${prefix}img2text\``,
    execute: async (message, client, payload) => {
        const session = client.getSession();
        if (!session || !message.key?.remoteJid) return;

        try {

            if (!payload.message.imageMessage?.mimetype?.startsWith("image")) {
                await session.sendMessage(message.key.remoteJid, { text: "Pastikan gambar juga dikirim bersama commandnya" });
                return;
            }

            const buffer = await downloadMediaMessage(message, "buffer", {});
            if (!buffer) {
                await session.sendMessage(message.key.remoteJid, { text: "Pastikan gambar juga dikirim bersama commandnya" });
                return;
            }

            const worker = await createWorker();

            const converting = await sharp(buffer)
                .grayscale()
                .normalize()
                .toBuffer();

            const text = await worker.recognize(converting);

            await session.sendMessage(message.key.remoteJid, { text: text.data.text });

        } catch (error) {
            await session.sendMessage(message.key.remoteJid, { text: "Terjadi masalah saat mengkonversi" });
            logger.warn("Img2Text error:", error);
        }
    }
} as CommandType