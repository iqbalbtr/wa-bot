import client from "../app/bot";

client.on('ready', () => {
    client.isLoggedIn = true;
    console.log("Login telah berhasil");
    console.log(client.info.wid._serialized);

})
