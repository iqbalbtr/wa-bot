import { Hono } from "hono";
import { zValidator } from '@hono/zod-validator';
import { z } from "zod";
import client from "../../bot";
import { HTTPException } from "hono/http-exception";
import { successResponse } from "../lib/util";
import fs from "fs";
import mime from "mime-types";

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

        const session = client.getSession();

        if (!session) {
            throw new HTTPException(401, { message: "Client is not logged in" });
        }

        let resultSuccessCount = 0;

        for (const target of targets) {
            try {
                if (attachment && attachment.length > 0) {

                    const sendAllMessage = attachment.map(async (filePath, i) => {

                        if (!fs.existsSync(filePath)) {
                            throw new Error(`File not found: ${filePath}`);
                        }

                        const buffer = fs.readFileSync(filePath);
                        const mimeType = mime.lookup(filePath) || 'application/octet-stream';
                        const fileName = filePath.split(/[\\/]/).pop() || 'file';
                        const isLastAttachment = i === attachment.length - 1;

                        if (mimeType.startsWith('image/')) {
                            return session.sendMessage(target, {
                                image: buffer,
                                caption: isLastAttachment ? message : undefined
                            });
                        } else if (mimeType.startsWith('video/')) {
                            return session.sendMessage(target, {
                                video: buffer,
                                caption: isLastAttachment ? message : undefined
                            });
                        } else if (mimeType.startsWith('audio/')) {
                            return session.sendMessage(target, {
                                audio: buffer,
                                mimetype: mimeType
                            });
                        } else {
                            return session.sendMessage(target, {
                                document: buffer,
                                mimetype: mimeType,
                                fileName: fileName,
                                caption: isLastAttachment ? message : undefined
                            });
                        }
                    });

                    await Promise.all(sendAllMessage);

                } else {
                    // Kirim pesan teks biasa jika tidak ada lampiran
                    await session.sendMessage(target, { text: message });
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