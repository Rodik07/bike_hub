import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bike: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bike',
    required: true
  },
  dealer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dealer',
    required: true
  },
  bookingDate: {
    type: Date,
    required: true
  },
  preferredTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'rescheduled', 'completed', 'cancelled'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true
  },
  dealerResponse: {
    type: String,
    trim: true
  },
  rescheduledDate: {
    type: Date,
    default: null
  },
  rescheduledTime: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

bookingSchema.index(
  { dealer: 1, bookingDate: 1, preferredTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'approved'] }
    }
  }
);

export default mongoose.model('Booking', bookingSchema);

