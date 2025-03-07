import client from "../bot/bot";
import { limiterMiddleware, removeLimiterUser } from "../middleware/limiter";

client.on('message', async (msg) => {

    const prefix = msg.body.split(process.env.PREFIX!)[1];
    
    if (msg.from.endsWith("@c.us")) {
        
        const command = client.commands?.get(prefix);
        
        if (command)
            await limiterMiddleware(client, msg, () => command.execute(msg, client));
    } else {

        const command = client.commands?.get(prefix);

        if (msg.mentionedIds.includes(client.info.wid._serialized as any)) {
            if (command)
                await limiterMiddleware(client, msg, () => command.execute(msg, client));
        }
    }

    removeLimiterUser(client, msg)
})