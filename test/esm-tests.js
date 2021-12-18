const { assert } = require("chai");
const { esmBarrel, transform } = require("./utils");

describe("esm import transformations", function() {
  const esmTransform = transform({
    moduleType: "esm",
    mainBarrelPath: esmBarrel,
  });

  it("should resolve member imports from barrel file", function() {
    const code = esmTransform(`import { Bar, Bazz, Buzz } from 'react-ui-lib';`);

    assert.equal(
      code,
      [
        `import { Bar } from "${esmBarrel}/foo-bar";`,
        `import { Abc as Bazz } from "${esmBarrel}/bazz";`,
        `import { default as Buzz } from "${esmBarrel}/buzz";`,
      ].join("\n"),
    );
  });

  it("should resolve member imports with alias from barrel file", function() {
    const code = esmTransform(`import { Bazz as Foo } from 'react-ui-lib';`);

    assert.equal(
      code,
      [
        `import { Abc as Foo } from "${esmBarrel}/bazz";`,
      ].join("\n"),
    );
  });
});
