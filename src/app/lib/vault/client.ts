import type {
  VaultAwardResult,
  VaultClientEvent,
  VaultMeResponse,
  VaultUnlock,
  VaultWeek,
} from "@/app/lib/vault/types";

export async function reportVaultEvent(
  event: VaultClientEvent
): Promise<VaultAwardResult | null> {
  try {
    const res = await fetch("/api/vault/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      credentials: "same-origin",
    });
    if (res.status === 401) return null;
    if (!res.ok) return null;
    return (await res.json()) as VaultAwardResult;
  } catch {
    return null;
  }
}

export async function fetchVaultMe(): Promise<VaultMeResponse | null> {
  try {
    const res = await fetch("/api/vault/me", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as VaultMeResponse;
  } catch {
    return null;
  }
}

export async function fetchVaultUnlocks(
  userId: string
): Promise<VaultUnlock[]> {
  try {
    const res = await fetch(
      `/api/vault/unlocks?userId=${encodeURIComponent(userId)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { unlocks?: VaultUnlock[] };
    return data.unlocks ?? [];
  } catch {
    return [];
  }
}

export async function fetchCurrentVaultWeek(): Promise<{
  weekStart: string;
  currentWeek: VaultWeek | null;
  points: number | null;
  unlocked: boolean | null;
} | null> {
  try {
    const res = await fetch("/api/vault/week", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as {
      weekStart: string;
      currentWeek: VaultWeek | null;
      points: number | null;
      unlocked: boolean | null;
    };
  } catch {
    return null;
  }
}
