const fs = require("fs");

const ts = require("typescript");

/**
 * Parses a normal file that has declarations such as:
 * ```
 * export const Foo = () => {}
 *
 * export function Bar() {}
 * ```
 * and returns a set of names that are exported.
 */
const collectEsmSubFileExports = (file) => {
  // TODO: cache?
  const sourceFile = ts.createSourceFile(
    file,
    fs.readFileSync(file).toString(),
    ts.ScriptTarget.ES2015,
    true,
  );

  const exports = new Set();
  sourceFile.forEachChild((child) => {
    if (ts.isFunctionDeclaration(child) && hasExportModifier(child)) {
      exports.add(child.name.text);
    }
    if (ts.isVariableStatement(child) && hasExportModifier(child)) {
      child.declarationList.declarations.forEach((declaration) => {
        exports.add(declaration.name.text);
      });
    }
  });

  return exports;
};

const hasExportModifier = (node) =>
  (node.modifiers || [])
    .some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);

module.exports = { collectEsmSubFileExports };
