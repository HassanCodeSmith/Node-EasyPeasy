const mongoose = require("mongoose");
const { EasyPeasyDB } = require("../config/db.config");

const worksheetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    imgUrl: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    grade: {
      type: String,
      required: true,
    },

    age: {
      type: String,
      required: true,
    },

    subject: {
      type: String,
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    language: {
      type: String,
      required: true,
    },

    status: {
      type: Boolean,
      required: true,
    },

    type: {
      type: String,
      default: "Interactive",
    },

    isFavorite: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Worksheet = EasyPeasyDB.model("Worksheet", worksheetSchema);

module.exports = Worksheet;
