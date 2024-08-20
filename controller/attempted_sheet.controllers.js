const AttemptedSheet = require("../models/attempted_sheet.model");
const User = require("../models/user.model");

const Datauri = require("datauri/parser");
const dUri = new Datauri();
const path = require("path");
const console = require("console");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});

const dataUri = (buffer, originalname) =>
  dUri.format(path.extname(originalname).toString(), buffer);

exports.postAttemptedSheet = async (req, res) => {
  try {
    const { userId } = req.user;

    const { workSheetId, content, base64Img } = req.body;
    const img = await cloudinary.uploader.upload(base64Img);
    const imgUrl = img.url;
    const attemptedSheet = await AttemptedSheet.create({
      userId,
      workSheetId,
      content,
      imgUrl,
    });
    return res.status(200).json({ success: true, attemptedSheet });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, message: error.message });
  }
};
