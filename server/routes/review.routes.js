import express from 'express';
import BikeReview from '../models/BikeReview.model.js';
import Bike from '../models/Bike.model.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   GET /api/reviews/:bikeId
// @desc    Get all reviews for a bike (sorted by net likes desc), paginated
// @access  Public
router.get('/:bikeId', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { bike: req.params.bikeId };
    const total = await BikeReview.countDocuments(filter);

    const reviews = await BikeReview.find(filter)
      .populate('user', 'name email avatar')
      .populate('comments.user', 'name email avatar')
      .populate('comments.replies.user', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Sort by net likes (likes.length - dislikes.length) descending in memory
    reviews.sort((a, b) => {
      const netA = a.likes.length - a.dislikes.length;
      const netB = b.likes.length - b.dislikes.length;
      return netB - netA;
    });

    res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/reviews/:bikeId/preview
// @desc    Get one random review for the bike detail preview
// @access  Public
router.get('/:bikeId/preview', async (req, res) => {
  try {
    const count = await BikeReview.countDocuments({ bike: req.params.bikeId });

    if (count === 0) {
      return res.json({ review: null, totalReviews: 0 });
    }

    // Get a random review
    const random = Math.floor(Math.random() * count);
    const review = await BikeReview.findOne({ bike: req.params.bikeId })
      .populate('user', 'name email avatar')
      .skip(random);

    // Get average rating
    const stats = await BikeReview.aggregate([
      { $match: { bike: review.bike } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    res.json({
      review,
      totalReviews: count,
      avgRating: stats[0]?.avgRating?.toFixed(1) || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/reviews/:bikeId/my-review
// @desc    Get logged-in user's review for this bike
// @access  Private
router.get('/:bikeId/my-review', protect, async (req, res) => {
  try {
    const review = await BikeReview.findOne({
      bike: req.params.bikeId,
      user: req.user._id
    })
      .populate('user', 'name email avatar')
      .populate('comments.user', 'name email avatar')
      .populate('comments.replies.user', 'name email avatar');

    res.json({ review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/reviews/:bikeId
// @desc    Create a review for a bike
// @access  Private
router.post('/:bikeId', protect, async (req, res) => {
  try {
    // Check if bike exists
    const bike = await Bike.findById(req.params.bikeId);
    if (!bike) {
      return res.status(404).json({ message: 'Bike not found' });
    }

    // Check if user already reviewed this bike
    const existing = await BikeReview.findOne({
      bike: req.params.bikeId,
      user: req.user._id
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this bike' });
    }

    const { rating, title, content } = req.body;

    const review = await BikeReview.create({
      bike: req.params.bikeId,
      user: req.user._id,
      rating,
      title,
      content
    });

    const populated = await BikeReview.findById(review._id)
      .populate('user', 'name email avatar');

    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this bike' });
    }
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/reviews/:reviewId
// @desc    Update own review
// @access  Private
router.put('/:reviewId', protect, async (req, res) => {
  try {
    const review = await BikeReview.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }

    const { rating, title, content } = req.body;
    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (content) review.content = content;

    await review.save();

    const populated = await BikeReview.findById(review._id)
      .populate('user', 'name email avatar')
      .populate('comments.user', 'name email avatar')
      .populate('comments.replies.user', 'name email avatar');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/reviews/:reviewId
// @desc    Delete own review
// @access  Private
router.delete('/:reviewId', protect, async (req, res) => {
  try {
    const review = await BikeReview.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await BikeReview.findByIdAndDelete(req.params.reviewId);
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/reviews/:reviewId/like
// @desc    Toggle like on a review
// @access  Private
router.post('/:reviewId/like', protect, async (req, res) => {
  try {
    const review = await BikeReview.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const userId = req.user._id;
    const alreadyLiked = review.likes.includes(userId);

    if (alreadyLiked) {
      // Remove like (toggle off)
      review.likes.pull(userId);
    } else {
      // Add like and remove dislike if present
      review.dislikes.pull(userId);
      review.likes.push(userId);
    }

    await review.save();

    res.json({
      likes: review.likes.length,
      dislikes: review.dislikes.length,
      userLiked: !alreadyLiked,
      userDisliked: false
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/reviews/:reviewId/dislike
// @desc    Toggle dislike on a review
// @access  Private
router.post('/:reviewId/dislike', protect, async (req, res) => {
  try {
    const review = await BikeReview.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const userId = req.user._id;
    const alreadyDisliked = review.dislikes.includes(userId);

    if (alreadyDisliked) {
      // Remove dislike (toggle off)
      review.dislikes.pull(userId);
    } else {
      // Add dislike and remove like if present
      review.likes.pull(userId);
      review.dislikes.push(userId);
    }

    await review.save();

    res.json({
      likes: review.likes.length,
      dislikes: review.dislikes.length,
      userLiked: false,
      userDisliked: !alreadyDisliked
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/reviews/:reviewId/comments
// @desc    Add a comment on a review
// @access  Private
router.post('/:reviewId/comments', protect, async (req, res) => {
  try {
    const review = await BikeReview.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    review.comments.push({
      user: req.user._id,
      content: content.trim()
    });

    await review.save();

    const populated = await BikeReview.findById(review._id)
      .populate('user', 'name email avatar')
      .populate('comments.user', 'name email avatar')
      .populate('comments.replies.user', 'name email avatar');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/reviews/:reviewId/comments/:commentId/replies
// @desc    Reply to a comment
// @access  Private
router.post('/:reviewId/comments/:commentId/replies', protect, async (req, res) => {
  try {
    const review = await BikeReview.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const comment = review.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    comment.replies.push({
      user: req.user._id,
      content: content.trim()
    });

    await review.save();

    const populated = await BikeReview.findById(review._id)
      .populate('user', 'name email avatar')
      .populate('comments.user', 'name email avatar')
      .populate('comments.replies.user', 'name email avatar');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/reviews/:reviewId/comments/:commentId
// @desc    Delete own comment
// @access  Private
router.delete('/:reviewId/comments/:commentId', protect, async (req, res) => {
  try {
    const review = await BikeReview.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const comment = review.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    review.comments.pull(req.params.commentId);
    await review.save();

    const populated = await BikeReview.findById(review._id)
      .populate('user', 'name email avatar')
      .populate('comments.user', 'name email avatar')
      .populate('comments.replies.user', 'name email avatar');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
