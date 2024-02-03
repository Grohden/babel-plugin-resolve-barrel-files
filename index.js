const pathLib = require("path");
const types = require("@babel/types");

const { err, partition } = require("./src/misc");
const { resolveLogLevel, DEBUG } = require("./src/log");
const { createCachedExportsHandler } = require("./src/cached-exports");

module.exports = function() {
  const fromCache = createCachedExportsHandler();

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
          && console.debug(`[resolve-barrel-files] Resolving ${moduleType} imports from ${mainBarrelPath}`);

        const exports = fromCache({
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
              && console.debug(
                `[resolve-barrel-files] No export info found for ${moduleName} import '${importName}', are you sure this is a ${moduleType} module?`,
              );
            continue;
          }

          const importFrom = pathLib.join(mainBarrelFolder, exportInfo.importPath);

          logLevel >= DEBUG
            && console.debug(`[resolve-barrel-files] Resolving ${moduleName} '${importName}' to ${importFrom}`);

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
