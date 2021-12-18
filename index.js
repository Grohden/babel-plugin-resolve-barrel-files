const pathLib = require("path");
const types = require("@babel/types");

const { err, partition } = require("./src/misc");
const { collectEsmExports } = require("./src/collect-esm-exports");
const { collectCjsExports } = require("./src/collect-cjs-exports");
const { resolveLogLevel, DEBUG, INFO } = require("./src/log");

const cachedResolvers = {};

function getCachedExports({
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

  logLevel >= INFO && console.log(`[resolve-barrel-files] '${moduleName}' exports:`, cachedResolvers[moduleName]);

  return cachedResolvers[moduleName];
}

module.exports = function() {
  return {
    visitor: {
      ImportDeclaration: function(path, state) {
        const moduleName = path.node.source.value;
        const sourceConfig = state.opts?.[moduleName];

        if (!sourceConfig) {
          return;
        }

        const transforms = [];
        const mainBarrelPath = sourceConfig.mainBarrelPath;
        const mainBarrelFolder = pathLib.join(mainBarrelPath, "..");
        const moduleType = sourceConfig.moduleType || "commonjs";
        const logLevel = resolveLogLevel(sourceConfig.logLevel);

        logLevel >= DEBUG
          && console.log(`[resolve-barrel-files] Resolving ${moduleType} imports from ${mainBarrelPath}`);

        const exports = getCachedExports({
          logLevel,
          moduleName,
          barrelFilePath: mainBarrelPath,
          moduleType,
        });

        const [fullImports, memberImports] = partition(
          specifier => specifier.type !== "ImportSpecifier",
          path.node.specifiers,
        );

        if (fullImports.length) {
          err("Full imports are not supported");
        }

        for (const memberImport of memberImports) {
          const importName = memberImport.imported.name;
          const localName = memberImport.local.name;
          const exportInfo = exports[importName];

          if (!exports[importName]) {
            logLevel >= DEBUG
              && console.log(
                `[${moduleName}] No export info found for ${importName}, are you sure this is a ${moduleType} module?`,
              );
            continue;
          }

          const importFrom = pathLib.join(mainBarrelFolder, exportInfo.importPath);

          logLevel >= DEBUG && console.log(`[${moduleName}] Resolving '${importName}' to ${importFrom}`);

          let newImportSpecifier = memberImport;

          if (exportInfo.importAlias) {
            newImportSpecifier = types.importSpecifier(
              types.identifier(localName),
              types.identifier(exportInfo.importAlias),
            );
          }

          transforms.push(types.importDeclaration(
            [newImportSpecifier],
            types.stringLiteral(importFrom),
          ));
        }

        if (transforms.length > 0) {
          path.replaceWithMultiple(transforms);
        }
      },
    },
  };
};
