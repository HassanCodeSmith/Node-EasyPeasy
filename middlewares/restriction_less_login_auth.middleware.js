const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

const restrictionLessLoginAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
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

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(payload.userId).select("-password");
      req.userRole = user?.Role;
      req.user = { userId: payload.userId };
      next();
    } catch (error) {
      next();
    }
  } else {
    next();
  }
};

module.exports = { restrictionLessLoginAuth };
