// Load environment variables FIRST - before any other imports
import 'dotenv/config';

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';

// Import Routes
import authRoutes from './routes/auth.routes.js';
import bikeRoutes from './routes/bike.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import dealerRoutes from './routes/dealer.routes.js';
import inquiryRoutes from './routes/inquiry.routes.js';
import adminRoutes from './routes/admin.routes.js';
import chatbotRoutes from './routes/chatbot.routes.js';

// Initialize Passport (after dotenv.config())
import passport from './config/passport.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security Middleware
// Set security HTTP headers with strict Content Security Policy
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow resources to be loaded by other origins (e.g., frontend)
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"], // Only allow scripts from same origin, block inline scripts
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for React/CSS-in-JS
      imgSrc: ["'self'", "data:", "https:", "blob:"], // Allow images from same origin, data URIs, HTTPS, and blobs
      fontSrc: ["'self'", "data:", "https:"], // Allow fonts from same origin, data URIs, and HTTPS
      connectSrc: ["'self'"], // Only allow AJAX/WebSocket connections to same origin
      mediaSrc: ["'self'", "blob:"], // Allow media from same origin and blobs (for audio/video)
      objectSrc: ["'none'"], // Disallow plugins (Flash, Java, etc.)
      frameSrc: ["'self'"], // Only allow iframes from same origin
      baseUri: ["'self'"], // Prevent base tag injection
      formAction: ["'self'"], // Only allow form submissions to same origin
      upgradeInsecureRequests: [] // Upgrade HTTP requests to HTTPS in production
    }
  }
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again in 10 minutes'
});
app.use('/api', limiter);

// Data Sanitization against NoSQL Query Injection
app.use(mongoSanitize());

// Data Sanitization against XSS
app.use(xss());

// Prevent Parameter Pollution
app.use(hpp());

// Custom CSRF Protection
// Ensures that state-changing requests come from the trusted frontend origin
app.use((req, res, next) => {
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const origin = req.get('Origin');
  // Referer is often less reliable but can be a fallback. 
  // Strict Origin check is best for APIs called by browsers.

  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

  // If Origin header is present, it MUST match
  if (origin) {
    if (origin !== allowedOrigin) {
      return res.status(403).json({ message: 'CSRF Protection: Origin mismatch' });
    }
  }
  // If no Origin (e.g. server-to-server or strict privacy settings), check Referer as fallback if available
  // NOTE: Modern browsers usually send Origin on POST. 

  next();
});

// Session middleware (required for Passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve static files (images, 360 assets, audio) with security options
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  index: false,        // Disable directory listings
  dotfiles: 'deny',    // Deny access to hidden files (.htaccess, etc.)
  setHeaders: (res, filepath) => {
    // Add security headers for all uploaded files
    res.set('X-Content-Type-Options', 'nosniff'); // Prevent MIME-sniffing
    res.set('X-Frame-Options', 'DENY');           // Prevent clickjacking

    // Set appropriate cache headers
    if (filepath.endsWith('.jpg') || filepath.endsWith('.png') ||
      filepath.endsWith('.webp') || filepath.endsWith('.gif')) {
      res.set('Cache-Control', 'public, max-age=31536000'); // Cache images for 1 year
    } else if (filepath.endsWith('.glb') || filepath.endsWith('.gltf')) {
      res.set('Cache-Control', 'public, max-age=2592000'); // Cache 3D models for 30 days
    } else if (filepath.endsWith('.mp3') || filepath.endsWith('.wav')) {
      res.set('Cache-Control', 'public, max-age=2592000'); // Cache audio for 30 days
    }
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/dealers', dealerRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'BikeHub API is running' });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bikehub');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

