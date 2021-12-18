const DEBUG = 1;
const INFO = 2;

function resolveLogLevel(level) {
  switch (level) {
    case "debug":
      return DEBUG;
    case "info":
      return INFO;
    default:
      return 0;
  }
}

module.exports = {
  DEBUG,
  INFO,
  resolveLogLevel,
};
