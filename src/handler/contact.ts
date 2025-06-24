import client from "../app/bot";
import cacheManager from "../lib/cache-manager";

const contactHandler = new Hono();

contactHandler.get("/", async (ctx) => {

    
    const isCaching = await cacheManager.get('contacts-whatsapp');
    
    if( isCaching) {
        return ctx.json(isCaching);
    } else {
        const contacts = await client.getContacts()

        await cacheManager.set('contacts-whatsapp', contacts, 1000 * 60 * 15);

        return ctx.json(contacts)
    }

})

export default contactHandler