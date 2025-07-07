import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import cacheManager from '../../shared/lib/cache-manager';
import { secretKey } from '../../shared/constant/env';

export const authMiddleware = createMiddleware(async (ctx, next) => {
    try {
        const rawToken = ctx.req.header('Authorization')
        const token = rawToken?.replace(/^Bearer\s/, '')

        if (!token) {
            throw new HTTPException(401)
        }

        let isValidToken = await cacheManager.get(token)

        if (!isValidToken) {
            const apiUrl = process.env.API_URL
            
            if (!apiUrl) throw new Error('API_URL not defined in env')

            const getUser = await fetch(`${apiUrl}/api/user`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-SECRET-KEY': secretKey,
                },
            })

            const user = await getUser.json()

            await cacheManager.set(token, user, 60 * 5) 
            isValidToken = user
        }

        ctx.set('user', isValidToken)

        return next()
    } catch (error) {
        throw new HTTPException(401, {
            message: 'Unauthorized access',
            cause: error,
        })
    }
})