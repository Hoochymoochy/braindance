export const VAULT_GOAL = 100;

export const VAULT_POINTS = {
  listen_10m: 5,
  save_track: 5,
  finish_set: 10,
  new_dj: 15,
  new_day: 5,
} as const;

export type VaultEventType =
  | "listen_10m"
  | "save_track"
  | "finish_set"
  | "new_dj"
  | "new_day";

export type VaultClientEventType =
  | "listen_chunk"
  | "finish_set"
  | "save_track"
  | "unsave_track";

export type VaultClientEvent = {
  type: VaultClientEventType;
  videoId: string;
  momentId?: string;
  /**
   * Stable track identity for like/unlike (artist|title|timestamp).
   * Required for save_track / unsave_track so re-likes cannot spam the same week.
   */
  trackKey?: string;
  /** 1-based index of completed 10-minute chunks for this video this session/week */
  chunkIndex?: number;
  djName?: string;
  setTitle?: string;
  durationSeconds?: number;
  listenedSeconds?: number;
};

export type VaultWeek = {
  week_start: string;
  video_id: string;
  youtube_url: string;
  title: string;
  channel: string;
  thumbnail: string | null;
  created_at: string;
  /** When true, identity fields are stripped — set is secret until unlock. */
  hidden?: boolean;
};

export type VaultProgress = {
  user_id: string;
  week_start: string;
  points: number;
  unlocked_at: string | null;
  updated_at: string;
};

export type VaultUnlock = {
  week_start: string;
  unlocked_at: string;
  week: VaultWeek | null;
};

export type VaultMeResponse = {
  weekStart: string;
  points: number;
  goal: number;
  unlocked: boolean;
  unlockedAt: string | null;
  currentWeek: VaultWeek | null;
  unlocks: VaultUnlock[];
};

export type VaultAwardResult = {
  points: number;
  awarded: number;
  unlocked: boolean;
  unlockedAt: string | null;
  weekStart: string;
  events: { event_type: string; event_key: string; points: number }[];
};
