const User = require("../models/user.model");

exports.checkCreatedSheetsLimit = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const role = req.userRole;
    const user = await User.findOne({ _id: userId });
    if (user.CreatedSheets === 50 && role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "You already created 50 sheets.",
      });
    }
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while checking created sheets limit",
    });
  }
};
