import client from "..";
import initializeSchedules from "../../schedule";

client.on('ready', async () => {
    client.isLoggedIn = true;

    console.log("Login telah berhasil");
    console.log(client.info.wid._serialized);

    await initializeSchedules()
})
