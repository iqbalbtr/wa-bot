import { AnyMessageContent, MiscMessageGenerationOptions, WASocket } from "@whiskeysockets/baileys";
import { WhatsappClient } from "./whatsaap";
import logger from "../../shared/lib/logger";

type PendingMessage = {
    time: number;
    to: string;
    message: AnyMessageContent;
    options?: MiscMessageGenerationOptions;
}

export class MessageClient {

    private client?: WhatsappClient;
    messagePending: PendingMessage[] = [];
    private session:  WASocket| null = null;

    constructor(client?: WhatsappClient) {
        if (client) {
            this.client = client;
            this.session = client.getSession();
        }
    }

    async sendMessage(to: string, message: AnyMessageContent, options?: MiscMessageGenerationOptions) {

        if (!this.session) {
            this.messagePending.push({
                time: Date.now(),
                to,
                message,
                options
            });
        } else {
            await this.session.sendMessage(to, message, options);
        }
    }

    async retrievePendingMessages() {
        if (!this.session) {
            return;
        }

        const pendingMessages = [...this.messagePending];
        this.messagePending = [];

        for (const pending of pendingMessages) {
            try {
                await this.session.sendMessage(pending.to, pending.message, pending.options);
            } catch (error) {
                logger.error("Failed to send pending message:", error);
                this.messagePending.push(pending);
            }
        }
    }

    updateSession() {
        if (this.client) {
            this.session = this.client.getSession();
        }
    }

    getPendingMessageCount(): number {
        return this.messagePending.length;
    }

    async initializeMessageStore(client: WhatsappClient) {

        this.client = client;
        this.session = client.getSession();

        await this.retrievePendingMessages();
    }

}