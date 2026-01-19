import express from 'express';
import Booking from '../models/Booking.model.js';
import Bike from '../models/Bike.model.js';
import { protect } from '../middleware/auth.middleware.js';
import { moderateAuthLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create test ride booking
// @access  Private
router.post('/', protect, moderateAuthLimiter, async (req, res) => {
  try {
    const { bike, dealer, bookingDate, preferredTime, message } = req.body;

    const booking = await Booking.create({
      user: req.user._id,
      bike,
      dealer,
      bookingDate,
      preferredTime,
      message
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('bike', 'name brand images')
      .populate('dealer', 'name address')
      .populate('user', 'name email phone');

    res.status(201).json(populatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/bookings
// @desc    Get user's bookings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    // If dealer, show bookings for their dealership
    if (req.user.role === 'dealer') {
      const Dealer = (await import('../models/Dealer.model.js')).default;
      const dealer = await Dealer.findOne({ email: req.user.email });
      if (dealer) {
        query.dealer = dealer._id;
      } else {
        return res.json([]);
      }
    } else {
      // Regular user sees only their bookings
      query.user = req.user._id;
    }

    const bookings = await Booking.find(query)
      .populate('bike', 'name brand images price')
      .populate('dealer', 'name address phone')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('bike')
      .populate('dealer')
      .populate('user');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' &&
      req.user.role !== 'dealer' &&
      booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/bookings/:id/approve
// @desc    Approve booking (Dealer/Admin)
// @access  Private/Dealer/Admin
router.put('/:id/approve', protect, async (req, res) => {
  try {
    if (req.user.role !== 'dealer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Dealer or Admin access required' });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = 'approved';
    if (req.body.message) {
      booking.dealerResponse = req.body.message;
    }

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('bike')
      .populate('dealer')
      .populate('user');

    res.json(populatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/bookings/:id/reject
// @desc    Reject booking (Dealer/Admin)
// @access  Private/Dealer/Admin
router.put('/:id/reject', protect, async (req, res) => {
  try {
    if (req.user.role !== 'dealer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Dealer or Admin access required' });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = 'rejected';
    if (req.body.message) {
      booking.dealerResponse = req.body.message;
    }

    await booking.save();

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/bookings/:id/reschedule
// @desc    Reschedule booking (Dealer/Admin)
// @access  Private/Dealer/Admin
router.put('/:id/reschedule', protect, async (req, res) => {
  try {
    if (req.user.role !== 'dealer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Dealer or Admin access required' });
    }

    const { rescheduledDate, rescheduledTime, message } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = 'rescheduled';
    booking.rescheduledDate = rescheduledDate;
    booking.rescheduledTime = rescheduledTime;
    if (message) {
      booking.dealerResponse = message;
    }

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('bike')
      .populate('dealer')
      .populate('user');

    res.json(populatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

