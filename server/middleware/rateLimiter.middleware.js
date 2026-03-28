import rateLimit from 'express-rate-limit';

// Strict rate limiter for authentication endpoints (login, signup, OTP verification)
// 10 requests per 6 minutes
export const strictAuthLimiter = rateLimit({
    windowMs: 6 * 60 * 1000, // 6 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: {
        message: 'Too many authentication attempts . Please try again after 6 minutes.',
        retryAfter: 6 * 60 // seconds
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Skip successful requests (optional - you may want to count all requests)
    skipSuccessfulRequests: false,
    // Skip failed requests (optional)
    skipFailedRequests: false,
    handler: (req, res) => {
        res.status(429).json({
            message: 'Too many authentication attempts . Please try again after 6 minutes.',
            retryAfter: 6 * 60,
            error: 'RATE_LIMIT_EXCEEDED'
        });
    }
});

// Moderate rate limiter for password reset and OTP resend
// 20 requests per 6 minutes
export const moderateAuthLimiter = rateLimit({
    windowMs: 6 * 60 * 1000, // 6 minutes
    max: 20, // limit each IP to 20 requests per windowMs
    message: {
        message: 'Too many requests . Please try again after 6 minutes.',
        retryAfter: 6 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            message: 'Too many requests . Please try again after 6 minutes.',
            retryAfter: 6 * 60,
            error: 'RATE_LIMIT_EXCEEDED'
        });
    }
});

// General API rate limiter
// 100 requests per 10 minutes
export const generalLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100,
    message: {
        message: 'Too many requests . Please try again after 10 minutes.',
        retryAfter: 10 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            message: 'Too many requests . Please try again after 10 minutes.',
            retryAfter: 10 * 60,
            error: 'RATE_LIMIT_EXCEEDED'
        });
    }
});
