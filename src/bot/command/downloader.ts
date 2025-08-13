import path from "path";
import fs from "fs";
import { childProcessCallback } from "../../shared/lib/util";
import { CommandType } from '../type/client';
import logger from '../../shared/lib/logger';
import { generateSessionFooterContent } from '../lib/util';

export default {
    name: "downloader",
    description: "Alat pengunduh video media sosial",
    execute: async (message, client) => {
    if (!message.key?.remoteJid) return;
    let content = generateSessionFooterContent('downloader');
    client.sessionManager.startOrAdvanceSession(message, 'downloader');
    await client.messageClient.sendMessage(message.key.remoteJid, { text: content });
    },
    commands: [
        {
            name: "/yt-video",
            description: "Downloader video dari youtube, pastikan setelah command kirim juga linknya",
            execute: async (message, client, payload) => {
                if (!message.key?.remoteJid) return;
                const link = payload.text.trim();
                if (!link) {
                    await client.messageClient.sendMessage(message.key.remoteJid, { text: 'Link tidak ditemukan' });
                    return;
                }
                const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
                if (!youtubeRegex.test(link)) {
                    await client.messageClient.sendMessage(message.key.remoteJid, { text: 'Link bukan link YouTube yang valid.' });
                    return;
                }
                try {
                    const outputpath = path.resolve(process.cwd(), "temp", "yt-dlp", Date.now().toString());
                    fs.mkdirSync(outputpath, { recursive: true });
                    const res = await childProcessCallback("yt-dlp", link, "-o", `${outputpath}/%(title)s.%(ext)s`);
                    const outputFile = res.find(fo => fo.startsWith("[download] Destination:"));
                    if (outputFile) {
                        const fileName = outputFile.split(": ")[1].trim();
                        if (fs.existsSync(fileName)) {
                            const buffer = fs.readFileSync(fileName);
                            await client.messageClient.sendMessage(message.key.remoteJid, {
                                document: buffer,
                                mimetype: "video/mp4",
                                fileName: path.basename(fileName),
                                caption: "Berhasil mengunduh video"
                            });

                            try { fs.unlinkSync(fileName); } catch (e) { logger.warn("Gagal menghapus file sementara:", e); }
                        } else {
                            await client.messageClient.sendMessage(message.key.remoteJid, { text: "File hasil unduhan tidak ditemukan di sistem." });
                        }
                    } else {
                        await client.messageClient.sendMessage(message.key.remoteJid, { text: "Gagal menemukan file hasil unduhan." });
                    }
                } catch (error) {
                    logger.warn("Downloader error:", error);
                    await client.messageClient.sendMessage(message.key.remoteJid, { text: "Terjadi kesalahan saat mengunduh video." });
                }
            },
        }
    ]
} as CommandType;