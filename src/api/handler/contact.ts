import { Hono } from "hono";
import client from "../../bot";
import cacheManager from "../../shared/lib/cache-manager";
import { successResponse } from "../lib/util";
import { HTTPException } from "hono/http-exception";

const contactHandler = new Hono();

contactHandler.get("/", async (ctx) => {


    let contacts = await cacheManager.get('contacts-whatsapp');

    
    if (!contacts) {
        
        if(!client.isLoggedIn)
            throw new HTTPException(401, { message: "Client is not logged in" });

        contacts = await client.getContacts()
        
        await cacheManager.set('contacts-whatsapp', contacts, 1000 * 60 * 15);
    }

    return ctx.json(successResponse("success get contacts", contacts), 200);
})

export default contactHandler