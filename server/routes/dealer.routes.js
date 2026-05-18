import express from 'express';
import { query, body, validationResult } from 'express-validator';
import Dealer from '../models/Dealer.model.js';
import Bike from '../models/Bike.model.js';
import DealerBikeListing from '../models/DealerBikeListing.model.js';
import Booking from '../models/Booking.model.js';
import SparePart from '../models/SparePart.model.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   GET /api/dealers
// @desc    Get all dealers (public route for dealer locator)
// @access  Public
router.get('/', [
  query('type').optional().trim().escape(),
  query('city').optional().trim().escape(),
  query('state').optional().trim().escape()
], async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, city, state } = req.query;
    const filter = { isActive: true };

    if (type) {
      filter.type = type;
    }
    if (city) {
      filter['address.city'] = { $regex: city, $options: 'i' };
    }
    if (state) {
      filter['address.state'] = { $regex: state, $options: 'i' };
    }

    const dealers = await Dealer.find(filter)
      .select('name type email phone address location workingHours brands services isActive')
      .sort({ createdAt: -1 });

    res.json(dealers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/dealers/:id/bikes
// @desc    Get all bikes listed by a specific dealer (public route)
// @access  Public
router.get('/:id/bikes', async (req, res) => {
  try {
    const { id } = req.params;

    // Find dealer
    const dealer = await Dealer.findById(id);
    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    // Get all active listings for this dealer
    const listings = await DealerBikeListing.find({
      dealer: id,
      isActive: true
    })
      .populate('bike', 'name brand category price images specifications')
      .sort({ createdAt: -1 });

    // Filter out listings where bike is not available
    const activeListings = listings.filter(listing => listing.bike && listing.bike.isAvailable !== false);

    res.json({
      dealer: {
        _id: dealer._id,
        name: dealer.name,
        type: dealer.type,
        address: dealer.address,
        phone: dealer.phone,
        email: dealer.email
      },
      bikes: activeListings.map(listing => ({
        listingId: listing._id,
        bike: listing.bike,
        availableForTestRide: listing.availableForTestRide,
        availableForPurchase: listing.availableForPurchase,
        onRoadPrice: listing.onRoadPrice,
        stock: listing.stock,
        notes: listing.notes
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// All routes below require authentication
router.use(protect);

// @route   GET /api/dealers/bikes
// @desc    Get all bikes (for dealer to list) with search, filter, and pagination
// @access  Private/Dealer
router.get('/bikes', authorize('dealer', 'admin'), async (req, res) => {
  try {
    const {
      search = '',
      brand = '',
      category = '',
      sortBy = 'newest', // 'newest', 'oldest', 'priceHigh', 'priceLow'
      page = 1,
      limit = 12
    } = req.query;

    // Build filter
    const filter = { isAvailable: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (brand) {
      filter.brand = { $regex: brand, $options: 'i' };
    }

    if (category) {
      filter.category = category;
    }

    // Build sort
    let sort = {};
    switch (sortBy) {
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'priceHigh':
        sort = { price: -1 };
        break;
      case 'priceLow':
        sort = { price: 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    // Get total count for pagination
    const total = await Bike.countDocuments(filter);

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const totalPages = Math.ceil(total / limitNum);

    // Get bikes
    const bikes = await Bike.find(filter)
      .select('name brand category price images specifications createdAt')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get unique brands for filter dropdown
    const brands = await Bike.distinct('brand', { isAvailable: true });

    res.json({
      bikes,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      filters: {
        brands: brands.sort()
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/dealers/my-listings
// @desc    Get dealer's bike listings
// @access  Private/Dealer
router.get('/my-listings', authorize('dealer', 'admin'), async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ email: req.user.email });
    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    const listings = await DealerBikeListing.find({
      dealer: dealer._id,
      isActive: true
    })
      .populate('bike', 'name brand category price images')
      .sort({ createdAt: -1 });

    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/dealers/list-bike
// @desc    List a bike for test ride or purchase
// @access  Private/Dealer
router.post('/list-bike', authorize('dealer', 'admin'), [
  body('notes').optional().trim().escape()
], async (req, res) => {
  try {
    const { bikeId, availableForTestRide, availableForPurchase, onRoadPrice, stock, notes } = req.body;

    const dealer = await Dealer.findOne({ email: req.user.email });
    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    // Check if bike exists
    const bike = await Bike.findById(bikeId);
    if (!bike) {
      return res.status(404).json({ message: 'Bike not found' });
    }

    // Check if already listed
    const existingListing = await DealerBikeListing.findOne({
      dealer: dealer._id,
      bike: bikeId
    });

    if (existingListing) {
      // Update existing listing
      existingListing.availableForTestRide = availableForTestRide !== undefined ? availableForTestRide : existingListing.availableForTestRide;
      existingListing.availableForPurchase = availableForPurchase !== undefined ? availableForPurchase : existingListing.availableForPurchase;
      existingListing.onRoadPrice = onRoadPrice || existingListing.onRoadPrice;
      existingListing.stock = stock !== undefined ? stock : existingListing.stock;
      existingListing.notes = notes || existingListing.notes;
      existingListing.isActive = true;
      await existingListing.save();

      return res.json({ message: 'Bike listing updated', listing: existingListing });
    }

    // Create new listing
    const listing = await DealerBikeListing.create({
      dealer: dealer._id,
      bike: bikeId,
      availableForTestRide: availableForTestRide !== undefined ? availableForTestRide : true,
      availableForPurchase: availableForPurchase !== undefined ? availableForPurchase : true,
      onRoadPrice,
      stock: stock || 0,
      notes
    });

    await listing.populate('bike', 'name brand category price images');

    res.status(201).json({ message: 'Bike listed successfully', listing });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Bike is already listed' });
    }
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/dealers/listings/:id
// @desc    Update bike listing
// @access  Private/Dealer
router.put('/listings/:id', authorize('dealer', 'admin'), async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ email: req.user.email });
    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    const listing = await DealerBikeListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Check if dealer owns this listing
    if (listing.dealer.toString() !== dealer._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(listing, req.body);
    await listing.save();
    await listing.populate('bike', 'name brand category price images');

    res.json({ message: 'Listing updated', listing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/dealers/listings/:id
// @desc    Remove bike listing
// @access  Private/Dealer
router.delete('/listings/:id', authorize('dealer', 'admin'), async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ email: req.user.email });
    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    const listing = await DealerBikeListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Check if dealer owns this listing
    if (listing.dealer.toString() !== dealer._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    listing.isActive = false;
    await listing.save();

    res.json({ message: 'Listing removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/dealers/bookings
// @desc    Get dealer's bookings
// @access  Private/Dealer
router.get('/bookings', authorize('dealer', 'admin'), async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ email: req.user.email });
    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    const bookings = await Booking.find({ dealer: dealer._id })
      .populate('bike', 'name brand images')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ SPARE PARTS ROUTES ============

// @route   GET /api/dealers/spare-parts
// @desc    Get all available spare parts with search, filter, pagination
// @access  Private/Dealer
router.get('/spare-parts', authorize('dealer', 'admin'), async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ email: req.user.email });
    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    const {
      search = '',
      category = '',
      page = 1,
      limit = 12
    } = req.query;

    // Build filter
    const filter = { isAvailable: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { partNumber: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      filter.category = category;
    }

    // Get total count
    const total = await SparePart.countDocuments(filter);

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const totalPages = Math.ceil(total / limitNum);

    const parts = await SparePart.find(filter)
      .populate('bike', 'name brand')
      .sort({ category: 1, name: 1 })
      .skip(skip)
      .limit(limitNum);

    // Add isListedByDealer flag to each part
    const partsWithFlag = parts.map(part => ({
      ...part.toObject(),
      isListedByDealer: part.dealers.some(d => d.toString() === dealer._id.toString())
    }));

    // Get unique categories for filter dropdown
    const categories = await SparePart.distinct('category', { isAvailable: true });

    res.json({
      parts: partsWithFlag,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      filters: {
        categories: categories.sort()
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/dealers/my-spare-parts
// @desc    Get spare parts listed by this dealer
// @access  Private/Dealer
router.get('/my-spare-parts', authorize('dealer', 'admin'), async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ email: req.user.email });
    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    const parts = await SparePart.find({
      dealers: dealer._id,
      isAvailable: true
    })
      .populate('bike', 'name brand')
      .sort({ category: 1, name: 1 });

    res.json(parts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/dealers/spare-parts/:partId/toggle
// @desc    Toggle listing of a spare part for this dealer
// @access  Private/Dealer
router.post('/spare-parts/:partId/toggle', authorize('dealer', 'admin'), async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ email: req.user.email });
    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    const part = await SparePart.findById(req.params.partId);
    if (!part) {
      return res.status(404).json({ message: 'Spare part not found' });
    }

    const dealerIndex = part.dealers.findIndex(d => d.toString() === dealer._id.toString());

    if (dealerIndex > -1) {
      // Remove dealer (unlist)
      part.dealers.splice(dealerIndex, 1);
      await part.save();
      res.json({ message: 'Spare part unlisted', listed: false });
    } else {
      // Add dealer (list)
      part.dealers.push(dealer._id);
      await part.save();
      res.json({ message: 'Spare part listed', listed: true });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
