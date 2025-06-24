import { Hono } from "hono";
import client from "../app/bot";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod"

const blockHandler = new Hono();

blockHandler.post("/block",
    zValidator("json", z.object({
        number: z.string(),
        blockName: z.string(),
        blockType: z.enum(["user", "group"]),
        reason: z.string().optional()
    })),
    async (ctx) => {

        const contacts = await client.getContacts()

        return ctx.json(contacts)
    })

blockHandler.delete("/block/:blockId",
    zValidator("param", z.object({
        blockId: z.string(),
    })),
    async (ctx) => {

        const contacts = await client.getContacts()

        return ctx.json(contacts)
    })

export default blockHandler