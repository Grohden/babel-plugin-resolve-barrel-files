function err(msg) {
  throw new Error("babel-plugin-resolve-barrel-files: " + msg);
}

function partition(predicate, list) {
  const left = [];
  const right = [];

  for (const item of list) {
    if (predicate(item)) {
      left.push(item);
    } else {
      right.push(item);
    }
  }

  return [left, right];
}

module.exports = {
  err,
  partition,
};
