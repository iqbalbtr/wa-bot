import Tiktok from '@tobyg74/tiktok-api-dl';
import path from "path";
import fs from "fs"
import { MessageMedia } from "whatsapp-web.js";
import { createSessionUser, generateSessionFooterContent } from "../lib/session";
import { childProcessCallback } from "../../shared/lib/util";
import { CommandType } from '../type/client';

module.exports = {
    name: "downloader",
    description: "Alat pengunduh video media sosial",
    execute: async (message) => {
        let content = generateSessionFooterContent('downloader');
        createSessionUser(message, 'downloader')
        return message.reply(content)
    },
    commands: [
        {
            name: '/tiktok',
            description: ` Downloader video dari tiktok pastikan setelah command kirim juga linknya`,
            execute: async (message) => {
                const link = message.body.split(" ")[1];

                if (!link) return message.reply('Link tidak ditemukan');

                try {
                    const res = await Tiktok.Downloader(link, { version: "v3" });

                    if (!res.result?.videoHD) {
                        return message.reply("Gagal mendapatkan video. Coba gunakan link lain.");
                    }

                    message.reply('Link unduh : ' + res.result.videoHD);
                } catch (error) {
                    message.reply("Terjadi kesalahan saat mengunduh video.");
                }
            },
        },
        {
            name: "/yt-video",
            description: "Downloader video dari youtube, pastikan setelah command kirim juga linknya",
            execute: async (message) => {
                const link = message.body.split(" ")[1];

                if (!link) return message.reply('Link tidak ditemukan');

                try {

                    const outputpath = path.join(__dirname, "../temp");

                    const res = await childProcessCallback("yt-dlp",
                        "https://www.youtube.com/watch?v=ZE5pIkbSI2Q",
                        "-o", `${outputpath}/%(title)s.%(ext)s`,
                    );

                    const outputFile = res.find(fo => fo.startsWith("[download] Destination:"))

                    if (outputFile) {
                        const fileName = outputFile.split(": ")[1].trim();
                        
                        const media = MessageMedia.fromFilePath(fileName)

                        message.reply(media, undefined, { 
                            caption: "Berikut video yang kamu minta",
                            sendMediaAsDocument: true
                         });

                        fs.rmSync(fileName, { force: true });
                    }

                } catch (error) {
                    message.reply("Terjadi kesalahan saat mengunduh video.");
                }
            }
        },
        {
            name: "/yt-music",
            description: "Downloader video dari youtube, pastikan setelah command kirim juga linknya",
            execute: async (message) => {
                const link = message.body.split(" ")[1];

                if (!link) return message.reply('Link tidak ditemukan');

                try {

                    const outputpath = path.join(__dirname, "../temp");

                    const res = await childProcessCallback("yt-dlp",
                        "https://www.youtube.com/watch?v=ZE5pIkbSI2Q",
                        "-o", `${outputpath}/%(title)s.%(ext)s`,
                    );

                    const outputFile = res.find(fo => fo.startsWith("[download] Destination:"))

                    if (outputFile) {
                        const fileName = outputFile.split(": ")[1].trim();
                        
                        const media = MessageMedia.fromFilePath(fileName)

                        message.reply(media, undefined, { 
                            caption: "Berikut video yang kamu minta",
                            sendMediaAsDocument: true
                         });

                        fs.rmSync(fileName, { force: true });
                    }

                } catch (error) {
                    message.reply("Terjadi kesalahan saat mengunduh video.");
                }
            }
        }
    ]
} as CommandType