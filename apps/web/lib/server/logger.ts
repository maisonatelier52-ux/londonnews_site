type LogLevel = "info" | "warn" | "error";

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return error;
}

export function logEvent(level: LogLevel, event: string, details: Record<string, unknown> = {}) {
  const payload = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...Object.fromEntries(
      Object.entries(details).map(([key, value]) => [
        key,
        key === "error" ? normalizeError(value) : value
      ])
    )
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
}
