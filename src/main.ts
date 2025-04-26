import client, { restartApp } from "./bot/bot";

client.initialize()

setInterval(restartApp, 30 * 1000)