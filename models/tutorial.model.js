const mongoose = require("mongoose");
const { EasyPeasyDB } = require("../config/db.config");

const tutorialSchema = new mongoose.Schema(
  {
    Title: {
      type: String,
      trim: true,
      required: true,
    },

    Description: {
      type: String,
      trim: true,
      required: true,
    },

    Status: {
      type: String,
      enum: ["draft", "new", ""],
      default: "draft",
    },

    Files: [
      {
        type: String,
        trim: true,
      },
    ],

    CreatedBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },

    PermanentDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, collection: "Tutorials" }
);

const Tutorial = EasyPeasyDB.model("Tutorial", tutorialSchema);

module.exports = { Tutorial };
