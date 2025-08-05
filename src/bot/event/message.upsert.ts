import logger from "../../shared/lib/logger";
import { ClientEvent } from "../type/client";

export default {
    event: "messages.upsert",
    listener: async (event, client) => {
        return client.command.handleCommandEvent(event)
    }
} as ClientEvent;