import { ClientEvent } from "../type/client";

export default {
    event: "messages.upsert",
    listener: async (event, client) => {
        return client.commandManager.processIncomingMessage(event);
    }
} as ClientEvent;