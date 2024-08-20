const mongoose = require("mongoose");
const { EasyPeasyDB } = require("../config/db.config");

const AttemptedSheet = new mongoose.Schema(
  {
    workSheetId: {
      type: mongoose.Types.ObjectId,
      ref: "workSheet",
    },
    imgUrl: String,

    content: String,

    userId: {
      type: mongoose.Types.ObjectId,
      ref: "user",
    },
  },
  {
    timestamps: true,
    collection: "AttemptedSheets",
  }
);

module.exports = EasyPeasyDB.model("attemptedSheet", AttemptedSheet);
