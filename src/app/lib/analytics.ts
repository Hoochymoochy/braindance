export type AnalyticsProps = Record<
  string,
  string | number | boolean | undefined | null
>;

type UmamiClient = {
  track: (event: string, data?: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    umami?: UmamiClient;
  }
}

/** Strip null/undefined so Umami only receives real metadata. */
function compactProps(
  data?: AnalyticsProps
): Record<string, string | number | boolean> | undefined {
  if (!data) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Fire a custom Umami event. Safe no-op when:
 * - running on the server
 * - Umami script is blocked / not loaded
 * - track throws
 */
export function trackEvent(name: string, data?: AnalyticsProps): void {
  if (typeof window === "undefined") return;
  try {
    const track = window.umami?.track;
    if (typeof track !== "function") return;
    const props = compactProps(data);
    if (props) track(name, props);
    else track(name);
  } catch {
    /* analytics must never break the app */
  }
}

/** Shared set identity fields used across most events. */
export type SetAnalyticsMeta = {
  set_id: string;
  set_title: string;
  artist: string;
};

export function setMeta(input: {
  set_id?: string | null;
  set_title?: string | null;
  artist?: string | null;
}): Partial<SetAnalyticsMeta> {
  return {
    set_id: input.set_id || undefined,
    set_title: input.set_title || undefined,
    artist: input.artist || undefined,
  };
}
