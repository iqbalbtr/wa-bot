import { downloadMediaMessage, proto } from "@whiskeysockets/baileys";
import { prefix } from "../../shared/constant/env";
import { generateSessionFooterContent } from "../lib/session";
import { CommandType } from "../type/client";
import { saveFileToTemp } from "../../shared/lib/storage";
import { convertPdfToDocx } from "../../script/pdf2docx";
import * as fs from "fs";
import logger from "../../shared/lib/logger";

export default {
    name: "converter",
    description: "Convert a file to another format",
    usage: `${prefix}converter`,
    execute: (message, client) => {
        client.userActiveSession.addUserSession(message, 'converter');
        const reply = generateSessionFooterContent("converter");
        client.getSession()?.sendMessage(message.key.remoteJid!, { text: reply });
    },
    commands: [
        {
            name: "/pdf2docx",
            description: "Convert a PDF file to DOCX format",
            execute: async (message, client) => {
                const session = client.getSession();
                if (!session || !message.key?.remoteJid) return;
                try {
                    logger.info("Converting PDF to DOCX");
                    const media = await downloadMediaMessage(message, "buffer", {});

                    if (!media) {
                        await session.sendMessage(message.key.remoteJid, { text: "Pastikan file PDF dikirim bersama commandnya" });
                        return;
                    }

                    const tempPath = saveFileToTemp(new Uint8Array(media), ["pdf"], ".pdf");
                    const outputDocx = tempPath.outputFolderFile.replace(".pdf", ".docx");

                    await convertPdfToDocx(tempPath.outputFolderFile, outputDocx);

                    const docxBuffer = fs.readFileSync(outputDocx);
                    await session.sendMessage(message.key.remoteJid, {
                        document: docxBuffer,
                        mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        fileName: outputDocx.split(/[\\/]/).pop(),
                        caption: "Berhasil mengonversi PDF ke DOCX"
                    });


                } catch (error) {
                    await session.sendMessage(message.key.remoteJid, { text: "Terjadi error saat mengonversi file" });
                    logger.warn("Converter error:", error);
                }
            }
        },
        {
            name: "/img2pdf",
            description: "Convert image to pdf",
            execute: async (message, client, payload, data) => {
                const session = client.getSession();
                if (!session || !message.key?.remoteJid) return;

                const content = generateSessionFooterContent("converter", "/img2pdf")

                session.sendMessage(message.key.remoteJid, { text: content })
                client.userActiveSession.addUserSession(message, '/img2pdf', { data });

            },
            commands: [
                {
                    name: "/add",
                    description: "Gunakan /add [image] untuk menambahkan gambar ke dalam dokumen",
                    execute: async (message, client, payload, data) => {
                        const session = client.getSession();
                        if (!session || !message.key?.remoteJid) return;

                        let content = "Perintah ini masih dalam pengembangan"
                        content += generateSessionFooterContent("converter", "/img2pdf")

                        session.sendMessage(message.key.remoteJid, { text: content })
                    }
                },
                {
                    name: "/remove",
                    description: "Gunakan /remove [image] untuk menghapus gambar dari dokumen",
                    execute: async (message, client, payload, data) => {
                        const session = client.getSession();
                        if (!session || !message.key?.remoteJid) return;

                        let content = "Perintah ini masih dalam pengembangan"
                        content += generateSessionFooterContent("converter", "/img2pdf")

                        session.sendMessage(message.key.remoteJid, { text: content })
                    }
                },
                {
                    name: "/clear",
                    description: "Gunakan /clear untuk menghapus semua gambar dari dokumen",
                    execute: async (message, client, payload, data) => {
                        const session = client.getSession();
                        if (!session || !message.key?.remoteJid) return;

                        let content = "Perintah ini masih dalam pengembangan"
                        content += generateSessionFooterContent("converter", "/img2pdf")

                        session.sendMessage(message.key.remoteJid, { text: content })
                    }
                },
                {
                    name: "/execute",
                    description: "Gunakan /execute [image] untuk mengeksekusi perintah pada gambar",
                    execute: async (message, client, payload, data) => {
                        const session = client.getSession();
                        if (!session || !message.key?.remoteJid) return;

                        let content = "Perintah ini masih dalam pengembangan"
                        content += generateSessionFooterContent("converter", "/img2pdf")

                        session.sendMessage(message.key.remoteJid, { text: content })
                    }
                }
            ]
        }
    ]
} as CommandType;