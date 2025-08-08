import client from "./bot";
import "dotenv/config"
import { serve } from '@hono/node-server'
import api from "./api";
import { port } from "./shared/constant/env";

serve({
  fetch: api.fetch,
  port: +port,
}, async (e) => {

  console.log("server is running at", e.port)

  // Initialize the bot client
  console.log("starting bot");
  await client.initialize()
})