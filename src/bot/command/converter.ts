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
    execute: (message: proto.IWebMessageInfo, client) => {
        client.userActiveSession.addUserSession(message, 'converter');
        const reply = generateSessionFooterContent("converter");
        client.getSession()?.sendMessage(message.key.remoteJid!, { text: reply }, { quoted: message });
    },
    commands: [
        {
            name: "/pdf2docx",
            description: "Convert a PDF file to DOCX format",
            execute: async (message: proto.IWebMessageInfo, client) => {
                const session = client.getSession();
                if (!session || !message.key?.remoteJid) return;

                try {
                    const media = await downloadMediaMessage(message, "buffer", {});

                    if (!media) {
                        await session.sendMessage(message.key.remoteJid, { text: "Pastikan file PDF dikirim bersama commandnya" }, { quoted: message });
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
                    }, { quoted: message });


                } catch (error) {
                    await session.sendMessage(message.key.remoteJid, { text: "Terjadi error saat mengonversi file" }, { quoted: message });
                    logger.warn("Converter error:", error);
                }
            }
        }
    ]
} as CommandType;