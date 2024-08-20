const express = require("express");
const attSheetRoute = express.Router();
const loginAuth = require("../middlewares/login_auth.middleware");
const adminCheck = require("../middlewares/admin_auth.middleware");
const {
  postAttemptedSheet,
} = require("../controller/attempted_sheet.controllers");

attSheetRoute.post("/postAttemptedSheet", loginAuth, postAttemptedSheet);

module.exports = attSheetRoute;
