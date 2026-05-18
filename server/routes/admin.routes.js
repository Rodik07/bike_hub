import express from 'express';
import Bike from '../models/Bike.model.js';
import Booking from '../models/Booking.model.js';
import User from '../models/User.model.js';
import Dealer from '../models/Dealer.model.js';
import Promotion from '../models/Promotion.model.js';
import SparePart from '../models/SparePart.model.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { sendDealerWelcomeEmail } from '../utils/emailService.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { validateUploadedFiles } from '../middleware/fileValidation.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ALLOWED EXTENSIONS MAPPING
const ALLOWED_IMAGES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif'
};

const ALLOWED_MODELS = {
  'model/gltf-binary': '.glb',
  'model/gltf+json': '.gltf',
  'application/octet-stream': '.glb' // Sometimes glb comes as octet-stream
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: (req, file, cb) => {
    // Generate safe filename with correct extension based on mimetype
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
    let ext = path.extname(file.originalname).toLowerCase();

    // Enforce extension based on mimetype if possible, or validate existing extension
    if (ALLOWED_IMAGES[file.mimetype]) {
      ext = ALLOWED_IMAGES[file.mimetype];
    } else if (ALLOWED_MODELS[file.mimetype]) {
      if (file.mimetype === 'application/octet-stream') {
        // For octet-stream, trust extension only if it's .glb or .gltf
        if (ext !== '.glb' && ext !== '.gltf') ext = '.glb';
      } else {
        ext = ALLOWED_MODELS[file.mimetype];
      }
    }

    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter for images and 3D models
// MODIFIED FOR PEN TESTING: Allows all files but tracks invalid ones
const fileFilter = (req, file, cb) => {
  const fileExtension = path.extname(file.originalname).toLowerCase();

  // Initialize warnings array on request if not exists
  if (!req.fileWarnings) {
    req.fileWarnings = [];
  }

  // Validate Images
  if (file.fieldname === 'images' || file.fieldname === 'image') {
    if (ALLOWED_IMAGES[file.mimetype] && ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(fileExtension)) {
      return cb(null, true);
    }
    // PEN TESTING: Allow but warn
    req.fileWarnings.push({
      field: file.fieldname,
      filename: file.originalname,
      mimetype: file.mimetype,
      warning: 'SECURITY WARNING: Invalid image file format uploaded. Allowed: JPG, PNG, WEBP, GIF'
    });
    return cb(null, true); // Allow for pen testing
  }
  // Validate 3D models
  else if (file.fieldname === 'model360') {
    if (ALLOWED_MODELS[file.mimetype] || (file.mimetype === 'application/octet-stream' && ['.glb', '.gltf'].includes(fileExtension))) {
      return cb(null, true);
    }
    // PEN TESTING: Allow but warn
    req.fileWarnings.push({
      field: file.fieldname,
      filename: file.originalname,
      mimetype: file.mimetype,
      warning: 'SECURITY WARNING: Invalid 3D model file uploaded. Allowed: GLB, GLTF'
    });
    return cb(null, true); // Allow for pen testing
  }
  // Validate audio files for exhaust sound
  else if (file.fieldname === 'exhaustSound') {
    const audioMimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav'];
    const audioExtensions = ['.mp3', '.wav'];
    if (audioMimeTypes.includes(file.mimetype) || audioExtensions.includes(fileExtension)) {
      return cb(null, true);
    }
    // PEN TESTING: Allow but warn
    req.fileWarnings.push({
      field: file.fieldname,
      filename: file.originalname,
      mimetype: file.mimetype,
      warning: 'SECURITY WARNING: Invalid audio file uploaded. Allowed: MP3, WAV'
    });
    return cb(null, true); // Allow for pen testing
  } else {
    // PEN TESTING: Allow unexpected fields but warn
    req.fileWarnings.push({
      field: file.fieldname,
      filename: file.originalname,
      mimetype: file.mimetype,
      warning: 'SECURITY WARNING: Unexpected field upload detected'
    });
    return cb(null, true); // Allow for pen testing
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Multer error handling wrapper
const handleMulterError = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        // Handle Multer-specific errors
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              message: 'File too large. Maximum size is 50MB.',
              field: err.field
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              message: 'Too many files uploaded.',
              field: err.field
            });
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
              message: 'Unexpected file field.',
              field: err.field
            });
          }
          return res.status(400).json({
            message: `File upload error: ${err.message}`,
            field: err.field
          });
        }

        // Handle custom file filter errors
        if (err.message) {
          return res.status(400).json({
            message: err.message
          });
        }

        // Generic error
        return res.status(500).json({
          message: 'File upload failed. Please try again.'
        });
      }
      next();
    });
  };
};

const router = express.Router();


// All routes require admin access
router.use(protect);
router.use(authorize('admin'));

// Validation Chains
const validateBike = [
  body('name').trim().notEmpty().escape().withMessage('Name is required'),
  body('brand').trim().notEmpty().escape().withMessage('Brand is required'),
  body('category').trim().notEmpty().escape().withMessage('Category is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('description').trim().escape(),
  body('features').optional().isArray().withMessage('Features must be an array'),
  body('features.*').trim().escape() // Sanitize array items
];

const validateDealer = [
  body('name').trim().notEmpty().escape().withMessage('Dealer name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').trim().escape(),
  body('location').trim().escape(),
  body('address').trim().escape()
];

const validatePromotion = [
  body('title').trim().notEmpty().escape().withMessage('Title is required'),
  body('description').trim().escape(),
  body('discountPercentage').optional().isNumeric(),
  body('validUntil').optional().isISO8601().toDate()
];

// Helper to check validation results
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Private/Admin
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalBikes = await Bike.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalDealers = await Dealer.countDocuments();

    // Most viewed bikes
    const mostViewedBikes = await Bike.find()
      .sort({ views: -1 })
      .limit(5)
      .select('name brand views');

    // Most compared bikes
    const mostComparedBikes = await Bike.find()
      .sort({ comparisons: -1 })
      .limit(5)
      .select('name brand comparisons');

    // Recent bookings
    const recentBookings = await Booking.find()
      .populate('bike', 'name brand')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      totalUsers,
      totalBikes,
      totalBookings,
      totalDealers,
      mostViewedBikes,
      mostComparedBikes,
      recentBookings
    });
  } catch (error) {
    console.error('Stats Error:', error); // Log full error server-side
    res.status(500).json({ message: 'Error fetching dashboard statistics' }); // Generic client message
  }
});

// @route   POST /api/admin/bikes
// @desc    Create bike with image and 3D model upload
// @access  Private/Admin
router.post('/bikes', handleMulterError(upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'model360', maxCount: 1 },
  { name: 'exhaustSound', maxCount: 1 }
])), validateUploadedFiles, validateBike, checkValidation, async (req, res) => {
  try {
    const bikeData = { ...req.body };

    // Parse JSON fields safely
    try {
      if (bikeData.specifications) {
        // If it's already an object (body parser), great. If string, parse it.
        bikeData.specifications = typeof bikeData.specifications === 'string'
          ? JSON.parse(bikeData.specifications)
          : bikeData.specifications;
      }
      if (bikeData.images && typeof bikeData.images === 'string') {
        bikeData.images = JSON.parse(bikeData.images);
      }
    } catch (e) {
      return res.status(400).json({ message: 'Invalid JSON format in specifications or images' });
    }

    // Add uploaded images
    if (req.files && req.files.images && req.files.images.length > 0) {
      const imageUrls = req.files.images.map(file => ({
        url: `/uploads/${file.filename}`,
        alt: bikeData.name || 'Bike image'
      }));
      bikeData.images = [...(bikeData.images || []), ...imageUrls];
    }

    // Add 3D model if uploaded
    if (req.files && req.files.model360 && req.files.model360.length > 0) {
      bikeData.model360 = `/uploads/${req.files.model360[0].filename}`;
    }

    // Add exhaust sound if uploaded
    if (req.files && req.files.exhaustSound && req.files.exhaustSound.length > 0) {
      bikeData.exhaustSound = `/uploads/${req.files.exhaustSound[0].filename}`;
    }

    const bike = await Bike.create(bikeData);

    // Include file warnings in response for pen testing
    const response = bike.toObject();
    if (req.fileWarnings && req.fileWarnings.length > 0) {
      response.securityWarnings = req.fileWarnings;
      response.warningMessage = `VULNERABILITY DETECTED: ${req.fileWarnings.length} invalid file(s) were uploaded and accepted. Files: ${req.fileWarnings.map(w => w.filename).join(', ')}`;
      console.warn('⚠️ SECURITY: Invalid files uploaded:', req.fileWarnings);
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Create Bike Error:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        message: messages.join(', '),
        errors: messages,
        type: 'validation'
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'A bike with this name already exists',
        type: 'duplicate'
      });
    }

    // Handle cast errors (invalid ObjectId, etc.)
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: `Invalid ${error.path}: ${error.value}`,
        type: 'cast'
      });
    }

    res.status(500).json({
      message: error.message || 'Error creating bike',
      type: 'server'
    });
  }
});

// @route   PUT /api/admin/bikes/:id
// @desc    Update bike with image and 3D model upload
// @access  Private/Admin
router.put('/bikes/:id', handleMulterError(upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'model360', maxCount: 1 },
  { name: 'exhaustSound', maxCount: 1 }
])), validateUploadedFiles, validateBike, checkValidation, async (req, res) => {
  try {
    const bikeData = { ...req.body };

    // Parse JSON fields safely
    try {
      if (bikeData.specifications) {
        bikeData.specifications = typeof bikeData.specifications === 'string'
          ? JSON.parse(bikeData.specifications)
          : bikeData.specifications;
      }
    } catch (e) {
      return res.status(400).json({ message: 'Invalid JSON in specifications' });
    }

    // Handle images
    if (req.files && req.files.images && req.files.images.length > 0) {
      const imageUrls = req.files.images.map(file => ({
        url: `/uploads/${file.filename}`,
        alt: bikeData.name || 'Bike image'
      }));

      // Get existing bike to merge images
      const existingBike = await Bike.findById(req.params.id);
      const existingImages = existingBike?.images || [];
      bikeData.images = [...existingImages, ...imageUrls];
    }

    // Handle 3D model
    if (req.files && req.files.model360 && req.files.model360.length > 0) {
      bikeData.model360 = `/uploads/${req.files.model360[0].filename}`;
    }

    // Handle exhaust sound
    if (req.files && req.files.exhaustSound && req.files.exhaustSound.length > 0) {
      bikeData.exhaustSound = `/uploads/${req.files.exhaustSound[0].filename}`;
    }

    const bike = await Bike.findByIdAndUpdate(
      req.params.id,
      bikeData,
      { new: true, runValidators: true }
    );

    if (!bike) {
      return res.status(404).json({ message: 'Bike not found' });
    }

    // Include file warnings in response for pen testing
    const response = bike.toObject();
    if (req.fileWarnings && req.fileWarnings.length > 0) {
      response.securityWarnings = req.fileWarnings;
      response.warningMessage = `VULNERABILITY DETECTED: ${req.fileWarnings.length} invalid file(s) were uploaded and accepted. Files: ${req.fileWarnings.map(w => w.filename).join(', ')}`;
      console.warn('⚠️ SECURITY: Invalid files uploaded:', req.fileWarnings);
    }

    res.json(response);
  } catch (error) {
    console.error('Update Bike Error:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        message: messages.join(', '),
        errors: messages,
        type: 'validation'
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'A bike with this name already exists',
        type: 'duplicate'
      });
    }

    // Handle cast errors (invalid ObjectId, etc.)
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: `Invalid ${error.path}: ${error.value}`,
        type: 'cast'
      });
    }

    res.status(500).json({
      message: error.message || 'Error updating bike',
      type: 'server'
    });
  }
});

// @route   GET /api/admin/dealers
// @desc    Get all dealers (Admin)
// @access  Private/Admin
router.get('/dealers', async (req, res) => {
  try {
    const dealers = await Dealer.find().sort({ createdAt: -1 });
    res.json(dealers);
  } catch (error) {
    console.error('Get Dealers Error:', error);
    res.status(500).json({ message: 'Error fetching dealers' });
  }
});

// @route   POST /api/admin/dealers
// @desc    Create dealer and user account
// @access  Private/Admin
router.post('/dealers', validateDealer, checkValidation, async (req, res) => {
  try {
    const { email, phone, name, ...dealerData } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Generate temporary password
    const temporaryPassword = crypto.randomBytes(8).toString('hex').toUpperCase();
    const passwordExpiry = new Date();
    passwordExpiry.setDate(passwordExpiry.getDate() + 3); // 3 days from now

    // Create dealer
    const dealer = await Dealer.create({
      ...dealerData,
      email,
      phone,
      name
    });

    // Create user account for dealer
    const user = await User.create({
      name: dealer.name,
      email: dealer.email,
      phone: dealer.phone,
      password: temporaryPassword, // Will be hashed by pre-save hook
      role: 'dealer',
      dealerId: dealer._id,
      mustChangePassword: true,
      temporaryPassword: temporaryPassword,
      temporaryPasswordExpiry: passwordExpiry
    });

    // Send welcome email with temporary password
    const emailSent = await sendDealerWelcomeEmail(
      email,
      dealer.name,
      temporaryPassword,
      dealer.name
    );

    if (!emailSent) {
      console.warn(`⚠️ Failed to send email to ${email}, but dealer account created`);
    }

    res.status(201).json({
      dealer,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role
      },
      message: 'Dealer created successfully. Welcome email sent with temporary password.'
    });
  } catch (error) {
    console.error('Create Dealer Error:', error);
    res.status(500).json({ message: 'Error creating dealer' });
  }
});

// @route   DELETE /api/admin/dealers/:id
// @desc    Delete dealer
// @access  Private/Admin
router.delete('/dealers/:id', async (req, res) => {
  try {
    await Dealer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Dealer deleted successfully' });
  } catch (error) {
    console.error('Delete Dealer Error:', error);
    res.status(500).json({ message: 'Error deleting dealer' });
  }
});

// @route   GET /api/admin/promotions
// @desc    Get all promotions (Public for home page, Admin for management)
// @access  Public (for viewing), Private/Admin (for management)
router.get('/promotions', async (req, res) => {
  try {
    const promotions = await Promotion.find({ isActive: true }).sort({ priority: -1, createdAt: -1 });
    res.json(promotions);
  } catch (error) {
    console.error('Get Promotions Error:', error);
    res.status(500).json({ message: 'Error fetching promotions' });
  }
});

// @route   POST /api/admin/promotions
// @desc    Create promotion
// @access  Private/Admin
router.post('/promotions', handleMulterError(upload.single('image')), validateUploadedFiles, validatePromotion, checkValidation, async (req, res) => {
  try {
    const promotionData = { ...req.body };

    if (req.file) {
      promotionData.image = `/uploads/${req.file.filename}`;
    }

    const promotion = await Promotion.create(promotionData);
    res.status(201).json(promotion);
  } catch (error) {
    console.error('Create Promotion Error:', error);
    res.status(500).json({ message: 'Error creating promotion' });
  }
});

// @route   PUT /api/admin/promotions/:id
// @desc    Update promotion
// @access  Private/Admin
router.put('/promotions/:id', handleMulterError(upload.single('image')), validateUploadedFiles, validatePromotion, checkValidation, async (req, res) => {
  try {
    const promotionData = { ...req.body };

    if (req.file) {
      promotionData.image = `/uploads/${req.file.filename}`;
    }

    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      promotionData,
      { new: true }
    );

    res.json(promotion);
  } catch (error) {
    console.error('Update Promotion Error:', error);
    res.status(500).json({ message: 'Error updating promotion' });
  }
});

// @route   DELETE /api/admin/promotions/:id
// @desc    Delete promotion
// @access  Private/Admin
router.delete('/promotions/:id', async (req, res) => {
  try {
    await Promotion.findByIdAndDelete(req.params.id);
    res.json({ message: 'Promotion deleted successfully' });
  } catch (error) {
    console.error('Delete Promotion Error:', error);
    res.status(500).json({ message: 'Error deleting promotion' });
  }
});

// ============ SPARE PARTS ROUTES ============

const validateSparePart = [
  body('name').trim().notEmpty().escape().withMessage('Part name is required'),
  body('bike').trim().notEmpty().withMessage('Bike reference is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('category').trim().notEmpty().escape().withMessage('Category is required'),
  body('partNumber').optional().trim().escape(),
  body('description').optional().trim().escape()
];

// @route   GET /api/admin/spare-parts
// @desc    Get spare parts (filter by bike)
// @access  Private/Admin
router.get('/spare-parts', async (req, res) => {
  try {
    const filter = {};
    if (req.query.bike) filter.bike = req.query.bike;

    const parts = await SparePart.find(filter)
      .populate('bike', 'name brand')
      .sort({ category: 1, name: 1 });
    res.json(parts);
  } catch (error) {
    console.error('Get Spare Parts Error:', error);
    res.status(500).json({ message: 'Error fetching spare parts' });
  }
});

// @route   POST /api/admin/spare-parts
// @desc    Create spare part with image
// @access  Private/Admin
router.post('/spare-parts', handleMulterError(upload.single('image')), validateUploadedFiles, validateSparePart, checkValidation, async (req, res) => {
  try {
    const partData = { ...req.body };

    if (req.file) {
      partData.image = `/uploads/${req.file.filename}`;
    }

    const part = await SparePart.create(partData);
    const populated = await part.populate('bike', 'name brand');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Create Spare Part Error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', '), errors: messages });
    }
    res.status(500).json({ message: 'Error creating spare part' });
  }
});

// @route   PUT /api/admin/spare-parts/:id
// @desc    Update spare part
// @access  Private/Admin
router.put('/spare-parts/:id', handleMulterError(upload.single('image')), validateUploadedFiles, validateSparePart, checkValidation, async (req, res) => {
  try {
    const partData = { ...req.body };

    if (req.file) {
      partData.image = `/uploads/${req.file.filename}`;
    }

    const part = await SparePart.findByIdAndUpdate(
      req.params.id,
      partData,
      { new: true, runValidators: true }
    ).populate('bike', 'name brand');

    if (!part) {
      return res.status(404).json({ message: 'Spare part not found' });
    }

    res.json(part);
  } catch (error) {
    console.error('Update Spare Part Error:', error);
    res.status(500).json({ message: 'Error updating spare part' });
  }
});

// @route   DELETE /api/admin/spare-parts/:id
// @desc    Delete spare part
// @access  Private/Admin
router.delete('/spare-parts/:id', async (req, res) => {
  try {
    await SparePart.findByIdAndDelete(req.params.id);
    res.json({ message: 'Spare part deleted successfully' });
  } catch (error) {
    console.error('Delete Spare Part Error:', error);
    res.status(500).json({ message: 'Error deleting spare part' });
  }
});

export default router;

