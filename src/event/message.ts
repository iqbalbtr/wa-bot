import client from "../bot/bot";
import { extractUserNumber, messageAutoReply } from "../lib/util";
import { limiterMiddleware, removeLimiterUser } from "../middleware/limiter";
import { handleSessionCommand, sessionHandler } from "../lib/session";


client.on('message', async (msg) => {

    // check user session
    const userInSession = client.session.users.get(extractUserNumber(msg))

    if (userInSession) {

        // Handle user session
        await limiterMiddleware(client, msg, () => {

            // if user from private message
            if (msg.from.endsWith("@c.us")) {

                const handler = sessionHandler(msg, userInSession, client)
                if (handler) {
                    const command = msg.body.trim().split(' ')[0]

                    return handleSessionCommand(command, userInSession.session.commands || [])
                        ?.execute(msg, client, userInSession.data)
                }
            } else {

                 msg.body = msg.body.split(" ").slice(1).join(" ")

                // if user from group message
                if (msg.mentionedIds.includes(client.info.wid._serialized as any)) {

                    const handler = sessionHandler(msg, userInSession, client)
                    if (handler) {
                        const command = msg.body.trim().split(' ')[0]
                        
                        return handleSessionCommand(command, userInSession.session.commands || [])
                            ?.execute(msg, client, userInSession.data)
                    }
                }
            }
        })

    } else {
        
        const prefix = msg.body.split(" ")[0].split(process.env.PREFIX!)[1];

        // if user from private message
        if (msg.from.endsWith("@c.us")) {

            const command = client.commands?.get(prefix);

            if (command) {
                await limiterMiddleware(client, msg, () => command.execute(msg, client));
            } else {
                await limiterMiddleware(client, msg, () => messageAutoReply(msg, client));
            }
        } else {

            const body = msg.body.split(" ")

            // if user from group message
            if (msg.mentionedIds.includes(client.info.wid._serialized as any)) {

                msg.body = body.slice(1).join(" ")

                const groupCommand = body[1].split(process.env.PREFIX!)[1]
                const command = client.commands?.get(groupCommand);

                if (command) {
                    await limiterMiddleware(client, msg, () => command.execute(msg, client));
                } else {
                    await limiterMiddleware(client, msg, () => messageAutoReply(msg, client));
                }
            }
        }
    }


    removeLimiterUser(client, msg)
})