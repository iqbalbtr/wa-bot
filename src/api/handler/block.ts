import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod"
import db from "../../database";
import { blockedUsers } from "../../database/schema";
import { eq, or } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { successResponse } from "../lib/util";

const blockHandler = new Hono();

blockHandler.get("/", async ctx => {

    const search = ctx.req.query("q") || "";

    let contacts

    if (search) {
        contacts = await db.select().from(blockedUsers)
            .where(
                or(
                    eq(blockedUsers.contact_id, search),
                    eq(blockedUsers.block_reason, search)
                )
            )
    } else {
        contacts = await db.select().from(blockedUsers);
    }

    contacts = await db.select().from(blockedUsers);


    return ctx.json(successResponse("success get blocked users", contacts), 200);
})

blockHandler.post("/",
    zValidator("json", z.object({
        contact_id: z.string(),
        block_reason: z.string(),
    }), (res) => {
        if (!res.success) {
            throw new HTTPException(400, {
                message: 'Bad Request',
                cause: res.error,
            })
        }
    }),
    async (ctx) => {

        const body = ctx.req.valid('json')

        const isExist = await db.select().from(blockedUsers).where(eq(blockedUsers.contact_id, body.contact_id))

        if (isExist.length >= 1)
            throw new HTTPException(401, { message: "user already blocked" })

        await db.insert(blockedUsers).values({
            contact_id: body.contact_id,
            block_reason: body.block_reason,
        })

        return ctx.json(successResponse("success blocking user"), 201)
    })

blockHandler.delete("/:blockId",
    async (ctx) => {

        const params = ctx.req.param()

        const isExist = await db.select().from(blockedUsers).where(eq(blockedUsers.id, +params['blockId']))

        if (!isExist)
            throw new HTTPException(404, { message: "blocked user not found" })

        await db.delete(blockedUsers).where(eq(blockedUsers.id, +params['blockId']))

        return ctx.json(successResponse("success unblocking user"), 200)
    })

export default blockHandler