const path = require("path");

function normalizePath(pathValue) {
  if (pathValue.startsWith(".")) {
    return path.resolve(pathValue);
  }

  return path;
}

module.exports = { normalizePath };
