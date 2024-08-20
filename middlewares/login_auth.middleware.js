const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return res
        .status(400)
        .json({ status: false, message: "Token must be provided" });
    }
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Token not found" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({ _id: payload.userId }).select(
      "-password"
    );

    if (user?.PermanentDeleted) {
      return res.status(400).json({
        success: false,
        message: "User is permanent deleted",
      });
    }

    req.userRole = user?.Role;
    req.user = { userId: payload.userId };
    next();
  } catch (error) {
    console.log("Error in loginAuth: ", error);
    return res
      .status(500)
      .json({ status: false, message: "Authentication Invalid......" });
  }
};

module.exports = auth;
