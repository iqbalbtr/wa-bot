import { Message } from "whatsapp-web.js";
import { like } from "drizzle-orm";
import { ClientContextType } from "../../types/client";
import { getUserIdFromMessage } from "../../lib/util";
import db from "../../database";
import { filteredMessages } from "../../database/schema";

export async function filterMessageMiddleware(context: ClientContextType<Message>, next: () => void) {

    const { params: message } = context;

    const filterMessages = await db.select().from(filteredMessages).where(like(filteredMessages.filter_keywords, `%${message.body}%`))

    if (filterMessages.length > 0) {
        const filter = filterMessages[0]

        message.reply(filter.auto_response)
        return;
    }

    next()
}