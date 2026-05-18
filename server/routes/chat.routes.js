import express from 'express';
import ChatMessage from '../models/ChatMessage.model.js';
import Dealer from '../models/Dealer.model.js';
import User from '../models/User.model.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All chat routes require authentication
router.use(protect);

// @route   GET /api/chat/conversations
// @desc    List all conversations for current user (grouped by the other party + dealer)
// @access  Private
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all unique conversation partners
    const conversations = await ChatMessage.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            dealer: '$dealer',
            otherUser: {
              $cond: [{ $eq: ['$sender', userId] }, '$receiver', '$sender']
            }
          },
          lastMessage: { $first: '$content' },
          lastMessageAt: { $first: '$createdAt' },
          lastSender: { $first: '$sender' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$read', false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { lastMessageAt: -1 } }
    ]);

    // Populate the conversation data
    const populated = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = await User.findById(conv._id.otherUser).select('name email avatar role');
        const dealer = await Dealer.findById(conv._id.dealer).select('name phone address');

        return {
          otherUser,
          dealer,
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt,
          lastSender: conv.lastSender,
          unreadCount: conv.unreadCount
        };
      })
    );

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/chat/messages/:otherUserId
// @desc    Get messages between current user and another user
// @access  Private
router.get('/messages/:otherUserId', async (req, res) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.otherUserId;
    const dealerId = req.query.dealerId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = {
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId }
      ]
    };

    if (dealerId) {
      filter.dealer = dealerId;
    }

    const total = await ChatMessage.countDocuments(filter);
    const messages = await ChatMessage.find(filter)
      .populate('sender', 'name email avatar')
      .populate('receiver', 'name email avatar')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    res.json({
      messages,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/chat/messages
// @desc    Send a message
// @access  Private
router.post('/messages', async (req, res) => {
  try {
    const { receiverId, dealerId, content, bookingId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    if (!receiverId || !dealerId) {
      return res.status(400).json({ message: 'Receiver and dealer are required' });
    }

    const message = await ChatMessage.create({
      sender: req.user._id,
      receiver: receiverId,
      dealer: dealerId,
      booking: bookingId || null,
      content: content.trim()
    });

    const populated = await ChatMessage.findById(message._id)
      .populate('sender', 'name email avatar')
      .populate('receiver', 'name email avatar');

    // Emit via Socket.IO if available
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiverId}`).emit('new_message', populated);
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/chat/read/:otherUserId
// @desc    Mark messages from other user as read
// @access  Private
router.put('/read/:otherUserId', async (req, res) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.otherUserId;

    const result = await ChatMessage.updateMany(
      { sender: otherUserId, receiver: userId, read: false },
      { $set: { read: true } }
    );

    // Notify the other user that messages are read
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${otherUserId}`).emit('messages_read', { readBy: userId });
    }

    res.json({ modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/chat/unread-count
// @desc    Get total unread message count
// @access  Private
router.get('/unread-count', async (req, res) => {
  try {
    const count = await ChatMessage.countDocuments({
      receiver: req.user._id,
      read: false
    });

    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
