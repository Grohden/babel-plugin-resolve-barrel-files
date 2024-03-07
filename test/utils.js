const path = require("path");
const babel = require("@babel/core");

const esmBarrel = path.resolve(__dirname, "./fixtures/esm.js");
const cjsBarrel = path.resolve(__dirname, "./fixtures/cjs.js");

function createOptions({
  libraryName = "react-ui-lib",
  mainBarrelPath,
  moduleType,
} = {}) {
  return {
    [libraryName]: {
      mainBarrelPath,
      moduleType,
    },
  };
}

const transform = (options) =>
  (code) => {
    return babel.transform(code, {
      presets: [["@babel/preset-env", { modules: false }]],
      plugins: [["./dist/index", createOptions(options)]],
    }).code;
  };

module.exports = {
  transform,
  esmBarrel,
  cjsBarrel,
};
