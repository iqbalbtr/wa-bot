import client from "..";
import { devId } from "../../shared/constant/env";
import { blockUserMiddleware } from "../middleware/block-user";
import { limiterMiddleware } from "../middleware/limiter";
import { SessionUserType } from "../type/client";
import { proto } from "@whiskeysockets/baileys";
import logger from "../../shared/lib/logger";
import { ClientEvent } from "../type/client";
import { extractCommandFromPrefix, extractContactId, middlewareApplier } from "../lib/util";
import { handleSessionCommand, sessionHandler } from "../lib/session";

/**
 * Fungsi untuk menangani pesan dari pengguna yang sudah terdaftar di sesi
 */
async function handleSessionUser(msg: proto.IWebMessageInfo, userInSession: SessionUserType) {

    const isGroupMessage = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.includes(extractContactId(devId)) || false;

    if (isGroupMessage) {

        // Memverifikasi jika sesi benar dan user terdaftar di sesi
        const handler = sessionHandler(msg, userInSession, client);
        if (!handler) return;

        const command = getCommandFromBody(msg.message?.conversation || "");
        const sessionCommand = handleSessionCommand(command, userInSession.session.commands || []);
        sessionCommand?.execute(msg, client, userInSession.data);
    }
}


/**
 * Fungsi untuk menangani pesan dari pengguna yang tidak terdaftar di sesi
 */
async function handleNormalUser(msg: proto.IWebMessageInfo) {

    /**
     * Melakukan validasi apakah pesan yang masuk dari private chat atau group chat
     */
    const isGroupMessage = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.includes(extractContactId(devId)) || false;
    const commandName = extractCommandFromPrefix(msg.message?.conversation || "");
    const command = client.command.getCommand(commandName || "");

    if (isGroupMessage) {

        const isMentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.includes(extractContactId(devId)) || false;

        if (command && isMentioned) {
            return command.execute(msg, client);
        }
        return client.defaultMessageReply(msg);
    } else {
        if (command) {
            return command.execute(msg, client);
        }
        return client.defaultMessageReply(msg);
    }
}

function getCommandFromBody(body: string) {
    return body.trim().split(' ')[0];
}


export default {
    event: "messages.upsert",
    listener: async (update, client) => {

        const msg = update.messages[0];
        const from = extractContactId(msg.key.remoteJid || "");

        if (msg.key.fromMe) return

        if (!msg.message || !msg.key || !from) {
            logger.warn("Received message without content or key");
            return;
        }

        const userInSession = client.userActiveSession.getUserSession(extractContactId(msg.key.remoteJid || ""));

        /**
         * Inisialisasi middleware untuk memfilter pesan yang masuk
         */
        await middlewareApplier(
            { client, params: msg },
            [
                blockUserMiddleware,
                limiterMiddleware,
            ],
            async () => {
                if (userInSession) {
                    await handleSessionUser(msg, userInSession);
                } else {
                    await handleNormalUser(msg);
                }
            }
        )

        // Menghilagkan sesi user yang sudah tidak memiliki prosess berjalan
        client.limiter.removeUser(from);
    },
} as ClientEvent