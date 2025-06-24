import client from "../app/bot";
import { devId } from "../constant/env";
import { handleSessionCommand, sessionHandler } from "../lib/session";
import { extractUserNumber, messageAutoReply, middlewareApplier } from "../lib/util";
import { blockUserMiddleware } from "../middleware/bot/block-user";
import { filterMessageMiddleware } from "../middleware/bot/filter-message";
import { limiterMiddleware, removeLimiterUser } from "../middleware/bot/limiter";
import { SessionUserType } from "../types/client";
import { Message } from "whatsapp-web.js";


client.on('message', async (msg) => {

    const userInSession = client.session.users.get(extractUserNumber(msg));

    if(msg.from !== devId)
        return

    /**
     * Inisialisasi middleware untuk memfilter pesan yang masuk
     */
    await middlewareApplier(
        { client, params: msg },
        [
            filterMessageMiddleware,
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
    removeLimiterUser(client, msg);
});


/**
 * Fungsi untuk menangani pesan dari pengguna yang sudah terdaftar di sesi
 */
async function handleSessionUser(msg: Message, userInSession: SessionUserType) {

    const isPrivateMessage = msg.from.endsWith("@c.us");
    const isGroupMessage = msg.mentionedIds.includes(client.info.wid);

    if (isPrivateMessage || isGroupMessage) {

        // Mengambil perintah dari pesan yang masuk dari group
        if (!isPrivateMessage) {
            msg.body = msg.body.split(" ").slice(1).join(" ");
        }

        // Memverifikasi jika sesi benar dan user terdaftar di sesi
        const handler = sessionHandler(msg, userInSession, client);
        if (!handler) return;

        const command = getCommandFromBody(msg.body);
        const sessionCommand = handleSessionCommand(command, userInSession.session.commands || []);
        sessionCommand?.execute(msg, client, userInSession.data);
    }
}


/**
 * Fungsi untuk menangani pesan dari pengguna yang tidak terdaftar di sesi
 */
async function handleNormalUser(msg: Message) {

    /**
     * Melakukan validasi apakah pesan yang masuk dari private chat atau group chat
     */
    const isPrivateMessage = msg.from.endsWith("@c.us");
    const isGroupMessage = msg.mentionedIds.map(fo => fo._serialized).includes(client.info.wid._serialized);

    if (isPrivateMessage) {
        const command = getCommandFromPrefix(msg.body);
        if (command) {
            return command.execute(msg, client);
        }
        return messageAutoReply(msg, client);
    }

    if (isGroupMessage) {
        const bodyParts = msg.body.split(" ");
        msg.body = bodyParts.slice(1).join(" ");
        const groupCommandPrefix = bodyParts[1]?.split(process.env.PREFIX!)[1];
        const command = client.commands?.get(groupCommandPrefix);

        if (command) {
            return command.execute(msg, client);
        }
        return messageAutoReply(msg, client);
    }
}

function getCommandFromBody(body: string) {
    return body.trim().split(' ')[0];
}

function getCommandFromPrefix(body: string) {
    const prefix = body.split(" ")[0].split(process.env.PREFIX!)[1];
    return client.commands?.get(prefix);
}
