/** import models */
const CommunityChatQuestions = require("../models/community_chat_questions.model");
const CommunityChatAnswers = require("../models/community_chat_answers.model");
const { EasyPeasyIdentityDB } = require("../config/db.config");

/** ___________ Community Chat Question's APIs *_____________*/

/**
 * Create new question
 */
exports.createQuestion = async (req, res) => {
  try {
    const { userId } = req.user;

    const { Title, Description, QuestionStatus } = req.body;

    if (!(Title && Description && QuestionStatus)) {
      return res.status(400).json({
        success: false,
        message: "Question title and description must be provided",
      });
    }

    await CommunityChatQuestions.create({
      ...req.body,
      CreatedBy: userId,
    });

    return res.status(200).json({
      success: true,
      message: "Question created successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while creating question",
    });
  }
};

/**
 * Get all questions
 */
exports.getAllQuestions = async (req, res) => {
  try {
    if (req?.user) {
      var { userId } = req.user;
    }
    const { page } = req.query;

    const limit = 16;
    const skip = (page - 1) * limit;

    const communityQuestions = await CommunityChatQuestions.find({
      SoftDelete: false,
      $or: [
        { QuestionStatus: { $in: ["new", "solved"] } },
        { QuestionStatus: "draft", CreatedBy: userId },
      ],
    })
      .populate({
        path: "CreatedBy",
        select:
          "-EmailConfirmed -PasswordHash -ForgotPasswordStatus -PermanentDeleted",
        model: EasyPeasyIdentityDB.model("User"),
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (communityQuestions.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Community questions list is empty",
        data: [],
        pagination: {
          page,
          limit,
          total: await CommunityChatQuestions.countDocuments({
            SoftDelete: false,
            $or: [
              { QuestionStatus: { $in: ["new", "solved"] } },
              { QuestionStatus: "draft", CreatedBy: userId },
            ],
          }),
        },
      });
    }

    return res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        total: await CommunityChatQuestions.countDocuments({
          SoftDelete: false,
          $or: [
            { QuestionStatus: { $in: ["new", "solved"] } },
            { QuestionStatus: "draft", CreatedBy: userId },
          ],
        }),
      },
      data: communityQuestions,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting all questions",
    });
  }
};

/**
 * Get single question
 */
exports.getQuestionDetails = async (req, res) => {
  try {
    const { questionId } = req.params;

    const communityQuestion = await CommunityChatQuestions.findOne({
      _id: questionId,
      SoftDelete: false,
    }).populate({
      path: "CreatedBy",
      select:
        "-EmailConfirmed -PasswordHash -ForgotPasswordStatus -PermanentDeleted",
      model: EasyPeasyIdentityDB.model("User"),
    });

    if (!communityQuestion) {
      console.log("Community question not found");
      return res.status(200).json({
        success: true,
        message: "Community question not found",
        data: {},
      });
    }

    communityQuestion.TotalViews += 1;
    await communityQuestion.save();

    return res.status(200).json({
      success: true,
      data: communityQuestion,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting question details",
    });
  }
};

/**
 * Delete question
 */
exports.deleteQuestion = async (req, res) => {
  try {
    const { userId } = req.user;
    const role = req.userRole;

    const { questionId } = req.params;

    const question = await CommunityChatQuestions.findOne({
      _id: questionId,
      SoftDelete: false,
    });

    if (!question) {
      console.log("Invalid id");
      return res.status(400).json({
        success: false,
        message: "Invalid id",
      });
    }

    if (
      question.CreatedBy.toString() !== userId.toString() &&
      role !== "admin"
    ) {
      console.error(
        "==> Authorization failed - You are not able to delete this question."
      );
      return res.status(400).json({
        success: false,
        message: "Authorization failed.",
      });
    }

    await CommunityChatQuestions.findOneAndUpdate(
      { _id: questionId, CreatedBy: userId },
      { SoftDelete: true }
    );

    await CommunityChatAnswers.updateMany(
      { QuestionId: questionId },
      { $set: { SoftDelete: true } }
    );

    return res.status(200).json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting question",
    });
  }
};

/**
 * Update question
 */
exports.updateQuestion = async (req, res) => {
  try {
    const { userId } = req.user;

    const { questionId } = req.params;

    const question = await CommunityChatQuestions.findOne({
      _id: questionId,
    });

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Invalid id",
      });
    }
    if (question.CreatedBy.toString() !== userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Authentication failed",
      });
    }

    const updatedFields = {};

    if (req.body.Title) {
      updatedFields.Title = req.body.Title;
    } else {
      updatedFields.Title = question.Title;
    }

    if (req.body.Description) {
      updatedFields.Description = req.body.Description;
    } else {
      updatedFields.Description = question.Description;
    }

    if (req.body.QuestionStatus) {
      updatedFields.QuestionStatus = req.body.QuestionStatus;
    } else {
      updatedFields.QuestionStatus = question.QuestionStatus;
    }

    await CommunityChatQuestions.findOneAndUpdate(
      { _id: questionId, CreatedBy: userId },
      { $set: updatedFields },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Question updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating question",
    });
  }
};

/**
 * Search on title
 */
exports.searchQuestionByTitle = async (req, res) => {
  try {
    const { Title, page } = req.query;

    const limit = 16;
    const skip = (page - 1) * limit;

    const searchedDocuments = await CommunityChatQuestions.find({
      Title: { $regex: new RegExp(Title, "i") },
      SoftDelete: false,
    })
      .populate({
        path: "CreatedBy",
        select:
          "-EmailConfirmed -PasswordHash -ForgotPasswordStatus -PermanentDeleted",
        model: EasyPeasyIdentityDB.model("User"),
      })
      .skip(skip)
      .limit(limit);

    if (searchedDocuments.length === 0) {
      console.log("==> There is no any Content for provided title");
      return res.status(200).json({
        success: true,
        message: "There is no any Content for provided title",
        pagination: {
          page,
          limit,
          total: await CommunityChatQuestions.countDocuments({
            Title: { $regex: new RegExp(Title, "i") },
            SoftDelete: false,
          }),
        },
        data: searchedDocuments,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Data fetched according to provided title",
      pagination: {
        page,
        limit,
        total: await CommunityChatQuestions.countDocuments({
          Title: { $regex: new RegExp(Title, "i") },
          SoftDelete: false,
        }),
      },
      data: searchedDocuments,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while search question by title",
    });
  }
};

/**
 * Marked question solved
 */
exports.changeQuestionStatus = async (req, res) => {
  try {
    const { userId } = req.user;
    const role = req.userRole;

    const { questionId, questionStatus } = req.params;

    const question = await CommunityChatQuestions.findOne({
      _id: questionId,
      SoftDelete: false,
    });

    if (!question) {
      console.log("Invalid question id");
      return res.status(404).json({
        success: true,
        message: "Invalid question id",
      });
    }

    if (
      question?.CreatedBy?.toString() !== userId.toString() &&
      role !== "admin"
    ) {
      console.error("You are not valid person to change question status.");
      return res.status(400).json({
        success: false,
        message: "You are not valid person to change question status.",
      });
    }

    if (question.QuestionStatus === questionStatus) {
      return res.status(409).json({
        success: false,
        message: `Question status already set to ${questionStatus}`,
      });
    }

    question.QuestionStatus = questionStatus;
    await question.save();

    return res.status(201).json({
      success: true,
      message: "Question status updated successfully",
    });
  } catch (error) {
    console.log("Error in changeQuestionStatus: ", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while changing question status",
    });
  }
};

/** ___________ Community Chat Answer's APIs *_____________*/

/**
 * Create answer
 */
exports.createAnswer = async (req, res) => {
  try {
    const { userId } = req.user;
    const { Answer, QuestionId } = req.body;

    if (!Answer) {
      console.log("Answer must be provided");
      return res.status(400).json({
        success: false,
        message: "Answer must be provided",
      });
    }

    if (!QuestionId) {
      console.log("Question id must be provided");
      return res.status(400).json({
        success: false,
        message: "Question id must be provided",
      });
    }

    const question = await CommunityChatQuestions.findOne({
      _id: QuestionId,
      SoftDelete: false,
    });

    if (!question) {
      console.log("Invalid question id");
      return res.status(400).json({
        success: false,
        message: "Invalid question id",
      });
    }

    // await CommunityChatAnswers.create({ ...req.body, CreatedBy: userId });
    await CommunityChatAnswers.create({
      ...req.body,
      CreatedBy: userId,
    });

    await CommunityChatQuestions.updateOne(
      { _id: QuestionId },
      { $inc: { TotalAnswers: 1 } }
    );

    return res.status(200).json({
      success: true,
      message: "Answer created successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while creating answer",
    });
  }
};

/**
 * Get all answers
 */
exports.getAnswersByQuestionId = async (req, res) => {
  try {
    if (req?.user) {
      var { userId } = req.user;
    }
    const { questionId } = req.params;
    const communityAnswers = await CommunityChatAnswers.find({
      QuestionId: questionId,
      SoftDelete: false,
    })
      .populate({
        path: "CreatedBy",
        select:
          "-EmailConfirmed -PasswordHash -ForgotPasswordStatus -PermanentDeleted",
        model: EasyPeasyIdentityDB.model("User"),
      })
      .populate({
        path: "RepliesOnAnswers.CreatedBy",
        select:
          "-EmailConfirmed -PasswordHash -ForgotPasswordStatus -PermanentDeleted",
        model: EasyPeasyIdentityDB.model("User"),
      });

    if (communityAnswers.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Community answers list is empty",
        data: [],
      });
    }

    await CommunityChatQuestions.findOneAndUpdate(
      { _id: questionId },
      {
        $set: { totalAnswers: communityAnswers.length },
        $inc: { totalViews: 1 },
      }
    );

    return res.status(200).json({
      success: true,
      data: communityAnswers,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting answers",
    });
  }
};

/**
 * Delete answer
 */
exports.deleteAnswer = async (req, res) => {
  try {
    const { userId } = req.user;
    const { answerId } = req.params;
    const answer = await CommunityChatAnswers.findOne({
      _id: answerId,
      SoftDelete: false,
    });

    if (!answer) {
      console.log("==> Invalid Id");
      return res.status(400).json({
        success: false,
        message: "Invalid id",
      });
    }
    if (answer.CreatedBy.toString() !== userId) {
      console.log("Authentication failed");
      return res.status(400).json({
        success: false,
        message: "Authentication failed",
      });
    }
    await CommunityChatAnswers.findOneAndUpdate(
      { _id: answerId, CreatedBy: userId },
      { SoftDelete: true }
    );

    console.log("==> Answer deleted successfully");
    return res.status(200).json({
      success: true,
      message: "Answer deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting answer",
    });
  }
};

/**
 * Update answer
 */
exports.updateAnswer = async (req, res) => {
  try {
    const { userId } = req.user;

    const { answerId } = req.params;
    const { QuestionId } = req.body;

    console.log("User Iddddddddddddddddddd: ", userId);
    console.log("Answer Iddddddddddddddddddd: ", answerId);
    const existingAnswer = await CommunityChatAnswers.findOne({
      _id: answerId,
    });

    if (!existingAnswer) {
      return res.status(400).json({
        success: false,
        message: "Invalid id",
      });
    }
    if (existingAnswer.CreatedBy.toString() !== userId) {
      return res.status(400).json({
        success: false,
        message: "Authentication failed",
      });
    }

    const updatedFields = {};

    if (req.body.Answer) {
      updatedFields.Answer = req.body.Answer;
    } else {
      updatedFields.Answer = existingAnswer.Answer;
    }

    await CommunityChatAnswers.findOneAndUpdate(
      { _id: QuestionId, CreatedBy: userId },
      { $set: updatedFields },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Question updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating answer",
    });
  }
};

/**
 * Reply On Answer
 */
exports.replyOnAnswer = async (req, res) => {
  try {
    const { userId } = req.user;
    const { AnswerId, ReplyOnAnswer } = req.body;
    const findAnswer = await CommunityChatAnswers.findOne({
      _id: AnswerId,
    });

    if (!findAnswer) {
      return res.status(400).json({
        success: false,
        message: "Invalid answer id",
      });
    }

    await CommunityChatAnswers.findOneAndUpdate(
      { _id: AnswerId },
      {
        $push: {
          RepliesOnAnswers: {
            Reply: ReplyOnAnswer,
            CreatedBy: userId,
          },
        },
      },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Reply on answer successfull",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while replay on answer",
    });
  }
};

/**
 * Update Reply on Answer
 */
exports.updateReplyOnAnswer = async (req, res) => {
  try {
    const { userId } = req.user;
    const { AnswerId, ReplyId, UpdatedReply } = req.body;

    const findAnswer = await CommunityChatAnswers.findOne({
      _id: AnswerId,
    });

    if (!findAnswer) {
      return res.status(400).json({
        success: false,
        message: "Invalid answer id",
      });
    }

    const updateResult = await CommunityChatAnswers.findOneAndUpdate(
      {
        _id: AnswerId,
        "RepliesOnAnswers._id": ReplyId,
        "RepliesOnAnswers.CreatedBy": userId,
      },
      {
        $set: {
          "RepliesOnAnswers.$.Reply": UpdatedReply,
        },
      },
      { new: true }
    );

    if (!updateResult) {
      return res.status(400).json({
        success: false,
        message:
          "Reply not found or you are not authorized to update this reply",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reply on answer successfully updated",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating reply on answer",
    });
  }
};

/**
 * Delete Reply on Answer
 */
exports.deleteReplyOnAnswer = async (req, res) => {
  try {
    const { userId } = req.user;
    const { answerId, replyId } = req.body;

    const findAnswer = await CommunityChatAnswers.findOne({
      _id: answerId,
    });

    if (!findAnswer) {
      return res.status(400).json({
        success: false,
        message: "Invalid answer id",
      });
    }

    const updateResult = await CommunityChatAnswers.findOneAndUpdate(
      { _id: answerId },
      {
        $pull: {
          RepliesOnAnswers: {
            _id: replyId,
            CreatedBy: userId,
          },
        },
      },
      { new: true }
    );

    if (!updateResult) {
      return res.status(400).json({
        success: false,
        message:
          "Reply not found or you are not authorized to delete this reply",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reply on answer successfully deleted",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting reply on answer",
    });
  }
};

/**
 * Search on Answer
 */
exports.searchByAnswer = async (req, res) => {
  try {
    const { QuestionId, Text } = req.query;

    const searchedDocuments = await CommunityChatAnswers.find({
      QuestionId,
      $or: [
        {
          Answer: { $regex: new RegExp(Text, "i") },
        },
        {
          "RepliesOnAnswers.Reply": { $regex: new RegExp(Text, "i") },
        },
      ],
      SoftDelete: false,
    })
      .populate({
        path: "CreatedBy",
        select:
          "-EmailConfirmed -PasswordHash -ForgotPasswordStatus -PermanentDeleted",
        model: EasyPeasyIdentityDB.model("User"),
      })
      .populate({
        path: "RepliesOnAnswers.CreatedBy",
        select:
          "-EmailConfirmed -PasswordHash -ForgotPasswordStatus -PermanentDeleted",
        model: EasyPeasyIdentityDB.model("User"),
      });

    if (searchedDocuments.length === 0) {
      console.log("==> There is no any Content for provided text");
      return res.status(200).json({
        success: true,
        message: "There is no any Content for provided text",
        data: searchedDocuments,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Data fetched according to provided title",
      data: searchedDocuments,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while search question by title",
    });
  }
};
