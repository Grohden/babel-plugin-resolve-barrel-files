import pathLib from "path";

export function normalizePath(path: string) {
  if (path.startsWith(".")) {
    return pathLib.resolve(path);
  }

  return path;
}
