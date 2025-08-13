import { ClientEvent } from "../type/client";

export default {
    event: "groups.update",
    listener: async ([event], client) => {
        if (!client.getSession() || !event.id) return;
        try {

            const session = client.getSession();

            if (!session) {
                client.logger.warn("No active session found for updating group metadata.");
                return;
            }

            const metadata = await session.groupMetadata(event.id);

            client.groupCache.set(event.id, metadata);
        } catch (error) {
            client.logger.warn(`Failed to update cache for group ${event.id}:`, error);
        }
    }
} as ClientEvent;