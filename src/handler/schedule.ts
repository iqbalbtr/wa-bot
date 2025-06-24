import db from "../database";
import { schedules } from "../database/schema";
import { eq } from "drizzle-orm";
import  { FastifyInstance, FastifyPluginOptions } from "fastify";

const scheduleHandler = async (route: FastifyInstance, opts: FastifyPluginOptions) => {

    route.post('/', {
        schema: {
            body: {
                type: 'object',
                required: ['message', 'contact_ids', 'scheduled_time'],
                properties: {
                    message: { type: 'string', minLength: 1 },
                    contact_ids: { type: 'array', items: { type: 'string' }, nullable: true },
                    scheduled_time: { type: 'string', format: 'date-time' }
                }
            }
        }
    }, async (req, reply) => {

        const { message, contact_ids, scheduled_time } = req.body as { message: string, contact_ids?: string[], scheduled_time: string };

        await db.insert(schedules).values({
            message: message,
            contact_ids: JSON.stringify(contact_ids) ?? '',
            scheduled_time: scheduled_time
        })

        return {
            message: "success adding new schedule"
        }
    })

    route.delete("/:scheduleId", {}, async (req, reply) => {

        const { scheduleId } = req.params as { scheduleId: string };

        if (!scheduleId) {
            return reply.status(400).send({
                message: "schedule not valid"
            })
        }

        const result = await db.delete(schedules).where(eq(schedules.id, +scheduleId))

        if (!result) {
            return reply.status(400).send({
                message: "schedule not found"
            })
        }

        return reply.send({
            message: "success"
        })
    })

}

export default scheduleHandler