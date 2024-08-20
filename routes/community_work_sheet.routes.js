/** __________ Middlewares __________ */
const loginAuth = require("../middlewares/login_auth.middleware");
const {
  restrictionLessLoginAuth,
} = require("../middlewares/restriction_less_login_auth.middleware");
const {
  checkCreatedSheetsLimit,
} = require("../middlewares/check_created_sheets_limit.middleware");

/** __________ Utils __________ */
const { upload } = require("../utils/upload.util");

/** __________ Express Router __________ */
const router = require("express").Router();

/** __________ Controllers __________ */
const {
  createCommunityWorkSheet,
  getCommunitySheet,
  updateCommunityWorkSheet,
  deleteCommunityWorkSheet,
  searchTitle,
  advanceSearch,
  getAllCommunityWorkSheets,
  relatedCommunityWorkSheets,
  increaseViews,
} = require("../controller/community_work_sheet.controllers");

/** /community/create */
router
  .route("/create")
  .post(
    upload.none(),
    loginAuth,
    checkCreatedSheetsLimit,
    createCommunityWorkSheet
  );

/** /community/getAll */
router.route("/getAll").get(loginAuth, getAllCommunityWorkSheets);

/** /community/get */
router.route("/get/:id").get(restrictionLessLoginAuth, getCommunitySheet);

/** /community/update */
router.route("/update/:id").post(loginAuth, updateCommunityWorkSheet);

/** /community/delete */
router.route("/delete/:id").post(loginAuth, deleteCommunityWorkSheet);

/** /community/searchTitle */
router.route("/searchTitle").get(loginAuth, searchTitle);

/** /community/advanceSearch */
router.route("/advanceSearch").post(loginAuth, advanceSearch);

/** /community/related */
router.route("/related/:workSheetId").get(relatedCommunityWorkSheets);

/** /community/increaseViews */
router.route("/increaseViews").post(upload.none(), loginAuth, increaseViews);

module.exports = router;
