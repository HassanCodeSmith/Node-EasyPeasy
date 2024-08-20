const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { EasyPeasyDB } = require("../config/db.config");

const forgotPasswordOtpSchema = new mongoose.Schema(
  {
    Email: {
      type: String,
      trim: true,
      required: true,
    },

    HashedOTP: {
      type: String,
      trim: true,
      required: true,
    },

    CreatedAt: {
      type: Date,
      default: Date.now,
      index: { expires: 300 }, // 60 * 5 = 300 (Expires after 5 mintis)
    },
  },
  { timestamps: true, collection: "ForgotPasswordOTPs" }
);

forgotPasswordOtpSchema.pre("save", async function (next) {
  if (!this.isModified("HashedOTP")) return next();

  const salt = await bcrypt.genSalt(10);
  this.HashedOTP = await bcrypt.hash(this.HashedOTP, salt);

  next();
});

forgotPasswordOtpSchema.methods.compareOtp = async function (candidateOtp) {
  return await bcrypt.compare(candidateOtp, this.HashedOTP);
};

const ForgotPasswordOTP = EasyPeasyDB.model(
  "ForgotPasswordOTP",
  forgotPasswordOtpSchema
);

module.exports = { ForgotPasswordOTP };
