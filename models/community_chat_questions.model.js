const mongoose = require("mongoose");
const { EasyPeasyDB } = require("../config/db.config");

const communityChatQuestionsSchema = new mongoose.Schema(
  {
    Title: {
      type: String,
      required: true,
      trim: true,
    },

    Description: {
      type: String,
      required: true,
      trim: true,
    },

    QuestionStatus: {
      type: String,
      enum: ["draft", "new", "solved"],
      default: "draft",
    },

    TotalViews: {
      type: Number,
      default: 0,
    },

    TotalAnswers: {
      type: Number,
      default: 0,
    },

    CreatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    SoftDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, collection: "CommunityChatQuestions" }
);

const CommunityChatQuestionsModel = EasyPeasyDB.model(
  "communitychatquestions",
  communityChatQuestionsSchema
);

module.exports = CommunityChatQuestionsModel;
