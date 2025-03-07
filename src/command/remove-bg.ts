import { Message, MessageMedia } from "whatsapp-web.js";
import { removeBackground } from "@imgly/background-removal-node";
import * as fs from 'fs'
import { saveFileToTemp } from "../lib/util";
import { ClientType } from "../types/client";
import { removeLimiterUser } from "../middleware/limiter";

function base64ToImage(base64String: string) {
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

module.exports = {
  name: "!remove-bg",
  description: "Menghapus latar belakang dari gambar yang dikirim",
  execute: async (message: Message, client: ClientType) => {
    const img = await message.downloadMedia();

    if (!img) return message.reply("Image nya mana bang? 🤦‍♂️");

    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(img.mimetype)) {
      return message.reply('Waduh format tidak didukung nih. pastikan format gambar jpge, png, jpg, atau webp');
    }

    if (base64ToImage(img.data).length >= 7 * 1024 * 1024) {
      return message.reply("Gambarnya terlalu besar")
    }

    const { outputFolderFile, outputFolder, filename } = saveFileToTemp(base64ToImage(img.data), ['img', 'rem-bg'], '.png')

    try {

      const removeBgBuffer = await removeBackground(outputFolderFile, {
        output: {
          format: 'image/png',
          quality: 0.9
        }
      });

      const media = new MessageMedia("image/png", Buffer.from(await removeBgBuffer.arrayBuffer()).toString('base64'), filename);

      client.sendMessage(message.from, media, {
        sendMediaAsDocument: true
      })

      fs.rmSync(outputFolder, { recursive: true })
    } catch (error) {
      message.reply('Terjadi error saat mengubah gambar')
      console.error(error);
    } finally {
      removeLimiterUser(client, message)
    }
  }
};
