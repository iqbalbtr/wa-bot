import { ClientEvent } from "../type/client";

export default {
    event: "messages.upsert",
    listener: async (event, client) => {
        return client.command.handleCommandEvent(event)
    }
} as ClientEvent;