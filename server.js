// Global rate limiter configuration
const globalLimiter = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit all IPs to 100 requests per windowMs
    message: 'Too many requests from all users, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    store: new rateLimit.MemoryStore(), // Use memory store for global tracking
    keyGenerator: () => 'global' // Use a single key for all requests
};

// Apply global rate limiter before the IP-based one
app.use(rateLimit(globalLimiter));