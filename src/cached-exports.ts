import { collectCjsExports } from "./collect-cjs-exports";
import { collectEsmExports } from "./collect-esm-exports";
import { INFO } from "./log";

export const createCachedExportsHandler = () => {
  const cachedResolvers: Record<string, any> = {};

  return function getCachedExports({
    logLevel,
    moduleName,
    barrelFilePath,
    moduleType,
  }: {
    logLevel: number;
    moduleName: string;
    barrelFilePath: string;
    moduleType: string;
  }) {
    if (cachedResolvers[moduleName]) {
      return cachedResolvers[moduleName];
    }

    if (moduleType === "esm") {
      cachedResolvers[moduleName] = collectEsmExports(barrelFilePath, logLevel);
    }

    if (moduleType === "commonjs") {
      cachedResolvers[moduleName] = collectCjsExports(barrelFilePath);
    }

    logLevel >= INFO && console.info(`[resolve-barrel-files] '${moduleName}' exports:`, cachedResolvers[moduleName]);

    return cachedResolvers[moduleName];
  };
};
