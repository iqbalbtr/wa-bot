import client from "..";

client.on('disconnected', () => {
    console.log("Bot disconected");
    client.isLoggedIn = false;
})