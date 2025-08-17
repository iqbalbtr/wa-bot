import { CommandType } from "../type/client";
import { prefix } from "../../shared/constant/env";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import logger from "../../shared/lib/logger";
import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";

async function imageStickerProcess(buffer: Buffer, name: string): Promise<Buffer> {
    if (buffer.length >= 5 * 1024 * 1024) {
        throw new Error("Ukuran gambar terlalu besar, maksimal 5MB");
    }

    const sticker = new Sticker(buffer, {
        pack: 'muria computer club sticker',
        author: "sticker@mcc",
        type: StickerTypes.FULL,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
    });

    const stickerBuffer = await sticker.toBuffer();
    return stickerBuffer;
}

async function videoStickerProcess(buffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const inputFilePath = path.join(process.cwd(), 'temp', `${Date.now()}_input.mp4`);
        const outputFilePath = path.join(process.cwd(), 'temp', `${Date.now()}_output.webp`);

        if (!fs.existsSync(path.join(process.cwd(), 'temp'))) {
            fs.mkdirSync(path.join(process.cwd(), 'temp'), { recursive: true });
        }

        fs.writeFileSync(inputFilePath, new Uint8Array(buffer));

        ffmpeg(inputFilePath)
            .outputOptions([
                '-vcodec', 'libwebp',
                '-vf', 'scale=512:512:force_original_aspect_ratio=increase,fps=15,crop=512:512',
                '-loop', '0',
                '-ss', '0',
                '-t', '5',
                '-an',
                '-vsync', '0',
                '-s', '512x512'
            ])
            .toFormat('webp')
            .save(outputFilePath)
            .on('end', () => {
                const stickerBuffer = fs.readFileSync(outputFilePath);

                fs.unlinkSync(inputFilePath);
                fs.unlinkSync(outputFilePath);

                resolve(stickerBuffer);
            })
            .on('error', (err) => {
                if (fs.existsSync(inputFilePath)) fs.unlinkSync(inputFilePath);
                if (fs.existsSync(outputFilePath)) fs.unlinkSync(outputFilePath);
                reject(err);
            });
    });
}

const command: CommandType = {
    name: "sticker",
    description: "Mengonversi gambar atau video menjadi stiker WhatsApp",
    usage: `\`${prefix}sticker\` (reply/caption media)`,
    execute: async (message, client, payload) => {
        const jid = message.key.remoteJid;
        if (!jid) {
            return;
        }

        try {
            const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const isImage = message.message?.imageMessage || quotedMessage?.imageMessage;
            const isVideo = message.message?.videoMessage || quotedMessage?.videoMessage;

            if (!isImage && !isVideo) {
                return client.messageClient.sendMessage(jid, {
                    text: `Silakan kirim atau balas gambar/video dengan caption \`${prefix}sticker\`.`
                });
            }

            const mediaMessage = isImage
                ? (message.message?.imageMessage || quotedMessage?.imageMessage)
                : (message.message?.videoMessage || quotedMessage?.videoMessage);

            const mediaSize = mediaMessage?.fileLength ?? mediaMessage?.fileLength ?? 0;
            if (Number(mediaSize) > 20 * 1024 * 1024) {
                return client.messageClient.sendMessage(jid, {
                    text: "Ukuran media terlalu besar, maksimal 20MB."
                });
            }

            const buffer = await downloadMediaMessage(message, 'buffer', {});

            if (!buffer) {
                return client.messageClient.sendMessage(jid, {
                    text: "Gagal mengunduh media. Silakan coba lagi."
                });
            }

            let stickerBuffer: Buffer;
            if (isImage) {
                stickerBuffer = await imageStickerProcess(buffer, '');
            } else {
                stickerBuffer = await videoStickerProcess(buffer);
            }

            await client.messageClient.sendMessage(jid, {
                sticker: stickerBuffer
            });

        } catch (error) {
            logger.error("Sticker command error:", error);
            await client.messageClient.sendMessage(jid, {
                text: `Terjadi kesalahan: ${(error as Error).message}`
            });
        }
    }
};

export default command;