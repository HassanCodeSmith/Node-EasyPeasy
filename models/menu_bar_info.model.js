const mongoose = require("mongoose");
const { EasyPeasyDB } = require("../config/db.config");

const menuBarInfoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },

    infoImage: {
      type: String,
      trim: true,
      default: "",
    },

    advanceInfoImage: {
      type: String,
      trim: true,
      default: "",
    },

    advanceInfoVideo: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true, collection: "MenuBarInfo" }
);

const MenuBarInfo = EasyPeasyDB.model("MenuBarInfo", menuBarInfoSchema);

module.exports = { MenuBarInfo };
