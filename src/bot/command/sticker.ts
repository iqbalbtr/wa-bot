import { CommandType } from "../type/client";
import sharp from "sharp";
import { prefix } from "../../shared/constant/env";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import logger from "../../shared/lib/logger";

export default {
    name: "sticker",
    description: "Mengonversi gambar yang dikirim menjadi stiker WhatsApp",
    usage: `\`${prefix}sticker [nama sticker]\``,
    execute: async (message, client, payload) => {

        const session = client.getSession();

        if (!session || !message.key?.remoteJid) {
            return;
        }

        try {
            const name = payload.text.split(" ").slice(1).join(" ") || "sticker";

            if (!payload.message?.imageMessage) {
                return session.sendMessage(message.key.remoteJid, {
                    text: "Kirim gambar dengan caption `!sticker [nama]` untuk membuat sticker"
                });
            }

            const buffer = await downloadMediaMessage(message, 'buffer', {});

            if (!buffer) {
                return session.sendMessage(message.key.remoteJid, {
                    text: "Gagal mengunduh gambar"
                });
            }

            if (buffer.length >= 5 * 1024 * 1024) {
                return session.sendMessage(message.key.remoteJid, {
                    text: "Ukuran gambar terlalu besar (maksimal 5MB)"
                });
            }

            const metadata = await sharp(buffer).metadata();

            if (!metadata.width || !metadata.height) {
                return session.sendMessage(message.key.remoteJid, {
                    text: "Format gambar tidak valid"
                });
            }

            const maxSize = Math.max(metadata.width, metadata.height);

            const resizedImage = await sharp(buffer)
                .resize({
                    width: metadata.width >= metadata.height ? 256 : undefined,
                    height: metadata.height > metadata.width ? 256 : undefined,
                    fit: 'contain'
                })
                .toFormat('webp', {
                    quality: 85
                })
                .extend({
                    top: Math.max(0, Math.floor((256 - (metadata.height * 256 / maxSize)) / 2)),
                    bottom: Math.max(0, Math.floor((256 - (metadata.height * 256 / maxSize)) / 2)),
                    left: Math.max(0, Math.floor((256 - (metadata.width * 256 / maxSize)) / 2)),
                    right: Math.max(0, Math.floor((256 - (metadata.width * 256 / maxSize)) / 2)),
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .toBuffer();

            await session.sendMessage(message.key.remoteJid, {
                sticker: resizedImage,
            });

        } catch (error) {
            logger.warn("Sticker error:", error);
            if (session && message.key?.remoteJid) {
                session.sendMessage(message.key.remoteJid, {
                    text: 'Terjadi kesalahan saat mengkonversi gambar'
                });
            }
        }
    }
} as CommandType