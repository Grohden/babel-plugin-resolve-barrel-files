export const DEBUG = 1;
export const INFO = 2;

export function resolveLogLevel(level: string | undefined) {
  switch (level) {
    case "debug":
      return DEBUG;
    case "info":
      return INFO;
    default:
      return 0;
  }
}
