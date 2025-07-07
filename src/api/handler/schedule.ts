import { Hono } from "hono";
import db from "../../database";
import { schedules } from "../../database/schema";
import { eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod"
import { successResponse } from "../lib/util";
import { HTTPException } from "hono/http-exception";
import { activeSchduleCurrent } from "../../schedule";

const scheduleHandler = new Hono()

scheduleHandler.get("/", async ctx => {
    const res = await db.select().from(schedules)

    const data = res.map(fo => ({
        ...fo,
        contact_ids: JSON.parse(fo.contact_ids)
    }))

    return ctx.json(successResponse("success get schedules", data), 200)
})

scheduleHandler.post('/',
    zValidator("json",
        z.object({
            message: z.string().min(1),
            contact_ids: z.array(z.string()).min(1),
            scheduled_time: z.string().min(1),
            attachment: z.string().optional().nullable()
        }), (res) => {
            if (!res.success) {
                throw new HTTPException(400, {
                    message: "Bad Request",
                    cause: res.error
                })
            }
        }
    ), async ctx => {

        const body = ctx.req.valid('json');

        await db.insert(schedules).values({
            ...body,
            contact_ids: JSON.stringify(body.contact_ids) ?? '',
        })

        await activeSchduleCurrent(body)

        return ctx.json(successResponse("success create schedule", 201))
    })

scheduleHandler.delete(
    "/:scheduleId",
    zValidator('param', z.object({
        scheduleId: z.string().min(1)
    }), (res) => {
        if (!res.success) {
            throw new HTTPException(400, {
                message: 'Bad Request',
                cause: res.error,
            })
        }
    }), async ctx => {

        const { scheduleId } = ctx.req.valid('param')

        const result = await db.delete(schedules).where(eq(schedules.id, +scheduleId))

        if (!result)
            throw new HTTPException(404, { message: "Schedule not found" });

        return ctx.json(successResponse("success delete schedule", 200))
    })


export default scheduleHandler