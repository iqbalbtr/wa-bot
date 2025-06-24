import { z } from "zod"
import db from "../database";
import { filteredMessages } from "../database/schema";
import fp from "fastify-plugin";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { eq } from "drizzle-orm";

const filterHandler = async (route: FastifyInstance, opst: FastifyPluginOptions) => {

    route.post("/filter", {
        schema: {
            body: {
                type: 'object',
                required: ['label', 'filter_keywords', 'auto_response'],
                properties: {
                    label: { type: 'string', minLength: 1 },
                    filter_keywords: { type: 'array', items: { type: 'string' } },
                    auto_response: { type: 'string' },
                    contact_ids: { type: 'array', items: { type: 'string' }, nullable: true }
                }
            }
        }
    }, async (req, reply) => {

        const body = await req.body as { label: string, filter_keywords: string[], auto_response: string, contact_ids?: string[] };

        await db.insert(filteredMessages).values({
            label: body.label,
            filter_keywords: body.filter_keywords ?? [],
            auto_response: body.auto_response,
            pinned_contact: body.contact_ids ?? []
        })

    })

    route.patch("/filter/:filterId", {
        schema: {
            body: {
                type: 'object',
                required: ['label', 'filter_keywords', 'auto_response'],
                properties: {
                    label: { type: 'string', minLength: 1 },
                    filter_keywords: { type: 'array', items: { type: 'string' } },
                    auto_response: { type: 'string' },
                    contact_ids: { type: 'array', items: { type: 'string' }, nullable: true }
                }
            }
        }
    }, async (req, reply) => {
        const { filterId } = req.params as { filterId: string };
        const body = await req.body as { label: string, filter_keywords: string[], auto_response: string, contact_ids?: string[] };

        await db.update(filteredMessages)
            .set({
                label: body.label,
                filter_keywords: body.filter_keywords ?? [],
                auto_response: body.auto_response,
                pinned_contact: body.contact_ids ?? []
            })
            .where(eq(filteredMessages.id, +filterId))

        return reply.status(200).send({
            status: true,
            message: "Filter updated successfully"
        });
    })

    route.delete("/filter/:filterId", {

    }, async(req, reply) => {
        const { filterId } = req.params as { filterId: string };

        await db.delete(filteredMessages)
            .where(eq(filteredMessages.id, +filterId))

        return reply.status(200).send({
            status: true,
            message: "Filter deleted successfully"
        });
    })
}

export default fp(filterHandler)