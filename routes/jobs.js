// routes/jobs.js - Job routes
const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");
const auth = require("../middleware/auth");

// @route   GET api/jobs
// @desc    Get all jobs
// @access  Public
router.get("/", jobController.getAllJobs);

// @route   GET api/jobs/:id
// @desc    Get job by ID
// @access  Public
router.get("/:id", jobController.getJobById);

// @route   POST api/jobs
// @desc    Create a job
// @access  Private (Admin only in a real app)
router.post("/", auth, jobController.createJob);

// @route   PUT api/jobs/:id
// @desc    Update a job
// @access  Private (Admin only in a real app)
router.put("/:id", auth, jobController.updateJob);

// @route   DELETE api/jobs/:id
// @desc    Delete a job
// @access  Private (Admin only in a real app)
router.delete("/:id", auth, jobController.deleteJob);

// @route   POST api/jobs/seed
// @desc    Seed jobs
// @access  Public (only for development)
router.post("/seed", jobController.seedJobs);

module.exports = router;
