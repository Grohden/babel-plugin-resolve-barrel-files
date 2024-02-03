const { collectEsmExports } = require("./collect-esm-exports");
const { collectCjsExports } = require("./collect-cjs-exports");
const { INFO } = require("./log");

const createCachedExportsHandler = (exports) => {
  const cachedResolvers = {};

  return function getCachedExports({
    logLevel,
    moduleName,
    barrelFilePath,
    moduleType,
  }) {
    if (cachedResolvers[moduleName]) {
      return cachedResolvers[moduleName];
    }

    if (moduleType === "esm") {
      cachedResolvers[moduleName] = collectEsmExports(barrelFilePath);
    }

    if (moduleType === "commonjs") {
      cachedResolvers[moduleName] = collectCjsExports(barrelFilePath);
    }

    logLevel >= INFO && console.info(`[resolve-barrel-files] '${moduleName}' exports:`, cachedResolvers[moduleName]);

    return cachedResolvers[moduleName];
  };
};

module.exports = { createCachedExportsHandler };
