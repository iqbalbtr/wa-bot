import app from "./app/api";
import { port } from "./constant/env";
import client from "./app/bot";
import "dotenv/config"

app.listen({
    port: +port,
}, (err) => {
    if (err) {
        console.error(err);
        process.exit(1)
    }
    console.log(`Server is running on port ${port}`);
})

// client.initialize()
