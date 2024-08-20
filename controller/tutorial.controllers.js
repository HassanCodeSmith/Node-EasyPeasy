const { EasyPeasyIdentityDB } = require("../config/db.config");
const { Tutorial } = require("../models/tutorial.model");
const { trimObjects } = require("../utils/trimObjects.util");

/**
 * Create Tutorials
 */
exports.createTutorial = async (req, res) => {
  try {
    trimObjects(req.body);
    const { userId } = req.user;
    const { Title, Description } = req.body;

    if (!(Title && Description)) {
      return res.status(400).json({
        success: true,
        message: "Tutorial title, description must be provided",
      });
    }

    if (req.files) {
      let Files = [];
      Files = req.files.map((file) => "/" + file.path.replace(/\\/g, "/"));
      req.body.Files = Files;
    }

    req.body.CreatedBy = userId;

    await Tutorial.create(req.body);

    return res.status(200).json({
      success: true,
      message: "Tutorial created successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while creating tutorial",
    });
  }
};

/**
 * Get All Tutorials
 */
exports.getAllTutorials = async (req, res) => {
  try {
    let userId;
    if (req?.user) {
      userId = req.user.userId;
    }
    const { page } = req.query;

    const limit = 16;
    const skip = (page - 1) * limit;

    const query = {
      PermanentDeleted: false,
      $or: [{ Status: "new" }, { Status: "" }],
    };

    if (userId) {
      query.$or.push({ Status: "draft", CreatedBy: userId });
    }

    const allTutorials = await Tutorial.find(query)
      .populate({
        path: "CreatedBy",
        select:
          "-isEmailVarified -password -setNewPwd -forgotPasswordOtp -forgotPasswordOtpExpire -resetPasswordToken -resetPasswordTokenExpire -permanentDeleted",
        model: EasyPeasyIdentityDB.model("User"),
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (allTutorials.length === 0) {
      console.log("==> Tutorials collection is empty");
      return res.status(200).json({
        success: true,
        message: "Tutorials collection is empty",
        pagination: {
          page,
          limit,
          total: await Tutorial.countDocuments(query),
        },
        data: [],
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "Tutorials collection fetched successfully",
        pagination: {
          page,
          limit,
          total: await Tutorial.countDocuments(query),
        },
        data: allTutorials,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting all tutorials",
    });
  }
};

/**
 * Get Tutorial By Id
 */
exports.getTutorialById = async (req, res) => {
  try {
    const { userId } = req.user;
    const { tutorialId } = req.params;

    const tutorial = await Tutorial.findOne({
      _id: tutorialId,
      PermanentDeleted: false,
      $or: [
        { Status: { $eq: "new" } },
        { Status: { $eq: "" } },
        { Status: { $eq: "draft" }, CreatedBy: userId },
      ],
    }).populate(
      "CreatedBy",
      "-isEmailVarified -password -setNewPwd -forgotPasswordOtp -forgotPasswordOtpExpire -resetPasswordToken -resetPasswordTokenExpire -permanentDeleted"
    );

    if (!tutorial) {
      console.log("==> Tutorial not found may be tutorial id is wrong");
      return res.status(404).json({
        success: false,
        message: "Tutorial not found",
        data: {},
      });
    }

    return res.status(200).json({
      success: true,
      message: "Tutorial found successfully",
      data: tutorial,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting tutorial",
    });
  }
};

/**
 * Delete Tutorial By Id
 */
exports.deleteTutorial = async (req, res) => {
  try {
    const { userId } = req.user;
    const { tutorialId } = req.params;

    const tutorial = await Tutorial.findOne({
      _id: tutorialId,
    });

    if (!tutorial) {
      console.error(
        "==> Tutorial not found may be tutorial id is wrong aur you are unauthorized person"
      );
      return res.status(404).json({
        success: false,
        message: "Invalid tutorial id",
        data: {},
      });
    }

    if (tutorial.PermanentDeleted) {
      console.error("Tutorial already deleted");
      return res.status(400).json({
        success: false,
        message: "Tutorial already deleted",
      });
    }

    tutorial.PermanentDeleted = true;
    await tutorial.save();

    console.error("Tutorial deleted successfully");
    return res.status(200).json({
      success: true,
      message: "Tutorial deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting tutorial",
    });
  }
};

/**
 * Update Tutorial
 */
exports.updateTutorial = async (req, res) => {
  try {
    const { userId } = req.user;
    const { tutorialId } = req.params;

    const tutorial = await Tutorial.findOne({
      _id: tutorialId,
      CreatedBy: userId,
      PermanentDeleted: false,
    });

    if (!tutorial) {
      console.log(
        "==> Tutorial not found may be tutorial id is wrong and tutorial is already deleted and you are unauthrized person"
      );
      return res.status(404).json({
        success: false,
        message: "Tutorial not found",
        data: {},
      });
    }

    if (req?.body?.Title) {
      tutorial.Title = req.body.Title;
    }

    if (req?.body?.Description) {
      tutorial.Description = req.body.Description;
    }

    if (req?.body?.Status) {
      tutorial.Status = req.body.Status;
    }

    console.log("Before Update: ", tutorial);

    if (req?.files.length !== 0) {
      let Files = [];
      Files = req.files.map((file) => "/" + file.path.replace(/\\/g, "/"));
      tutorial.Files = Files;
    }

    console.log("After Update: ", tutorial);

    await tutorial.save();

    console.log("updated tutorialllllllllllllll: ", tutorial);

    return res.status(200).json({
      success: true,
      message: "Tutorial updated successfully",
      data: tutorial,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting tutorial",
    });
  }
};

/**
 * Search By Title
 */
exports.searchTutorialByTitle = async (req, res) => {
  try {
    const { Title, page } = req.query;

    const limit = 16;
    const skip = (page - 1) * limit;

    const searchedDocuments = await Tutorial.find({
      Title: { $regex: new RegExp(Title, "i") },
      PermanentDeleted: false,
    })
      .skip(skip)
      .limit(limit);
    console.log(searchedDocuments.length);
    if (searchedDocuments.length === 0) {
      console.log("==> There is no any Content for provided title");
      return res.status(200).json({
        success: true,
        message: "There is no any Content for provided title",
        pagination: {
          page,
          limit,
          total: await Tutorial.countDocuments({
            PermanentDeleted: false,
            Title: { $regex: new RegExp(Title, "i") },
          }),
          // total: searchedDocuments.length,
        },
        data: searchedDocuments,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Data fetched according to provided title",
      pagination: {
        page,
        limit,
        total: await Tutorial.countDocuments({
          PermanentDeleted: false,
          Title: { $regex: new RegExp(Title, "i") },
        }),
        // total: searchedDocuments.length,
      },
      data: searchedDocuments,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while search question by title",
    });
  }
};
