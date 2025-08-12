import { ClientEvent } from "../type/client";

export default {
    event: "group-participants.update",
    listener: async (event, client) => {

        const { id, participants, action, author } = event;

        try {
            const session = client.getSession();

            if (!session) {
                client.logger.warn("No active session found for updating group metadata.");
                return;
            }

            // if (action == "add") {
            //     const welcomeText = `Halo dan selamat datang di grup, @${participants[0].split('@')[0]}! 🎉`;

            //     await client.message.sendMessage(id, {
            //         text: welcomeText,
            //         mentions: participants
            //     });
            // }

            const metadata = await session.groupMetadata(event.id);
            client.groupCache.set(event.id, metadata);
        } catch (error) {
            client.logger.warn(`Failed to update cache for group ${event.id}:`, error);
        }
    }
} as ClientEvent