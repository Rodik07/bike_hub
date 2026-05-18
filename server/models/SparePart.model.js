import mongoose from 'mongoose';

const sparePartSchema = new mongoose.Schema({
    bike: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bike',
        required: [true, 'Bike reference is required']
    },
    name: {
        type: String,
        required: [true, 'Part name is required'],
        trim: true
    },
    partNumber: {
        type: String,
        trim: true,
        default: null
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0
    },
    image: {
        type: String,
        default: null
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Engine', 'Brakes', 'Electrical', 'Body', 'Suspension', 'Exhaust', 'Transmission', 'Tyres', 'Filters', 'Other'],
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    dealers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dealer'
    }],
    isAvailable: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for fast bike-specific queries
sparePartSchema.index({ bike: 1, category: 1 });
sparePartSchema.index({ bike: 1, name: 'text' });

export default mongoose.model('SparePart', sparePartSchema);
