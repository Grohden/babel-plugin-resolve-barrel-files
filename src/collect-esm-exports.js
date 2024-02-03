const fs = require("fs");
const path = require("path");

const ts = require("typescript");
const { collectEsmSubFileExports } = require("./collect-esm-subfile-exports");
const { INFO } = require("./log");

/**
 * Parses an ESM barrel (index) file, extracts all it's export
 * names and returns an object that maps
 * an import name to the path + some meta infos.
 *
 * Note: this doesn't handle the following cases:
 * ```
 * import {A, B} from './foo';
 *
 * export {A,B}
 *
 * export * as Namespace from './foo';
 * ```
 *
 * The case above is not supported.
 */
const collectEsmExports = (file, logLevel) => {
  const sourceFile = ts.createSourceFile(
    file,
    fs.readFileSync(file).toString(),
    ts.ScriptTarget.ES2015,
    true,
  );

  const exports = {};
  sourceFile.forEachChild((child) => {
    if (ts.isExportDeclaration(child)) {
      if (!child.moduleSpecifier) {
        return;
      }

      const importName = child.moduleSpecifier.text;

      // Named export
      if (child.exportClause) {
        child.exportClause.forEachChild((node) => {
          if (ts.isExportSpecifier(node)) {
            exports[node.name.text] = {
              importPath: importName,
              importAlias: node.propertyName?.text,
            };
          }
        });

        return;
      }

      // Wildcard export
      const subFile = path.resolve(path.dirname(file), child.moduleSpecifier.text);
      const subFileExt = path.extname(subFile) || guessExtension(subFile);

      if (!subFileExt) {
        logLevel >= INFO
          && console.info(`[resolve-barrel-files] Could not find extension for ${subFile}, ignoring`);

        return;
      }

      [...collectEsmSubFileExports(subFile + subFileExt)].forEach((name) => {
        exports[name] = {
          importPath: importName,
          importAlias: undefined,
        };
      });
    }
  });

  return exports;
};

const guessExtension = (file) => {
  return [".tsx", ".ts", ".jsx", ".js"].find((ext) => {
    if (fs.existsSync(file + ext)) {
      return ext;
    }
  });
};

module.exports = { collectEsmExports };
