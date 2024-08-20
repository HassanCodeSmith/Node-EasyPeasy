const CommunityWorkSheet = require("../models/community_work_sheet.model");
const User = require("../models/user.model");
const FavoriteWorkSheet = require("../models/favourite_work_sheet.model");
const Post = require("../models/post.model");

const path = require("path");
const fs = require("fs");
const { promisify } = require("util");
const { trimObjects } = require("../utils/trimObjects.util");
const writeFileAsync = promisify(fs.writeFile);

/**
 * Create Community Work Sheet
 */
exports.createCommunityWorkSheet = async (req, res) => {
  try {
    trimObjects(req.body);
    const { userId } = req.user;

    const {
      Title,
      Subject,
      Language,
      Description,
      Content,
      Age,
      Grade,
      Privacy,
    } = req.body;

    const requiredFields = [
      "Title",
      "Subject",
      "Language",
      "Description",
      "Content",
      "Age",
      "Grade",
      "Privacy",
    ];

    const missingFields = [];

    for (let field of requiredFields) {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      const missingFieldsMessage = `Please fill required missing fields ${missingFields.join(
        ", "
      )}`;

      return res.status(400).json({
        success: false,
        error: missingFieldsMessage,
      });
    }

    if (req.body.PictureUri) {
      const base64Data = req.body.PictureUri.replace(
        /^data:image\/\w+;base64,/,
        ""
      );
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `${Date.now()}-${Math.floor(
        Math.random() * 100000
      )}.webp`;
      const filePath = path.join(__dirname, "..", "uploads/images", fileName);

      await writeFileAsync(filePath, buffer);

      const PictureUri = `/uploads/images/${fileName}`;

      await CommunityWorkSheet.create({
        Title,
        Subject,
        Language,
        Description,
        Content,
        Age,
        Grade,
        Privacy,
        PictureUri,
        CreatedBy: userId,
      });
    } else {
      await CommunityWorkSheet.create({
        Title,
        Subject,
        Language,
        Description,
        Content,
        Age,
        Grade,
        Privacy,
        CreatedBy: userId,
      });
    }

    await User.findOneAndUpdate(
      { _id: userId },
      { $inc: { CreatedSheets: 1 } }
    );

    return res.status(200).json({
      success: true,
      message: "Community work sheet created successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: "An Error occurred while creating Community worksheet",
    });
  }
};

/**
 * Get All Community Work Sheets
 */
exports.getAllCommunityWorkSheets = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { page } = req.query;
    const limit = 16;
    const skip = (page - 1) * limit;

    const myWorkSheets = await CommunityWorkSheet.find({
      CreatedBy: userId,
      PermanentDeleted: false,
    })
      .select("-Content")
      .skip(skip)
      .limit(limit);
    if (!myWorkSheets) {
      return res.status(404).json({
        success: false,
        message: "Your work sheet collection is empty",
      });
    }

    const myFavoriteWorkSheets = await FavoriteWorkSheet.findOne({
      CreatedBy: userId,
    });

    const data = myWorkSheets.map((worksheet) => ({
      ...worksheet.toObject(),
      IsFavorite:
        myFavoriteWorkSheets &&
        myFavoriteWorkSheets.CommunityWorkSheetIds.includes(
          worksheet._id.toString()
        ),
    }));
    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: await CommunityWorkSheet.countDocuments({
          CreatedBy: userId,
          PermanentDeleted: false,
        }),
      },
    });
  } catch (error) {
    console.error("Error in getAllCommunityWorkSheets:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: "An error occurred while getting community worksheets",
    });
  }
};

/**
 * Get Local Sheet By Id
 */
exports.getCommunitySheet = async (req, res) => {
  try {
    let userId;
    if (req?.user) {
      userId = req.user.userId;
    }
    const { id } = req.params;
    const sheet = await CommunityWorkSheet.findById(id).select("-PictureUri");

    const myFavoriteWorkSheets = await FavoriteWorkSheet.findOne({
      CreatedBy: userId,
    });
    let data = {};
    if (
      myFavoriteWorkSheets &&
      myFavoriteWorkSheets.CommunityWorkSheetIds.includes(sheet._id)
    ) {
      data = {
        ...sheet.toObject(),
        IsFavorite: true,
      };
    } else {
      data = {
        ...sheet.toObject(),
      };
    }
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.log("Error in getCommunitySheet: ", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting community worksheet",
    });
  }
};

/**
 * Update Community Work Sheet
 */
exports.updateCommunityWorkSheet = async (req, res) => {
  try {
    trimObjects(req.body);
    const { userId } = req.user;
    const { id } = req.params;
    console.log("ping pong", userId);

    const user = await User.findOne({ _id: userId, PermanentDeleted: false });
    if (!user) {
      console.log("==> Invalid user id");
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const workSheet = await CommunityWorkSheet.findOne({
      _id: id,
      CreatedBy: userId,
      PermanentDeleted: false,
    });

    if (!workSheet) {
      console.log("==> Invalid worksheet id");
      return res.status(400).json({
        success: false,
        message: "Invalid worksheet id",
      });
    }

    if (req?.body?.Title) {
      workSheet.Title = req.body.Title;
    }

    if (req?.body?.Subject) {
      workSheet.Subject = req.body.Subject;
    }

    if (req?.body?.Language) {
      workSheet.Language = req.body.Language;
    }

    if (req?.body?.Description) {
      workSheet.Description = req.body.Description;
    }

    if (req?.body?.Content) {
      workSheet.Content = req.body.Content;
    }

    if (req?.body?.Age) {
      workSheet.Age = req.body.Age;
    }

    if (req?.body?.Grade) {
      workSheet.Grade = req.body.Grade;
    }

    if (req?.body?.Privacy) {
      workSheet.Privacy = req.body.Privacy;
    }

    if (req?.body?.PictureUri) {
      const base64Data = req.body.PictureUri.replace(
        /^data:image\/\w+;base64,/,
        ""
      );
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `${Date.now()}-${Math.floor(
        Math.random() * 100000
      )}.png`;
      const filePath = path.join(__dirname, "..", "uploads/images", fileName);

      await writeFileAsync(filePath, buffer);

      const PictureUri = `/uploads/images/${fileName}`;
      workSheet.PictureUri = PictureUri;
    }

    await workSheet.save();

    console.log("==> Updated Local Work Sheet__:", workSheet);
    return res.status(200).json({
      success: true,
      message: "Local work sheet updated successfully.",
      data: workSheet,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating local worksheet",
    });
  }
};

/**
 * Delete Local Work Sheet
 */
exports.deleteCommunityWorkSheet = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const localWorkSheet = await CommunityWorkSheet.findOne({
      _id: id,
      CreatedBy: userId,
    });

    if (!localWorkSheet) {
      return res.status(400).json({
        success: false,
        message: "Invalid user or community worksheet id",
      });
    }

    if (localWorkSheet.PermanentDeleted) {
      return res.status(200).json({
        success: true,
        message: "Community worksheet already deleted",
      });
    }

    localWorkSheet.PermanentDeleted = true;
    await localWorkSheet.save();

    return res.status(200).json({
      success: true,
      message: "Community worksheet deleted",
    });
  } catch (error) {
    console.log("deleteLocalWorkSheet error: ", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleteing community worksheet",
    });
  }
};

/**
 * Search  by Title
 */
exports.searchTitle = async (req, res) => {
  try {
    const { userId } = req.user;
    const { Title, page } = req.query;

    const limit = 16;
    const skip = (page - 1) * limit;

    const searchedDocuments = await CommunityWorkSheet.find({
      $and: [
        { CreatedBy: userId },
        { PermanentDeleted: false },
        { Title: { $regex: new RegExp(Title, "i") } },
      ],
    })
      .select("-Content")
      .skip(skip)
      .limit(limit);

    if (searchedDocuments.length === 0) {
      console.log("==> There is no any Content for provided title");
      return res.status(200).json({
        success: true,
        message: "There is no any Content for provided title",
        pagination: {
          page,
          limit,
          total: await CommunityWorkSheet.countDocuments({
            $and: [
              { PermanentDeleted: false },
              { Title: { $regex: new RegExp(Title, "i") } },
            ],
          }),
        },
        data: searchedDocuments,
      });
    }

    const myFavoriteWorkSheets = await FavoriteWorkSheet.findOne({
      CreatedBy: userId,
    });

    const data = searchedDocuments.map((worksheet) => ({
      ...worksheet.toObject(),
      IsFavorite:
        myFavoriteWorkSheets &&
        myFavoriteWorkSheets.CommunityWorkSheetIds.includes(
          worksheet._id.toString()
        ),
    }));

    return res.status(200).json({
      success: true,
      message: "Data fetched according to provided title",
      pagination: {
        page,
        limit,
        total: await CommunityWorkSheet.countDocuments({
          $and: [
            { PermanentDeleted: false },
            { Title: { $regex: new RegExp(Title, "i") } },
          ],
        }),
      },
      data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while searching by title",
    });
  }
};

/**
 *  Advance Search
 */
exports.advanceSearch = async (req, res) => {
  try {
    const { userId } = req.user;
    const { Title, Subject, Language, Description, Age, Grade } = req.body;
    const { page } = req.query;

    const limit = 16;
    const skip = (page - 1) * 15;

    const query = {};

    if (Title) {
      query.Title = { $regex: new RegExp(Title, "i") };
    }
    if (Subject) {
      query.Subject = { $regex: new RegExp(Subject, "i") };
    }
    if (Language) {
      query.Language = { $regex: new RegExp(Language, "i") };
    }
    if (Description) {
      query.Description = { $regex: new RegExp(Description, "i") };
    }
    if (Age) {
      query.Age = Age;
    }
    if (Grade) {
      query.Grade = Grade;
    }

    const searchedDocuments = await CommunityWorkSheet.find({
      $and: [
        { CreatedBy: userId },
        { PermanentDeleted: false },
        { Title: { $regex: new RegExp(Title, "i") } },
      ],
      ...query,
    })
      .select("-Content")
      .skip(skip)
      .limit(limit);

    if (searchedDocuments.length === 0) {
      console.log("No Content found for the provided criteria.");
      return res.status(200).json({
        success: true,
        message: "No Content found for the provided criteria.",
        pagination: {
          page,
          limit,
          total: searchedDocuments.length,
        },
        data: [],
      });
    }

    const myFavoriteWorkSheets = await FavoriteWorkSheet.findOne({
      CreatedBy: userId,
    });

    const data = searchedDocuments.map((worksheet) => ({
      ...worksheet.toObject(),
      IsFavorite:
        myFavoriteWorkSheets &&
        myFavoriteWorkSheets?.CommunityWorkSheetIds.includes(
          worksheet._id.toString()
        ),
    }));

    return res.status(200).json({
      success: true,
      message: "Data fetched according to the provided criteria.",
      pagination: {
        page,
        limit,
        total: data.length,
      },
      data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while performing the search.",
    });
  }
};

/**
 * Related Community Work Sheets
 */
exports.relatedCommunityWorkSheets = async (req, res) => {
  try {
    trimObjects(req.body);
    const { workSheetId } = req.params;

    const workSheet = await CommunityWorkSheet.findOne({
      _id: workSheetId,
      PermanentDeleted: false,
    }).select("-Content");

    if (!workSheet) {
      console.log("==> Invalid worksheet id");
      return res.status(404).json({
        success: false,
        message: "Invalid worksheet id",
      });
    }

    const Grade = workSheet.Grade;

    const relatedWorkSheets = await CommunityWorkSheet.find({
      PermanentDeleted: false,
      Grade,
      _id: { $ne: workSheet._id },
    })
      .select("-Content")
      .limit(5);

    if (relatedWorkSheets.length === 0) {
      return res.status(200).json({
        success: true,
        message: "There is no related worksheet for that particular worksheet",
        data: relatedWorkSheets,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Related worksheet fetched successfully",
      data: relatedWorkSheets,
    });
  } catch (error) {
    console.log("Error in relatedCommunityWorkSheets: ", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting related community worksheets",
    });
  }
};

/**
 * IncreaseViews
 */
exports.increaseViews = async (req, res) => {
  try {
    const { sheetType, sheetId } = req.body;

    if (!(sheetType && sheetId)) {
      console.error("Sheet Type and Sheet Id are required.");
      return res.status(404).json({
        success: false,
        message: "Sheet type and sheet id are required.",
      });
    }

    const validSheetType = ["Community", "Interactive"];

    if (!validSheetType.includes(sheetType)) {
      console.error(
        `${sheetType} is a invalid sheet type - The valid sheet types are ${validSheetType[0]} and ${validSheetType[1]}`
      );

      return res.status(400).json({
        success: false,
        message: `${validSheetType} is a invalid sheet type - The valid sheet types are ${validSheetType[0]} and ${validSheetType[1]}`,
      });
    }

    if (sheetType === "Community") {
      const sheet = await CommunityWorkSheet.findOne({ _id: sheetId });

      if (!sheet) {
        console.error(`${sheetId} is invalid community sheet id`);
        return res.status(400).json({
          success: false,
          messge: "Invalid sheet id",
        });
      }

      if (sheet.PermanentDeleted) {
        console.error("Sheet permanently deleted");
        return res.status(400).json({
          success: false,
          message: "Invalid sheet id - sheet permanently deleted.",
        });
      }

      sheet.TotalViews += 1;
      await sheet.save();

      return res.status(200).json({
        success: true,
        message: "Sheet views increased.",
      });
    }
    if (sheetType === "Interactive") {
      const sheet = await Post.findOne({
        _id: sheetId,
        liveWorksheetAvailability: "Yes",
      });

      if (!sheet) {
        console.error(`${sheetId} is invalid community sheet id`);
        return res.status(400).json({
          success: false,
          messge: "Invalid sheet id",
        });
      }

      sheet.liveWorksheetTotalViews += 1;
      await sheet.save();

      return res.status(200).json({
        success: true,
        message: "Sheet views increased.",
      });
    }
  } catch (error) {
    console.error("Error in increaseViews: ", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while increasing views.",
    });
  }
};
