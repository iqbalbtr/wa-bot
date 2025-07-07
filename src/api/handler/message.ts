import { Hono } from "hono";
import { zValidator } from '@hono/zod-validator'
import { z } from "zod"
import { MessageMedia } from "whatsapp-web.js";
import client from "../../bot";
import { HTTPException } from "hono/http-exception";
import { successResponse } from "../lib/util";

const messageRoute = new Hono()

messageRoute.post("/forward",
    zValidator("json",
        z.object({
            targets: z.array(z.string()).min(1, "At least one target is required"),
            message: z.string().min(1, "Message cannot be empty"),
            attachment: z.string().optional().nullable()
        }), (res) => {
            if (!res.success)
                throw new HTTPException(400, { cause: res });
        }
    ),
    async ctx => {

        const { message, targets, attachment } = ctx.req.valid("json")

        if (!client.isLoggedIn)
            throw new HTTPException(401, { message: "Client is not logged in" });

        let media

        if (attachment) {
            media = MessageMedia.fromFilePath(attachment)
        }

        if (!client.isLoggedIn)
            throw new HTTPException(401, { message: "Client is not logged in" });

        let resultSuccessCount = 0

        for (const target of targets) {

            try {
                await client.sendMessage(target, media ? media : message, media && { caption: message })
                resultSuccessCount += 1
            } catch (error) {
                console.error(`Failed to forward message to ${target}:`, error);
            }
        }

        const res = {
            success: resultSuccessCount,
            failed: targets.length - resultSuccessCount,
            total: targets.length
        }

        return ctx.json(successResponse("Message forwarded successfully", res))
    })

export default messageRoute