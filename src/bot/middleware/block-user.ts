import { Message } from "whatsapp-web.js";
import db from "../../database";
import { blockedUsers } from "../../database/schema";
import { ClientContextType } from "../type/client";

export async function blockUserMiddleware(context: ClientContextType<Message>, next: () => void) {

    const { params: message } = context;

    const userId = message.from

    const blockUsers = await db.select().from(blockedUsers)

    if (blockUsers.map(user => user.contact_id).includes(userId)) {
        message.reply("⚠️ Kamu sudah diblokir oleh bot ini!")
        return;
    }

    next();
}