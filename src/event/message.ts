import client from "../bot/bot";
import { limiterMiddleware, removeLimiterUser } from "../middleware/limiter";

client.on('message', async (msg) => {

    const prefix = msg.body;
    const command = client.commands?.get(prefix);

    if (command)
        limiterMiddleware(client, msg, () => command.execute(msg, client))
})