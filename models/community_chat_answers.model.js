const mongoose = require("mongoose");
const { EasyPeasyDB } = require("../config/db.config");

const communityChatAnswersSchema = new mongoose.Schema(
  {
    QuestionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "communitychatquestions",
    },

    Answer: {
      type: String,
      required: true,
      trim: true,
    },

    RepliesOnAnswers: [
      {
        Reply: {
          type: String,
          trim: true,
          required: true,
        },
        CreatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        CreatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    CreatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    SoftDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, collection: "CommunityChatAnswers" }
);

const CommunityChatAnswersModel = EasyPeasyDB.model(
  "communitychatanswers",
  communityChatAnswersSchema
);

module.exports = CommunityChatAnswersModel;
