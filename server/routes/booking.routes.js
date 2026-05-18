import express from 'express';
import Booking from '../models/Booking.model.js';
import Dealer from '../models/Dealer.model.js';
import { protect } from '../middleware/auth.middleware.js';
import {
  generateBookingSlots,
  isValidBookingSlot,
  normalizeTime,
  findConflictingBooking,
  getBookedSlotsForDate
} from '../utils/bookingSlots.js';

const router = express.Router();

const validateBookingSlot = async (dealerId, bookingDate, preferredTime, excludeBookingId = null) => {
  const normalizedTime = normalizeTime(preferredTime);
  if (!normalizedTime || !isValidBookingSlot(normalizedTime)) {
    return { ok: false, status: 400, message: 'Please select a valid 15-minute time slot between 9:00 AM and 5:00 PM' };
  }

  const conflict = await findConflictingBooking(
    Booking,
    dealerId,
    bookingDate,
    normalizedTime,
    excludeBookingId
  );

  if (conflict) {
    return {
      ok: false,
      status: 409,
      message: 'This time slot is already booked at this dealership. Please choose another slot.'
    };
  }

  return { ok: true, preferredTime: normalizedTime };
};

// @route   GET /api/bookings/available-slots
// @desc    Get available 15-min slots for a dealer on a date
// @access  Private
router.get('/available-slots', protect, async (req, res) => {
  try {
    const { dealer, date, excludeBookingId } = req.query;
    if (!dealer || !date) {
      return res.status(400).json({ message: 'Dealer and date are required' });
    }

    const bookedSlots = await getBookedSlotsForDate(Booking, dealer, date, excludeBookingId || null);
    const allSlots = generateBookingSlots();
    const availableSlots = allSlots.filter((slot) => !bookedSlots.includes(slot));

    res.json({ availableSlots, bookedSlots, allSlots });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/bookings
// @desc    Create test ride booking
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { bike, dealer, bookingDate, preferredTime, message } = req.body;

    if (!bike || !dealer || !bookingDate || !preferredTime) {
      return res.status(400).json({ message: 'Bike, dealer, date, and time are required' });
    }

    const dealerDoc = await Dealer.findById(dealer);
    if (!dealerDoc || !dealerDoc.isActive) {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    const slotCheck = await validateBookingSlot(dealer, bookingDate, preferredTime);
    if (!slotCheck.ok) {
      return res.status(slotCheck.status).json({ message: slotCheck.message });
    }

    const booking = await Booking.create({
      user: req.user._id,
      bike,
      dealer,
      bookingDate,
      preferredTime: slotCheck.preferredTime,
      message
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('bike', 'name brand images')
      .populate('dealer', 'name address')
      .populate('user', 'name email phone');

    res.status(201).json(populatedBooking);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'This time slot is already booked at this dealership. Please choose another slot.'
      });
    }
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/bookings
// @desc    Get user's bookings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'dealer') {
      const dealer = await Dealer.findOne({ email: req.user.email });
      if (dealer) {
        query.dealer = dealer._id;
      } else {
        return res.json([]);
      }
    } else {
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

router.put('/:id/approve', protect, async (req, res) => {
  try {
    if (req.user.role !== 'dealer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Dealer or Admin access required' });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (req.user.role === 'dealer') {
      const dealer = await Dealer.findOne({ email: req.user.email });
      if (!dealer || booking.dealer.toString() !== dealer._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to approve this booking' });
      }
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

router.put('/:id/reschedule', protect, async (req, res) => {
  try {
    if (req.user.role !== 'dealer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Dealer or Admin access required' });
    }

    const { rescheduledDate, rescheduledTime, message } = req.body;

    if (!rescheduledDate || !rescheduledTime) {
      return res.status(400).json({ message: 'Rescheduled date and time are required' });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (req.user.role === 'dealer') {
      const dealer = await Dealer.findOne({ email: req.user.email });
      if (!dealer || booking.dealer.toString() !== dealer._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to reschedule this booking' });
      }
    }

    const slotCheck = await validateBookingSlot(
      booking.dealer,
      rescheduledDate,
      rescheduledTime,
      booking._id
    );
    if (!slotCheck.ok) {
      return res.status(slotCheck.status).json({ message: slotCheck.message });
    }

    booking.status = 'rescheduled';
    booking.rescheduledDate = rescheduledDate;
    booking.rescheduledTime = slotCheck.preferredTime;
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

router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({ message: `Cannot cancel a ${booking.status} booking` });
    }

    booking.status = 'cancelled';
    if (req.body.reason) {
      booking.message = `Cancelled: ${req.body.reason}`;
    }

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('bike', 'name brand images price')
      .populate('dealer', 'name address phone')
      .populate('user', 'name email phone');

    res.json(populatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/edit', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this booking' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Can only edit pending bookings' });
    }

    const { bookingDate, preferredTime, message } = req.body;
    const nextDate = bookingDate || booking.bookingDate;
    const nextTime = preferredTime || booking.preferredTime;

    const slotCheck = await validateBookingSlot(
      booking.dealer,
      nextDate,
      nextTime,
      booking._id
    );
    if (!slotCheck.ok) {
      return res.status(slotCheck.status).json({ message: slotCheck.message });
    }

    if (bookingDate) booking.bookingDate = bookingDate;
    booking.preferredTime = slotCheck.preferredTime;
    if (message !== undefined) booking.message = message;

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('bike', 'name brand images price')
      .populate('dealer', 'name address phone')
      .populate('user', 'name email phone');

    res.json(populatedBooking);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'This time slot is already booked at this dealership. Please choose another slot.'
      });
    }
    res.status(500).json({ message: error.message });
  }
});

export default router;
