import { getDbClient } from "@/app/lib/listener-profile/db";
import {
  capListenedSeconds,
  mergeListenedSeconds,
} from "@/app/lib/listening/rules";
import type {
  ListeningProgressPayload,
  ListeningProgressResult,
} from "@/app/lib/listening/types";

export {
  LISTENING_HEARTBEAT_SECONDS,
  MAX_SESSION_LISTENED_SECONDS,
  shouldPersistListeningProgress,
  capListenedSeconds,
  mergeListenedSeconds,
} from "@/app/lib/listening/rules";

export function validateListeningProgressPayload(
  input: unknown
): ListeningProgressPayload {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid listening progress body");
  }
  const body = input as Record<string, unknown>;
  const sessionId = String(body.sessionId ?? "").trim();
  const videoId = String(body.videoId ?? "").trim();
  if (!sessionId || sessionId.length < 8 || sessionId.length > 128) {
    throw new Error("Invalid sessionId");
  }
  if (!videoId || videoId.length > 128) {
    throw new Error("Missing videoId");
  }
  const listenedSeconds = Number(body.listenedSeconds);
  if (!Number.isFinite(listenedSeconds) || listenedSeconds < 0) {
    throw new Error("Invalid listenedSeconds");
  }
  const durationSeconds = Number(body.durationSeconds ?? 0);
  return {
    sessionId,
    videoId,
    djName: String(body.djName ?? "").trim().slice(0, 240),
    setTitle: String(body.setTitle ?? "").trim().slice(0, 500),
    durationSeconds: Number.isFinite(durationSeconds)
      ? Math.max(0, Math.floor(durationSeconds))
      : 0,
    listenedSeconds: Math.floor(listenedSeconds),
    completed: Boolean(body.completed),
  };
}

/**
 * Upsert one playback session by (user_id, client_session_id).
 * Uses max(existing, reported) so retries / double flushes cannot inflate.
 */
export async function persistListeningProgress(
  userId: string,
  payload: ListeningProgressPayload
): Promise<ListeningProgressResult> {
  const db = getDbClient();
  const durationSeconds = payload.durationSeconds ?? 0;
  const reported = capListenedSeconds(
    payload.listenedSeconds,
    durationSeconds
  );

  if (reported <= 0 && !payload.completed) {
    return {
      sessionId: payload.sessionId,
      listenedSeconds: 0,
      completed: false,
    };
  }

  const { data: existing, error: selectError } = await db
    .from("listening_sessions")
    .select("id, listened_seconds, completed, duration_seconds")
    .eq("user_id", userId)
    .eq("client_session_id", payload.sessionId)
    .maybeSingle();

  if (selectError) throw new Error(selectError.message);

  if (existing?.id) {
    const nextListened = mergeListenedSeconds(
      Number(existing.listened_seconds) || 0,
      reported,
      durationSeconds || Number(existing.duration_seconds) || 0
    );
    const completed =
      Boolean(existing.completed) || Boolean(payload.completed);
    const nextDuration = Math.max(
      Number(existing.duration_seconds) || 0,
      durationSeconds
    );

    // Skip no-op writes (duplicate flush with same totals).
    if (
      nextListened === (Number(existing.listened_seconds) || 0) &&
      completed === Boolean(existing.completed) &&
      nextDuration === (Number(existing.duration_seconds) || 0)
    ) {
      return {
        sessionId: payload.sessionId,
        listenedSeconds: nextListened,
        completed,
      };
    }

    const { error: updateError } = await db
      .from("listening_sessions")
      .update({
        dj_name: payload.djName || undefined,
        set_title: payload.setTitle || undefined,
        duration_seconds: nextDuration || undefined,
        listened_seconds: nextListened,
        completed,
        ended_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateError) throw new Error(updateError.message);

    return {
      sessionId: payload.sessionId,
      listenedSeconds: nextListened,
      completed,
    };
  }

  const { error: insertError } = await db.from("listening_sessions").insert({
    user_id: userId,
    video_id: payload.videoId,
    client_session_id: payload.sessionId,
    dj_name: payload.djName ?? "",
    set_title: payload.setTitle ?? "",
    duration_seconds: durationSeconds,
    listened_seconds: reported,
    completed: Boolean(payload.completed),
    ended_at: new Date().toISOString(),
  });

  if (insertError) {
    // Race: concurrent insert for same session — retry as update.
    if (insertError.code === "23505") {
      return persistListeningProgress(userId, payload);
    }
    throw new Error(insertError.message);
  }

  return {
    sessionId: payload.sessionId,
    listenedSeconds: reported,
    completed: Boolean(payload.completed),
  };
}
