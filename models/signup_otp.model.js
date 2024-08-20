const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { EasyPeasyDB } = require("../config/db.config");

const signupOtpSchema = new mongoose.Schema(
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
  { timestamps: true, collection: "SignUpOTPs" }
);

signupOtpSchema.pre("save", async function (next) {
  if (!this.isModified("HashedOTP")) return next();

  const salt = await bcrypt.genSalt(10);
  this.HashedOTP = await bcrypt.hash(this.HashedOTP, salt);

  next();
});

signupOtpSchema.methods.compareOtp = async function (candidateOtp) {
  return await bcrypt.compare(candidateOtp, this.HashedOTP);
};

const SignUpOTP = EasyPeasyDB.model("SignUpOTP", signupOtpSchema);

module.exports = SignUpOTP;
