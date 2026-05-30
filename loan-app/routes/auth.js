import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import UserProfile from '../models/UserProfile.js';
import { authenticate } from '../middleware/auth.js';
import { validateRegistration, validateLogin, handleValidationErrors } from '../middleware/validation.js';
import { sendVerificationEmail } from '../services/emailService.js';

const router = express.Router();

// Register
router.post('/register', validateRegistration, handleValidationErrors, async (req, res) => {
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }
    
    // Create user
    const user = new User({ email, password });
    await user.save();
    
    // Create profile
    const profile = new UserProfile({
      user: user._id,
      firstName: firstName || '',
      lastName: lastName || '',
      phoneNumber: phoneNumber || ''
    });
    await profile.save();
    
    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    user.emailVerificationToken = verificationToken;
    await user.save();
    
    // Send verification email
    await sendVerificationEmail(email, verificationToken);
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, isStaff: user.isStaff },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      token,
      user: {
        id: user._id,
        email: user.email,
        isStaff: user.isStaff,
        isSuperuser: user.isSuperuser,
        emailVerified: user.emailVerified,
        profile: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          accountNumber: profile.accountNumber
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login
router.post('/login', validateLogin, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    // Check if account is locked
    if (user.isLocked()) {
      const waitTime = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      return res.status(401).json({ 
        success: false, 
        message: `Account locked. Try again in ${waitTime} minutes.` 
      });
    }
    
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      await user.incrementLoginAttempts();
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();
    
    const profile = await UserProfile.findOne({ user: user._id });
    
    const token = jwt.sign(
      { userId: user._id, email: user.email, isStaff: user.isStaff },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        isStaff: user.isStaff,
        isSuperuser: user.isSuperuser,
        emailVerified: user.emailVerified,
        profile: {
          firstName: profile?.firstName,
          lastName: profile?.lastName,
          balance: profile?.balance,
          accountNumber: profile?.accountNumber,
          accountType: profile?.accountType
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.userId });
    res.json({
      success: true,
      user: req.user,
      profile: profile
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify email
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.emailVerified) {
      return res.json({ success: true, message: 'Email already verified' });
    }
    
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();
    
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }
});

// Logout
router.post('/logout', authenticate, async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Change password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
