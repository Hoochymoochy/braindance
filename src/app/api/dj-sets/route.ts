import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

type DjSet = {
  video_id: string;
  title: string;
  channel: string;
  published_at: string;
  thumbnail?: string;
  url: string;
  fetched_at: string;
  view_count?: number;
  duration_seconds?: number;
};

type StoredDjSets = {
  updated_at?: string;
  count?: number;
  items?: DjSet[];
};

const DATA_PATH = path.join(process.cwd(), "backend", "data", "dj_sets.json");
const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_DURATION_SECONDS = 30 * 60;

/** Keep legacy rows that never got duration_seconds; only drop known-short videos. */
function passesDurationFilter(item: DjSet): boolean {
  const d = item.duration_seconds;
  if (d == null || Number.isNaN(d)) return true;
  return d >= MIN_DURATION_SECONDS;
}

function withinDays(isoDate: string, days: number): boolean {
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return false;
  return Date.now() - timestamp <= days * DAY_MS;
}

function sortByViewsDesc(items: DjSet[]): DjSet[] {
  return [...items].sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0));
}

function topViewed(items: DjSet[], days: number, limit = 6): DjSet[] {
  const scoped = items.filter((item) => withinDays(item.published_at, days));
  if (scoped.length === 0) {
    return sortByViewsDesc(items).slice(0, limit);
  }
  return sortByViewsDesc(scoped).slice(0, limit);
}

export async function GET() {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw) as StoredDjSets;
    const items = (parsed.items ?? []).filter(
      (item) => Boolean(item.video_id) && passesDurationFilter(item)
    );

    const payload = {
      updatedAt: parsed.updated_at ?? null,
      count: parsed.count ?? items.length,
      currentSets: items,
      featured: {
        daily: topViewed(items, 1, 4),
        weekly: topViewed(items, 7, 6),
      },
    };

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      {
        updatedAt: null,
        count: 0,
        currentSets: [],
        featured: { daily: [], weekly: [] },
      },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { videoId?: string };
    const videoId = body.videoId?.trim();
    if (!videoId) {
      return NextResponse.json({ item: null }, { status: 400 });
    }

    const raw = await fs.readFile(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw) as StoredDjSets;
    const items = (parsed.items ?? []).filter(
      (item) => Boolean(item.video_id) && passesDurationFilter(item)
    );
    const item = items.find((entry) => entry.video_id === videoId) ?? null;
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ item: null }, { status: 200 });
  }
}
