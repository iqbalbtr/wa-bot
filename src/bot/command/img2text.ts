import { createWorker } from "tesseract.js";
import { prefix } from "../../shared/constant/env";
import sharp from "sharp";
import { downloadMediaMessage, proto } from "@whiskeysockets/baileys";
import { CommandType } from "../type/client";
import logger from "../../shared/lib/logger";

export default {
    name: "img2text",
    description: "Mengonversi gambar yang terdapat text menjadi text",
    usage: `\`${prefix}img2text\``,
    execute: async (message: proto.IWebMessageInfo, client) => {
        const session = client.getSession();
        if (!session || !message.key?.remoteJid) return;

        try {

            if (!message.message?.imageMessage?.mimetype?.startsWith("image")) {
                await session.sendMessage(message.key.remoteJid, { text: "Pastikan gambar juga dikirim bersama commandnya" }, { quoted: message });
                return;
            }

            const buffer = await downloadMediaMessage(message, "buffer", {});
            if (!buffer) {
                await session.sendMessage(message.key.remoteJid, { text: "Pastikan gambar juga dikirim bersama commandnya" }, { quoted: message });
                return;
            }

            const worker = await createWorker();

            const converting = await sharp(buffer)
                .grayscale()
                .normalize()
                .toBuffer();

            const text = await worker.recognize(converting);

            await session.sendMessage(message.key.remoteJid, { text: text.data.text }, { quoted: message });

        } catch (error) {
            await session.sendMessage(message.key.remoteJid, { text: "Terjadi masalah saat mengkonversi" }, { quoted: message });
            logger.warn("Img2Text error:", error);
        }
    }
} as CommandType