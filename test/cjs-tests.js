const { assert } = require("chai");
const { cjsBarrel, transform } = require("./utils");

describe("commonjs import transformations", function() {
  const cjsTransform = transform({
    moduleType: "commonjs",
    mainBarrelPath: cjsBarrel,
  });

  it("should resolve member imports from barrel file", function() {
    const code = cjsTransform(`import { Bar, Bazz, Buzz } from 'react-ui-lib';`);

    assert.equal(
      code,
      [
        `import { Bar } from "${cjsBarrel}/foo-bar";`,
        `import { Abc as Bazz } from "${cjsBarrel}/bazz";`,
        `import { default as Buzz } from "${cjsBarrel}/buzz";`,
      ].join("\n"),
    );
  });

  it("should resolve member imports with alias from barrel file", function() {
    const code = cjsTransform(`import { Bazz as Foo } from 'react-ui-lib';`);

    assert.equal(
      code,
      [
        `import { Abc as Foo } from "${cjsBarrel}/bazz";`,
      ].join("\n"),
    );
  });
});
