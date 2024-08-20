/** __________ Middlewares __________ */
const adminAuth = require("../middlewares/admin_auth.middleware");
const loginAuth = require("../middlewares/login_auth.middleware");
const {
  restrictionLessLoginAuth,
} = require("../middlewares/restriction_less_login_auth.middleware");

/** __________ Express Router __________ */
const PostRouter = require("express").Router();

/** __________ Controllers __________ */
const {
  getPostData,
  searchOnTitle,
  getMainAndSubTopics,
  getTopicData,
  getSheetById,
  statusChange,
  createSheetJson,
  getdatabystatus,
  deleteInteractiveWorkSheet,
  getWorksheets,
  relatedInteractiveWorkSheets,
  searchTitle,
  advanceSearch,
} = require("../controller/post.controllers");

/** /interactive/getPostData */
PostRouter.get("/getPostData", getPostData);

/** /interactive/search */
PostRouter.get("/search/Title", searchOnTitle);

/** /interactive/getdatabystatus */
PostRouter.get("/getdatabystatus", loginAuth, adminAuth, getdatabystatus);

/** /interactive/search/getMainAndSubTopics */
PostRouter.get(
  "/search/getMainAndSubTopics",
  loginAuth,
  adminAuth,
  getMainAndSubTopics
);

/** /interactive/search/getTopicData */
PostRouter.get("/search/getTopicData", getTopicData);

/** /interactive/getSheetById */
PostRouter.get(
  "/getSheetById/:sheetId",
  restrictionLessLoginAuth,
  getSheetById
);

/** /interactive/statusChange */
PostRouter.patch("/statusChange/:id", loginAuth, adminAuth, statusChange);

/** /interactive/createSheetJson */
PostRouter.patch("/createSheetJson/:id", loginAuth, adminAuth, createSheetJson);

/** /interactive/delete */
PostRouter.post(
  "/delete/:id",
  loginAuth,
  adminAuth,
  deleteInteractiveWorkSheet
);

/** /interactive/getWorksheets */
PostRouter.post("/getWorksheets", restrictionLessLoginAuth, getWorksheets);

/** /interactive/related */
PostRouter.get(
  "/related/:workSheetId",
  restrictionLessLoginAuth,
  relatedInteractiveWorkSheets
);

/** /interactive/searchTitle */
PostRouter.get("/titleSearch", restrictionLessLoginAuth, searchTitle);
PostRouter.post("/advanceSearch", restrictionLessLoginAuth, advanceSearch);

module.exports = PostRouter;
