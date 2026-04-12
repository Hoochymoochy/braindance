/**
 * Goofy-but-shaped-like-prod data for `/api/streams/*` when `STREAM_UI_MOCKS=1`.
 *
 * Preset streams (copy into `/stream/<id>`):
 * - `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11` — long tracklist
 * - `b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22` — shorter corporate parody set
 *
 * Any other UUID still returns a default stream + generic tracks (id matches URL).
 *
 * YouTube URL uses a long-running embed-friendly lofi stream so the player always loads.
 */

export const MOCK_EMBED_YOUTUBE_URL =
  "https://www.youtube.com/watch?v=jfKfPfyJRdk";

const THUMB = "https://i.ytimg.com/vi/jfKfPfyJRdk/maxresdefault.jpg";

export type MockStreamRecord = {
  id: string;
  title: string;
  artist: string;
  youtube_url: string;
  soundcloud_url: string | null;
  duration: number;
  thumbnail: string;
  created_at: string;
};

export type MockTrackRecord = {
  id: string;
  stream_id: string;
  timestamp: string;
  artist: string;
  title: string;
  spotify_url: string | null;
  soundcloud_url: string | null;
};

/** Curated presets — visit `/stream/<id>` with mocks on. */
export const MOCK_STREAM_PRESETS: Record<string, MockStreamRecord> = {
  "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11": {
    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    title: "Live from the Rhubarb Dimension (4hr Warmup)",
    artist: "DJ Glitch Possum",
    youtube_url: MOCK_EMBED_YOUTUBE_URL,
    soundcloud_url: "https://soundcloud.com/example/dj-glitch-possum-rhubarb",
    duration: 4 * 3600 + 20 * 60,
    thumbnail: THUMB,
    created_at: "2026-04-01T12:00:00.000Z",
  },
  "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22": {
    id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    title: "Corporate Synergy Rave™ — Q3 All-Hands Afterparty",
    artist: "Karen From Payroll (B2B) The Intern",
    youtube_url: MOCK_EMBED_YOUTUBE_URL,
    soundcloud_url: null,
    duration: 2 * 3600 + 7 * 60,
    thumbnail: THUMB,
    created_at: "2026-03-15T09:00:00.000Z",
  },
};

const BASE_TRACKS_A: Omit<MockTrackRecord, "stream_id">[] = [
  {
    id: "t-001",
    timestamp: "00:04:12",
    artist: "Swedish Chef Mafia",
    title: "Bork Bork Bork (VIP Intro Edit)",
    spotify_url: "https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7U9",
    soundcloud_url: null,
  },
  {
    id: "t-002",
    timestamp: "00:18:44",
    artist: "The Algorithm & Friends",
    title: "404 — Feeling Not Found (Original Mix)",
    spotify_url: null,
    soundcloud_url: "https://soundcloud.com/example/404-feeling",
  },
  {
    id: "t-003",
    timestamp: "00:32:01",
    artist: "Sidechain Chicken",
    title: "Why Is The Kick Ducking Again",
    spotify_url: "https://open.spotify.com/track/3n3Ppam7vgaVa1ia6c0ju6",
    soundcloud_url: "https://soundcloud.com/example/sidechain-chicken",
  },
  {
    id: "t-004",
    timestamp: "00:47:59",
    artist: "Moisturized Disco",
    title: "Ceramide Anthem (Extended Hydration Mix)",
    spotify_url: null,
    soundcloud_url: null,
  },
  {
    id: "t-005",
    timestamp: "01:05:20",
    artist: "DJ Glitch Possum",
    title: "This Drop Is Legally Distinct From Sandstorm",
    spotify_url: "https://open.spotify.com/track/5Z01UMMf7V1o0MzF86s6WJ",
    soundcloud_url: null,
  },
];

const BASE_TRACKS_B: Omit<MockTrackRecord, "stream_id">[] = [
  {
    id: "u-001",
    timestamp: "00:02:00",
    artist: "PowerPoint Parade",
    title: "Slide 7 — \"Synergy\" (Ambient)",
    spotify_url: null,
    soundcloud_url: null,
  },
  {
    id: "u-002",
    timestamp: "00:14:30",
    artist: "Karen From Payroll",
    title: "Please See HR (Tech House)",
    spotify_url: null,
    soundcloud_url: "https://soundcloud.com/example/see-hr",
  },
  {
    id: "u-003",
    timestamp: "00:29:00",
    artist: "The Intern",
    title: "I'll Fix It In Post (UK Garage)",
    spotify_url: "https://open.spotify.com/track/0V3wPSX9ygBnCm8psDIegu",
    soundcloud_url: null,
  },
];

export const MOCK_TRACK_PRESETS: Record<string, MockTrackRecord[]> = {
  "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11": BASE_TRACKS_A.map((t) => ({
    ...t,
    stream_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  })),
  "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22": BASE_TRACKS_B.map((t) => ({
    ...t,
    stream_id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
  })),
};

export const DEFAULT_MOCK_STREAM: Omit<MockStreamRecord, "id"> = {
  title: "Untitled Braindance Rehearsal #∞",
  artist: "You (feat. Impostor Syndrome)",
  youtube_url: MOCK_EMBED_YOUTUBE_URL,
  soundcloud_url: "https://soundcloud.com/example/braindance-default",
  duration: 3600 + 42 * 60,
  thumbnail: THUMB,
  created_at: "2026-04-11T16:20:00.000Z",
};

export const DEFAULT_MOCK_TRACKS_TEMPLATE: Omit<MockTrackRecord, "stream_id">[] =
  [
    {
      id: "d-001",
      timestamp: "00:00:01",
      artist: "Placeholder Industries",
      title: "Loading Bar (Never Resolves)",
      spotify_url: null,
      soundcloud_url: null,
    },
    {
      id: "d-002",
      timestamp: "00:12:34",
      artist: "Mock Data Collective",
      title: "This Is Fine (Fire Emoji Remix)",
      spotify_url: "https://open.spotify.com/track/3AhXZa8sUQht0UTdSvFyXY",
      soundcloud_url: null,
    },
    {
      id: "d-003",
      timestamp: "00:45:00",
      artist: "UI Builder",
      title: "Ship It (WIP Forever Dub)",
      spotify_url: null,
      soundcloud_url: "https://soundcloud.com/example/ship-it",
    },
  ];
