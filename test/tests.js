const { assert } = require('chai');
const babel = require('@babel/core');
const path = require('path');

function createOptions({
  libraryName = 'react-ui-lib',
  mainBarrelPath = path.resolve(__dirname, '../fixtures/')
}) {
  return {
    [libraryName]: {
      mainBarrelPath,
    }
  };
}

function transform(code, options) {
  return babel.transform(code, {
    presets: [['@babel/preset-env', { modules: false }]],
    plugins: [['./index', options || createOptions({})]]
  }).code;
}

describe('import transformations', function () {
  const uiLibPath = path.resolve(__dirname, '../fixtures/');

  it('should resolve member imports from barrel file', function () {
    const code = transform(`import { Bar, Bazz, Buzz } from 'react-ui-lib';`);

    assert.equal(code, [
      `import { Bar } from "${uiLibPath}/foo-bar";`,
      `import { Abc as Bazz } from "${uiLibPath}/bazz";`,
      `import { default as Buzz } from "${uiLibPath}/buzz";`
    ].join("\n"))
  });

  it('should resolve member imports with alias from barrel file', function () {
    const code = transform(`import { Bazz as Foo } from 'react-ui-lib';`);

    assert.equal(code, [
      `import { Abc as Foo } from "${uiLibPath}/bazz";`,
    ].join("\n"))
  });
});
