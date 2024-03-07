import fs from "fs";
import path from "path";
import ts from "typescript";

import { INFO } from "./log";

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
export const collectEsmExports = (file: string, logLevel: number) => {
  const sourceFile = fileProject(file);

  const exports: Record<string, { importPath: string; importAlias?: string }> = {};
  sourceFile.forEachChild((child) => {
    if (ts.isExportDeclaration(child)) {
      if (!child.moduleSpecifier || !ts.isStringLiteral(child.moduleSpecifier)) {
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
      const subFile = path.resolve(path.dirname(file), importName);
      const subFileExt = path.extname(subFile) || guessExtension(subFile);

      if (!subFileExt) {
        logLevel >= INFO
          && console.info(`[resolve-barrel-files] Could not find extension for ${subFile}, ignoring`);

        return;
      }

      const subFileSource = fileProject(subFile + subFileExt);
      // need to recursively collect exports from the sub file
      if (isBarrelFile(subFileSource)) {
        // FIXME: TEST THIS
        Object.assign(exports, collectEsmExports(subFile + subFileExt, logLevel));
      } else {
        collectEsmSubFileExports(subFileSource).forEach((name) => {
          exports[name] = {
            importPath: importName,
            importAlias: undefined,
          };
        });
      }
    }
  });

  return exports;
};

/**
 * Parses a normal file that has declarations such as:
 * ```
 * export const Foo = () => {}
 *
 * export function Bar() {}
 * ```
 * and returns a set of names that are exported.
 */
const collectEsmSubFileExports = (file: ts.SourceFile): Set<string> => {
  const exports = new Set<string>();
  file.forEachChild((child) => {
    // export const <name> = ..., <name2> = ...
    if (ts.isVariableStatement(child)) {
      if (hasExportModifier(child.modifiers)) {
        child.declarationList.declarations.forEach((declaration) => {
          exports.add(declaration.name.getText());
        });

        return;
      }
    }

    if (ts.isFunctionDeclaration(child)) {
      if (hasExportModifier(child.modifiers) && child.name) {
        exports.add(child.name.text);
      }
    }
  });

  return exports;
};

const fileProject = (file: string) => {
  return ts.createSourceFile(
    file,
    fs.readFileSync(file).toString(),
    ts.ScriptTarget.ES2015,
    true,
  );
};

const isBarrelFile = (file: ts.SourceFile) => {
  return file.getChildren().every((child) => ts.isExportDeclaration(child));
};

const hasExportModifier = (modifiers: ts.NodeArray<ts.ModifierLike> | undefined) => {
  return modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
};

const guessExtension = (file: string) => {
  return [".tsx", ".ts", ".jsx", ".js"].find((ext) => {
    if (fs.existsSync(file + ext)) {
      return ext;
    }
  });
};
