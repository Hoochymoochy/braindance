import {
  DEFAULT_MOCK_STREAM,
  DEFAULT_MOCK_TRACKS_TEMPLATE,
  MOCK_STREAM_PRESETS,
  MOCK_TRACK_PRESETS,
  type MockStreamRecord,
  type MockTrackRecord,
} from "@/app/lib/mocks/streamFixtures";

/** When true, `/api/streams/*` serves fixtures instead of hitting BACKEND_URL. */
export function isStreamUiMocksEnabled(): boolean {
  const v = process.env.STREAM_UI_MOCKS?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function getMockStream(id: string): MockStreamRecord {
  const preset = MOCK_STREAM_PRESETS[id];
  if (preset) return preset;
  return { ...DEFAULT_MOCK_STREAM, id };
}

export function getMockTracksForStream(id: string): MockTrackRecord[] {
  const preset = MOCK_TRACK_PRESETS[id];
  if (preset) return preset;
  return DEFAULT_MOCK_TRACKS_TEMPLATE.map((t) => ({ ...t, stream_id: id }));
}
