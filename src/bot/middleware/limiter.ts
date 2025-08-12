import { proto } from "@whiskeysockets/baileys";
import { Client, ClientContextType } from "../type/client";
import { extractContactId } from "../lib/util";

export function limiterMiddleware(
    context: ClientContextType<proto.IWebMessageInfo>,
    next: () => void
) {

    const { client, params: message } = context;

    return new Promise((resolve) => {

        const userId = message.key.remoteJid

        if(!userId)
            return

        if (client.requestLimiter.isLimitReached()) {
            resolve(() => client.getSession()?.sendMessage(
                message.key.remoteJid!,
                {
                    text: "⚠️ Server sedang sibuk, coba lagi nanti!"
                }
            ));
        }

        client.requestLimiter.startRequest(userId);
        resolve(next())
    })
}
