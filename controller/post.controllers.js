const Post = require("../models/post.model");
const CommunityWorkSheet = require("../models/community_work_sheet.model");
const FavoriteWorkSheet = require("../models/favourite_work_sheet.model");

const multer = require("multer");
const upload = multer({ dest: "./upload/" });

const path = require("path");
const crypto = require("crypto");

exports.getPostData = async (req, res) => {
  try {
    let page = parseInt(req.query.page);
    if (!page || page <= 0) {
      page = 1;
    }
    let limit = parseInt(req.query.limit || 20);
    const { availability } = req.query;
    let query = {
      "PostType.Type": "WorkSheet",
    };

    if (availability && availability.toLowerCase() !== "all") {
      query.liveWorksheetAvailability = availability;
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    let datacount;
    let data;
    let totalPages;

    if (availability && availability.toLowerCase() === "all") {
      data = await Post.find(query);
      datacount = data.length;
      totalPages = Math.ceil(datacount / limit);
      data = data.slice(startIndex, endIndex);
    } else {
      datacount = await Post.countDocuments(query);
      data = await Post.find(query).skip(startIndex).limit(limit);
      totalPages = Math.ceil(datacount / limit);
    }

    return res.status(200).json({ success: true, datacount, totalPages, data });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.getMainAndSubTopics = async (req, res) => {
  try {
    const { topic } = req.query;

    const topicRegex = new RegExp(topic, "i");

    const posts = await Post.find({ "Topics.Title": topicRegex });

    const topicsMap = new Map();

    posts.forEach((post) => {
      post.Topics.forEach((topic, idx) => {
        if (topic.ParentId === null && topic.Title.match(topicRegex)) {
          // Create a new entry in the map for main topics
          if (!topicsMap.has(topic.Title)) {
            topicsMap.set(topic.Title, {
              id: crypto.randomUUID(),
              mainTopic: topic.Title,
              subTopics: [],
            });
          }
        } else if (topic.ParentId !== null && topic.Title.match(topicRegex)) {
          // Find the parent topic for the sub-topic
          const parentTopic = posts.find((p) =>
            p.Topics.some((t) => t._id.toString() === topic.ParentId.toString())
          );
          if (parentTopic) {
            const parentTopicTitle = parentTopic.Topics.find(
              (t) => t._id.toString() === topic.ParentId.toString()
            ).Title;

            if (topicsMap.has(parentTopicTitle)) {
              // Add the sub-topic to the existing main topic entry if not already present
              const subTopics = topicsMap.get(parentTopicTitle).subTopics;
              if (!subTopics.includes(topic.Title)) {
                subTopics.push(topic.Title);
              }
            } else {
              // Create a new entry in the map for main topics along with the sub-topic
              topicsMap.set(parentTopicTitle, {
                id: crypto.randomUUID(),
                mainTopic: parentTopicTitle,
                subTopics: [topic.Title],
              });
            }
          }
        }
      });
    });

    // Convert the map values to an array of objects
    const topicsArray = Array.from(topicsMap.values());

    return res.status(200).json({ topics: topicsArray });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
};

exports.getTopicData = async (req, res) => {
  try {
    let page = parseInt(req.query.page);
    if (!page || page <= 0) {
      page = 1;
    }
    let limit = parseInt(req.query.limit || 20);
    const { topic, availability } = req.query;

    const topicRegex = new RegExp(topic, "i");

    let query = { "Topics.Title": topicRegex, "PostType.Type": "WorkSheet" };
    if (availability && availability.toLowerCase() !== "all") {
      query.liveWorksheetAvailability = availability;
    }

    const totalCount = await Post.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);
    if (page > totalPages) {
      page = totalPages;
    }
    if (totalCount < limit) {
      limit = totalCount;
    }
    const posts = await Post.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({ datacount: totalCount, posts });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
};

exports.searchOnTitle = async (req, res) => {
  try {
    let page = parseInt(req.query.page);
    if (!page || page <= 0) {
      page = 1;
    }
    let limit = parseInt(req.query.limit || 20);
    const { title, availability } = req.query;
    const titleRegex = new RegExp(title, "i");

    let query = { Title: titleRegex, "PostType.Type": "WorkSheet" };
    if (availability && availability.toLowerCase() !== "all") {
      query.liveWorksheetAvailability = availability;
    }

    const totalCount = await Post.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);
    if (page > totalPages) {
      page = totalPages;
    }
    if (totalCount < limit) {
      limit = totalCount;
    }

    const data = await Post.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({ datacount: totalCount, data });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.statusChange = async (req, res) => {
  try {
    const { id } = req.params;
    const { liveWorksheetAvailability } = req.body;

    const statusChange = await Post.findOneAndUpdate(
      { _id: id },
      { liveWorksheetAvailability: liveWorksheetAvailability },
      { new: true }
    );
    return res
      .status(200)
      .json({ success: true, message: "Successfully Changed" });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.createSheetJson = async (req, res) => {
  try {
    const { id } = req.params;
    const { liveWorksheetJson, liveWorksheetAvailability, liveWorksheetURL } =
      req.body;

    const data = await Post.findOneAndUpdate(
      { _id: id },
      { liveWorksheetJson, liveWorksheetAvailability, liveWorksheetURL },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Sheet Has been Updated",
      data: { _id: data._id },
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.getdatabystatus = async (req, res) => {
  try {
    let page = parseInt(req.query.page);
    if (!page || page <= 0) {
      page = 1;
    }
    const limit = parseInt(req.query.limit || 20);

    const availability = req.query.availability;

    // if (availability !== "Yes" && availability !== "No") {
    //   return res.status(400).json({ error: "Invalid 'availability' value" });
    // }

    const totalCount = await Post.countDocuments({
      liveWorksheetAvailability: availability,
      "PostType.Type": "WorkSheet",
    });
    const totalPages = Math.ceil(totalCount / limit);
    if (page > totalPages) {
      page = totalPages;
    }
    let data = await Post.find({
      "PostType.Type": "WorkSheet",
      liveWorksheetAvailability: availability,
    })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({ page, limit, totalCount, data });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Get Interactive Worksheet By Id
 */
exports.getSheetById = async (req, res) => {
  try {
    if (req?.user) {
      var { userId } = req.user;
    }
    const { sheetId } = req.params;

    const sheet = await Post.findOne({ _id: sheetId });

    const myFavoriteWorkSheets = await FavoriteWorkSheet.findOne({
      CreatedBy: userId,
    });
    let data = {};
    if (myFavoriteWorkSheets?.InteractiveWorkSheetIds.includes(sheet._id)) {
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
    console.log(error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Delete Interactive Work Sheet
 */
exports.deleteInteractiveWorkSheet = async (req, res) => {
  try {
    const { id } = req.params;
    await Post.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          liveWorksheetAvailability: "No",
          liveWorksheetURL: "",
          liveWorksheetJson: "",
        },
      }
    );
    return res
      .status(200)
      .json({ success: true, message: "Sheet has been deleted" });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Get Work Sheets
 */
exports.getWorksheets = async (req, res) => {
  try {
    if (req?.user) {
      var { userId } = req.user;
      var role = req.userRole;
    }

    const { type } = req.body;
    const { page } = req.query;

    const limit = 16;
    const skip = (page - 1) * limit;

    const validTypeStrings = [
      "Community",
      "Interactive",
      "NonInteractive",
      "All",
    ];

    if (!validTypeStrings.includes(type)) {
      return res.status(404).json({
        success: false,
        message: "Invalid worksheet type",
      });
    }

    if (type === "Community") {
      const communityWorkSheets = await CommunityWorkSheet.find({
        Privacy: "bank",
        PermanentDeleted: false,
      })
        .skip(skip)
        .limit(limit)
        .select(
          "Title Subject Language PictureUri Description Age Grade Privacy TermsAndConditionsAgreed TotalViews Type Modified CreatedBy PermanentDeleted"
        );

      const myFavoriteWorkSheets = await FavoriteWorkSheet.findOne({
        CreatedBy: userId,
      });

      const data = communityWorkSheets.map((worksheet) => ({
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
            Privacy: "bank",
            PermanentDeleted: false,
          }),
        },
      });
    } else if (type === "Interactive") {
      const interactiveWorkSheets = await Post.find({
        liveWorksheetAvailability: "Yes",
        "PostType.Type": "WorkSheet",
      })
        .skip(skip)
        .limit(limit)
        .select(
          "Created CreatedBy Modified ModifiedBy DeletedAt Title Slug Excerpt Content PictureUri PostType Status FileUri AllowDownloadFile MetaSeo Order LanguageId Categories FlashCards IsMemberOnly liveWorksheetAvailability liveWorksheetURL liveWorksheetIsFavorite liveWorksheetTotalViews"
        );

      const myFavoriteWorkSheets = await FavoriteWorkSheet.findOne({
        CreatedBy: userId,
      });

      const data = interactiveWorkSheets.map((worksheet) => ({
        ...worksheet.toObject(),
        IsFavorite:
          myFavoriteWorkSheets &&
          myFavoriteWorkSheets.InteractiveWorkSheetIds.includes(
            worksheet._id.toString()
          ),
      }));

      return res.status(200).json({
        success: true,
        data,
        pagination: {
          page,
          limit,
          total: await Post.countDocuments({
            liveWorksheetAvailability: "Yes",
            "PostType.Type": "WorkSheet",
          }),
        },
      });
    } else if (type === "NonInteractive") {
      if (role !== "admin") {
        console.error("Authorization is invalid. You are not a admin");
        return res.status(400).json({
          success: false,
          message: "Authorization is invalid.",
        });
      }
      const interactiveWorkSheets = await Post.find({
        liveWorksheetAvailability: "No",
        "PostType.Type": "WorkSheet",
      })
        .skip(skip)
        .limit(limit)
        .select(
          "Created CreatedBy Modified ModifiedBy DeletedAt Title Slug Excerpt Content PictureUri PostType Status FileUri AllowDownloadFile MetaSeo Order LanguageId Categories FlashCards IsMemberOnly liveWorksheetAvailability liveWorksheetURL liveWorksheetIsFavorite liveWorksheetTotalViews"
        );

      const myFavoriteWorkSheets = await FavoriteWorkSheet.findOne({
        CreatedBy: userId,
      });

      const data = interactiveWorkSheets.map((worksheet) => ({
        ...worksheet.toObject(),
        IsFavorite:
          myFavoriteWorkSheets &&
          myFavoriteWorkSheets.InteractiveWorkSheetIds.includes(
            worksheet._id.toString()
          ),
      }));

      return res.status(200).json({
        success: true,
        data,
        pagination: {
          page,
          limit,
          total: await Post.countDocuments({
            liveWorksheetAvailability: "No",
            "PostType.Type": "WorkSheet",
          }),
        },
      });
    } else if (type === "All") {
      const allCommunityWorkSheets = await CommunityWorkSheet.find({
        Privacy: "bank",
        PermanentDeleted: false,
      }).select("-Content");

      const interactiveWorkSheets = await Post.find({
        liveWorksheetAvailability: "Yes",
        "PostType.Type": "WorkSheet",
      }).select("-liveWorksheetJson");

      const allWorksheets = [
        ...allCommunityWorkSheets,
        ...interactiveWorkSheets,
      ].slice(skip, skip + limit);

      const myFavoriteWorkSheets = await FavoriteWorkSheet.findOne({
        CreatedBy: userId,
      });

      const data = allWorksheets.map((worksheet) => ({
        ...worksheet.toObject(),
        IsFavorite:
          myFavoriteWorkSheets &&
          (myFavoriteWorkSheets.CommunityWorkSheetIds.includes(
            worksheet._id.toString()
          ) ||
            myFavoriteWorkSheets.InteractiveWorkSheetIds.includes(
              worksheet._id.toString()
            )),
      }));

      return res.status(200).json({
        success: true,
        data,
        pagination: {
          page,
          limit,
          total:
            (await CommunityWorkSheet.countDocuments({
              Privacy: "bank",
              PermanentDeleted: false,
            })) +
            (await Post.countDocuments({
              liveWorksheetAvailability: "Yes",
              "PostType.Type": "WorkSheet",
            })),
        },
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Related Interactive Work Sheets
 */
exports.relatedInteractiveWorkSheets = async (req, res) => {
  try {
    if (req?.user) {
      var { userId } = req.user;
    }
    const { workSheetId } = req.params;

    const workSheet = await Post.findOne({
      _id: workSheetId,
      liveWorksheetAvailability: "Yes",
    }).select("-liveWorksheetJson");

    if (!workSheet) {
      console.log("==> Invalid worksheet id");
      return res.status(404).json({
        success: false,
        message: "Invalid worksheet id",
      });
    }

    const relatedWorkSheets = await Post.find({
      liveWorksheetAvailability: "Yes",
      "PostType.Type": "WorkSheet",
      _id: { $ne: workSheet._id },
    })
      .select("-liveWorksheetJson")
      .limit(5);

    if (relatedWorkSheets.length === 0) {
      return res.status(200).josn({
        success: true,
        message: "There is no related worksheet for that particular worksheet",
        data: relatedWorkSheets,
      });
    }

    const myFavoriteWorkSheets = await FavoriteWorkSheet.findOne({
      CreatedBy: userId,
    });

    const data = relatedWorkSheets.map((worksheet) => ({
      ...worksheet.toObject(),
      IsFavorite:
        myFavoriteWorkSheets &&
        myFavoriteWorkSheets.InteractiveWorkSheetIds.includes(
          worksheet._id.toString()
        ),
    }));

    return res.status(200).json({
      success: true,
      message: "Related worksheet fetched successfully",
      data,
    });
  } catch (error) {
    console.log("Error in relatedInteractiveWorkSheets: ", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting related interactive worksheets",
    });
  }
};

/**
 * Search Community Work Sheet by Title
 */
exports.searchTitle = async (req, res) => {
  try {
    // console.log("AJ");
    if (req?.user) {
      var { userId } = req.user;
      var role = req.userRole;
    }
    const { Type, Title, page } = req.query;

    const limit = 16;
    const skip = (page - 1) * limit;

    const validTypeStrings = [
      "All",
      "Interactive",
      "NonInteractive",
      "Community",
    ];

    if (!validTypeStrings.includes(Type)) {
      console.log("==> Invalid worksheet type");
      return res.status(400).json({
        success: true,
        message: "Invalid worksheet type",
      });
    }

    if (Type === "Interactive") {
      titleSearchInInteractiveWorksheets(
        res,
        page,
        limit,
        skip,
        Title,
        userId,
        role
      );
    }

    if (Type === "NonInteractive") {
      titleSearchInNonInteractiveWorksheets(
        res,
        page,
        limit,
        skip,
        Title,
        userId,
        role
      );
    }

    if (Type === "Community") {
      titleSearchInCommunityWorksheets(res, page, limit, skip, Title, userId);
    }

    if (Type === "All") {
      titleSearchForWorksheets(res, page, limit, skip, Title, userId, role);
    }
  } catch (error) {
    // console.log("AJ");
    return res.status(500).json({
      success: false,
      message: "Error occurred while searching by title",
    });
  }
};

/** __________ TITLE SEARCH - HELPING FUNCTIONS _________ */

// Title Search in Interactive Worksheets
async function titleSearchInInteractiveWorksheets(
  res,
  page,
  limit,
  skip,
  Title,
  userId,
  role
) {
  try {
    const searchedDocuments = await Post.find({
      $and: [
        { "PostType.Type": { $eq: "WorkSheet" } },
        { liveWorksheetAvailability: "Yes" },
        { Title: { $regex: new RegExp(Title, "i") } },
      ],
    })
      .skip(skip)
      .limit(limit)
      .select(
        "Created CreatedBy Modified ModifiedBy DeletedAt Title Slug Excerpt Content PictureUri PostType Status FileUri AllowDownloadFile MetaSeo Order LanguageId Categories FlashCards IsMemberOnly liveWorksheetAvailability liveWorksheetURL liveWorksheetIsFavorite liveWorksheetTotalViews"
      );

    if (searchedDocuments.length === 0) {
      console.log("==> There is no any Content for provided title");
      return res.status(200).json({
        success: true,
        message: "There is no any Content for provided title",
        pagination: {
          page,
          limit,
          total: await Post.countDocuments({
            $and: [
              { "PostType.Type": { $eq: "WorkSheet" } },
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
        myFavoriteWorkSheets.InteractiveWorkSheetIds.includes(
          worksheet._id.toString()
        ),
    }));

    return res.status(200).json({
      success: true,
      message: "Data fetched according to provided title",
      pagination: {
        page,
        limit,
        total: await Post.countDocuments({
          $and: [
            { "PostType.Type": { $eq: "WorkSheet" } },
            { liveWorksheetAvailability: "Yes" },
            { Title: { $regex: new RegExp(Title, "i") } },
          ],
        }),
      },
      data,
    });
  } catch (error) {
    throw error;
  }
}

// Title Search in NonInteractive Worksheets
async function titleSearchInNonInteractiveWorksheets(
  res,
  page,
  limit,
  skip,
  Title,
  userId,
  role
) {
  try {
    if (role !== "admin") {
      console.log("Athorization is invalid.");
      return res.status(400).json({
        success: false,
        message: "Athorization is invalid.",
      });
    }
    const searchedDocuments = await Post.find({
      $and: [
        { "PostType.Type": { $eq: "WorkSheet" } },
        { liveWorksheetAvailability: "No" },
        { Title: { $regex: new RegExp(Title, "i") } },
      ],
    })
      .skip(skip)
      .limit(limit)
      .select(
        "Created CreatedBy Modified ModifiedBy DeletedAt Title Slug Excerpt Content PictureUri PostType Status FileUri AllowDownloadFile MetaSeo Order LanguageId Categories FlashCards IsMemberOnly liveWorksheetAvailability liveWorksheetURL liveWorksheetIsFavorite liveWorksheetTotalViews"
      );

    if (searchedDocuments.length === 0) {
      console.log("==> There is no any Content for provided title");
      return res.status(200).json({
        success: true,
        message: "There is no any Content for provided title",
        pagination: {
          page,
          limit,
          total: await Post.countDocuments({
            $and: [
              { "PostType.Type": { $eq: "WorkSheet" } },
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
        myFavoriteWorkSheets.InteractiveWorkSheetIds.includes(
          worksheet._id.toString()
        ),
    }));

    return res.status(200).json({
      success: true,
      message: "Data fetched according to provided title",
      pagination: {
        page,
        limit,
        total: await Post.countDocuments({
          $and: [
            { "PostType.Type": { $eq: "WorkSheet" } },
            { liveWorksheetAvailability: "No" },
            { Title: { $regex: new RegExp(Title, "i") } },
          ],
        }),
      },
      data,
    });
  } catch (error) {
    throw error;
  }
}

// Title Search in Interactive WorkSheets
async function titleSearchInCommunityWorksheets(
  res,
  page,
  limit,
  skip,
  Title,
  userId
) {
  try {
    const searchedDocuments = await CommunityWorkSheet.find({
      $and: [
        { Privacy: "bank" },
        { PermanentDeleted: false },
        { Title: { $regex: new RegExp(Title, "i") } },
      ],
    })
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
            { Privacy: "bank" },
            { PermanentDeleted: false },
            { Title: { $regex: new RegExp(Title, "i") } },
          ],
        }),
      },
      data,
    });
  } catch (error) {
    throw error;
  }
}

// Title Search in both Interactive and Community
async function titleSearchForWorksheets(
  res,
  page,
  limit,
  skip,
  Title,
  userId,
  role
) {
  try {
    const interactiveSearchedDocuments = await Post.find({
      $and: [
        { "PostType.Type": { $eq: "WorkSheet" } },
        { liveWorksheetAvailability: "Yes" },
        { Title: { $regex: new RegExp(Title, "i") } },
      ],
    }).select(
      "Created CreatedBy Modified ModifiedBy DeletedAt Title Slug Excerpt Content PictureUri PostType Status FileUri AllowDownloadFile MetaSeo Order LanguageId Categories FlashCards IsMemberOnly liveWorksheetAvailability liveWorksheetURL liveWorksheetIsFavorite liveWorksheetTotalViews"
    );

    const myFavoriteWorkSheets = await FavoriteWorkSheet.findOne({
      CreatedBy: userId,
    });

    let interactiveData = [];
    if (interactiveSearchedDocuments.length !== 0) {
      interactiveData = interactiveSearchedDocuments.map((worksheet) => ({
        ...worksheet.toObject(),
        IsFavorite:
          myFavoriteWorkSheets &&
          myFavoriteWorkSheets.InteractiveWorkSheetIds.includes(
            worksheet._id.toString()
          ),
      }));
    }

    const communitySearchedDocuments = await CommunityWorkSheet.find({
      $and: [
        { Privacy: "bank" },
        { PermanentDeleted: false },
        { Title: { $regex: new RegExp(Title, "i") } },
      ],
    });

    let communityData = [];
    if (communitySearchedDocuments.length !== 0) {
      communityData = communitySearchedDocuments.map((worksheet) => ({
        ...worksheet.toObject(),
        IsFavorite:
          myFavoriteWorkSheets &&
          myFavoriteWorkSheets.CommunityWorkSheetIds.includes(
            worksheet._id.toString()
          ),
      }));
    }

    let searchedDocuments = [];
    if (interactiveData.length !== 0 && communityData.length !== 0) {
      searchedDocuments = [...communityData, ...interactiveData];
    }

    if (interactiveData.length !== 0 && communityData.length === 0) {
      searchedDocuments = [...interactiveData];
    }

    if (interactiveData.length === 0 && communityData.length !== 0) {
      searchedDocuments = [...communityData];
    }

    console.log("lenthhhhhhhhhhhhhhhhh:", searchedDocuments.length);

    if (searchedDocuments.length === 0) {
      console.error("==> There is no any Content for provided title");
      return res.status(200).json({
        success: true,
        message: "There is no any Content for provided title",
        pagination: {
          page,
          limit,
          total:
            (await CommunityWorkSheet.countDocuments({
              Privacy: "bank",
              PermanentDeleted: false,
            })) +
            (await Post.countDocuments({
              $and: [
                { "PostType.Type": { $eq: "WorkSheet" } },
                { liveWorksheetAvailability: "Yes" },
              ],
            })),
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
        total:
          (await CommunityWorkSheet.countDocuments({
            $and: [
              { Privacy: "bank" },
              { PermanentDeleted: false },
              { Title: { $regex: new RegExp(Title, "i") } },
            ],
          })) +
          (await Post.countDocuments({
            $and: [
              { "PostType.Type": { $eq: "WorkSheet" } },
              { liveWorksheetAvailability: "Yes" },
              { Title: { $regex: new RegExp(Title, "i") } },
            ],
          })),
      },
      data: searchedDocuments.slice(skip, skip + limit),
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Advance Search
 */
exports.advanceSearch = async (req, res) => {
  try {
    let userId, role;

    if (req?.user) {
      userId = req.user.userId;
      role = req.userRole;
    }

    const { Title, Subject, Language, Description, Age, Grade } = req.body;
    const { page = 1, Type } = req.query;

    const limit = 16;
    const skip = (page - 1) * limit;

    const validTypeStrings = [
      "All",
      "Interactive",
      "NonInteractive",
      "Community",
    ];

    if (!validTypeStrings.includes(Type)) {
      console.log("==> Invalid worksheet type");
      return res.status(400).json({
        success: false,
        message: "Invalid worksheet type",
      });
    }

    const query = {};

    if (Title) query.Title = { $regex: new RegExp(Title, "i") };
    if (Subject) query.Subject = { $regex: new RegExp(Subject, "i") };
    if (Language) query.Language = { $regex: new RegExp(Language, "i") };
    if (Description)
      query.Description = { $regex: new RegExp(Description, "i") };
    if (Age) query.Age = { $regex: new RegExp(Age, "i") };
    if (Grade) query.Grade = { $regex: new RegExp(Grade, "i") };

    if (Type === "Interactive") {
      await advanceSearchInInteractiveWorksheets(
        res,
        page,
        limit,
        skip,
        query,
        userId,
        role
      );
    } else if (Type === "NonInteractive") {
      await advanceSearchInNonInteractiveWorksheets(
        res,
        page,
        limit,
        skip,
        query,
        userId,
        role
      );
    } else if (Type === "Community") {
      await advanceSearchInCommunityWorksheets(
        res,
        page,
        limit,
        skip,
        query,
        userId
      );
    } else {
      await advanceSearchForWorksheets(
        res,
        page,
        limit,
        skip,
        query,
        userId,
        role
      );
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while searching in worksheets",
    });
  }
};

/** __________ ADVANCE SEARCH - HELPING FUNCTIONS _________ */
async function advanceSearchInInteractiveWorksheets(
  res,
  page,
  limit,
  skip,
  query,
  userId,
  role
) {
  try {
    const searchCriteria = [
      { "PostType.Type": { $eq: "WorkSheet" } },
      { liveWorksheetAvailability: "Yes" },
      ...Object.entries(query).map(([key, value]) => ({ [key]: value })),
    ];

    const searchedDocuments = await Post.find({ $and: searchCriteria })
      .skip(skip)
      .limit(limit)
      .select(
        "Created CreatedBy Modified ModifiedBy DeletedAt Title Slug Excerpt Content PictureUri PostType Status FileUri AllowDownloadFile MetaSeo Order LanguageId Categories FlashCards IsMemberOnly liveWorksheetAvailability liveWorksheetURL liveWorksheetIsFavorite liveWorksheetTotalViews"
      );

    const total = await Post.countDocuments({ $and: searchCriteria });

    const myFavoriteWorkSheets = await FavoriteWorkSheet.findOne({
      CreatedBy: userId,
    });

    const data = searchedDocuments.map((worksheet) => ({
      ...worksheet.toObject(),
      IsFavorite: myFavoriteWorkSheets?.InteractiveWorkSheetIds.includes(
        worksheet._id.toString()
      ),
    }));

    if (searchedDocuments.length === 0) {
      console.log("==> There is no any Content for provided title");
      return res.status(200).json({
        success: true,
        message: "There is no any Content for provided title",
        pagination: { page, limit, total },
        data,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Data fetched according to provided title",
      pagination: { page, limit, total },
      data,
    });
  } catch (error) {
    throw error;
  }
}

async function advanceSearchInNonInteractiveWorksheets(
  res,
  page,
  limit,
  skip,
  query,
  userId,
  role
) {
  try {
    if (role !== "admin") {
      console.log("Athorization is invalid.");
      return res.status(400).json({
        success: false,
        message: "Athorization is invalid.",
      });
    }
    const searchCriteria = [
      { "PostType.Type": { $eq: "WorkSheet" } },
      { liveWorksheetAvailability: "No" },
      ...Object.entries(query).map(([key, value]) => ({ [key]: value })),
    ];

    const searchedDocuments = await Post.find({ $and: searchCriteria })
      .skip(skip)
      .limit(limit)
      .select(
        "Created CreatedBy Modified ModifiedBy DeletedAt Title Slug Excerpt Content PictureUri PostType Status FileUri AllowDownloadFile MetaSeo Order LanguageId Categories FlashCards IsMemberOnly liveWorksheetAvailability liveWorksheetURL liveWorksheetIsFavorite liveWorksheetTotalViews"
      );

    const total = await Post.countDocuments({ $and: searchCriteria });

    const myFavoriteWorkSheets = await FavoriteWorkSheet.findOne({
      CreatedBy: userId,
    });

    const data = searchedDocuments.map((worksheet) => ({
      ...worksheet.toObject(),
      IsFavorite: myFavoriteWorkSheets?.InteractiveWorkSheetIds.includes(
        worksheet._id.toString()
      ),
    }));

    if (searchedDocuments.length === 0) {
      console.log("==> There is no any Content for provided title");
      return res.status(200).json({
        success: true,
        message: "There is no any Content for provided title",
        pagination: { page, limit, total },
        data,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Data fetched according to provided title",
      pagination: { page, limit, total },
      data,
    });
  } catch (error) {
    throw error;
  }
}

async function advanceSearchInCommunityWorksheets(
  res,
  page,
  limit,
  skip,
  query,
  userId
) {
  try {
    const searchCriteria = [
      { Privacy: "bank" },
      { PermanentDeleted: false },
      ...Object.entries(query).map(([key, value]) => ({ [key]: value })),
    ];

    const searchedDocuments = await CommunityWorkSheet.find({
      $and: searchCriteria,
    })
      .skip(skip)
      .limit(limit);

    const total = await CommunityWorkSheet.countDocuments({
      $and: searchCriteria,
    });

    const myFavoriteWorkSheets = await FavoriteWorkSheet.findOne({
      CreatedBy: userId,
    });

    const data = searchedDocuments.map((worksheet) => ({
      ...worksheet.toObject(),
      IsFavorite: myFavoriteWorkSheets?.CommunityWorkSheetIds.includes(
        worksheet._id.toString()
      ),
    }));

    if (searchedDocuments.length === 0) {
      console.log("==> There is no any Content for provided title");
      return res.status(200).json({
        success: true,
        message: "There is no any Content for provided title",
        pagination: { page, limit, total },
        data,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Data fetched according to provided title",
      pagination: { page, limit, total },
      data,
    });
  } catch (error) {
    throw error;
  }
}

async function advanceSearchForWorksheets(
  res,
  page,
  limit,
  skip,
  query,
  userId,
  role
) {
  try {
    const searchCriteriaInteractive = [
      { "PostType.Type": { $eq: "WorkSheet" } },
      { liveWorksheetAvailability: "Yes" },
      ...Object.entries(query).map(([key, value]) => ({ [key]: value })),
    ];

    const searchCriteriaCommunity = [
      { Privacy: "bank" },
      { PermanentDeleted: false },
      ...Object.entries(query).map(([key, value]) => ({ [key]: value })),
    ];

    const interactiveSearchedDocuments = await Post.find({
      $and: searchCriteriaInteractive,
    }).select(
      "Created CreatedBy Modified ModifiedBy DeletedAt Title Slug Excerpt Content PictureUri PostType Status FileUri AllowDownloadFile MetaSeo Order LanguageId Categories FlashCards IsMemberOnly liveWorksheetAvailability liveWorksheetURL liveWorksheetIsFavorite liveWorksheetTotalViews"
    );

    const communitySearchedDocuments = await CommunityWorkSheet.find({
      $and: searchCriteriaCommunity,
    });

    const myFavoriteWorkSheets = await FavoriteWorkSheet.findOne({
      CreatedBy: userId,
    });

    const interactiveData = interactiveSearchedDocuments.map((worksheet) => ({
      ...worksheet.toObject(),
      IsFavorite: myFavoriteWorkSheets?.InteractiveWorkSheetIds.includes(
        worksheet._id.toString()
      ),
    }));

    const communityData = communitySearchedDocuments.map((worksheet) => ({
      ...worksheet.toObject(),
      IsFavorite: myFavoriteWorkSheets?.CommunityWorkSheetIds.includes(
        worksheet._id.toString()
      ),
    }));

    const searchedDocuments = [...interactiveData, ...communityData];
    const total =
      (await Post.countDocuments({ $and: searchCriteriaInteractive })) +
      (await CommunityWorkSheet.countDocuments({
        $and: searchCriteriaCommunity,
      }));

    if (searchedDocuments.length === 0) {
      console.log("==> There is no any Content for provided title");
      return res.status(200).json({
        success: true,
        message: "There is no any Content for provided title",
        pagination: { page, limit, total },
        data: searchedDocuments.slice(skip, skip + limit),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Data fetched according to provided title",
      pagination: { page, limit, total },
      data: searchedDocuments.slice(skip, skip + limit),
    });
  } catch (error) {
    throw error;
  }
}
