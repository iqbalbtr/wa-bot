import fs from "fs";

import { ClientEvent } from "../type/client";

export default {
    event: "messaging-history.set",
    listener: async (e, client) => {
        
        const {contacts} = e

        fs.writeFileSync("contacts.json", JSON.stringify(contacts, null, 2));
    }
} as ClientEvent;