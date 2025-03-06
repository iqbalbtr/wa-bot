import client from "../bot/bot";
import { limiterMiddleware } from "../middleware/limiter";

client.on('message', async (msg) => {

    const prefix = msg.body;
    const command = client.commands?.get(prefix);

    if (command)
        limiterMiddleware(client, msg, async (rmUser) => {
            try {
                return command.execute(msg, client);
            } catch (error) {
                console.error(error);
            } finally {
                rmUser(client, msg)
            }
        })
})