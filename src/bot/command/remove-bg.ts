import { removeBackground } from "@imgly/background-removal-node";
import { prefix } from "../../shared/constant/env";
import { saveFileToTemp } from "../../shared/lib/storage";
import { downloadMediaMessage, proto } from "@whiskeysockets/baileys";
import * as fs from "fs";
import { CommandType } from "../type/client";
import logger from "../../shared/lib/logger";

export default {
  name: "rem-bg",
  description: "Menghapus latar belakang dari gambar yang dikirim",
  usage: `\`${prefix}rem-bg\``,
  execute: async (message: proto.IWebMessageInfo, client) => {
    const session = client.getSession();
    if (!session || !message.key?.remoteJid) return;

    try {
      // Download image from message
      const buffer = await downloadMediaMessage(message, "buffer", {});
      if (!buffer) {
        await session.sendMessage(message.key.remoteJid, { text: "Pastikan gambarnya juga dikirim bersama commandnya" }, { quoted: message });
        return;
      }

      if (buffer.length >= 7 * 1024 * 1024) {
        await session.sendMessage(message.key.remoteJid, { text: "Ukuran gambar terlalu besar" }, { quoted: message });
        return;
      }

      // Save temp file
      const { outputFolderFile, outputFolder, filename } = saveFileToTemp(new Uint8Array(buffer), ['img', 'rem-bg'], '.png');

      // Remove background
      const removeBgBuffer = await removeBackground(outputFolderFile, {
        output: {
          format: 'image/png',
          quality: 0.9
        }
      });

      // Send result as document
      await session.sendMessage(message.key.remoteJid, {
        document: Buffer.from(await removeBgBuffer.arrayBuffer()),
        mimetype: "image/png",
        fileName: filename,
        caption: "Berhasil menghapus background"
      }, { quoted: message });

      fs.rmSync(outputFolder, { recursive: true });
    } catch (error) {
      await session.sendMessage(message.key.remoteJid, { text: "Terjadi error saat mengubah gambar" }, { quoted: message });
      logger.error("Remove background error:", error);
    }
  }
} as CommandType