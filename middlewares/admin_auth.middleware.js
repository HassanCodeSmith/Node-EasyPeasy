const User = require("../models/user.model");

const adminAuth = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const user = await User.findById(userId);

    if (user.Role === "admin") {
      req.role = user.Role;
      next();
      return;
    }

    return res
      .statue(400)
      .json({ success: false, message: "Admin Auth - Authentication Invalid" });
  } catch (error) {
    return res
      .status(400)
      .json({ status: false, message: "Admin Auth - Authentication Invalid" });
  }
};

module.exports = adminAuth;
