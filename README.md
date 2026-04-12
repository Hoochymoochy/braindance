# Braindance (frontend)

Next.js app for **Braindance**: home and discovery for DJ sets, hosted event streams, and (when wired up) the **Braindance pipeline API** (streams + tracklists from your separate Node backend).

## Stack

- **Next.js 15** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS** + shared glass styles in `src/app/globals.css` (`glass-bends`, `glass-bends-card`, motion helpers like `ease-bends`)
- **Supabase** (client) for hosted events, streams table, links, heatmap/geo, feedback/contact tables
- **Optional HTTP backend** proxied via `BACKEND_URL` (DJ sets list, per-video metadata, pipeline `GET /streams/...`)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run lint
npm test        # Jest
```

---

## Environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (browser) |
| `JWT_SECRET` | Host auth (JWT verify in `ProtectedRoute` / host flows) |
| `BACKEND_URL` | Origin of the **external** API (e.g. `http://localhost:3000` or `https://api.example.com`). Used by `/api/dj-sets` and `/api/streams/*`. Trailing paths like `/dj-sets` are normalized away. |
| `BACKEND_URL_BACKUP` | Optional second origin; used when primary fails or returns empty for DJ sets |
| `STREAM_UI_MOCKS` | Set to `1` / `true` / `yes` so **`/api/streams/:id`** and **`/api/streams/:id/tracks`** return **mock JSON** (no backend). Good for UI work. |
| `NEXT_PUBLIC_SITE_URL` | e.g. `https://braindance.live` — passed as YouTube embed `origin` (see `src/app/lib/utils/youtube.ts`) |
| `NEXT_PUBLIC_YOUTUBE_EMBED_HOST` | Set to `nocookie` to use `youtube-nocookie.com` embeds |
| `NEXT_PUBLIC_TWITCH_PARENT` | Hostname Twitch allows for embeds (e.g. `localhost` locally, your domain in prod). Defaults to `localhost` if unset. |

Copy from your hoster / Supabase dashboard; there is no committed `.env` in-repo.

---

## App routes (pages)

All live under `src/app/`. Global **Header** + **Footer** + padded `<main>` come from `src/app/layout.tsx`.

| Route | What it does |
|-------|----------------|
| `/` | Home: hero, story cards, featured DJ sets from **`GET /api/dj-sets`** |
| `/events` | DJ set grid, filters, “Random set”, featured + paginated sets; **`EventLayout`** may show live/upcoming **Supabase events** as posters |
| `/stream/[eventId]` | Public stream viewer. **`eventId`** interpretation below. |
| `/stream/[eventId]/photo-upload` | Photo upload for an event |
| `/policy`, `/feedback`, `/contact` | Static-ish content + forms writing to Supabase utilities |
| `/host/login`, `/host/sign-up` | Host auth |
| `/host/[hostId]/dashboard` | Host dashboard |
| `/host/[hostId]/[eventId]/stream` | Host view: stream + photo review + stats + globe |

---

## How `/stream/[eventId]` picks a source

`eventId` is a **string** from the URL.

1. **UUID** (RFC shape)  
   - Try **pipeline**: `GET /api/streams/:id` → if `200` and body has `youtube_url`, treat as Braindance pipeline stream.  
   - Then `GET /api/streams/:id/tracks` for the sidebar tracklist.  
   - Embeds use `buildYoutubeEmbedSrc()` in `src/app/lib/utils/youtube.ts`.  
   - If that fails or no `youtube_url`, fall through.

2. **Supabase event**  
   - `getStreams(eventId)`, `getLinks`, `getEventById`, optional views + city for UUIDs.  
   - Stats + **GlobeHeatmap** when it’s a DB event (`isDbEvent`).

3. **YouTube video id** (11 chars, common fallback)  
   - `POST /api/dj-sets` with `{ "videoId": eventId }` → proxies to backend `GET /dj-sets/:videoId`.

**Globe:** `GlobeHeatmap` is loaded with **`next/dynamic({ ssr: false })`** from the stream/host pages so `react-globe.gl` never runs on the server (`window` / WebGL).

---

## Next.js API routes (proxies)

Implemented in `src/app/api/`. They call **`BACKEND_URL`** (and optional backup) except when mocks are on for streams.

| App route | Upstream (typical) | Notes |
|-----------|--------------------|--------|
| `GET /api/dj-sets` | `GET {BACKEND_URL}/dj-sets` | Shapes `featured`, `currentSets`, filters by duration in route |
| `POST /api/dj-sets` | `GET {BACKEND_URL}/dj-sets/:videoId` | Body: `{ "videoId": "..." }` |
| `GET /api/streams/[id]` | `GET {BACKEND_URL}/streams/:id` | Mock if `STREAM_UI_MOCKS` |
| `GET /api/streams/[id]/tracks` | `GET {BACKEND_URL}/streams/:id/tracks` | Response may normalize to `{ tracks: [...] }` |

Shared fetch helpers: `src/app/lib/backend/http.ts`.

---

## Example JSON shapes

**Pipeline stream** (from your Braindance API / mocks):

```json
{
  "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "title": "Example set",
  "artist": "DJ Name",
  "youtube_url": "https://www.youtube.com/watch?v=jfKfPfyJRdk",
  "soundcloud_url": null,
  "duration": 3600,
  "thumbnail": "https://i.ytimg.com/vi/.../maxresdefault.jpg",
  "created_at": "2026-04-01T12:00:00.000Z",
  "backendSource": "mock"
}
```

**Tracks** (array or wrapped):

```json
{
  "tracks": [
    {
      "id": "t-001",
      "stream_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "timestamp": "00:04:12",
      "artist": "Artist",
      "title": "Track title",
      "spotify_url": "https://open.spotify.com/track/...",
      "soundcloud_url": null
    }
  ],
  "backendSource": "primary"
}
```

**DJ set card** (from `/api/dj-sets`, simplified):

```json
{
  "video_id": "abc123def45",
  "title": "Set title",
  "channel": "Channel name",
  "published_at": "2026-01-01T00:00:00.000Z",
  "thumbnail": "https://i.ytimg.com/...",
  "url": "https://www.youtube.com/watch?v=...",
  "view_count": 120000,
  "duration_seconds": 3600
}
```

---

## UI dev without the pipeline API

```bash
STREAM_UI_MOCKS=1 npm run dev
```

Open **`/stream/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11`** (preset in `src/app/lib/mocks/streamFixtures.ts`) or any UUID for default mock data. See comments in that file for preset IDs.

---

## Notable directories

| Path | Role |
|------|------|
| `src/app/` | App Router pages, layouts, API routes |
| `src/app/components/` | UI (Header, Footer, StreamCard, GlobeHeatmap, …) |
| `src/app/lib/` | Supabase helpers, backend HTTP, events, mocks |
| `src/components/` | Shared (e.g. `ColorBends`) |
| `_archive/` | Old/unused snippets kept for reference |

---

## Troubleshooting

- **`window is not defined` / globe / Three:** ensure globe imports stay **dynamic `ssr: false`** (see stream + host stream pages).  
- **Backend `fetch failed`:** see logs from API routes; test `BACKEND_URL` with `curl` from the same machine as Next.  
- **YouTube embed blocked:** set `NEXT_PUBLIC_SITE_URL`; optional `NEXT_PUBLIC_YOUTUBE_EMBED_HOST=nocookie`. Some videos disallow embedding (owner setting), which no code can override.

---

## Agent / AI helper

See **[AGENTS.md](./AGENTS.md)** for a quick map of where features live and conventions used in this repo.
