const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['student', 'organizer', 'admin'],
      default: 'student'
    }
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (raw) {
  return bcrypt.compare(raw, this.passwordHash);
};

userSchema.statics.hashPassword = function (raw) {
  return bcrypt.hash(raw, 10);
};

module.exports = mongoose.model('User', userSchema);
