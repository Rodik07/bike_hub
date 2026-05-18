import express from 'express';
import { body, validationResult } from 'express-validator';
import Inquiry from '../models/Inquiry.model.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   POST /api/inquiries
// @desc    Create inquiry
// @access  Private
router.post('/', protect, [
  body('subject').trim().escape().notEmpty().withMessage('Subject is required'),
  body('message').trim().escape().notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bike, dealer, subject, message } = req.body;

    const inquiry = await Inquiry.create({
      user: req.user._id,
      bike,
      dealer,
      subject,
      message
    });

    const populatedInquiry = await Inquiry.findById(inquiry._id)
      .populate('bike', 'name brand')
      .populate('dealer', 'name')
      .populate('user', 'name email');

    res.status(201).json(populatedInquiry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/inquiries
// @desc    Get inquiries
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'dealer' || req.user.role === 'admin') {
      // Dealers see inquiries for their dealership
      const Dealer = (await import('../models/Dealer.model.js')).default;
      const dealer = await Dealer.findOne({ email: req.user.email });
      if (dealer) {
        query.dealer = dealer._id;
      }
    } else {
      // Users see their own inquiries
      query.user = req.user._id;
    }

    const inquiries = await Inquiry.find(query)
      .populate('bike', 'name brand images')
      .populate('dealer', 'name')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(inquiries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/inquiries/:id/reply
// @desc    Reply to inquiry (Dealer/Admin)
// @access  Private/Dealer/Admin
router.put('/:id/reply', protect, [
  body('message').trim().escape().notEmpty().withMessage('Reply message is required')
], async (req, res) => {
  try {
    if (req.user.role !== 'dealer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Dealer or Admin access required' });
    }

    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message } = req.body;

    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    inquiry.status = 'replied';
    inquiry.dealerReply = {
      message,
      repliedAt: new Date()
    };

    await inquiry.save();

    const populatedInquiry = await Inquiry.findById(inquiry._id)
      .populate('bike')
      .populate('dealer')
      .populate('user');

    res.json(populatedInquiry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

