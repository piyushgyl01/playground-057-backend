// routes/profile.js - Profile routes
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth');

// @route   GET api/profile/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, profileController.getCurrentProfile);

// @route   POST api/profile
// @desc    Create or update user profile
// @access  Private
router.post('/', auth, profileController.createProfile);

// @route   DELETE api/profile
// @desc    Delete profile and user
// @access  Private
router.delete('/', auth, profileController.deleteProfile);

module.exports = router;