import express from 'express';
import { body, validationResult } from 'express-validator';
import passport from '../config/passport.js';
import User from '../models/User.model.js';
import { generateToken } from '../utils/generateToken.js';
import { protect } from '../middleware/auth.middleware.js';
import crypto from 'crypto';
import { sendPasswordResetEmail, sendOTPEmail } from '../utils/emailService.js';

const router = express.Router();

// Helper function to generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password: encodedPassword, phone, role } = req.body;

    // Decode Base64 password
    const password = Buffer.from(encodedPassword, 'base64').toString('utf-8');

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user (only admin can create dealer/admin roles)
    const userRole = role && req.body.adminToken === process.env.ADMIN_SECRET ? role : 'user';

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: userRole
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user - Step 1: Verify credentials and send OTP
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password: encodedPassword } = req.body;

    // Decode Base64 password
    const password = Buffer.from(encodedPassword, 'base64').toString('utf-8');

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockUntil - new Date()) / 60000);
      return res.status(423).json({
        message: `Account temporarily locked. Please try again in ${minutesLeft} minute(s).`,
        lockUntil: user.lockUntil
      });
    }

    // Check if temporary password has expired without being changed
    if (user.mustChangePassword && user.temporaryPasswordExpiry && user.temporaryPasswordExpiry < new Date()) {
      return res.status(403).json({
        message: 'Your temporary password has expired. Please use "Forgot Password" to get a new one.',
        temporaryPasswordExpired: true
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      const maxAttempts = 5;
      const attemptsRemaining = maxAttempts - user.loginAttempts;

      // Lock account after 5 failed attempts for 30 minutes
      if (user.loginAttempts >= maxAttempts) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        await user.save();
        return res.status(423).json({
          message: 'Too many failed login attempts. Account locked for 30 minutes.',
          lockUntil: user.lockUntil,
          attemptsRemaining: 0
        });
      }

      await user.save();
      return res.status(401).json({
        message: `Invalid password. ${attemptsRemaining} ${attemptsRemaining === 1 ? 'try' : 'tries'} remaining before account lock.`,
        attemptsRemaining: attemptsRemaining
      });
    }

    // Reset login attempts on successful password verification
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    // Generate 6-digit OTP
    const otpCode = generateOTP();
    const otpExpiry = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes

    // Save OTP to user
    user.otpCode = otpCode;
    user.otpExpiry = otpExpiry;
    user.otpAttempts = 0;
    await user.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(user.email, user.name, otpCode);

    if (!emailSent) {
      // Clear OTP if email failed
      user.otpCode = undefined;
      user.otpExpiry = undefined;
      await user.save();
      return res.status(500).json({
        message: 'Failed to send OTP email. Please check email configuration or try again later.',
        emailError: true
      });
    }

    res.json({
      message: 'OTP sent to your email. Please verify to complete login.',
      email: user.email,
      otpSent: true,
      expiresIn: 180 // 3 minutes in seconds
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP - Step 2: Complete login with OTP
// @access  Public
router.post('/verify-otp', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').notEmpty().withMessage('OTP is required').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid verification attempt' });
    }

    // Check if OTP exists
    if (!user.otpCode || !user.otpExpiry) {
      return res.status(400).json({ message: 'No OTP found. Please login again.' });
    }

    // Check if OTP has expired
    if (user.otpExpiry < new Date()) {
      user.otpCode = undefined;
      user.otpExpiry = undefined;
      user.otpAttempts = 0;
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please login again.' });
    }

    // Verify OTP
    if (user.otpCode !== otp) {
      // Increment OTP attempts
      user.otpAttempts = (user.otpAttempts || 0) + 1;

      // Lock account after 5 failed OTP attempts for 30 minutes
      if (user.otpAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        user.otpCode = undefined;
        user.otpExpiry = undefined;
        user.otpAttempts = 0;
        await user.save();
        return res.status(423).json({
          message: 'Too many failed OTP attempts. Account locked for 30 minutes.',
          lockUntil: user.lockUntil
        });
      }

      await user.save();
      return res.status(401).json({
        message: 'Invalid OTP. Please try again.',
        attemptsRemaining: 5 - user.otpAttempts
      });
    }

    // OTP is valid - clear OTP fields and complete login
    user.otpCode = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    await user.save();

    // Check if password change is required
    const mustChangePassword = user.mustChangePassword ||
      (user.temporaryPasswordExpiry && new Date() > user.temporaryPasswordExpiry);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      dealerId: user.dealerId,
      mustChangePassword,
      temporaryPasswordExpiry: user.temporaryPasswordExpiry || null,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP
// @access  Public
router.post('/resend-otp', [
  body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If the email exists, a new OTP has been sent.' });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockUntil - new Date()) / 60000);
      return res.status(423).json({
        message: `Account temporarily locked. Please try again in ${minutesLeft} minute(s).`,
        lockUntil: user.lockUntil
      });
    }

    // Generate new OTP
    const otpCode = generateOTP();
    const otpExpiry = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes

    // Save new OTP
    user.otpCode = otpCode;
    user.otpExpiry = otpExpiry;
    user.otpAttempts = 0;
    await user.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(user.email, user.name, otpCode);

    if (!emailSent) {
      // Clear OTP if email failed
      user.otpCode = undefined;
      user.otpExpiry = undefined;
      await user.save();
      return res.status(500).json({
        message: 'Failed to send OTP email. Please check email configuration or try again later.',
        emailError: true
      });
    }

    res.json({
      message: 'A new OTP has been sent to your email.',
      expiresIn: 180 // 3 minutes in seconds
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -temporaryPassword');

    // Check if password change is required
    const mustChangePassword = user.mustChangePassword ||
      (user.temporaryPasswordExpiry && new Date() > user.temporaryPasswordExpiry);

    res.json({
      ...user.toObject(),
      mustChangePassword
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change password (required for dealers with temporary password)
// @access  Private
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    user.mustChangePassword = false;
    user.passwordChangedAt = new Date();
    user.temporaryPassword = undefined;
    user.temporaryPasswordExpiry = undefined;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If that email exists, a password reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token expires in 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(user.email, user.name, resetUrl);

    res.json({ message: 'If that email exists, a password reset link has been sent.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    user.mustChangePassword = false;
    user.passwordChangedAt = new Date();
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth login
// @access  Public
router.get('/google', (req, res, next) => {
  // Check if OAuth is configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/login?error=oauth_not_configured`);
  }
  // Check if strategy is registered
  if (!passport._strategies || !passport._strategies.google) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/login?error=oauth_not_configured`);
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get(
  '/google/callback',
  (req, res, next) => {
    // Check if OAuth is configured before attempting authentication
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=oauth_not_configured`);
    }
    // Only use passport.authenticate if strategy is registered
    if (passport._strategies && passport._strategies.google) {
      passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed` })(req, res, next);
    } else {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=oauth_not_configured`);
    }
  },
  async (req, res) => {
    try {
      if (!req.user) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
      }

      // Generate 6-digit OTP for OAuth login (2FA)
      const otpCode = generateOTP();
      const otpExpiry = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes

      // Save OTP to user
      const user = await User.findById(req.user._id);
      user.otpCode = otpCode;
      user.otpExpiry = otpExpiry;
      user.otpAttempts = 0;
      await user.save();

      // Send OTP email
      const emailSent = await sendOTPEmail(user.email, user.name, otpCode);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      if (!emailSent) {
        // Clear OTP if email failed
        user.otpCode = undefined;
        user.otpExpiry = undefined;
        await user.save();
        return res.redirect(`${frontendUrl}/login?error=email_failed`);
      }

      // Redirect to frontend with OAuth flag and email (no token yet)
      res.redirect(`${frontendUrl}/auth/callback?otpRequired=true&email=${encodeURIComponent(req.user.email)}&name=${encodeURIComponent(req.user.name)}&provider=google`);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=oauth_error`);
    }
  }
);

// @route   GET /api/auth/user-by-dealer/:dealerId
// @desc    Find the user account linked to a dealer (for chat)
// @access  Private
router.get('/user-by-dealer/:dealerId', protect, async (req, res) => {
  try {
    // Try finding by dealerId field first
    let user = await User.findOne({ dealerId: req.params.dealerId }).select('_id name email avatar');

    if (!user) {
      // Fallback: look up the Dealer record and find user by matching email
      const Dealer = (await import('../models/Dealer.model.js')).default;
      const dealer = await Dealer.findById(req.params.dealerId);
      if (dealer) {
        user = await User.findOne({ email: dealer.email, role: 'dealer' }).select('_id name email avatar');
      }
    }

    if (!user) {
      return res.status(404).json({ message: 'Dealer user not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

