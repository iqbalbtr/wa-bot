import { Hono } from "hono";
import { saveFileToTemp } from "../../shared/lib/storage";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import { successResponse } from "../lib/util";

const uploadHandler = new Hono()

uploadHandler.post("/",
    zValidator("form", z.object({
        file: z.instanceof(File).refine(file => file.size > 0, {
            message: "File must be provided and cannot be empty"
        }).refine(file => file.size <= 25 * 1024 * 1024, {
            message: "File size must not exceed 10MB"
        }),
        is_temp: z.string().optional().default("true").transform(value => value === "true" || value === "1")
    }), (res) => {
        if (!res.success) {
            throw new HTTPException(400, {
                message: 'Bad Request',
                cause: res.error,
            })
        }
    }),
    async (c) => {

        const body = c.req.valid("form")

        const file = body["file"] as File

        const result = saveFileToTemp(Buffer.from(await file.arrayBuffer()), ["bot"], `.${file.name.split(".").pop()}`, (e, isDelete) => {
            if (body.is_temp) {
                setTimeout(() => {
                    isDelete()
                }, 1000 * 60 * 15)
            }
        })

        return c.json(successResponse("success store file", result))
    })

export default uploadHandler