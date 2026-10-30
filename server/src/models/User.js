const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      immutable: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    role: {
      type: String,
      enum: ['student', 'organizer', 'admin'],
      default: 'student'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
