import Fastify from "fastify"
// import scheduleHandler from "../handler/schedule";
// import contactHandler from "../handler/contact";
// import { authMidlleware } from "../middleware/api/auth";
import messageRoute from "../handler/message"
import multipart from "@fastify/multipart"
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";

/**
 * 
 * Kamu bisa mengatur konfigurasi route dan rest API server disini
 */
const app = Fastify({
    logger: { level: "info" },
})

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.withTypeProvider<ZodTypeProvider>()
app.register(multipart)

// app.use("/", authMidlleware);


app.register(messageRoute);
// app.route("/message/schedule", scheduleHandler);
// app.route("/contacts", contactHandler);

export default app;