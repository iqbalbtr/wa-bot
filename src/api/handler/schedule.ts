import { Hono } from "hono";
import db from "../../database";
import { schedules } from "../../database/schema";
import { count, desc, eq, or } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod"
import { successResponse } from "../lib/util";
import { HTTPException } from "hono/http-exception";
import { activateNewSchedule } from "../../schedule";

const scheduleHandler = new Hono()

scheduleHandler.get("/",
    zValidator("query", z.object({
        page: z.coerce.number().min(1).optional().default(1),
        limit: z.coerce.number().min(1).optional().default(5),
    }), (res) => {
        if (!res.success) {
            throw new HTTPException(400, {
                message: "Bad Request",
                cause: res.error
            })
        }
    }), async ctx => {

        const { limit, page } = ctx.req.valid('query')

        const skip = (page - 1) * limit;

        const res = await db.select().from(schedules)
            .orderBy(desc(schedules.id)).limit(limit).offset(skip)

        const total = await db.select({ count: count() }).from(schedules)

        const data = res.map(fo => ({
            ...fo,
            contact_ids: JSON.parse(fo.contact_ids)
        }))

        const pagination = {
            total_page: Math.ceil(total[0].count / limit),
            total_item: total[0].count,
            page,
            data
        }

        return ctx.json(successResponse("success get schedules", pagination), 200)
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

        await activateNewSchedule(body)

        return ctx.json(successResponse("success create schedule", 201))
    })

scheduleHandler.patch(
    "/:scheduleId",
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

        const body = ctx.req.valid('json')
        const { scheduleId } = ctx.req.param()

        const countExist = await db.select({ count: count() }).from(schedules)

        const scheduleCount = countExist[0].count;

        if (scheduleCount === 0) {
            throw new HTTPException(404, { message: "Schedule not found" });
        }

        await db.update(schedules).set({
            ...body,
            contact_ids: JSON.stringify(body.contact_ids) ?? '',
        }).where(eq(schedules.id, +scheduleId))

        return ctx.json(successResponse("success delete schedule", 200))
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