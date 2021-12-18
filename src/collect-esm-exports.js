const fs = require("fs");

const ts = require("typescript");

/**
 * Parses a ESM barrel (index) file, extracts all it's export
 * names and returns an object that maps
 * a import name to the path + some meta infos.
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
const collectEsmExports = (file) => {
  const sourceFile = ts.createSourceFile(
    file,
    fs.readFileSync(file).toString(),
    ts.ScriptTarget.ES2015,
    true,
  );

  const exports = {};
  sourceFile.forEachChild((child) => {
    if (ts.isExportDeclaration(child)) {
      if (child.exportClause && child.moduleSpecifier) {
        const importName = child.moduleSpecifier.text;

        child.exportClause.forEachChild((node) => {
          if (ts.isExportSpecifier(node)) {
            exports[node.name.text] = {
              importPath: importName,
              importAlias: node.propertyName?.text,
            };
          }
        });
      }
    }
  });

  return exports;
};

module.exports = { collectEsmExports };
