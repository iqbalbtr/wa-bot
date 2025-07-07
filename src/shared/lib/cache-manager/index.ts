import { createCache, } from "cache-manager";

const cacheManager = createCache({
    ttl: 10 * 1000
})

export default cacheManager;