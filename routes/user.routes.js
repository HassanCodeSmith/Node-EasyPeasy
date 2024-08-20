/** __________ Middlewares __________ */
const loginAuth = require("../middlewares/login_auth.middleware");

/** __________ Utils __________ */
const { upload } = require("../utils/upload.util");

/** __________ Express Router __________ */
const UserRoute = require("express").Router();

/** __________ Controllers __________ */
const {
  signUp,
  verifySignUpOtp,
  resendSignUpOTP,
  login,
  getUserData,
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
  changePassword,
  updateProfile,
  socialLogin,
} = require("../controller/user.controllers");

/** /user/signup */
UserRoute.post("/signup", signUp);

/** /user/verifySignUpOtp */
UserRoute.post("/verifySignUpOtp", verifySignUpOtp);

/** /user/resendSignUpOTP */
UserRoute.post("/resendSignUpOTP", resendSignUpOTP);

/** /user/login */
UserRoute.post("/login", login);

/** /user/getUserData */
UserRoute.get("/getUserData", loginAuth, getUserData);

/** /user/forgotPassword */
UserRoute.patch("/forgotPassword", forgotPassword);

/** /user/verifyForgotPasswordOtp */
UserRoute.post("/verifyForgotPasswordOtp", verifyForgotPasswordOtp);

/** /user/resetPassword */
UserRoute.patch("/resetPassword", resetPassword);

/** /user/changePassword */
UserRoute.patch("/changePassword", loginAuth, changePassword);

/** /user/updateProfile */
UserRoute.patch(
  "/updateProfile",
  loginAuth,
  upload.single("AvatarUrl"),
  updateProfile
);

/** /user/socialLogin */
UserRoute.post("/socialLogin", upload.single("AvatarUrl"), socialLogin);

module.exports = UserRoute;
