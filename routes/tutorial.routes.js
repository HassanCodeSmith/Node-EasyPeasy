/** __________ Middlewares __________ */
const adminAuth = require("../middlewares/admin_auth.middleware");
const loginAuth = require("../middlewares/login_auth.middleware");
const {
  restrictionLessLoginAuth,
} = require("../middlewares/restriction_less_login_auth.middleware");

/** __________ Utils __________ */
const { upload } = require("../utils/upload.util");

/** __________ Express Router __________ */
const router = require("express").Router();

/** __________ Controllers __________ */
const {
  createTutorial,
  getAllTutorials,
  getTutorialById,
  deleteTutorial,
  updateTutorial,
  searchTutorialByTitle,
} = require("../controller/tutorial.controllers");

/** /tutorial/create */
router
  .route("/create")
  .post(loginAuth, adminAuth, upload.any(), createTutorial);

/** /tutorial/getAll */
router.route("/getAll").get(restrictionLessLoginAuth, getAllTutorials);

/** /tutorial/get */
router.route("/get/:tutorialId").get(loginAuth, getTutorialById);

/** /tutorial/delete */
router.route("/delete/:tutorialId").post(loginAuth, adminAuth, deleteTutorial);

/** /tutorial/update */
router
  .route("/update/:tutorialId")
  .post(loginAuth, upload.any(), updateTutorial);

/** /tutorial/titleSearch */
router.route("/titleSearch").get(searchTutorialByTitle);

module.exports = router;
