import { FastifyInstance, FastifyPluginOptions } from "fastify";
import client from "../app/bot";
import fp from "fastify-plugin";
import { z } from "zod";

const messageRoute = async (route: FastifyInstance, opts: FastifyPluginOptions) => {

    const messageSchema = z.object({
        targets: z.array(z.string()).min(1, "At least one target is required"),
        message: z.string().min(1, "Message cannot be empty"),
        attachment: z.string().optional()
    })
    route.post("/forward", {
        schema: {
            body: messageSchema
        }
    }, async (req, reply) => {

        const { message, targets, attachment } = req.body as z.infer<typeof messageSchema>;
  
        if (!client.isLoggedIn) {
            return reply.status(403).send({
                status: false,
                error: "Client is not logged in"
            });
        }

        for (const target of targets) {
            if (!client.isLoggedIn)
                continue;
            client.sendMessage(target, message)
        }

        if (attachment) {

        }

        return reply.status(200).send({
            status: true,
            message: "Messages forwarded successfully",
        })

    })
}

export default fp(messageRoute)