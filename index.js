const pathLib = require("path");
const types = require("@babel/types");

const { err, partition } = require("./src/misc");
const { collectExports } = require("./src/collect-exports");

const cachedResolvers = {};

function getOrCacheExports({
  moduleName,
  barrelFilePath,
}) {
  if (cachedResolvers[moduleName]) {
    return cachedResolvers[moduleName];
  }

  return cachedResolvers[moduleName] = collectExports(
    require.resolve(barrelFilePath),
  );
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
        const sourceImport = sourceConfig.mainBarrelPath;
        const exports = getOrCacheExports({
          moduleName,
          barrelFilePath: sourceImport,
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
          const importFrom = pathLib.join(sourceImport, exportInfo.importPath);

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
