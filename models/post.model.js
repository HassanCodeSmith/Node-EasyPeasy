const mongoose = require("mongoose");
const { EasyPeasyDB } = require("../config/db.config");

const postSchema = new mongoose.Schema(
  {
    Created: {
      type: Date,
      default: Date.now,
    },

    CreatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    Modified: {
      type: Date,
      default: Date.now,
    },

    // ModifiedBy: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User",
    // },

    ModifiedBy: String,

    DeletedAt: {
      type: Date,
      default: null,
    },

    Title: {
      type: String,
      required: true,
    },

    Slug: {
      type: String,
      required: true,
    },

    Excerpt: String,

    Content: String,

    PictureUri: String,

    PostType: {
      type: {
        _id: mongoose.Schema.Types.ObjectId,

        Created: Date,

        CreatedBy: mongoose.Schema.Types.ObjectId,

        Modified: Date,

        // ModifiedBy: mongoose.Schema.Types.ObjectId,

        ModifiedBy: String,

        DeletedAt: Date,

        Type: String,

        Name: String,

        Slug: String,

        Style: {
          BannerBgUri: String,

          IconUri: String,

          BannerBgColor: String,
        },
      },

      required: true,
    },

    Status: String,

    FileUri: String,

    FileUriAuth: String,

    AllowDownloadFile: Boolean,

    MetaSeo: {
      MetaTitle: String,

      MetaDescription: String,

      MetaKeywords: String,
    },

    Order: Number,

    LanguageId: mongoose.Schema.Types.ObjectId,

    Categories: [mongoose.Schema.Types.ObjectId],

    FlashCards: [
      {
        _id: mongoose.Schema.Types.ObjectId,

        Created: Date,

        CreatedBy: mongoose.Schema.Types.ObjectId,

        Modified: Date,

        // ModifiedBy: mongoose.Schema.Types.ObjectId,

        ModifiedBy: String,

        DeletedAt: Date,

        Title: String,

        PictureUri: String,

        MediaUri: String,

        Order: Number,

        IsMemberOnly: Boolean,
      },
    ],

    Topics: [
      {
        _id: mongoose.Schema.Types.ObjectId,
        Created: Date,

        CreatedBy: mongoose.Schema.Types.ObjectId,

        Modified: Date,

        // ModifiedBy: mongoose.Schema.Types.ObjectId,

        ModifiedBy: String,

        DeletedAt: Date,

        Title: String,

        Slug: String,

        Description: String,

        Style: {
          BannerBgUri: String,

          IconUri: String,

          BannerBgColor: String,
        },

        ParentId: mongoose.Schema.Types.ObjectId,

        Order: Number,

        LanguageId: mongoose.Schema.Types.ObjectId,

        Link: String,
      },
    ],

    IsMemberOnly: Boolean,

    liveWorksheetJson: String,

    liveWorksheetAvailability: String,

    liveWorksheetURL: String,

    liveWorksheetIsFavorite: {
      type: Boolean,
      default: false,
    },

    liveWorksheetTotalViews: {
      type: Number,
      default: 0,
    },
  },
  { collection: "Post" }
);

const Post = EasyPeasyDB.model("Post", postSchema);

module.exports = Post;
