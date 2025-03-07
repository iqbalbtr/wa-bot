import { Message } from "whatsapp-web.js";
import { ClientType } from "../types/client";

export function removeLimiterUser(client: ClientType, message: Message) {
    const userId = message.from.endsWith("@c.us") ? message.from : message.author
        client.limiter.users.delete(userId!);
}

export function limiterMiddleware(
    client: ClientType,
    message: Message,
    next: () => void
) {
    return new Promise((resolve) => {

        const now = Date.now();
        const userId = message.from.endsWith("@c.us") ? message.from : message.author

        if (client.limiter.users.size >= client.limiter.max) {
            resolve(message.reply("⚠️ Server sedang sibuk, coba lagi nanti!"));
        }

        client.limiter.users.set(userId!, now);

        client.limiter.userTotal += 1

        resolve(next())
    })
}
