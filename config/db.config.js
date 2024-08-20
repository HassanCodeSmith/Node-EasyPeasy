const mongoose = require("mongoose");

let EasyPeasyDB;
let EasyPeasyIdentityDB;

(async () => {
  try {
    EasyPeasyDB = mongoose.createConnection(process.env.EasyPeasyDB);
    console.log(`EasyPeasyDB connected`);

    EasyPeasyIdentityDB = mongoose.createConnection(
      process.env.EasyPeasyIdentityDB
    );
    console.log(`EasyPeasyIdentityDB connected`);
  } catch (error) {
    console.log("=> ERROR IN DB CONNECTION: ", error);
  }
})();

module.exports = { EasyPeasyDB, EasyPeasyIdentityDB };
