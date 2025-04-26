import client, { restartApp } from "../bot/bot";

client.on('disconnected', () => {
    console.log("Bot disconected");
    restartApp()
})