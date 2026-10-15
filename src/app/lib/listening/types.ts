/** Client → server listening progress (analytics only — no Vault points). */
export type ListeningProgressPayload = {
  sessionId: string;
  videoId: string;
  djName?: string;
  setTitle?: string;
  durationSeconds?: number;
  /** Cumulative active listening seconds for this playback session. */
  listenedSeconds: number;
  completed?: boolean;
};

export type ListeningProgressResult = {
  sessionId: string;
  listenedSeconds: number;
  completed: boolean;
};
