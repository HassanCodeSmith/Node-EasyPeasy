const mongoose = require("mongoose");
const { EasyPeasyDB } = require("../config/db.config");

const topicSchema = new mongoose.Schema(
  {
    Created: {
      type: Date,
      default: Date.now,
    },
    CreatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    Modified: Date,
    ModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    DeletedAt: Date,
    Title: {
      type: String,
      required: true,
    },
    Slug: {
      type: String,
      required: true,
    },
    Description: String,
    Style: {
      BannerBgUri: String,
      IconUri: String,
      BannerBgColor: String,
    },
    ParentId: mongoose.Schema.Types.ObjectId,
    Order: {
      type: Number,
      default: 0,
    },
    LanguageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Language", // Reference to Language model, change accordingly
    },
    Link: String,
    IsTopBtnFilter: {
      type: Boolean,
      default: false,
    },
    IsNotRedirect: {
      type: Boolean,
      default: false,
    },
    BgColorTopBtnFilter: String,
  },
  { collection: "Topic" }
);

const Topic = EasyPeasyDB.model("Topic", topicSchema);

module.exports = Topic;
