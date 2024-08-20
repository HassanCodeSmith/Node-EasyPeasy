const mongoose = require("mongoose");
const { EasyPeasyDB } = require("../config/db.config");

const communityWorkSheetSchema = new mongoose.Schema(
  {
    Title: {
      type: String,
      required: true,
      trim: true,
    },

    Subject: {
      type: String,
      required: true,
      trim: true,
    },

    Language: {
      type: String,
      required: true,
      trim: true,
    },

    PictureUri: {
      type: String,
      trim: true,
    },

    Description: {
      type: String,
      required: true,
      trim: true,
    },

    Content: {
      type: String,
      required: true,
      trim: true,
    },

    Age: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],

    Grade: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],

    Privacy: {
      type: String,
      enum: ["private", "bank"],
      default: "private",
    },

    TermsAndConditionsAgreed: Boolean,

    TotalViews: {
      type: Number,
      default: 0,
    },

    Type: {
      type: String,
      default: "Community",
    },

    Modified: {
      type: Date,
      default: Date.now,
    },

    CreatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    PermanentDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, collection: "CommunityWorkSheets" }
);

const CommunityWorkSheet = EasyPeasyDB.model(
  "CommunityWorkSheet",
  communityWorkSheetSchema
);

module.exports = CommunityWorkSheet;
