const FavoriteWorkSheet = require("../models/favourite_work_sheet.model");

const CommunityWorkSheets = require("../models/community_work_sheet.model");
const InteractiveWorkSheets = require("../models/post.model");

/**
 * Add To Favorite
 */
exports.addToFavorite = async (req, res) => {
  try {
    const { userId } = req.user;
    const role = req.userRole;
    const { worksheetId, worksheetType } = req.params;

    if (worksheetType === "Community") {
      const checkWorkSheet = await CommunityWorkSheets.findOne({
        _id: worksheetId,
      });

      if (!checkWorkSheet) {
        return res.status(404).json({
          success: false,
          message: "Community worksheet not found",
        });
      }

      const checkCommunityFavoriteWorkSheet = await FavoriteWorkSheet.findOne({
        CreatedBy: userId,
        CommunityWorkSheetIds: worksheetId,
      });

      if (checkCommunityFavoriteWorkSheet) {
        return res.status(409).json({
          success: false,
          message: "Community worksheet already exists in favorites",
        });
      }

      await FavoriteWorkSheet.findOneAndUpdate(
        {
          CreatedBy: userId,
        },
        { $push: { CommunityWorkSheetIds: worksheetId } },
        { upsert: true }
      );

      return res.status(201).json({
        success: true,
        message: "Communiy worksheet added to favorites",
      });
    }

    if (worksheetType === "Interactive") {
      const checkWorkSheet = await InteractiveWorkSheets.findOne({
        _id: worksheetId,
      });

      if (!checkWorkSheet) {
        return res.status(404).json({
          success: false,
          message: "Interactive worksheet not found",
        });
      }

      const checkInteractiveFavoriteWorkSheet = await FavoriteWorkSheet.findOne(
        {
          CreatedBy: userId,
          InteractiveWorkSheetIds: worksheetId,
        }
      );

      if (checkInteractiveFavoriteWorkSheet) {
        return res.status(409).json({
          success: false,
          message: "Interactive worksheet already exists in favorites",
        });
      }

      await FavoriteWorkSheet.findOneAndUpdate(
        {
          CreatedBy: userId,
        },
        { $push: { InteractiveWorkSheetIds: worksheetId } },
        { upsert: true }
      );

      return res.status(201).json({
        success: true,
        message: "Interactive worksheet added to favorites",
      });
    }
  } catch (error) {
    console.log("Error in addToFavorite: ", error);
    return res.status(500).json({
      success: true,
      message: "An error occurred while adding the sheet to favroites",
    });
  }
};

/**
 * Get All MyFavorites
 */
exports.getFavoriteWorkSheets = async (req, res) => {
  try {
    const { userId } = req.user;
    const { workSheetType, page } = req.query;

    const validWorkSheetTypes = ["All", "Community", "Interactive"];

    if (!validWorkSheetTypes.includes(workSheetType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Worksheet type",
      });
    }

    const limit = 16;
    const skip = (page - 1) * limit;

    let workSheets = null;
    let total = 0;

    if (workSheetType === "All") {
      workSheets = await FavoriteWorkSheet.findOne({ CreatedBy: userId })
        .populate({
          path: "CommunityWorkSheetIds",
          select: "-Content",
        })
        .populate({
          path: "InteractiveWorkSheetIds",
          select: "-liveWorksheetJson",
        });

      if (workSheets) {
        total =
          workSheets.CommunityWorkSheetIds.length +
          workSheets.InteractiveWorkSheetIds.length;
      }
    } else if (workSheetType === "Community") {
      workSheets = await FavoriteWorkSheet.findOne({ CreatedBy: userId })
        .populate({
          path: "CommunityWorkSheetIds",
          select: "-Content",
        })
        .select("-InteractiveWorkSheetIds");

      if (workSheets) {
        total = workSheets.CommunityWorkSheetIds.length;
      }
    } else if (workSheetType === "Interactive") {
      workSheets = await FavoriteWorkSheet.findOne({ CreatedBy: userId })
        .populate({
          path: "InteractiveWorkSheetIds",
          select: "-liveWorksheetJson",
        })
        .select("-CommunityWorkSheetIds");

      if (workSheets) {
        total = workSheets.InteractiveWorkSheetIds.length;
      }
    }

    if (!workSheets) {
      return res.status(200).json({
        success: true,
        message: "My favorite collection is empty",
        data: [],
      });
    }

    // Add IsFavorite property based on type
    let data = null;
    if (workSheetType === "All") {
      data = {
        CommunityWorkSheetIds: workSheets.CommunityWorkSheetIds.map(
          (worksheet) => ({
            ...worksheet.toObject(),
            IsFavorite: true,
          })
        ),
        InteractiveWorkSheetIds: workSheets.InteractiveWorkSheetIds.map(
          (worksheet) => ({
            ...worksheet.toObject(),
            IsFavorite: true,
          })
        ),
      };
    } else if (workSheetType === "Community") {
      data = {
        CommunityWorkSheetIds: workSheets.CommunityWorkSheetIds.map(
          (worksheet) => ({
            ...worksheet.toObject(),
            IsFavorite: true,
          })
        ),
      };
    } else if (workSheetType === "Interactive") {
      data = {
        InteractiveWorkSheetIds: workSheets.InteractiveWorkSheetIds.map(
          (worksheet) => ({
            ...worksheet.toObject(),
            IsFavorite: true,
          })
        ),
      };
    }

    return res.status(200).json({
      success: true,
      message: "My favorite collection fetched successfully",
      pagination: {
        page,
        limit,
        total,
      },
      data:
        workSheetType === "Interactive"
          ? data.InteractiveWorkSheetIds.slice(skip, skip + limit)
          : workSheetType === "Community"
          ? data.CommunityWorkSheetIds.slice(skip, skip + limit)
          : [
              ...data.CommunityWorkSheetIds,
              ...data.InteractiveWorkSheetIds,
            ].slice(skip, skip + limit),
    });
  } catch (error) {
    console.log("==> Error in getFavoriteWorkSheets: ", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting favorite worksheets",
    });
  }
};

/**
 * Remove Sheet From My Favorite
 */
exports.removeMyFavorite = async (req, res) => {
  try {
    const { userId } = req.user;
    const { workSheetId, workSheetType } = req.params;

    const validWorksheetTypes = ["Community", "Interactive"];

    if (!validWorksheetTypes.includes(workSheetType)) {
      return res.status(404).json({
        success: false,
        message: "Invalid Worksheet type",
      });
    }

    if (workSheetType === "Community") {
      const isValidWorkSheetId = await FavoriteWorkSheet.findOne({
        CreatedBy: userId,
        CommunityWorkSheetIds: workSheetId,
      });

      if (!isValidWorkSheetId) {
        return res.status(404).json({
          success: false,
          message: "Invalid community worksheet id",
        });
      }

      await FavoriteWorkSheet.findOneAndUpdate(
        { CreatedBy: userId, CommunityWorkSheetIds: workSheetId },
        {
          $pull: { CommunityWorkSheetIds: workSheetId },
        }
      );

      return res.status(201).json({
        success: true,
        message: "Community worksheet removed successfully",
      });
    } else {
      const isValidWorkSheetId = await FavoriteWorkSheet.findOne({
        CreatedBy: userId,
        InteractiveWorkSheetIds: workSheetId,
      });

      if (!isValidWorkSheetId) {
        return res.status(404).json({
          success: false,
          message: "Invalid interactive worksheet id",
        });
      }

      await FavoriteWorkSheet.findOneAndUpdate(
        { CreatedBy: userId, InteractiveWorkSheetIds: workSheetId },
        {
          $pull: { InteractiveWorkSheetIds: workSheetId },
        }
      );

      return res.status(201).json({
        success: true,
        message: "Interactive worksheet removed successfully",
      });
    }
  } catch (error) {
    console.log("An error occurred while removing sheet from my favorite");
    console.log("Error in removeMyFavorite: ", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while removing sheet from my favorite",
    });
  }
};

/**
 * Search by Title in My Favorite
 */
exports.titleSearch = async (req, res) => {
  try {
    const { userId } = req.user;
    const { Title, page, workSheetType } = req.query;

    const limit = 16;
    const skip = (page - 1) * limit;

    const searchedDocuments = await FavoriteWorkSheet.findOne({
      CreatedBy: userId,
    })
      .populate("CommunityWorkSheetIds", "-Content")
      .populate("InteractiveWorkSheetIds", "-Content");

    if (!searchedDocuments) {
      console.log("My favorite collection is empty");
      return res.status(200).json({
        success: true,
        message: "My favorite collection is empty",
        data: [],
      });
    }

    let resultentWorkSheets = [];
    const regex = new RegExp(Title, "i");
    if (workSheetType === "Community") {
      searchedDocuments.CommunityWorkSheetIds.forEach((worksheet) => {
        if (regex.test(worksheet.Title)) {
          resultentWorkSheets.push({
            ...worksheet.toObject(),
            IsFavorite: true,
          });
        }
      });
      return res.status(200).json({
        success: true,
        message: "Data fetched according to provided title",
        data: resultentWorkSheets.slice(skip, skip + limit),
        pagination: {
          page,
          limit,
          total: resultentWorkSheets.length,
        },
      });
    }
    if (workSheetType === "Interactive") {
      searchedDocuments.InteractiveWorkSheetIds.forEach((worksheet) => {
        if (regex.test(worksheet.Title)) {
          resultentWorkSheets.push({
            ...worksheet.toObject(),
            IsFavorite: true,
          });
        }
      });

      console.log("Resultent Work Sheets: ", resultentWorkSheets);
      return res.status(200).json({
        success: true,
        message: "Data fetched according to provided title",
        data: resultentWorkSheets.slice(skip, skip + limit),
        pagination: {
          page,
          limit,
          total: resultentWorkSheets.length,
        },
      });
    }

    searchedDocuments.CommunityWorkSheetIds.forEach((worksheet) => {
      if (regex.test(worksheet.Title)) {
        resultentWorkSheets.push({ ...worksheet.toObject(), IsFavorite: true });
      }
    });

    searchedDocuments.InteractiveWorkSheetIds.forEach((worksheet) => {
      if (regex.test(worksheet.Title)) {
        resultentWorkSheets.push({ ...worksheet.toObject(), IsFavorite: true });
      }
    });

    console.log("Resultent Work Sheets: ", resultentWorkSheets);
    return res.status(200).json({
      success: true,
      message: "Data fetched according to provided title",
      data: resultentWorkSheets.slice(skip, skip + limit),
      pagination: {
        page,
        limit,
        total: resultentWorkSheets.length,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while searching by title in my favorite",
    });
  }
};

/**
 * Advance Search on Title, Subject, Description, Language, Age, Grade
 */
exports.advanceSearch = async (req, res) => {
  try {
    const { userId } = req.user;
    const { Title, Subject, Language, Description, Age, Grade } = req.body;
    const { page, Type } = req.query;

    const limit = 16;
    const skip = (page - 1) * limit;

    if (Type === "All") {
      const searchedDocuments = await FavoriteWorkSheet.findOne({
        CreatedBy: userId,
      })
        .populate("CommunityWorkSheetIds", "-Content")
        .populate("InteractiveWorkSheetIds", "-Content");

      if (!searchedDocuments) {
        console.log("My favorite collection is empty");
        return res.status(200).json({
          success: true,
          message: "My favorite collection is empty",
          pagination: {
            page,
            limit,
            total:
              searchedDocuments.CommunityWorkSheetIds.length +
              searchedDocuments.InteractiveWorkSheetIds.length,
          },
          data: [],
        });
      }

      let resultentWorkSheets = [];

      // Function to create a dynamic regex for a given field
      const createRegex = (field) => {
        return field ? new RegExp(field, "i") : null;
      };

      // Create regex objects for each field
      const titleRegex = createRegex(Title);
      const subjectRegex = createRegex(Subject);
      const languageRegex = createRegex(Language);
      const descriptionRegex = createRegex(Description);
      const ageRegex = createRegex(Age);
      const gradeRegex = createRegex(Grade);

      const matchWorksheet = (worksheet) => {
        return (
          (!titleRegex || titleRegex.test(worksheet.Title)) &&
          (!subjectRegex || subjectRegex.test(worksheet.Subject)) &&
          (!languageRegex || languageRegex.test(worksheet.Language)) &&
          (!descriptionRegex || descriptionRegex.test(worksheet.Description)) &&
          (!ageRegex || ageRegex.test(worksheet.Age)) &&
          (!gradeRegex || gradeRegex.test(worksheet.Grade))
        );
      };

      // Filter CommunityWorkSheetIds
      searchedDocuments.CommunityWorkSheetIds.forEach((worksheet) => {
        if (matchWorksheet(worksheet)) {
          resultentWorkSheets.push({
            ...worksheet.toObject(),
            IsFavorite: true,
          });
        }
      });

      // Filter InteractiveWorkSheetIds
      searchedDocuments.InteractiveWorkSheetIds.forEach((worksheet) => {
        if (matchWorksheet(worksheet)) {
          resultentWorkSheets.push({
            ...worksheet.toObject(),
            IsFavorite: true,
          });
        }
      });

      console.log("Resultant Work Sheets: ", resultentWorkSheets.length);
      return res.status(200).json({
        success: true,
        message: "Data fetched according to provided criteria",
        pagination: {
          page,
          limit,
          total: resultentWorkSheets.length,
        },
        data: resultentWorkSheets.slice(skip, skip + limit),
      });
    } else if (Type === "Community") {
      const searchedDocuments = await FavoriteWorkSheet.findOne({
        CreatedBy: userId,
      })
        .populate("CommunityWorkSheetIds", "-Content")
        .select("-InteractiveWorkSheetIds");

      if (!searchedDocuments) {
        console.log("My favorite collection is empty");
        return res.status(200).json({
          success: true,
          message: "My favorite collection is empty",
          pagination: {
            page,
            limit,
            total:
              searchedDocuments.CommunityWorkSheetIds.length +
              searchedDocuments.InteractiveWorkSheetIds.length,
          },
          data: [],
        });
      }

      let resultentWorkSheets = [];

      // Function to create a dynamic regex for a given field
      const createRegex = (field) => {
        return field ? new RegExp(field, "i") : null;
      };

      // Create regex objects for each field
      const titleRegex = createRegex(Title);
      const subjectRegex = createRegex(Subject);
      const languageRegex = createRegex(Language);
      const descriptionRegex = createRegex(Description);
      const ageRegex = createRegex(Age);
      const gradeRegex = createRegex(Grade);

      const matchWorksheet = (worksheet) => {
        return (
          (!titleRegex || titleRegex.test(worksheet.Title)) &&
          (!subjectRegex || subjectRegex.test(worksheet.Subject)) &&
          (!languageRegex || languageRegex.test(worksheet.Language)) &&
          (!descriptionRegex || descriptionRegex.test(worksheet.Description)) &&
          (!ageRegex || ageRegex.test(worksheet.Age)) &&
          (!gradeRegex || gradeRegex.test(worksheet.Grade))
        );
      };

      // Filter CommunityWorkSheetIds
      searchedDocuments.CommunityWorkSheetIds.forEach((worksheet) => {
        if (matchWorksheet(worksheet)) {
          resultentWorkSheets.push({
            ...worksheet.toObject(),
            IsFavorite: true,
          });
        }
      });

      console.log("Resultant Work Sheets: ", resultentWorkSheets.length);
      return res.status(200).json({
        success: true,
        message: "Data fetched according to provided criteria",
        pagination: {
          page,
          limit,
          total: resultentWorkSheets.length,
        },
        data: resultentWorkSheets.slice(skip, skip + limit),
      });
    } else if (Type === "Interactive") {
      const searchedDocuments = await FavoriteWorkSheet.findOne({
        CreatedBy: userId,
      })
        .populate("InteractiveWorkSheetIds", "-Content")
        .select("-CommunityWorkSheetIds");

      if (!searchedDocuments) {
        console.log("My favorite collection is empty");
        return res.status(200).json({
          success: true,
          message: "My favorite collection is empty",
          pagination: {
            page,
            limit,
            total:
              searchedDocuments.CommunityWorkSheetIds.length +
              searchedDocuments.InteractiveWorkSheetIds.length,
          },
          data: [],
        });
      }

      let resultentWorkSheets = [];

      // Function to create a dynamic regex for a given field
      const createRegex = (field) => {
        return field ? new RegExp(field, "i") : null;
      };

      // Create regex objects for each field
      const titleRegex = createRegex(Title);
      const subjectRegex = createRegex(Subject);
      const languageRegex = createRegex(Language);
      const descriptionRegex = createRegex(Description);
      const ageRegex = createRegex(Age);
      const gradeRegex = createRegex(Grade);

      const matchWorksheet = (worksheet) => {
        return (
          (!titleRegex || titleRegex.test(worksheet.Title)) &&
          (!subjectRegex || subjectRegex.test(worksheet.Subject)) &&
          (!languageRegex || languageRegex.test(worksheet.Language)) &&
          (!descriptionRegex || descriptionRegex.test(worksheet.Description)) &&
          (!ageRegex || ageRegex.test(worksheet.Age)) &&
          (!gradeRegex || gradeRegex.test(worksheet.Grade))
        );
      };

      // Filter InteractiveWorkSheetIds
      searchedDocuments.InteractiveWorkSheetIds.forEach((worksheet) => {
        if (matchWorksheet(worksheet)) {
          resultentWorkSheets.push({
            ...worksheet.toObject(),
            IsFavorite: true,
          });
        }
      });

      console.log("Resultant Work Sheets: ", resultentWorkSheets.length);
      return res.status(200).json({
        success: true,
        message: "Data fetched according to provided criteria",
        pagination: {
          page,
          limit,
          total: resultentWorkSheets.length,
        },
        data: resultentWorkSheets.slice(skip, skip + limit),
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while searching in my favorite",
    });
  }
};
