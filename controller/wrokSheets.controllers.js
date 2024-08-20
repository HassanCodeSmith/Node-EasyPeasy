const User = require("../models/user.model");
const InteractiveWorkSheet = require("../models/post.model");
const LocalWorkSheet = require("../models/community_work_sheet.model");
const AudioVideoUrls = require("../models/audio_video.model");
const path = require("path");

const fs = require("fs");
const { promisify } = require("util");
const { default: axios } = require("axios");
const writeFileAsync = promisify(fs.writeFile);

exports.createSheet = async (req, res) => {
  try {
    const {
      title,
      language,
      description,
      grade,
      age,
      subject,
      content,
      status,
      base64Img,
    } = req.body;
    const requiredFields = [
      "title",
      "language",
      "description",
      "grade",
      "age",
      "subject",
      "content",
      "status",
    ];

    const missingFields = [];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      const missingFieldsMessage = `Missing fields: ${missingFields.join(
        ", "
      )}`;
      return res
        .status(400)
        .json({ success: false, message: missingFieldsMessage });
    }
    if (req.body.base64Img) {
      // Save the image to the server
      const base64Data = base64Img.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `${Date.now()}-${Math.floor(
        Math.random() * 100000
      )}.png`;
      const filePath = path.join(__dirname, "..", "uploads/images", fileName);
      await writeFileAsync(filePath, buffer);

      const imgUrl = `${req.protocol}://${req.get(
        "host"
      )}/uploads/images/${fileName}`;
      console.log(imgUrl);
      const sheet = await WorkSheet.create({
        grade,
        age,
        subject,
        content,
        imgUrl,
        title,
        language,
        description,
        status,
      });
      return res
        .status(200)
        .json({ success: true, sheet, message: "Sheet created Successfully" });
    }
    const sheet = await WorkSheet.create({
      grade,
      age,
      subject,
      content,
      title,
      language,
      description,
      status,
    });
    return res
      .status(200)
      .json({ success: true, sheet, message: "Sheet created Successfully" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteSheet = async (req, res) => {
  try {
    const { userId } = req.user;
    const { workSheetId } = req.params;
    await WorkSheet.findOneAndRemove({ _id: workSheetId });
    return res
      .status(200)
      .json({ success: true, message: "Worksheet has been deleted" });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateSheet = async (req, res) => {
  try {
    const {
      title,
      language,
      description,
      grade,
      age,
      subject,
      content,
      status,
      base64Img,
    } = req.body;
    const { userId } = req.user;
    const { workSheetId } = req.params;
    const check = await WorkSheet.findById(workSheetId);
    if (!check) {
      return res
        .status(400)
        .json({ success: false, message: "No WorkSheet Found " });
    }
    // Save the image to the server
    const base64Data = base64Img.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const fileName = `${Date.now()}-${Math.floor(Math.random() * 100000)}.png`;
    const filePath = path.join(__dirname, "..", "uploads", fileName);
    await writeFileAsync(filePath, buffer);

    // Store the image URL in MongoDB
    const imgUrl = `${req.protocol}://${req.get("host")}/uploads/${fileName}`;
    // const img = await cloudinary.uploader.upload(base64Img);
    // const imgUrl = img.url;
    await WorkSheet.findOneAndUpdate(
      { _id: workSheetId },
      {
        grade,
        age,
        subject,
        content,
        imgUrl,
        title,
        language,
        description,
        status,
      },
      { new: true }
    );
    return res
      .status(200)
      .json({ success: true, message: "Your Sheet Has been updated" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAllpublishSheets = async (req, res) => {
  try {
    let { page } = req.query;
    if (!page) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a page number" });
    }
    page = parseInt(page);
    const limit = 9;
    const skip = (page - 1) * limit;

    // Get the total count of sheets
    const totalCount = await WorkSheet.countDocuments({ status: true });

    const publish = await WorkSheet.find({ status: true })
      .limit(limit)
      .skip(skip);
    // console.log(publish);
    const subjects = publish.map((item) => item.subject);

    return res
      .status(200)
      .json({ success: true, subjects, totalCount, publish });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAlldraftSheets = async (req, res) => {
  try {
    let { page } = req.query;
    if (!page) {
      return res
        .status(400)
        .json({ success: false, message: "please provide a page No" });
    }
    page = parseInt(page);
    const limit = 9;
    const skip = (page - 1) * limit;
    const totalCount = await WorkSheet.countDocuments({ status: false });

    const publish = await WorkSheet.find({ status: false })
      .limit(limit)
      .skip(skip);
    const subjects = publish.map((item) => item.subject);
    // console.log(publish);
    return res
      .status(200)
      .json({ success: true, subjects, totalCount, publish });
  } catch (error) {
    console.log(error);

    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.getSheetById = async (req, res) => {
  try {
    const { workSheetId } = req.params;
    const data = await WorkSheet.findById(workSheetId);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getSheetsBysubject = async (req, res) => {
  try {
    const { search } = req.query;

    if (search) {
      const regex = new RegExp(search, "i");

      const count = await WorkSheet.countDocuments({ subject: regex });
      const data = await WorkSheet.find({ subject: regex });

      return res.status(200).json({ success: true, count, data });
    }

    return res.status(200).json({ success: true, count: 0, data: [] });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.getSheetsBysubject = async (req, res) => {
  try {
    const { search } = req.query;

    if (search) {
      const regex = new RegExp(search, "i");

      const count = await WorkSheet.countDocuments({ subject: regex });
      const data = await WorkSheet.find({ subject: regex });

      return res.status(200).json({ success: true, count, data });
    }

    return res.status(200).json({ success: true, count: 0, data: [] });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.uploadVideoAudio = async (req, res) => {
  try {
    const { Title, Type } = req.body;
    const { userId } = req.user;
    // console.log(req.files);
    if (req.file) {
      if (Type === "video") {
        let VideoUrl = (filePath =
          "http://45.32.107.232:7000" + "/" + req.file.path);

        // console.log("====", videoUrl);
        // Saving video with fields in DB

        const videocontents = await AudioVideoUrls.create({
          VideoUrl,

          Type,
          Title,
          CreatedBy: userId,
        });
        return res.status(200).json({
          success: true,
          message: "Media Uploaded Successfull",
          data: videocontents,
        });
      }

      // Creating

      if (req.file) {
        let AudioUrl = "http://45.32.107.232:7000" + "/" + req.file.path;
        const Content = await AudioVideoUrls.create({
          AudioUrl,
          Type,
          Title,
          CreatedBy: userId,
        });
        return res.status(200).json({
          success: true,
          message: "Media Uploaded Successfull",
          data: Content,
        });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status.json({ success: false, message: error.message });
  }
};

exports.getAudioVideo = async (req, res) => {
  try {
    const { userId } = req.user;
    const data = await AudioVideoUrls.find({ CreatedBy: userId });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteAudioVideo = async (req, res) => {
  try {
    const { userId } = req.user;
    const { audioVideoId } = req.params;
    await AudioVideoUrls.findOneAndRemove({ _id: audioVideoId });
    return res
      .status(200)
      .json({ success: true, message: "Deleted Successfully" });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
