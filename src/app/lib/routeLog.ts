/**
 * Explicit stdout logging for API routes so messages show up in the same
 * terminal as `next dev` (some setups hide or buffer console.log).
 */
export function routeLog(scope: string, message: string, extra?: unknown): void {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [braindance] [${scope}] ${message}`;
  if (extra === undefined) {
    process.stdout.write(`${prefix}\n`);
    return;
  }
  let suffix: string;
  if (typeof extra === "string") {
    suffix = extra;
  } else {
    try {
      suffix = JSON.stringify(extra);
    } catch {
      suffix = String(extra);
    }
  }
  process.stdout.write(`${prefix} ${suffix}\n`);
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
