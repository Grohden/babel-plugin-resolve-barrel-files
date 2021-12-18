const path = require("path");
const { assert } = require("chai");
const { cjsBarrel, transform } = require("./utils");

describe("commonjs import transformations", function() {
  const barrelFolder = path.resolve(cjsBarrel, "..");
  const cjsTransform = transform({
    moduleType: "commonjs",
    mainBarrelPath: cjsBarrel,
  });

  it("should resolve member imports from barrel file", function() {
    const code = cjsTransform(`import { Bar, Bazz, Buzz } from 'react-ui-lib';`);

    assert.equal(
      code,
      [
        `import { Bar } from "${barrelFolder}/foo-bar";`,
        `import { Abc as Bazz } from "${barrelFolder}/bazz";`,
        `import { default as Buzz } from "${barrelFolder}/buzz";`,
      ].join("\n"),
    );
  });

  it("should resolve member imports with alias from barrel file", function() {
    const code = cjsTransform(`import { Bazz as Foo } from 'react-ui-lib';`);

    assert.equal(
      code,
      [
        `import { Abc as Foo } from "${barrelFolder}/bazz";`,
      ].join("\n"),
    );
  });

  it("should resolve member imports with wildcard generated code", function() {
    const code = cjsTransform(`import { Wildcard, Unique } from 'react-ui-lib';`);

    assert.equal(
      code,
      [
        `import { default as Wildcard } from "${barrelFolder}/wildcard";`,
        `import { Unique } from "${barrelFolder}/wildcard";`,
      ].join("\n"),
    );
  });
});
