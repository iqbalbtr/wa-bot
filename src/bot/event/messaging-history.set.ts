import { ClientEvent } from "../type/client";

export default {
    event: "messaging-history.set",
    listener: async (e, client) => {
        const {contacts} = e
        client.contactManager.setContacts(contacts)
    }
} as ClientEvent;