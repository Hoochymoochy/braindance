This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Edit pages under `src/app/`.

## DJ sets API proxy

`src/app/api/dj-sets/route.ts` calls your separate backend using `BACKEND_URL` (see `.env.example`).

- `GET /api/dj-sets` → backend `GET /dj-sets`
- `POST /api/dj-sets` with `{ "videoId": "..." }` → backend `GET /dj-sets/:video_id`

Logs for that route use **`process.stdout` / `process.stderr`** with a `[braindance]` prefix so they show in the same terminal as `npm run dev`. Trigger the route by loading a page that fetches `/api/dj-sets` or run:

```bash
curl -s "http://localhost:3000/api/dj-sets" | head
```

### If you see `fetch failed` / upstream errors

Node’s `fetch` hides the real reason behind `TypeError: fetch failed`; the API route now prints the full chain (e.g. `ECONNREFUSED`, TLS, DNS). From the same machine as `npm run dev`, check the backend directly:

```bash
curl -v "https://YOUR_HOST/dj-sets"
```

If `curl` works but Next still fails, compare IPv4 vs IPv6, firewall, or certificate hostname mismatch. Self-signed certs will fail until the cert is trusted or you terminate TLS on localhost and point `BACKEND_URL` at `http://127.0.0.1:...` via a tunnel.
