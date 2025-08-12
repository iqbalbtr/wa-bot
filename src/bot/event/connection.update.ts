import { Boom } from '@hapi/boom';
import { ConnectionState, DisconnectReason } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import type { ClientEvent } from '../type/client';
import type { WhatsappClient } from '../core/whatsaap';

/**
 * Menangani logika saat koneksi WhatsApp berhasil terbuka sepenuhnya.
 * @param client Instance WhatsappClient.
 */
async function handleConnectionOpen(client: WhatsappClient): Promise<void> {
    const session = client.getSession();
    if (!session) return;

    client.logger.info("✅ Connection established successfully.");

    try {

        const groupMetadata = await session.groupFetchAllParticipating();
        client.logger.info("Fetching and caching group metadata...");
        for (const jid in groupMetadata) {
            client.groupCache.set(jid, groupMetadata[jid]);
        }
        client.logger.info(`Cached metadata for ${Object.keys(groupMetadata).length} groups.`);

    } catch (error) {
        client.logger.error("❌ Failed during post-connection setup:", error);
    }
}

/**
 * Menangani logika saat koneksi WhatsApp terputus.
 * @param client Instance WhatsappClient.
 * @param lastDisconnect Objek yang berisi informasi tentang alasan diskoneksi.
 */
async function handleConnectionClose(client: WhatsappClient, lastDisconnect: ConnectionState['lastDisconnect']): Promise<void> {
    const error = lastDisconnect?.error;
    const statusCode = (error instanceof Boom) ? error.output.statusCode : 0;
    const reason = DisconnectReason[statusCode] || 'Unknown';

    client.logger.warn(`🔌 Connection closed. Reason: ${reason} (Code: ${statusCode})`);

    // Jika ter-logout, hapus sesi dan hentikan bot
    if (statusCode === DisconnectReason.loggedOut) {
        client.logger.error("Connection logged out. Please delete the auth folder and restart.");
        await client.destroySession(true);
        // Hentikan proses agar tidak mencoba rekoneksi tanpa henti
        process.exit(1);
        return;
    }

    // Untuk error lain, coba untuk rekoneksi
    client.logger.info("Attempting to reconnect...");
    await client.createSession().catch(err => {
        client.logger.error("❌ Failed to re-create session:", err);
    });
}

/**
 * Mendefinisikan event handler untuk 'connection.update'.
 * Event ini mengelola seluruh siklus hidup koneksi, dari QR code, konek, hingga terputus.
 */
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