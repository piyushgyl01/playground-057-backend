// routes/recommendations.js - Recommendation routes
const express = require("express");
const router = express.Router();
const recommendationController = require("../controllers/recommendationController");
const auth = require("../middleware/auth");

// @route   GET api/recommendations
// @desc    Get job recommendations based on user profile
// @access  Private
router.get("/", auth, recommendationController.getJobRecommendations);

module.exports = router;
