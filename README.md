# Strava Ride Share

Turn a Strava ride into a clean, modern share image — your route drawn on a real map plus
the stats you care about. Built to replace Strava's bland default share card.

- **Connect with Strava** → browse your recent rides → pick one
- Customize: **format** (9:16 story / 1:1 square), **theme**, **units**, **map style**, and
  **which stats** to feature
- Live preview, one-click **PNG download**

Stack: Next.js (App Router) · server-side image generation with `next/og` (Satori) ·
Stadia Maps Static Images for the route map (optional, with a keyless fallback) ·
`iron-session` cookie sessions (no database).

---

## 1. Get your credentials

### Strava API application
1. Go to <https://www.strava.com/settings/api> and create an application (any name/website).
2. Set **Authorization Callback Domain** to the host you'll run on — **domain only, no scheme
   or path**:
   - local dev → `localhost`
   - server → your domain or IP, e.g. `rides.example.com` or `203.0.113.10`
3. Copy the **Client ID** and **Client Secret**.

### Stadia Maps key (optional — for a real base map)
1. Create a free account (no credit card) at <https://client.stadiamaps.com/signup/>.
2. Create a property and copy its **API key**.

> The Stadia key is **optional**. Without it, rides still render — the route is drawn on a
> styled background instead of a real map. With it, the route sits on real map tiles
> (outdoors / terrain / satellite / dark / light).

> Free tiers are plenty for personal use: Strava allows 200 requests / 15 min (2000 / day);
> Stadia's free tier is ~125 static maps / month. If you exceed it, the app automatically
> falls back to the keyless styled route.

## 2. Configure

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable               | Value                                                            |
| ---------------------- | ---------------------------------------------------------------- |
| `STRAVA_CLIENT_ID`     | from the Strava app                                              |
| `STRAVA_CLIENT_SECRET` | from the Strava app                                              |
| `STRAVA_REDIRECT_URI`  | `http://localhost:3000/api/auth/callback` (match your host/port) |
| `STADIA_API_KEY`       | optional — Stadia Maps key for a real base map                   |
| `SESSION_SECRET`       | 32+ random chars — `openssl rand -base64 32`                     |
| `APP_BASE_URL`         | `http://localhost:3000` (or your public URL)                     |

The `STRAVA_REDIRECT_URI` path must be `/api/auth/callback`, and its host must match the
Strava app's Authorization Callback Domain.

## 3. Run

### Local (development)

```bash
npm install
npm run dev
# open http://localhost:3000
```

### Docker (self-hosted)

```bash
# .env in this directory is read automatically by docker compose
docker compose up --build
# open http://localhost:3000 (or your server URL)
```

When deploying to a server, set `APP_BASE_URL` and `STRAVA_REDIRECT_URI` to the public URL,
and the Strava app's callback domain to that host.

---

## How it works

- `app/api/auth/*` — Strava OAuth (scope `activity:read`); tokens are stored in an encrypted,
  HTTP-only session cookie and auto-refreshed (`lib/strava.ts`).
- `app/activities` — lists your recent rides.
- `app/editor/[id]` — controls + a live `<img>` preview that points straight at the image
  route, so the preview is exactly what you download.
- `app/api/share-image` — renders the card to PNG with `next/og`. The route polyline
  (`map.summary_polyline`) is overlaid on a Stadia Maps static map, fetched server-side and
  embedded as a data URI (`lib/map.ts`). If there's no Stadia key or the fetch fails, the
  polyline is decoded (`lib/polyline.ts`) and drawn as an SVG route on a styled background.

Fonts: `assets/fonts/Inter.ttf` is bundled and loaded at render time — no runtime font fetch.

> Per Strava's API brand guidelines, generated images include a "Powered by Strava" mark.
