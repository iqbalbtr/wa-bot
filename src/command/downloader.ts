import { createSessionUser, generateSessionFooterContent } from "../lib/session";
import { CommandType } from "../types/client";
import Tiktok from '@tobyg74/tiktok-api-dl';


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
        }
    ]
} as CommandType