const { MenuBarInfo } = require("../models/menu_bar_info.model");
const { trimObjects } = require("../utils/trimObjects.util");

/**
 * Create Menu Bar Info
 */
exports.createMenuBarInfo = async (req, res) => {
  try {
    trimObjects(req.body);
    const { title } = req.body;

    if (!title) {
      console.error("Title is required.");
      return res.status(404).json({
        success: false,
        message: "Title is required.",
      });
    }

    const isValidTitle = await MenuBarInfo.findOne({
      title: { $regex: new RegExp(title, "i") },
    });

    if (isValidTitle) {
      console.error("Title already exists.");
      return res.status(400).json({
        success: false,
        message: "Title already taken.",
      });
    }

    if (req?.files["infoImage"]) {
      req.body.infoImage =
        "/" + req.files["infoImage"][0].path.replace(/\\/g, "/");
    }

    if (req?.files["advanceInfoVideo"]) {
      req.body.advanceInfoVideo =
        "/" + req.files["advanceInfoVideo"][0].path.replace(/\\/g, "/");
    }

    await MenuBarInfo.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Menubar info added successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while creating menu bar info.",
    });
  }
};

/**
 * Get All Info
 */
exports.getAllInfo = async (req, res) => {
  try {
    const info = await MenuBarInfo.find({});

    if (info.lenght === 0) {
      console.error("Menubar info collection is empty");
      return res.status(200).json({
        success: false,
        message: "Menubar info collection is empty",
        data: info,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Menubar info feteched successfully.",
      data: info,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting menu bar info.",
    });
  }
};

/**
 * Get Single Menu Bar Entity
 */
exports.getSingleEntity = async (req, res) => {
  try {
    const { entityId } = req.params;
    const info = await MenuBarInfo.findOne({ _id: entityId });

    if (!info) {
      console.error("Invalud Menubar entity id");
      return res.status(404).json({
        success: false,
        message: "Invalud Menubar entity id",
        data: info,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Menubar entity info feteched successfully.",
      data: info,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting menu bar entity info.",
    });
  }
};

/**
 * Update Menu Bar Entity
 */
exports.updateMenuBarEntity = async (req, res) => {
  try {
    const { entityId } = req.params;
    const entity = await MenuBarInfo.findOne({ _id: entityId });

    if (!entity) {
      console.error("Invalud Menubar entity id");
      return res.status(404).json({
        success: false,
        message: "Invalud Menubar entity id",
      });
    }

    if (req?.body?.title) {
      entity.title = req.body.title;
    }

    if (req?.body?.info) {
      entity.info = req.body.info;
    }

    if (req?.body?.advanceInfo) {
      entity.advanceInfo = req.body.advanceInfo;
    }

    if (req?.body?.advanceInfoImage) {
      entity.advanceInfoImage = req.body.advanceInfoImage;
    }

    if (req?.files["infoImage"]) {
      entity.infoImage =
        "/" + req.files["infoImage"][0].path.replace(/\\/g, "/");
    }

    if (req?.files["advanceInfoVideo"]) {
      entity.advanceInfoVideo =
        "/" + req.files["advanceInfoVideo"][0].path.replace(/\\/g, "/");
    }

    await entity.save();
    return res.status(200).json({
      success: true,
      message: "Menubar entity info updated successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating menu bar entity info.",
    });
  }
};

/**
 * Delete Single Menu Bar Entity
 */
exports.deleteMenuBarEntity = async (req, res) => {
  try {
    const { entityId } = req.params;
    await MenuBarInfo.findOneAndDelete({ _id: entityId });

    return res.status(200).json({
      success: true,
      message: "Menubar entity deleted successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting menu bar entity.",
    });
  }
};
