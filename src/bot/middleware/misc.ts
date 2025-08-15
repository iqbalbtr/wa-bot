import { eq } from "drizzle-orm";
import db from "../../database";
import { groupSettings } from "../../database/schema";
import { ClientContextType } from "../type/client";
import { groupEnumSetting } from "../command/group";

export function miscMiddleware(context: ClientContextType, next: () => void) {

    const { client, message, payload } = context;

    return new Promise(async (resolve) => {

        const userId = message.key.remoteJid

        if (!userId)
            return
        
        if (!userId.endsWith("@g.us")) {
            
            client.sessionManager.endSessionForUser(message)
            client.messageClient.sendMessage(userId, {
                text: "Perintah ini hanya bisa digunakan di grup."
            });

            return ;
        }

        resolve(next())
    })
}