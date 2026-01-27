import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

/**
 * Rate limiting configuration for BikeHub
 * 
 * PRODUCTION RECOMMENDATION:
 * Use Redis-based store for rate limiting to ensure limits persist
 * across server restarts and work correctly in multi-instance deployments.
 * 
 * In-memory rate limiting (default) has limitations:
 * - Resets when server restarts
 * - Doesn't work with load balancers/multiple instances
 * - Each instance tracks limits separately
 */

// Redis client (for production)
let redisClient = null;

// Initialize Redis client (only in production or if REDIS_URL is set)
export const initRedis = async () => {
    if (process.env.REDIS_URL || process.env.NODE_ENV === 'production') {
        try {
            redisClient = createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379',
                socket: {
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            console.error('Redis: Max reconnection attempts reached');
                            return null;
                        }
                        return Math.min(retries * 100, 3000);
                    }
                }
            });

            redisClient.on('error', (err) => {
                console.error('Redis Client Error:', err);
            });

            redisClient.on('connect', () => {
                console.log('Redis connected for rate limiting');
            });

            await redisClient.connect();
            return redisClient;
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
            console.warn('Falling back to in-memory rate limiting');
            return null;
        }
    }
    return null;
};

// Create rate limiter with optional Redis store
export const createRateLimiter = (options = {}) => {
    const defaultOptions = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
        message: 'Too many requests from this IP, please try again later',
        standardHeaders: true,
        legacyHeaders: false,
        ...options
    };

    // Use Redis store if available
    if (redisClient) {
        defaultOptions.store = new RedisStore({
            client: redisClient,
            prefix: 'rl:', // Redis key prefix
            // Send command to reset on server restart
            sendCommand: (...args) => redisClient.sendCommand(args)
        });
    }

    return rateLimit(defaultOptions);
};

// Pre-configured limiters
export const apiLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again in 15 minutes'
});

export const strictAuthLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts, please try again in 15 minutes',
    skipSuccessfulRequests: false
});

export const moderateAuthLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many requests, please try again in 15 minutes'
});

export const uploadLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many file uploads from this IP, please try again in 15 minutes'
});

export default {
    initRedis,
    createRateLimiter,
    apiLimiter,
    strictAuthLimiter,
    moderateAuthLimiter,
    uploadLimiter
};
