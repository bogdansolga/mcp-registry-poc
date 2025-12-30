// Simple console wrapper for consistent logging
const logger = {
  info: (...args: unknown[]) => console.log("[INFO]", ...args),
  error: (...args: unknown[]) => console.error("[ERROR]", ...args),
  warn: (...args: unknown[]) => console.warn("[WARN]", ...args),
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      console.debug("[DEBUG]", ...args);
    }
  },
};

export { logger };
