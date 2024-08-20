/** __________ Models __________ */
const User = require("../models/user.model");
const SignUpOTP = require("../models/signup_otp.model");
const { ForgotPasswordOTP } = require("../models/forgot_password_otp.model");

/** __________ Utils __________ */
const { sendEmail } = require("../utils/sendEmail.util");
const { validateEmail } = require("../utils/emailValidator.util");
const { trimObjects } = require("../utils/trimObjects.util");

/** __________ Custom Modules _________ */
const bcrypt = require("bcrypt");

/**
 * User Sign Up
 */
exports.signUp = async (req, res) => {
  try {
    trimObjects(req.body);

    const { Name, UserName, Email, Password, ConfirmPassword } = req.body;

    if (!(Name && UserName && Email && Password && ConfirmPassword)) {
      console.error("Please enter all required fields.");
      return res.status(400).json({
        success: false,
        message: "Please enter all required fields.",
      });
    }

    if (!validateEmail(req.body.Email)) {
      console.error("Email format is incorrect.");
      return res.status(400).json({
        success: false,
        message: "Email format is incorrect.",
      });
    }

    const findUser = await User.findOne({ Email: req.body.Email });

    if (findUser) {
      console.error("Email already taken.");
      return res.status(400).json({
        success: false,
        message: "Email already taken.",
      });
    }

    if (Password !== ConfirmPassword) {
      console.error("Password and ConfirmPassword are Not Matched.");
      return res.status(400).json({
        success: false,
        message: "Password and ConfirmPassword are Not Matched.",
      });
    }

    const newUser = await User.create({
      Name,
      UserName,
      Email,
      PasswordHash: Password,
    });

    const sign_up_otp = (
      Math.floor(Math.random() * 899999) + 100000
    ).toString();
    console.log("SignUp OTP: ", sign_up_otp);

    await SignUpOTP.create({
      Email,
      HashedOTP: sign_up_otp,
    });

    const mail = {
      email: Email,
      subject: "Please check your email to verify your email address",
      html: `<p>Dear User,</p>
        <p>Your One-Time password (otp) is <strong>${sign_up_otp}</strong>.</p>
        <p>Please use this otp to complete your email verification process.</p>
        <p>Thank you,</p>`,
    };

    sendEmail(mail);

    const token = await newUser.createJWT();

    return res.status(200).json({
      success: true,
      message: "Email verification otp has been sent, Please check your email",
      OTPFor: "SignUp",
      access_token: token,
      data: {
        Name,
        UserName,
        Email,
      },
    });
  } catch (error) {
    console.error("SignUp Error: :", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while signup",
    });
  }
};

/**
 * Verify Sign Up otp
 */
exports.verifySignUpOtp = async (req, res) => {
  try {
    const { Email, OTP } = req.body;
    const user = await User.findOne({ Email });

    if (!user) {
      console.error("User not found with provided email.");
      return res.status(404).json({
        success: false,
        message: "User not found with provided email.",
      });
    }

    if (user.EmailConfirmed) {
      console.log("Your email already verified.");
      return res.status(200).json({
        success: true,
        message: "Your email already verified.",
      });
    }

    const otpDetails = await SignUpOTP.findOne({ Email });

    if (!otpDetails) {
      console.error("OTP has been expired.");
      return res.status(404).json({
        success: false,
        message: "OTP has been expired.",
      });
    }

    const isValidOTP = await otpDetails.compareOtp(OTP);

    if (!isValidOTP) {
      console.error("Invalid OTP");
      return res.status(404).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    await SignUpOTP.findOneAndDelete({ Email });

    user.EmailConfirmed = true;
    await user.save();

    console.log("Email verified successfully");
    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Error in sign up otp verification: ", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while verifying sign up OTP",
    });
  }
};

/**
 * Resend Sighn Up otp
 */
exports.resendSignUpOTP = async (req, res) => {
  try {
    const { Email } = req.body;
    await SignUpOTP.findOneAndDelete({ Email });

    const sign_up_otp = (
      Math.floor(Math.random() * 899999) + 100000
    ).toString();
    console.log("SignUp OTP: ", sign_up_otp);

    await SignUpOTP.create({
      Email,
      HashedOTP: sign_up_otp,
    });

    const mail = {
      email: Email,
      subject: "Please check your email to verify your email",
      html: `<p>Dear User,</p>
        <p>Your One-Time password (OTP) is <strong>${sign_up_otp}</strong>.</p>
        <p>Please use this OTP to complete your email verification process.</p>
        <p>Thank you,</p>`,
    };
    sendEmail(mail);

    return res.status(200).json({
      success: true,
      message: "OTP has been sent to your email",
    });
  } catch (error) {
    console.error("Error in resend sign up OTP: ", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while resend email varification OTP",
    });
  }
};

/**
 * User Login
 */
exports.login = async (req, res) => {
  try {
    const { Email, Password } = req.body;

    if (!Email || !Password) {
      console.error("Please enter required fields.");
      return res.status(400).json({
        success: false,
        message: "Please enter required fields.",
      });
    }

    if (!validateEmail(Email)) {
      console.error("Email format is incorrect.");
      return res.status(400).json({
        success: false,
        message: "Email format is incorrect.",
      });
    }

    const user = await User.findOne({ Email });

    if (!user) {
      console.error("User not found.");
      return res.status(400).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!user.EmailConfirmed) {
      await SignUpOTP.findOneAndDelete({ Email });

      const sign_up_otp = (
        Math.floor(Math.random() * 899999) + 100000
      ).toString();
      console.log("SignUp OTP:", sign_up_otp);

      await SignUpOTP.create({
        Email,
        HashedOTP: sign_up_otp,
      });

      const mail = {
        email: Email,
        subject: "Please check your email to verify your email",
        html: `<p>Dear User,</p>
        <p>Your One-Time password (OTP) is <strong>${sign_up_otp}</strong>.</p>
        <p>Please use this OTP to complete your email verification process.</p>
        <p>Thank you,</p>`,
      };
      sendEmail(mail);

      console.log(
        "Your email is not varified - OTP has been sent to your email address"
      );
      return res.status(200).json({
        success: true,
        OTPFor: "SignUp",
        message:
          "Your email is not varified - OTP has been sent to your email address",
      });
    }

    if (user.PasswordHash === "") {
      console.error("Please reset your password.");
      return res.status(400).json({
        success: false,
        message: "Please reset your password.",
      });
    }

    const isPassword = await user.comparePassword(Password);
    if (!isPassword) {
      console.log("password is Not Correct");
      return res
        .status(400)
        .json({ success: false, message: "password is Not Correct" });
    }

    const token = await user.createJWT();

    return res.status(200).json({
      success: true,
      message: "Login successfully",
      access_token: token,
      data: {
        _id: user.id,
        Name: user.Name,
        Role: user.Role,
      },
    });
  } catch (error) {
    console.log("Login error: ", error);
    return res
      .status(400)
      .json({ success: false, message: "An error occurred while login" });
  }
};

/**
 * Get User Data
 */
exports.getUserData = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findOne({
      _id: userId,
      PermanentDeleted: false,
    }).select("-PasswordHash");

    if (!user) {
      console.error("User not found.");
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user && user.AvatarUrl) {
      user.AvatarUrl = user.AvatarUrl.replace(/\\/g, "/");
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log("Error in getUserData", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting user data",
    });
  }
};

/**
 * Forgot password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { Email } = req.body;
    const user = await User.findOne({ Email });

    if (!user) {
      console.error("No User found with email address");
      return res
        .status(400)
        .json({ success: false, message: "No User found with email address" });
    }

    await User.findOneAndUpdate(
      { Email },
      { $set: { PasswordHash: "", ForgotPasswordStatus: false } },
      { upsert: true }
    );

    await ForgotPasswordOTP.findOneAndDelete({ Email });

    const forgotPasswordOtp = (
      Math.floor(Math.random() * 899999) + 100000
    ).toString();

    // remove log
    console.log("Forgot Password OTP: ", forgotPasswordOtp);

    await ForgotPasswordOTP.create({ Email, HashedOTP: forgotPasswordOtp });

    const mail = {
      email: Email,
      subject: "Please check your email to forgot your password",
      html: `<p>Dear User,</p>
        <p>Your One-Time password (OTP) is <strong>${forgotPasswordOtp}</strong>.</p>
        <p>Please use this OTP to complete your authentication process.</p>
        <p>Thank you,</p>`,
    };

    sendEmail(mail);

    return res.status(200).json({
      success: true,
      OTPFor: "Reset",
      message: "OTP Has been sent your email",
    });
  } catch (error) {
    console.error("Error in forgot password", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while forget passwrod",
    });
  }
};

/**
 * Verify Forgot password otp
 */
exports.verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { Email, OTP } = req.body;
    const user = await User.findOne({ Email });

    if (!user) {
      console.error("User not found with provided email.");
      return res.status(404).json({
        success: false,
        message: "User not found with provided email.",
      });
    }

    const isUserRequestedForForgotPassword = await User.findOne({
      Email,
      ForgotPasswordStatus: { $exists: true, $eq: false },
    });

    if (!isUserRequestedForForgotPassword) {
      console.error("Please first request for forgot password.");
      return res.status(400).json({
        success: false,
        message: "Please first request for forgot password.",
      });
    }

    const otpDetails = await ForgotPasswordOTP.findOne({ Email });

    if (!otpDetails) {
      console.error("OTP has been expired.");
      return res.status(404).json({
        success: false,
        message: "OTP has been expired.",
      });
    }

    const isValidOTP = await otpDetails.compareOtp(OTP);

    if (!isValidOTP) {
      console.error("Invalid OTP");
      return res.status(404).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    await User.findOneAndUpdate(
      {
        Email,
      },
      { $set: { ForgotPasswordStatus: true } }
    );

    await ForgotPasswordOTP.findOneAndDelete({ Email });

    console.log("Forgot password OTP verified successfully");
    return res.status(200).json({
      success: true,
      message: "Forgot password OTP verified successfully",
    });
  } catch (error) {
    console.error("Error in forgot password otp verification: ", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while verifying forgot password OTP",
    });
  }
};

/**
 * Reset password
 */
exports.resetPassword = async (req, res) => {
  try {
    let { Email } = req.body;

    Email = Email.toLowerCase();
    const oldUser = await User.findOne({ Email });
    if (!oldUser.ForgotPasswordStatus) {
      console.error("Please first verify your forgot password otp");
      return res.status(400).json({
        success: false,
        message: "Please first verify your forgot password otp",
      });
    }

    let { Password, ConfirmPassword } = req.body;

    if (Password !== ConfirmPassword) {
      console.error("Password don't match");
      return res
        .status(400)
        .json({ success: false, message: "Password don't match" });
    }

    const salt = await bcrypt.genSalt(10);
    const PasswordHash = await bcrypt.hash(Password, salt);

    await User.findOneAndUpdate(
      { Email },
      { PasswordHash, $unset: { ForgotPasswordStatus: false } }
    );

    return res
      .status(200)
      .json({ success: true, message: "New password successfully updated" });
  } catch (error) {
    console.log("Error in reset password: ", error);

    return res.status(500).json({
      success: false,
      message: "An error occurred while reset password",
    });
  }
};

/**
 * Change password
 */
exports.changePassword = async (req, res) => {
  try {
    trimObjects(req.body);

    const { userId } = req.user;

    const { OldPassword, NewPassword, ConfirmPassword } = req.body;

    if (NewPassword !== ConfirmPassword) {
      console.error("Password is Not Matched");
      return res.status(400).json({
        success: false,
        message: "Password is Not Matched",
      });
    }

    const user = await User.findById(userId);

    const isValid = await user.comparePassword(OldPassword);

    if (!isValid) {
      console.error("Old password is incorrect");
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const PasswordHash = await bcrypt.hash(NewPassword, salt);

    await User.findOneAndUpdate(
      { _id: userId },
      {
        PasswordHash,
      }
    );
    return res.status(200).json({
      success: true,
      message: "Your password has been updated successfully",
    });
  } catch (error) {
    console.log("Error in changePassword", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while change password",
    });
  }
};

/**
 * Update Profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { userId } = req.user;

    trimObjects(req.body);

    const user = await User.findOne({ _id: userId, PermanentDeleted: false });

    if (req.body.Name) {
      user.Name = req.body.Name;
    }

    if (req.body.UserName) {
      user.UserName = req.body.UserName;
    }

    if (req.body.Email) {
      user.Email = req.body.Email;
    }

    if (req.file) {
      const AvatarUrl = "/" + req.file.path;
      user.AvatarUrl = AvatarUrl;
    }

    await user.save();

    console.log("userrrrrrrrrrrrrr: ", user);

    return res.status(201).json({
      success: "success",
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.log("Error in updateProfile: ", error);
    return res.status(500).json({
      success: false,
      message:
        "Error occurred while updating the profile. Please try again later.",
    });
  }
};

/**
 * Social Login
 */
exports.socialLogin = async (req, res) => {
  try {
    const { Email } = req.body;

    const user = await User.findOne({ Email });

    if (user?.PermanentDeleted) {
      console.error("User permanently deleted.");
      return res.status(400).json({
        success: false,
        message: "User permanently deleted.",
      });
    }

    if (user?.PermanentDeleted === false) {
      const token = await user.createJWT();

      return res.status(200).json({
        success: true,
        message: "Login successfully",
        access_token: token,
        data: {
          _id: user.id,
          Name: user.Name,
          Role: user.Role,
        },
      });
    }

    if (req.file) {
      req.body.AvatarUrl = req.file.path;
    }

    req.body.UserName = Email?.slice(0, Email.indexOf("@")).replace(
      /[._\W]/g,
      ""
    );

    req.body.EmailConfirmed = true;

    const newUser = await User.create(req.body);

    const token = await newUser.createJWT();

    return res.status(200).json({
      success: true,
      message: "Login successfully",
      access_token: token,
      data: {
        _id: newUser.id,
        Name: newUser.Name,
        Role: newUser.Role,
      },
    });
  } catch (error) {
    console.log("Error in socialLogin: ", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while social login",
    });
  }
};

////Admin////////////////////////////

// exports.adminLogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password) {
//       return res
//         .status(403)
//         .json({ success: false, message: "email or password cannot be empty" });
//     }

//     if (!validateEmail(email)) {
//       return res.status(400).json({
//         success: false,
//         message: "Please enter a valid email address",
//       });
//     }

//     const find = await User.findOne({ email });
//     if (!find) {
//       return res
//         .status(404)
//         .json({ success: false, message: "email address not found" });
//     }
//     const isPassword = await find.comparePassword(password);
//     if (!isPassword) {
//       return res
//         .status(400)
//         .json({ success: false, message: "password is incorrect" });
//     }

//     const token = await find.createJWT();
//     return res.status(200).json({
//       success: true,
//       access_token: token,
//       data: {
//         firstName: find.firstName,
//         lastName: find.lastName,
//         _id: find.id,
//         role: find.role,
//       },
//     });
//   } catch (error) {}
// };

// exports.adminSignUp = async (req, res) => {
//   try {
//     const find = await User.findOne({ email: req.body.email });
//     if (find) {
//       return res.status(400).json({
//         error: "email already exists",
//       });
//     }
//     if (!req.body.password) {
//       return res.status(400).json({
//         success: false,
//         message: "password is required",
//       });
//     }
//     if (!validateEmail(req.body.email)) {
//       return res.status(400).json({
//         success: false,
//         message: "email is not valid",
//       });
//     }
//     const { firstName, lastName, email } = req.body;
//     const user = await User.create({ ...req.body });
//     return res.status(200).json({
//       //   access_token: token,
//       success: "success",
//       message: "Successfully signed up",
//       data: {
//         firstName,
//         lastName,
//         email,
//       },
//     });
//   } catch (error) {
//     return res.status(400).json({ success: false, message: error.message });
//   }
// };
