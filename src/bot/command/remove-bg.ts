import { removeBackground } from "@imgly/background-removal-node";
import { prefix } from "../../shared/constant/env";
import { saveFileToTemp } from "../../shared/lib/storage";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import * as fs from "fs";
import { CommandType } from "../type/client";
import logger from "../../shared/lib/logger";

export default {
  name: "rem-bg",
  description: "Menghapus latar belakang dari gambar yang dikirim",
  usage: `\`${prefix}rem-bg\``,
  execute: async (message, client) => {
    const session = client.getSession();
    if (!session || !message.key?.remoteJid) return;

    try {
      const buffer = await downloadMediaMessage(message, "buffer", {});
      if (!buffer) {
        await session.sendMessage(message.key.remoteJid, { text: "Pastikan gambarnya juga dikirim bersama commandnya" });
        return;
      }

      if (buffer.length >= 7 * 1024 * 1024) {
        await session.sendMessage(message.key.remoteJid, { text: "Ukuran gambar terlalu besar" });
        return;
      }

      const { outputFolderFile, outputFolder, filename } = saveFileToTemp(new Uint8Array(buffer), ['img', 'rem-bg'], '.png');

      const removeBgBuffer = await removeBackground(outputFolderFile, {
        output: {
          format: 'image/png',
          quality: 0.9
        }
      });

      await session.sendMessage(message.key.remoteJid, {
        document: Buffer.from(await removeBgBuffer.arrayBuffer()),
        mimetype: "image/png",
        fileName: filename,
        caption: "Berhasil menghapus background"
      });

      fs.rmSync(outputFolder, { recursive: true });
    } catch (error) {
      await session.sendMessage(message.key.remoteJid, { text: "Terjadi error saat mengubah gambar" });
      logger.error("Remove background error:", error);
    }
  }
} as CommandType