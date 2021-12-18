const path = require("path");
const babel = require("@babel/core");

const esmBarrel = path.resolve(__dirname, "./fixtures/esm.js");

function createOptions({
  libraryName = "react-ui-lib",
  mainBarrelPath = esmBarrel,
  isCjs = false,
} = {}) {
  return {
    [libraryName]: {
      mainBarrelPath,
      isCommonJSModule: isCjs,
    },
  };
}

function transform(code, options) {
  return babel.transform(code, {
    presets: [["@babel/preset-env", { modules: false }]],
    plugins: [["./index", createOptions(options)]],
  }).code;
}

module.exports = {
  transform,
  esmBarrel,
};
