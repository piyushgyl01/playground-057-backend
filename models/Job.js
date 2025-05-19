// models/Job.js - Job listing model
const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  company: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  skills: {
    type: [String],
    required: true,
  },
  jobType: {
    type: String,
    enum: ["remote", "onsite", "hybrid"],
    required: true,
  },
  salary: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("pg57Job", JobSchema);
