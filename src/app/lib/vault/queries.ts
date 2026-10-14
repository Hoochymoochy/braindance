import { getDbClient } from "@/app/lib/listener-profile/db";
import type {
  VaultMeResponse,
  VaultProgress,
  VaultUnlock,
  VaultWeek,
} from "@/app/lib/vault/types";
import { VAULT_GOAL } from "@/app/lib/vault/types";
import { vaultWeekStart } from "@/app/lib/vault/week";

function mapWeek(row: Record<string, unknown>): VaultWeek {
  return {
    week_start: String(row.week_start),
    video_id: String(row.video_id),
    youtube_url: String(row.youtube_url),
    title: String(row.title ?? ""),
    channel: String(row.channel ?? ""),
    thumbnail: row.thumbnail != null ? String(row.thumbnail) : null,
    created_at: String(row.created_at ?? ""),
  };
}

/** Strip identity so locked clients cannot open the set on YouTube. */
export function redactVaultWeek(week: VaultWeek): VaultWeek {
  return {
    week_start: week.week_start,
    video_id: "",
    youtube_url: "",
    title: "",
    channel: "",
    thumbnail: null,
    created_at: week.created_at,
    hidden: true,
  };
}

/** All vault exclusive video ids (for catalog exclusion). */
export async function listVaultVideoIds(): Promise<Set<string>> {
  const db = getDbClient();
  const { data, error } = await db.from("vault_weeks").select("video_id");
  if (error) throw new Error(error.message);
  return new Set(
    (data ?? [])
      .map((r) => String((r as { video_id?: string }).video_id ?? "").trim())
      .filter(Boolean)
  );
}

export async function getVaultWeekByStart(
  weekStart: string
): Promise<VaultWeek | null> {
  const db = getDbClient();
  const { data, error } = await db
    .from("vault_weeks")
    .select("*")
    .eq("week_start", weekStart)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapWeek(data as Record<string, unknown>) : null;
}

export async function getVaultWeekByVideoId(
  videoId: string
): Promise<VaultWeek | null> {
  const db = getDbClient();
  const { data, error } = await db
    .from("vault_weeks")
    .select("*")
    .eq("video_id", videoId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapWeek(data as Record<string, unknown>) : null;
}

export async function getVaultProgress(
  userId: string,
  weekStart: string
): Promise<VaultProgress | null> {
  const db = getDbClient();
  const { data, error } = await db
    .from("vault_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    user_id: String(data.user_id),
    week_start: String(data.week_start),
    points: Number(data.points) || 0,
    unlocked_at: data.unlocked_at ? String(data.unlocked_at) : null,
    updated_at: String(data.updated_at),
  };
}

export async function isVaultUnlocked(
  userId: string,
  weekStart: string
): Promise<boolean> {
  const progress = await getVaultProgress(userId, weekStart);
  return Boolean(progress?.unlocked_at);
}

export async function listUserUnlocks(userId: string): Promise<VaultUnlock[]> {
  const db = getDbClient();
  const { data: progressRows, error } = await db
    .from("vault_progress")
    .select("week_start, unlocked_at")
    .eq("user_id", userId)
    .not("unlocked_at", "is", null)
    .order("unlocked_at", { ascending: false });
  if (error) throw new Error(error.message);
  if (!progressRows?.length) return [];

  const weekStarts = progressRows.map((r) => String(r.week_start));
  const { data: weeks, error: weeksError } = await db
    .from("vault_weeks")
    .select("*")
    .in("week_start", weekStarts);
  if (weeksError) throw new Error(weeksError.message);

  const byStart = new Map(
    (weeks ?? []).map((w) => [
      String((w as { week_start: string }).week_start),
      mapWeek(w as Record<string, unknown>),
    ])
  );

  return progressRows.map((r) => ({
    week_start: String(r.week_start),
    unlocked_at: String(r.unlocked_at),
    week: byStart.get(String(r.week_start)) ?? null,
  }));
}

export async function getVaultMe(userId: string): Promise<VaultMeResponse> {
  const weekStart = vaultWeekStart();
  const [currentWeek, progress, unlocks] = await Promise.all([
    getVaultWeekByStart(weekStart),
    getVaultProgress(userId, weekStart),
    listUserUnlocks(userId),
  ]);

  const unlocked = Boolean(progress?.unlocked_at);
  const safeWeek =
    currentWeek == null
      ? null
      : unlocked
        ? currentWeek
        : redactVaultWeek(currentWeek);

  return {
    weekStart,
    points: progress?.points ?? 0,
    goal: VAULT_GOAL,
    unlocked,
    unlockedAt: progress?.unlocked_at ?? null,
    currentWeek: safeWeek,
    unlocks,
  };
}
