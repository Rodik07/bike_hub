import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';

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
import passport from './config/passport.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
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

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

app.use((req, res, next) => next());

app.use(
  session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'test-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { index: false, dotfiles: 'deny' }));

app.use('/api/auth', authRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/dealers', dealerRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'BikeHub API is running' });
});

app.get('/api/promotions', async (req, res) => {
  try {
    const promotions = await Promotion.find({ isActive: true }).sort({ priority: -1, createdAt: -1 });
    res.json(promotions);
  } catch {
    res.status(500).json({ message: 'Error fetching promotions' });
  }
});

app.get('/api/spare-parts/detail/:partId', async (req, res) => {
  try {
    const part = await SparePart.findById(req.params.partId)
      .populate('bike', 'name brand images')
      .populate('dealers', 'name phone email address location type isActive');

    if (!part) {
      return res.status(404).json({ message: 'Spare part not found' });
    }

    res.json(part);
  } catch {
    res.status(500).json({ message: 'Error fetching spare part details' });
  }
});

app.get('/api/spare-parts/:bikeId', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
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
  } catch {
    res.status(500).json({ message: 'Error fetching spare parts' });
  }
});

export default app;
