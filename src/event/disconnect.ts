import client from "../app/bot";

client.on('disconnected', () => {
    console.log("Bot disconected");
    client.isLoggedIn = false;
})