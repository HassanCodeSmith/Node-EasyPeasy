const mongoose = require("mongoose");
const { EasyPeasyDB } = require("../config/db.config");

const audioVideoSchema = new mongoose.Schema(
  {
    VideoUrl: {
      type: String,
    },
    AudioUrl: {
      type: String,
    },
    Type: {
      type: String,
      required: true,
    },
    Title: {
      type: String,
    },
    CreatedBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  },
  { collection: "AudioVideos" }
);

const AudioVideo = EasyPeasyDB.model("AudioVideo", audioVideoSchema);

module.exports = AudioVideo;
