const { assert } = require("chai");
const babel = require("@babel/core");
const path = require("path");

const esmBarrel = path.resolve(__dirname, "../fixtures/esm");

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

describe("esm import transformations", function() {
  const esmLibPath = esmBarrel;

  it("should resolve member imports from barrel file", function() {
    const code = transform(`import { Bar, Bazz, Buzz } from 'react-ui-lib';`);

    assert.equal(
      code,
      [
        `import { Bar } from "${esmLibPath}/foo-bar";`,
        `import { Abc as Bazz } from "${esmLibPath}/bazz";`,
        `import { default as Buzz } from "${esmLibPath}/buzz";`,
      ].join("\n"),
    );
  });

  it("should resolve member imports with alias from barrel file", function() {
    const code = transform(`import { Bazz as Foo } from 'react-ui-lib';`);

    assert.equal(
      code,
      [
        `import { Abc as Foo } from "${esmLibPath}/bazz";`,
      ].join("\n"),
    );
  });
});
