// models/Profile.js - User profile model
const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "pg57User",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  yearsOfExperience: {
    type: Number,
    required: true,
  },
  skills: {
    type: [String],
    required: true,
  },
  preferredJobType: {
    type: String,
    enum: ["remote", "onsite", "any"],
    default: "any",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
ProfileSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("pg57Profile", ProfileSchema);
