/** __________ Middlewares __________ */
const loginAuth = require("../middlewares/login_auth.middleware");

/** __________ Express Router __________ */
const favoriteWorkSheetsRouter = require("express").Router();

/** __________ Controllers __________ */
const {
  addToFavorite,
  getFavoriteWorkSheets,
  removeMyFavorite,
  titleSearch,
  advanceSearch,
} = require("../controller/favourite_work_sheet.controllers");

/** /favorite/addToFavorite */
favoriteWorkSheetsRouter.post(
  "/addToFavorite/:worksheetId/:worksheetType",
  loginAuth,
  addToFavorite
);

/** /favorite/getFavoriteWorkSheets */
favoriteWorkSheetsRouter.get(
  "/getFavoriteWorkSheets",
  loginAuth,
  getFavoriteWorkSheets
);

/** /favorite/removeMyFavorite */
favoriteWorkSheetsRouter.patch(
  "/removeMyFavorite/:workSheetId/:workSheetType",
  loginAuth,
  removeMyFavorite
);

/** /favorite/titleSearch */
favoriteWorkSheetsRouter.get("/titleSearch", loginAuth, titleSearch);

/** /favorite/advanceSearch */
favoriteWorkSheetsRouter.post("/advanceSearch", loginAuth, advanceSearch);

module.exports = favoriteWorkSheetsRouter;
