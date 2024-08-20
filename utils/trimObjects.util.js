const trimObjects = (obj) => {
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      obj[key] = obj[key].trim();
    } else if (typeof obj[key] === "object") {
      trimObjects(obj[key]);
    }
  }
};

module.exports = { trimObjects };
