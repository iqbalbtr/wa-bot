import { Message } from "whatsapp-web.js";
import { ClientType } from "../types/client";

export function removeLimiterUser(client: ClientType, message: Message) {
    client.limiter.users.delete(message.from);
}

export function limiterMiddleware(
    client: ClientType,
    message: Message,
    next: () => void
) {
    const userId = message.from;
    const now = Date.now();
    const cooldownTime = 10 * 1000;

    if (client.limiter.users.size >= client.limiter.max) {
        return message.reply("⚠️ Server sedang sibuk, coba lagi nanti!");
    }

    const lastRequestTime = client.limiter.users.get(userId);

    if (lastRequestTime && now - lastRequestTime < cooldownTime) {
        return message.reply("⏳ Kamu terlalu cepat! Silakan coba lagi nanti.");
    }

    client.limiter.users.set(userId, now);
    client.limiter.userTotal += 1

    next();
}
