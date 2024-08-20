/** __________ Middlewares __________ */
const loginAuth = require("../middlewares/login_auth.middleware");
const adminAuth = require("../middlewares/admin_auth.middleware");

/** __________ Utils __________ */
const { upload } = require("../utils/upload.util");

/** __________ Express Router __________ */
const router = require("express").Router();

/** __________ Controllers __________ */
const {
  createMenuBarInfo,
  getAllInfo,
  getSingleEntity,
  updateMenuBarEntity,
  deleteMenuBarEntity,
} = require("../controller/menu_bar_info.controllers");

/** /menuBarInfo/create */
router.route("/create").post(
  loginAuth,
  adminAuth,
  upload.fields([
    { name: "infoImage", maxCount: 1 },
    { name: "advanceInfoVideo", maxCount: 1 },
  ]),
  createMenuBarInfo
);

/** /menuBarInfo/getAll */
router.route("/getAll").get(getAllInfo);

/** /menuBarInfo/get */
router.route("/get/:entityId").get(getSingleEntity);

/** /menuBarInfo/update */
router.route("/update/:entityId").patch(
  loginAuth,
  adminAuth,
  upload.fields([
    { name: "infoImage", maxCount: 1 },
    { name: "advanceInfoVideo", maxCount: 1 },
  ]),
  updateMenuBarEntity
);

/** /menuBarInfo/delete */
router
  .route("/delete/:entityId")
  .delete(loginAuth, adminAuth, deleteMenuBarEntity);

module.exports = router;
