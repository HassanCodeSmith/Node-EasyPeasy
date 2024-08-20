const express = require("express");
const SheetRoute = express.Router();
const loginAuth = require("../middlewares/login_auth.middleware");
const adminAuth = require("../middlewares/admin_auth.middleware");
const { upload } = require("../utils/upload.util");

const {
  createSheet,
  getAlldraftSheets,
  getAllpublishSheets,
  deleteSheet,
  updateSheet,
  getSheetById,
  uploadVideoAudio,
  getSheetsBysubject,
  getAudioVideo,
  deleteAudioVideo,
} = require("../controller/wrokSheets.controllers");

SheetRoute.post(
  "/createSheet",
  // upload.single("image", "audio", "video"),
  loginAuth,
  adminAuth,
  createSheet
);
SheetRoute.post(
  "/uploadVideoAudio",
  upload.single("File"),
  loginAuth,
  // adminAuth,
  uploadVideoAudio
);
SheetRoute.get("/getAllpublishSheets", getAllpublishSheets);
SheetRoute.get("/getAudioVideo", loginAuth, getAudioVideo);
SheetRoute.get("/getAlldraftSheets", getAlldraftSheets);
SheetRoute.get("/getSheetsBysubject", getSheetsBysubject);

SheetRoute.delete("/deleteSheet/:workSheetId", loginAuth, deleteSheet);
SheetRoute.delete(
  "/deleteAudioVideo/:audioVideoId",
  loginAuth,
  deleteAudioVideo
);
// SheetRoute.get("/getSheetById/:workSheetId", getSheetById);
SheetRoute.patch(
  "/updateSheet/:workSheetId",
  upload.single("image"),
  loginAuth,
  updateSheet
);

module.exports = SheetRoute;
