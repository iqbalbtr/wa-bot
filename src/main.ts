import client from "./bot";
import "dotenv/config"
import api from "./api";
import { port } from "./shared/constant/env";
import { serve } from "@hono/node-server";
import logger from "./shared/lib/logger";
import scheduleManager from "./schedule";

serve({
    fetch: api.fetch,
    port: +port,
}, async (e) => {
    logger.info(`server is running at ${e.port}`)
    await client.createSession()
    await scheduleManager.initialize()
})