import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Custom format for console (more readable in development)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// Rotating file transport for all logs
const allLogsTransport = new DailyRotateFile({
    filename: path.join(__dirname, '../logs/application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d', // Keep logs for 14 days
    format: logFormat
});

// Rotating file transport for error logs only
const errorLogsTransport = new DailyRotateFile({
    filename: path.join(__dirname, '../logs/error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '30d', // Keep error logs for 30 days
    format: logFormat
});

// Rotating file transport for security events
const securityLogsTransport = new DailyRotateFile({
    filename: path.join(__dirname, '../logs/security-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '90d', // Keep security logs for 90 days
    format: logFormat
});

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        allLogsTransport,
        errorLogsTransport
    ],
    // Handle uncaught exceptions and rejections
    exceptionHandlers: [
        new DailyRotateFile({
            filename: path.join(__dirname, '../logs/exceptions-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d'
        })
    ],
    rejectionHandlers: [
        new DailyRotateFile({
            filename: path.join(__dirname, '../logs/rejections-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d'
        })
    ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// Security logger (separate instance for security events)
const securityLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [securityLogsTransport],
    defaultMeta: { category: 'security' }
});

// Helper functions for common logging scenarios
export const logInfo = (message, meta = {}) => {
    logger.info(message, meta);
};

export const logError = (message, error = null, meta = {}) => {
    if (error instanceof Error) {
        logger.error(message, {
            error: error.message,
            stack: error.stack,
            ...meta
        });
    } else {
        logger.error(message, meta);
    }
};

export const logWarn = (message, meta = {}) => {
    logger.warn(message, meta);
};

export const logDebug = (message, meta = {}) => {
    logger.debug(message, meta);
};

// Security event logging
export const logSecurityEvent = (event, data = {}) => {
    const logData = {
        event,
        timestamp: new Date().toISOString(),
        ...data
    };

    securityLogger.info(event, logData);

    // Also log to main logger for visibility
    logger.info(`[SECURITY] ${event}`, logData);
};

// HTTP request logging helper
export const logRequest = (req, statusCode, responseTime) => {
    logger.info('HTTP Request', {
        method: req.method,
        url: req.originalUrl,
        statusCode,
        responseTime: `${responseTime}ms`,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        userId: req.user?._id
    });
};

// Authentication event logging
export const logAuth = {
    loginSuccess: (userId, email, ip) => {
        logSecurityEvent('LOGIN_SUCCESS', { userId, email, ip });
    },
    loginFailure: (email, ip, reason) => {
        logSecurityEvent('LOGIN_FAILURE', { email, ip, reason });
    },
    logout: (userId, email, ip) => {
        logSecurityEvent('LOGOUT', { userId, email, ip });
    },
    register: (userId, email, ip) => {
        logSecurityEvent('USER_REGISTERED', { userId, email, ip });
    },
    passwordChange: (userId, email, ip) => {
        logSecurityEvent('PASSWORD_CHANGED', { userId, email, ip });
    },
    passwordReset: (email, ip) => {
        logSecurityEvent('PASSWORD_RESET_REQUESTED', { email, ip });
    },
    accountLocked: (userId, email, ip, reason) => {
        logSecurityEvent('ACCOUNT_LOCKED', { userId, email, ip, reason });
    },
    otpSent: (userId, email) => {
        logSecurityEvent('OTP_SENT', { userId, email });
    },
    otpVerified: (userId, email, ip) => {
        logSecurityEvent('OTP_VERIFIED', { userId, email, ip });
    },
    otpFailed: (userId, email, ip, attempts) => {
        logSecurityEvent('OTP_VERIFICATION_FAILED', { userId, email, ip, attempts });
    }
};

// Admin action logging
export const logAdminAction = (action, userId, targetId, details = {}) => {
    logSecurityEvent('ADMIN_ACTION', {
        action,
        adminUserId: userId,
        targetId,
        ...details
    });
};

// File upload logging
export const logFileUpload = (userId, filename, fileType, fileSize, ip) => {
    logSecurityEvent('FILE_UPLOADED', {
        userId,
        filename,
        fileType,
        fileSize,
        ip
    });
};

// Rate limit logging
export const logRateLimit = (ip, endpoint) => {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', { ip, endpoint });
};

// Validation failure logging
export const logValidationFailure = (endpoint, ip, errors) => {
    logSecurityEvent('VALIDATION_FAILURE', { endpoint, ip, errors });
};

export default logger;
