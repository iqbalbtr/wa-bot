import fs, { mkdirSync } from "fs";
import { Contact } from "@whiskeysockets/baileys";
import { WhatsappClient } from "./whatsaap";
import path from "path";

export class ContactClient {

    private contacts: Contact[] = [];

    constructor(private client: WhatsappClient) {
    }

    public initialize() {
        mkdirSync(path.join(process.cwd(), "temp", "assets"), { recursive: true });
        this.loadContactsFromFile();
    }

    async getContact() {
        return this.contacts;
    }

    async setContact(contacts: Contact[]) {
        this.contacts = contacts.filter(contact => contact.id && contact.name && contact.id.endsWith("@g.us"));
        this.saveContactsToFile(contacts);
    }

    private async saveContactsToFile(contacts: Contact[]) {
        this.contacts = contacts.filter(contact => contact.id && contact.name && contact.id.endsWith("@g.us"));
        fs.writeFileSync(path.join(process.cwd(), "temp", "assets", "contacts.json"), JSON.stringify(this.contacts, null, 2));
        this.client.logger.info("Contacts saved to contacts.json");
    }

    private async loadContactsFromFile() {
        const filePath = path.join(process.cwd(), "temp", "assets", "contacts.json");
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, "utf-8");
            this.contacts = (JSON.parse(data) as Contact[]).filter(contact => contact.id && contact.name && contact.id.endsWith("@g.us"));
            this.client.logger.info("Contacts loaded from contacts.json");
        }
    }
}