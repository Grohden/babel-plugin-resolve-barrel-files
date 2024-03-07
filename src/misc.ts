export function err(msg: string) {
  return new Error("babel-plugin-resolve-barrel-files: " + msg);
}

export function partition<T>(predicate: (item: T) => boolean, list: T[]) {
  const left = [];
  const right = [];

  for (const item of list) {
    if (predicate(item)) {
      left.push(item);
    } else {
      right.push(item);
    }
  }

  return [left, right] as const;
}
