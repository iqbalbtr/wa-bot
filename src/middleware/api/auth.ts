import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'


export const authMidlleware = createMiddleware(async (ctx, next) => {

    const { req } = ctx;

    const token = req.header()["authorization"]

    if (!token) {
        throw new HTTPException(401)
    }

    const getUser = await fetch(`${process.env.API_URL}/me`, {
        method: "GET",
        headers: {
            "Authorization": token
        }
    });

    if (!getUser.ok) {
        throw new HTTPException(401)
    }

    ctx.set("user", await getUser.json())

    return next()
})