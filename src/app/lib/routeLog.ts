/**
 * Explicit stdout logging for API routes so messages show up in the same
 * terminal as `next dev` (some setups hide or buffer console.log).
 * Currently quiet — restore the previous body when debugging backend proxies.
 */
export function routeLog(
  _scope: string,
  _message: string,
  _extra?: unknown
): void {
  // no-op
}

export function routeError(scope: string, message: string, err?: unknown): void {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [braindance] [${scope}] ERROR ${message}`;
  if (err === undefined) {
    process.stderr.write(`${prefix}\n`);
    return;
  }
  process.stderr.write(`${prefix}\n`);
  if (err instanceof Error && err.stack) {
    process.stderr.write(`${err.stack}\n`);
  } else {
    process.stderr.write(`${String(err)}\n`);
  }
}
