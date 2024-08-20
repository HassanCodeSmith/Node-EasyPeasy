/** __________ Middlewares __________ */
const loginAuth = require("../middlewares/login_auth.middleware");
const {
  restrictionLessLoginAuth,
} = require("../middlewares/restriction_less_login_auth.middleware");

/** __________ Utils __________ */
const { upload } = require("../utils/upload.util");

/** __________ Express Router __________ */
const communityChatRouter = require("express").Router();

/** __________ Controllers __________ */
const {
  createQuestion,
  deleteQuestion,
  getAllQuestions,
  updateQuestion,
  createAnswer,
  deleteAnswer,
  getAnswersByQuestionId,
  updateAnswer,
  replyOnAnswer,
  getQuestionDetails,
  updateReplyOnAnswer,
  deleteReplyOnAnswer,
  searchQuestionByTitle,
  changeQuestionStatus,
  searchByAnswer,
} = require("../controller/community_chat.controllers");

/** ___________ Community Chat Question's Routes *_____________*/
/** /communityChat/createQuestion */
communityChatRouter.post(
  "/createQuestion",
  loginAuth,
  upload.none(),
  createQuestion
);

/** /communityChat/getAllQuestions */
communityChatRouter.get(
  "/getAllQuestions",
  restrictionLessLoginAuth,
  getAllQuestions
);

/** /communityChat/getQuestionDetails */
communityChatRouter.get(
  "/getQuestionDetails/:questionId",
  restrictionLessLoginAuth,
  getQuestionDetails
);

/** /communityChat/deleteQuestion */
communityChatRouter.patch(
  "/deleteQuestion/:questionId",
  loginAuth,
  deleteQuestion
);

/** /communityChat/updateQuestion */
communityChatRouter.patch(
  "/updateQuestion/:questionId",
  loginAuth,
  updateQuestion
);

/** /communityChat/searchQuestionByTitle */
communityChatRouter.get("/searchQuestionByTitle", searchQuestionByTitle);

/** /communityChat/changeQuestionStatus */
communityChatRouter.post(
  "/changeQuestionStatus/:questionId/:questionStatus",
  loginAuth,
  changeQuestionStatus
);

/** ___________ Community Chat Answer's Routes *_____________*/

/** /communityChat/createAnswer */
communityChatRouter.post(
  "/createAnswer",
  loginAuth,
  upload.none(),
  createAnswer
);

/** /communityChat/getAnswersByQuestionId */
communityChatRouter.get(
  "/getAnswersByQuestionId/:questionId",
  restrictionLessLoginAuth,
  getAnswersByQuestionId
);

/** /communityChat/deleteAnswer */
communityChatRouter.patch("/deleteAnswer/:answerId", loginAuth, deleteAnswer);

/** /communityChat/updateAnswer */
communityChatRouter.patch("/updateAnswer/:answerId", loginAuth, updateAnswer);

/** /communityChat/replyOnAnswer */
communityChatRouter.post("/replyOnAnswer", loginAuth, replyOnAnswer);

/** /communityChat/updateReplyOnAnswer */
communityChatRouter.post(
  "/updateReplyOnAnswer",
  loginAuth,
  updateReplyOnAnswer
);

/** /communityChat/deleteReplyOnAnswer */
communityChatRouter.post(
  "/deleteReplyOnAnswer",
  loginAuth,
  deleteReplyOnAnswer
);

/** /communityChat/searchByAnswer */
communityChatRouter.get("/searchByAnswer", searchByAnswer);

module.exports = communityChatRouter;
