const mongoose = require("mongoose");
const { EasyPeasyDB } = require("../config/db.config");

const postTypeSchema = new mongoose.Schema(
  {
    Created: {
      type: Date,
      default: Date.now,
    },
    CreatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    Modified: {
      type: Date,
      default: Date.now,
    },
    ModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    DeletedAt: {
      type: Date,
      default: null,
    },
    Type: {
      type: String,
      required: true,
    },
    Name: {
      type: String,
      required: true,
    },
    Slug: {
      type: String,
      required: true,
    },
    Style: {
      BannerBgUri: String,
      IconUri: String,
      BannerBgColor: String,
    },
  },
  { collation: "PostType" }
);

const PostType = EasyPeasyDB.model("PostType", postTypeSchema);

module.exports = PostType;
