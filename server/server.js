// Load environment variables FIRST - before any other imports
import 'dotenv/config';

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
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
import reviewRoutes from './routes/review.routes.js';
import chatRoutes from './routes/chat.routes.js';
import Promotion from './models/Promotion.model.js';
import SparePart from './models/SparePart.model.js';
import User from './models/User.model.js';

// Import Logger
import logger, { logInfo, logError, logRequest } from './config/logger.js';

// Initialize Passport (after dotenv.config())
import passport from './config/passport.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const app = express();
const httpServer = createServer(app);

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
      upgradeInsecureRequests: []
    }
  }
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests , please try again in 10 minutes'
});
app.use('/api', limiter);

// Data Sanitization against NoSQL Query Injection
app.use(mongoSanitize());

// Data Sanitization against XSS
app.use(xss());

// Prevent Parameter Pollution
app.use(hpp());

// HTTP Request Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();

  // Log after response is sent
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    logRequest(req, res.statusCode, responseTime);
  });

  next();
});

// Custom CSRF Protection
// Ensures that state-changing requests come from the trusted frontend origin
// DISABLED FOR PEN TESTING - Re-enable for production
app.use((req, res, next) => {
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // TEMPORARILY DISABLED FOR PEN TESTING
  // Uncomment below block for production
  /*
  const origin = req.get('Origin');
  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

  // If Origin header is present, it MUST match
  if (origin) {
    if (origin !== allowedOrigin) {
      return res.status(403).json({ message: 'CSRF Protection: Origin mismatch' });
    }
  }
  */

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
      // Keep the session cookie for 7 days so that a browser
      // stays logged in for a week unless the token is revoked
      maxAge: 7 * 24 * 60 * 60 * 1000
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
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'BikeHub API is running' });
});

// Public promotions endpoint (no auth required - used by ad banners)
app.get('/api/promotions', async (req, res) => {
  try {
    const promotions = await Promotion.find({ isActive: true }).sort({ priority: -1, createdAt: -1 });
    res.json(promotions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching promotions' });
  }
});

// Public spare part detail endpoint (no auth required) - MUST be before :bikeId route
app.get('/api/spare-parts/detail/:partId', async (req, res) => {
  try {
    const part = await SparePart.findById(req.params.partId)
      .populate('bike', 'name brand images')
      .populate('dealers', 'name phone email address location type isActive');

    if (!part) {
      return res.status(404).json({ message: 'Spare part not found' });
    }

    res.json(part);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching spare part details' });
  }
});

// Public spare parts endpoint with pagination (no auth required)
app.get('/api/spare-parts/:bikeId', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = { bike: req.params.bikeId, isAvailable: true };
    const total = await SparePart.countDocuments(filter);
    const parts = await SparePart.find(filter)
      .sort({ category: 1, name: 1 })
      .skip(skip)
      .limit(limit);

    res.json({
      parts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching spare parts' });
  }
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log("Using Mongo URI:", process.env.MONGODB_URI);
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bikehub');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

const PORT = process.env.PORT || 5001;

// ===== Socket.IO Setup =====
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Socket.IO JWT authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return next(new Error('User not found or inactive'));
    }
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.user._id.toString();
  console.log(`🔌 Socket connected: ${socket.user.name} (${userId})`);

  // Join personal room for targeted messages
  socket.join(`user_${userId}`);

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.user.name}`);
  });
});

// Start HTTP + Socket.IO server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP + Socket.IO Server running on port ${PORT}`);
});
