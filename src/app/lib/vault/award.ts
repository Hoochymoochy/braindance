import { getDbClient } from "@/app/lib/listener-profile/db";
import type {
  VaultAwardResult,
  VaultClientEvent,
} from "@/app/lib/vault/types";
import { VAULT_GOAL, VAULT_POINTS } from "@/app/lib/vault/types";
import {
  normalizeDjName,
  utcDayKey,
  vaultTrackKey,
  vaultWeekStart,
} from "@/app/lib/vault/week";

type PendingCredit = {
  event_type: string;
  event_key: string;
  points: number;
};

async function ensureProgressRow(
  userId: string,
  weekStart: string
): Promise<{ points: number; unlocked_at: string | null }> {
  const db = getDbClient();
  const { data, error } = await db
    .from("vault_progress")
    .select("points, unlocked_at")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) {
    return {
      points: Number(data.points) || 0,
      unlocked_at: data.unlocked_at ? String(data.unlocked_at) : null,
    };
  }

  const { data: inserted, error: insertError } = await db
    .from("vault_progress")
    .insert({
      user_id: userId,
      week_start: weekStart,
      points: 0,
    })
    .select("points, unlocked_at")
    .single();
  if (insertError) {
    const { data: again, error: againError } = await db
      .from("vault_progress")
      .select("points, unlocked_at")
      .eq("user_id", userId)
      .eq("week_start", weekStart)
      .single();
    if (againError) throw new Error(againError.message);
    return {
      points: Number(again.points) || 0,
      unlocked_at: again.unlocked_at ? String(again.unlocked_at) : null,
    };
  }
  return {
    points: Number(inserted.points) || 0,
    unlocked_at: inserted.unlocked_at ? String(inserted.unlocked_at) : null,
  };
}

async function hasEvent(
  userId: string,
  weekStart: string,
  eventKey: string
): Promise<boolean> {
  const db = getDbClient();
  const { data, error } = await db
    .from("vault_events")
    .select("id")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .eq("event_key", eventKey)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

async function getEvent(
  userId: string,
  weekStart: string,
  eventKey: string
): Promise<{ id: string; points: number } | null> {
  const db = getDbClient();
  const { data, error } = await db
    .from("vault_events")
    .select("id, points")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .eq("event_key", eventKey)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return { id: String(data.id), points: Number(data.points) || 0 };
}

async function hasEverHeardDj(userId: string, djKey: string): Promise<boolean> {
  if (!djKey) return true;
  const db = getDbClient();

  const { data: sessions, error: sErr } = await db
    .from("listening_sessions")
    .select("id")
    .eq("user_id", userId)
    .ilike("dj_name", djKey)
    .limit(1);
  if (sErr) throw new Error(sErr.message);
  if (sessions?.length) return true;

  const { data: events, error: eErr } = await db
    .from("vault_events")
    .select("id")
    .eq("user_id", userId)
    .eq("event_key", `dj:${djKey}`)
    .limit(1);
  if (eErr) throw new Error(eErr.message);
  return Boolean(events?.length);
}

async function applyCredits(
  userId: string,
  weekStart: string,
  credits: PendingCredit[]
): Promise<VaultAwardResult> {
  const db = getDbClient();
  const progress = await ensureProgressRow(userId, weekStart);
  let points = progress.points;
  let unlockedAt = progress.unlocked_at;
  let awarded = 0;
  const applied: PendingCredit[] = [];

  for (const credit of credits) {
    if (points >= VAULT_GOAL) break;
    // Any prior row for this key (including revoked 0-point) blocks re-award this week.
    if (await hasEvent(userId, weekStart, credit.event_key)) continue;

    const room = VAULT_GOAL - points;
    const grant = Math.min(credit.points, room);
    if (grant <= 0) continue;

    const { error } = await db.from("vault_events").insert({
      user_id: userId,
      week_start: weekStart,
      event_type: credit.event_type,
      event_key: credit.event_key,
      points: grant,
    });
    if (error) {
      if (error.code === "23505") continue;
      throw new Error(error.message);
    }

    points += grant;
    awarded += grant;
    applied.push({ ...credit, points: grant });
  }

  if (awarded > 0 || (!unlockedAt && points >= VAULT_GOAL)) {
    const patch: Record<string, unknown> = {
      points,
      updated_at: new Date().toISOString(),
    };
    if (!unlockedAt && points >= VAULT_GOAL) {
      unlockedAt = new Date().toISOString();
      patch.unlocked_at = unlockedAt;
    }
    const { error } = await db
      .from("vault_progress")
      .update(patch)
      .eq("user_id", userId)
      .eq("week_start", weekStart);
    if (error) throw new Error(error.message);
  }

  return {
    points,
    awarded,
    unlocked: Boolean(unlockedAt) || points >= VAULT_GOAL,
    unlockedAt,
    weekStart,
    events: applied,
  };
}

/**
 * Unlike: remove this week's points for the track, keep the ledger row at 0
 * so re-liking the same track cannot spam until next week.
 */
async function revokeTrackCredit(
  userId: string,
  weekStart: string,
  eventKey: string
): Promise<VaultAwardResult> {
  const db = getDbClient();
  const existing = await getEvent(userId, weekStart, eventKey);
  const progress = await ensureProgressRow(userId, weekStart);
  let points = progress.points;
  let unlockedAt = progress.unlocked_at;
  let awarded = 0;
  const applied: PendingCredit[] = [];

  if (existing && existing.points > 0) {
    const { error } = await db
      .from("vault_events")
      .update({ points: 0 })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);

    points = Math.max(0, points - existing.points);
    awarded = -existing.points;
    applied.push({
      event_type: "unsave_track",
      event_key: eventKey,
      points: awarded,
    });

    const patch: Record<string, unknown> = {
      points,
      updated_at: new Date().toISOString(),
    };
    if (points < VAULT_GOAL && unlockedAt) {
      unlockedAt = null;
      patch.unlocked_at = null;
    }
    const { error: pErr } = await db
      .from("vault_progress")
      .update(patch)
      .eq("user_id", userId)
      .eq("week_start", weekStart);
    if (pErr) throw new Error(pErr.message);
  }

  return {
    points,
    awarded,
    unlocked: Boolean(unlockedAt) && points >= VAULT_GOAL,
    unlockedAt,
    weekStart,
    events: applied,
  };
}

function resolveTrackKey(event: VaultClientEvent): string {
  const raw = event.trackKey?.trim();
  if (raw) return raw.slice(0, 240);
  // Fallback only — prefer client-provided stable key.
  return vaultTrackKey({
    artist: event.djName,
    title: event.setTitle,
    timestamp: event.momentId,
  }).slice(0, 240);
}

function validateClientEvent(event: VaultClientEvent): void {
  if (!event?.type) throw new Error("Missing event type");
  if (!event.videoId?.trim()) throw new Error("Missing videoId");
  if (event.type === "listen_chunk") {
    const n = Number(event.chunkIndex);
    if (!Number.isInteger(n) || n < 1 || n > 72) {
      throw new Error("Invalid chunkIndex");
    }
  }
  if (event.type === "save_track" || event.type === "unsave_track") {
    const key = event.trackKey?.trim();
    if (!key) throw new Error("Missing trackKey");
  }
}

/**
 * Award vault points for a client-reported activity. Point totals are never
 * trusted from the client — only event types + idempotent keys.
 */
export async function awardVaultFromClientEvent(
  userId: string,
  event: VaultClientEvent
): Promise<VaultAwardResult> {
  validateClientEvent(event);

  const weekStart = vaultWeekStart();
  const day = utcDayKey();
  const videoId = event.videoId.trim();
  const djName = (event.djName ?? "").trim();
  const djKey = normalizeDjName(djName);
  if (event.type === "unsave_track") {
    const trackKey = resolveTrackKey(event);
    const eventKey = `track:${videoId}:${trackKey}`;
    return revokeTrackCredit(userId, weekStart, eventKey);
  }

  const credits: PendingCredit[] = [];

  const dayKey = `day:${day}`;
  if (!(await hasEvent(userId, weekStart, dayKey))) {
    credits.push({
      event_type: "new_day",
      event_key: dayKey,
      points: VAULT_POINTS.new_day,
    });
  }

  if (event.type === "listen_chunk") {
    const chunkIndex = Number(event.chunkIndex);
    credits.push({
      event_type: "listen_10m",
      event_key: `listen_10m:${videoId}:${chunkIndex}`,
      points: VAULT_POINTS.listen_10m,
    });

    if (djKey && !(await hasEverHeardDj(userId, djKey))) {
      credits.push({
        event_type: "new_dj",
        event_key: `dj:${djKey}`,
        points: VAULT_POINTS.new_dj,
      });
    }
    // Listening minutes are persisted by /api/listening/progress — not Vault.
  } else if (event.type === "finish_set") {
    credits.push({
      event_type: "finish_set",
      event_key: `finish:${videoId}`,
      points: VAULT_POINTS.finish_set,
    });

    if (djKey && !(await hasEverHeardDj(userId, djKey))) {
      credits.push({
        event_type: "new_dj",
        event_key: `dj:${djKey}`,
        points: VAULT_POINTS.new_dj,
      });
    }
    // Listening minutes / completed flag: /api/listening/progress only.
  } else if (event.type === "save_track") {
    const trackKey = resolveTrackKey(event);
    credits.push({
      event_type: "save_track",
      event_key: `track:${videoId}:${trackKey}`,
      points: VAULT_POINTS.save_track,
    });
  }

  return applyCredits(userId, weekStart, credits);
}
