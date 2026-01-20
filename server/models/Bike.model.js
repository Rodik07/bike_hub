import mongoose from 'mongoose';

const bikeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Bike name is required'],
    trim: true
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Sports', 'Cruiser', 'Touring', 'Adventure', 'Naked', 'Scooter', 'Electric'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  exShowroomPrice: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  specifications: {
    engine: {
      displacement: String,
      maxPower: String,
      maxTorque: String,
      cooling: String,
      transmission: String
    },
    dimensions: {
      length: String,
      width: String,
      height: String,
      wheelbase: String,
      groundClearance: String
    },
    performance: {
      topSpeed: String,
      mileage: String,
      fuelCapacity: String
    },
    brakes: {
      front: String,
      rear: String,
      abs: Boolean
    },
    suspension: {
      front: String,
      rear: String
    },
    tyres: {
      front: String,
      rear: String
    },
    colors: [String]
  },
  images: [{
    url: String,
    alt: String
  }],
  model360: {
    type: String, // Path to 360° model file (GLB/GLTF or image sequence)
    default: null
  },
  exhaustSound: {
    type: String, // URL to exhaust sound audio file (MP3/WAV)
    default: null
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  comparisons: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for search
bikeSchema.index({ name: 'text', brand: 'text', category: 'text', description: 'text' });

export default mongoose.model('Bike', bikeSchema);

