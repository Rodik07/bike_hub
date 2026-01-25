import express from 'express';
import { query, validationResult } from 'express-validator';
import Bike from '../models/Bike.model.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   GET /api/bikes
// @desc    Get all bikes with filters
// @access  Public
router.get('/', [
  query('brand').optional().trim().escape(),
  query('category').optional().trim().escape(),
  query('search').optional().trim().escape(),
  query('minPrice').optional().isNumeric().toFloat(),
  query('maxPrice').optional().isNumeric().toFloat(),
  query('featured').optional().isBoolean()
], async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { brand, category, search, minPrice, maxPrice, featured } = req.query;

    const filter = {};

    if (brand) filter.brand = brand;
    if (category) filter.category = category;
    if (featured === 'true') filter.featured = true;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let query = Bike.find(filter);

    if (search) {
      query = Bike.find({
        ...filter,
        $text: { $search: search }
      });
    }

    const bikes = await query.sort({ createdAt: -1 });
    res.json(bikes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/bikes/brands
// @desc    Get all unique brands
// @access  Public
router.get('/brands', async (req, res) => {
  try {
    const brands = await Bike.distinct('brand');
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/bikes/categories
// @desc    Get all unique categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Bike.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/bikes/:id
// @desc    Get single bike by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);

    if (!bike) {
      return res.status(404).json({ message: 'Bike not found' });
    }

    // Increment view count
    bike.views += 1;
    await bike.save();

    res.json(bike);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/bikes/:id/compare
// @desc    Increment comparison count
// @access  Private
router.post('/:id/compare', protect, async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);

    if (!bike) {
      return res.status(404).json({ message: 'Bike not found' });
    }

    bike.comparisons += 1;
    await bike.save();

    res.json({ message: 'Comparison tracked', comparisons: bike.comparisons });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/bikes
// @desc    Create new bike (Admin only)
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const bike = await Bike.create(req.body);
    res.status(201).json(bike);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/bikes/:id
// @desc    Update bike (Admin only)
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const bike = await Bike.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!bike) {
      return res.status(404).json({ message: 'Bike not found' });
    }

    res.json(bike);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/bikes/:id
// @desc    Delete bike (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const bike = await Bike.findByIdAndDelete(req.params.id);

    if (!bike) {
      return res.status(404).json({ message: 'Bike not found' });
    }

    res.json({ message: 'Bike deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

