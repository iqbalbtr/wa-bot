import Tiktok from '@tobyg74/tiktok-api-dl';
import path from "path";
import fs from "fs";
import { childProcessCallback } from "../../shared/lib/util";
import { CommandType } from '../type/client';
import { generateSessionFooterContent } from '../lib/session';
import logger from '../../shared/lib/logger';

export default {
    name: "downloader",
    description: "Alat pengunduh video media sosial",
    execute: async (message, client) => {
        const session = client.getSession();
        if (!session || !message.key?.remoteJid) return;
        let content = generateSessionFooterContent('downloader');
        client.userActiveSession.addUserSession(message, 'downloader');
        await session.sendMessage(message.key.remoteJid, { text: content });
    },
    commands: [
        {
            name: '/tiktok',
            description: `Downloader video dari tiktok pastikan setelah command kirim juga linknya`,
            execute: async (message, client, payload) => {
                const session = client.getSession();
                if (!session || !message.key?.remoteJid) return;
                const link = payload.text.split(" ")[1];
                if (!link) {
                    await session.sendMessage(message.key.remoteJid, { text: 'Link tidak ditemukan' });
                    return;
                }
                try {
                    const res = await Tiktok.Downloader(link, { version: "v3" });
                    if (!res.result?.videoHD) {
                        await session.sendMessage(message.key.remoteJid, { text: "Gagal mendapatkan video. Coba gunakan link lain." });
                        return;
                    }
                    await session.sendMessage(message.key.remoteJid, { text: 'Link unduh : ' + res.result.videoHD });
                } catch (error) {
                    logger.warn("Downloader error:", error);
                    await session.sendMessage(message.key.remoteJid, { text: "Terjadi kesalahan saat mengunduh video." });
                }
            },
        },
        {
            name: "/yt-video",
            description: "Downloader video dari youtube, pastikan setelah command kirim juga linknya",
            execute: async (message, client, payload) => {
                const session = client.getSession();
                if (!session || !message.key?.remoteJid) return;
                const link = payload.text.split(" ")[1];
                if (!link) {
                    await session.sendMessage(message.key.remoteJid, { text: 'Link tidak ditemukan' });
                    return;
                }
                try {
                    const outputpath = path.join(__dirname, "../temp");
                    const res = await childProcessCallback("yt-dlp", link, "-o", `${outputpath}/%(title)s.%(ext)s`);
                    const outputFile = res.find(fo => fo.startsWith("[download] Destination:"));
                    if (outputFile) {
                        const fileName = outputFile.split(": ")[1].trim();
                        // Send as document
                        const buffer = fs.readFileSync(fileName);
                        await session.sendMessage(message.key.remoteJid, {
                            document: buffer,
                            mimetype: "video/mp4",
                            fileName: path.basename(fileName),
                            caption: "Berhasil mengunduh video"
                        });
                    } else {
                        await session.sendMessage(message.key.remoteJid, { text: "Gagal menemukan file hasil unduhan." });
                    }
                } catch (error) {
                    logger.warn("Downloader error:", error);
                    await session.sendMessage(message.key.remoteJid, { text: "Terjadi kesalahan saat mengunduh video." });
                }
            },
        }
    ]
} as CommandType;