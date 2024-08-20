const mongoose = require("mongoose");
const { EasyPeasyDB } = require("../config/db.config");

const favoriteWorkSheetsShcema = new mongoose.Schema(
  {
    CommunityWorkSheetIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CommunityWorkSheet",
      },
    ],

    InteractiveWorkSheetIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],

    CreatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    collection: "FavoriteWorkSheets",
  }
);

const FavoriteWorkSheet = EasyPeasyDB.model(
  "Favoriteworksheet",
  favoriteWorkSheetsShcema
);

module.exports = FavoriteWorkSheet;
