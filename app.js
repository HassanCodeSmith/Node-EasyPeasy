require("dotenv").config();
var morgan = require("morgan");
const express = require("express");
const app = express();
const Cors = require("cors");

require("./config/db.config");

const User = require("./models/user.model");

app.use(Cors());

/** __________ Middlewares __________ */
app.use(express.json({ limit: "50gb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads/images", express.static("uploads/images"));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send(
    "<h1 style='display: flex; justify-content: center;  align-items: center; font-size:9rem; margin-top:16rem;'> Confusion is part of programming</h1>"
  );
});

/** __________ Routes __________ */
const userRouter = require("./routes/user.routes");
const workSheet = require("./routes/work_sheets.routes");
const AttemptedSheet = require("./routes/attempted_sheet.routes");
const PostRouter = require("./routes/post.routes");
const CommunityChatRouter = require("./routes/community_chat.routes");
const FavoriteWorkSheetsRouter = require("./routes/favourite_work_sheet.routes");
const communityWorkSheetRouter = require("./routes/community_work_sheet.routes");
const tutorialRouter = require("./routes/tutorial.routes");
const menuBarInfoRouter = require("./routes/menu_bar_info.routes");

/** __________ Speech to text __________ */
const multer = require("multer");
const upload = multer({ dest: "./upload/" });
const { exec } = require("child_process");

app.post("/api/v1/transcribe", upload.single("audio"), async (req, res) => {
  console.log(req.file);
  const fs = require("fs");
  const speech = require("@google-cloud/speech");
  const keyFilename = "./compact-medium-384015-e64c34e3cdc1.json";
  const client = new speech.SpeechClient({ keyFilename });
  const audioConfig = {
    encoding: "LINEAR16",
    sampleRateHertz: 8000,
    languageCode: "en-US",
  };

  const audioFile = req.file; // Access the uploaded file using req.file

  // Convert audio sample rate to 8000 if it's higher
  if (audioConfig.sampleRateHertz < 8000) {
    const outputFilePath = `${audioFile.path}_converted.wav`;

    // Construct the sox command for sample rate conversion
    const soxCommand = `sox ${audioFile.path} -r 8000 ${outputFilePath}`;

    // Execute the sox command
    exec(soxCommand, async (error, stdout, stderr) => {
      if (error) {
        console.error("Error converting sample rate:", error);
        res
          .status(500)
          .json({ error: "An error occurred during sample rate conversion." });
        return;
      }

      // Read the converted audio file content
      const convertedAudioContent = fs
        .readFileSync(outputFilePath)
        .toString("base64");

      // Delete the temporary converted audio file
      fs.unlinkSync(outputFilePath);

      // Perform transcription with the converted audio
      await transcribeAudio({ content: convertedAudioContent });
    });
  } else {
    // Perform transcription with the original audio
    await transcribeAudio({
      content: fs.readFileSync(audioFile.path).toString("base64"),
    });
  }

  async function transcribeAudio(audio) {
    const request = {
      audio,
      config: audioConfig,
    };

    try {
      const [response] = await client.recognize(request);
      const transcription = response.results
        .map((result) => result.alternatives[0].transcript)
        .join("\n");
      console.log("Transcription:", transcription);
      res.json({ transcription });
      fs.unlinkSync(audioFile.path);
    } catch (err) {
      console.error("Speech-to-Text API error:", err);
      res
        .status(500)
        .json({ error: "An error occurred during transcription." });
    }
  }
});

/** __________ Routes __________ */
app.use("/api/v1/user", userRouter);
app.use("/api/v1", workSheet);
app.use("/api/v1", AttemptedSheet);
app.use("/api/v1/interactive", PostRouter);
app.use("/api/v1/communityChat", CommunityChatRouter);
app.use("/api/v1/favorite", FavoriteWorkSheetsRouter);
app.use("/api/v1/community", communityWorkSheetRouter);
app.use("/api/v1/tutorial", tutorialRouter);
app.use("/api/v1/menuBarInfo", menuBarInfoRouter);

/** __________ DB Connection and Server Listening __________ */
const start = async () => {
  try {
    const Email = process.env.ADMIN_EMAIL;
    const PasswordHash = process.env.ADMIN_PASSWORD;
    const findAdmin = await User.findOne({ Email });
    if (!findAdmin) {
      await User.create({
        Email,
        PasswordHash,
        Role: "admin",
        EmailConfirmed: true,
      });

      console.log(`Admin created successfully with email ${Email}`);
    } else {
      console.log(`Admin Already exists with email ${Email}`);
    }
    const port = 7000;

    app.listen(port, () =>
      console.log(`Server is running and listenning on ${port}`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
