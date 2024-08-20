const multer = require("multer");

const allowedTypes = [
  "image/png",
  "image/jpg",
  "image/jpeg",
  "audio/mpeg",
  "video/mp4",
];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // if (file.mimetype === "audio/mpeg") {
    //   console.log("=======", file.mimetype);
    //   cb(null, "./uploads/audio");
    // } else if (file.mimetype === "video/mp4") {
    //   cb(null, "./uploads/video");
    // } else {
    //   cb(null, "./uploads/images");
    // }
    cb(null, "./uploads/images");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    );
  },
});

const fileFilter = function (req, file, cb) {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only PNG, JPG, JPEG, MP3, and MP4 files are allowed."
      )
    );
  }
};

const upload = multer({ storage: storage });

module.exports = { upload };
