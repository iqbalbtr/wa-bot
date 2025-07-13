import { Hono } from "hono";
import { zValidator } from '@hono/zod-validator';
import { z } from "zod";
import { MessageMedia } from "whatsapp-web.js";
import client from "../../bot";
import { HTTPException } from "hono/http-exception";
import { successResponse } from "../lib/util";

const messageRoute = new Hono();

messageRoute.post("/forward",
    zValidator("json",
        z.object({
            targets: z.array(z.string()).min(1, "At least one target is required"),
            message: z.string().min(1, "Message cannot be empty"),
            attachment: z.array(z.string()).optional().nullable()
        }), (res, c) => {
            if (!res.success) {
                throw new HTTPException(400, { cause: res.error });
            }
        }
    ),
    async (ctx) => {
        const { message, targets, attachment } = ctx.req.valid("json");

        if (!client.isLoggedIn) {
            throw new HTTPException(401, { message: "Client is not logged in" });
        }
        // Pengecekan login ganda telah dihapus dari sini
        let resultSuccessCount = 0;

        for (const target of targets) {
            try {
                if (attachment && attachment.length > 0) {

                    const sendAllMessage = attachment.map(async (path, i) => {

                        const media = MessageMedia.fromFilePath(path);
                        const isLastAttachment = i === attachment.length - 1;

                        return client.sendMessage(target, media, {
                            caption: isLastAttachment ? message : undefined
                        });

                    })

                    await Promise.all(sendAllMessage)

                } else {
                    // Kirim pesan teks biasa jika tidak ada lampiran
                    await client.sendMessage(target, message);
                }

                resultSuccessCount += 1;
            } catch (error) {
                // Log error untuk setiap target yang gagal
                console.error(`Failed to forward message to ${target}:`, error);
            }
        }

        const res = {
            success: resultSuccessCount,
            failed: targets.length - resultSuccessCount,
            total: targets.length
        };

        return ctx.json(successResponse("Forward process completed.", res));
    }
);

export default messageRoute;