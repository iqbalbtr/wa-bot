import { port } from "./shared/constant/env";
import client from "./bot";
import "dotenv/config"
import api from "./api";

client.createSession()
// serve({
//   fetch: api.fetch,
//   port: +port,
// }, async (e) => {

//   console.log("server is running at", e.port)

//   // Initialize the bot client
//   console.log("starting bot");
//   await client.initialize()
// })