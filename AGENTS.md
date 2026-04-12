# Agent notes (Braindance frontend)

Use this file to orient quickly when editing or reviewing the codebase.

## What this repo is

A **Next.js App Router** frontend: marketing home, DJ set discovery (`/events`), public stream page (`/stream/[eventId]`), host tools, and thin **API routes** that proxy an optional **external Braindance backend** (`BACKEND_URL`). **Supabase** holds hosted events, links, feedback/contact, and stream metadata for the “hosted event” path.

## Find things fast

| Topic | Where |
|-------|--------|
| Global layout, nav chrome | `src/app/layout.tsx` (Header, Footer, main padding vars `--nav-header-h`, `--nav-footer-h`) |
| Home / featured sets | `src/app/page.tsx` → fetches `/api/dj-sets` |
| DJ sets grid, filters | `src/app/events/page.tsx` |
| Public stream + tracklist | `src/app/stream/[eventId]/page.tsx` |
| Host live stream + photos | `src/app/host/[hostId]/[eventId]/stream/page.tsx` |
| DJ sets proxy | `src/app/api/dj-sets/route.ts` |
| Pipeline streams proxy | `src/app/api/streams/[id]/route.ts`, `.../tracks/route.ts` |
| Shared backend fetch | `src/app/lib/backend/http.ts` |
| YouTube embed URL + allow list | `src/app/lib/utils/youtube.ts` |
| Stream UI mocks | `src/app/lib/mocks/streamFixtures.ts`, `streamMocks.ts`; env `STREAM_UI_MOCKS` |
| Supabase client | `src/app/lib/utils/supabaseClient.ts` |
| Glass / motion tokens | `src/app/globals.css` (`glass-bends-card`, `ease-bends`, `motion-enter`) |
| DJ set cards | `src/app/components/dj-sets/StreamCard.tsx` |
| Event posters | `src/app/components/user/Poster.tsx` |
| Globe heatmap | `src/app/components/GlobeHeatmap.tsx` — **must** be imported with `next/dynamic({ ssr: false })` from pages (not SSR-safe) |

## Stream page resolution order (`/stream/[eventId]`)

1. If `eventId` looks like a **UUID** → `GET /api/streams/:id` (pipeline). Success + `youtube_url` → load tracks, pipeline UI.  
2. Else **Supabase** event streams + links + event row.  
3. Else **`POST /api/dj-sets`** with `videoId` = raw `eventId` (YouTube id path).

Do not assume one id type; the same route handles UUID, event id, and YouTube video id depending on data.

## Conventions (match existing code)

- Prefer **small, focused diffs**; don’t refactor unrelated files.  
- **Don’t** statically import `react-globe.gl` in modules that SSR; use **`dynamic(..., { ssr: false })`** at the page level.  
- API routes: use **`BACKEND_URL`** / **`BACKEND_URL_BACKUP`** via `src/app/lib/backend/http.ts` for consistency.  
- New env vars: document in **README.md** environment table.

## Testing API proxies locally

```bash
curl -s "http://localhost:3000/api/dj-sets" | head
curl -s "http://localhost:3000/api/streams/<uuid>" | head
```

With `STREAM_UI_MOCKS=1`, streams routes return fixtures without a real backend.
