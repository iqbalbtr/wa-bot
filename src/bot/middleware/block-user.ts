import { proto } from "@whiskeysockets/baileys";
import db from "../../database";
import { blockedUsers } from "../../database/schema";
import { ClientContextType } from "../type/client";
import { extractContactId } from "../lib/util";

export async function blockUserMiddleware(context: ClientContextType<proto.IWebMessageInfo>, next: () => void) {

    const session = context.client.getSession();
    const { params: message } = context;

    const userId = extractContactId(message.key.remoteJid || "");

    const blockUsers = await db.select().from(blockedUsers)

    if (blockUsers.map(user => user.contact_id).includes(userId)) {
        await session?.sendMessage(message.key.remoteJid!, {
            text: "Maaf, kamu telah diblokir oleh bot ini."
        },{
            quoted: message
        });
        return;
    }

    next();
}