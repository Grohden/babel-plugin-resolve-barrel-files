import type { PluginObj } from "@babel/core";
import * as t from "@babel/types";
import pathLib from "path";

import { createCachedExportsHandler } from "./cached-exports";
import { DEBUG, resolveLogLevel } from "./log";
import { err } from "./misc";
import { normalizePath } from "./normalize-path";

type ModuleOption = {
  mainBarrelPath: string;
  moduleType?: "commonjs" | "esm";
  logLevel?: "debug" | "info";
};

export default function(): PluginObj {
  const resolveFromCached = createCachedExportsHandler();

  return {
    name: "resolve-barrel-files",
    visitor: {
      ImportDeclaration: (path, state) => {
        const castOpts = state.opts as Record<string, ModuleOption> | undefined;
        const moduleName = path.node.source.value;
        let normalized = moduleName;
        if (normalized.startsWith(".") && state.file.opts.filename) {
          normalized = normalizePath(pathLib.join(state.file.opts.filename, "..", moduleName));
        }

        const sourceConfig = castOpts?.[normalized];
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

        const exports = resolveFromCached({
          logLevel,
          moduleName: normalized,
          barrelFilePath: mainBarrelPath,
          moduleType,
        });

        for (const memberImport of path.node.specifiers) {
          if (!t.isImportSpecifier(memberImport)) {
            throw err("Full imports are not supported");
          }

          const importName = t.isIdentifier(memberImport.imported)
            ? memberImport.imported.name
            : memberImport.imported.value;

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
            newImportSpecifier = t.importSpecifier(
              t.identifier(localName),
              t.identifier(exportInfo.importAlias),
            );
          }

          transforms.push(t.importDeclaration(
            [newImportSpecifier],
            t.stringLiteral(importFrom),
          ));
        }

        if (transforms.length > 0) {
          path.replaceWithMultiple(transforms);
        }
      },
    },
  };
}
