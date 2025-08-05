import { Boom } from '@hapi/boom';
import { DisconnectReason } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import { WhatsappClient } from '../client/whatsaap';
import { ClientEvent } from '../type/client';


async function handleConnectionOpen(client: WhatsappClient): Promise<void> {
    client.startTime = Date.now();
    client.logger.info("✅ Connection established successfully.");

    try {
        await client.message.initializeMessageStore(client);
    } catch (error) {
        client.logger.error("❌ Failed during post-connection initialization:", error);
    }
}


async function handleConnectionClose(client: WhatsappClient, lastDisconnect: any): Promise<void> {
    const error = lastDisconnect?.error as Boom | undefined;
    const statusCode = error?.output?.statusCode;
    const reason = DisconnectReason[statusCode as number] || 'Unknown';

    client.logger.warn(`🔌 Connection closed. Reason: ${reason}`);

    if (statusCode === DisconnectReason.loggedOut) {
        client.logger.error("Connection logged out. Please delete the auth folder and restart.");
        await client.destroySession(true);
        return;
    }

    client.logger.info("Attempting to reconnect...");
    await client.createSession().catch(err => {
        client.logger.error("❌ Failed to re-create session:", err);
    });
}


const connectionUpdateEvent: ClientEvent = {
    event: "connection.update",
    listener: async (update, client) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            client.logger.info('📱 QR Code received, please scan with your phone.');
            qrcode.generate(qr, { small: true });
            return;
        }

        switch (connection) {
            case 'open':
                await handleConnectionOpen(client);
                break;
            case 'close':
                await handleConnectionClose(client, lastDisconnect);
                break;
        }
    },
};

export default connectionUpdateEvent;