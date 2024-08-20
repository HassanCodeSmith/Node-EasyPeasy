const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { EasyPeasyIdentityDB } = require("../config/db.config");

const User = new mongoose.Schema(
  {
    Name: {
      type: String,
      trim: true,
    },

    UserName: { type: String },

    Email: {
      type: String,
      required: true,
    },

    EmailConfirmed: {
      type: Boolean,
      default: false,
    },

    AvatarUrl: {
      type: String,
      default: null,
    },

    Role: { type: String, enum: ["admin", "user"], default: "user" },

    CreatedSheets: {
      type: Number,
      default: 0,
    },

    PasswordHash: { type: String, default: "" },

    ForgotPasswordStatus: {
      type: Boolean,
    },

    PermanentDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "Users",
  }
);

User.pre("save", async function (next) {
  if (!this.isModified("PasswordHash")) next();
  const salt = await bcrypt.genSalt(10);
  this.PasswordHash = await bcrypt.hash(this.PasswordHash, salt);

  next();
});

User.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.PasswordHash);
  return isMatch;
};

User.methods.createJWT = function () {
  return jwt.sign({ userId: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  });
};

module.exports = EasyPeasyIdentityDB.model("User", User);
