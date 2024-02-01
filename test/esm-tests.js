const path = require("path");
const { assert } = require("chai");
const { esmBarrel, transform } = require("./utils");

describe("esm import transformations", function() {
  const barrelFolder = path.resolve(esmBarrel, "..");
  const esmTransform = transform({
    moduleType: "esm",
    mainBarrelPath: esmBarrel,
  });

  it("should resolve member imports from barrel file", function() {
    const code = esmTransform(`import { Bar, Bazz, Buzz } from 'react-ui-lib';`);

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
    const code = esmTransform(`import { Bazz as Foo } from 'react-ui-lib';`);

    assert.equal(
      code,
      [
        `import { Abc as Foo } from "${barrelFolder}/bazz";`,
      ].join("\n"),
    );
  });

  it("should resolve wildcard exports", function() {
    const code = esmTransform(`import { foo, bar, bazz } from 'react-ui-lib';`);

    assert.equal(
      code,
      [
        `import { foo } from "${barrelFolder}/esm-subfile";`,
        `import { bar } from "${barrelFolder}/esm-subfile";`,
        `import { bazz } from "${barrelFolder}/esm-subfile";`,
      ].join("\n"),
    );
  });
});
