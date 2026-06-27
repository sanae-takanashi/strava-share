# Strava Ride Share

Turn a Strava ride into a clean, modern share image — your route drawn on a real map plus
the stats you care about. Built to replace Strava's bland default share card.

- **Connect with Strava** → browse your recent rides → pick one
- Customize: **format** (9:16 story / 1:1 square), **theme**, **units**, **map style**, and
  **which stats** to feature
- Live preview, one-click **PNG download**

Stack: Next.js (App Router) · server-side image generation with `next/og` (Satori) ·
Mapbox Static Images for the route map · `iron-session` cookie sessions (no database).

---

## 1. Get your credentials

### Strava API application
1. Go to <https://www.strava.com/settings/api> and create an application (any name/website).
2. Set **Authorization Callback Domain** to the host you'll run on — **domain only, no scheme
   or path**:
   - local dev → `localhost`
   - server → your domain or IP, e.g. `rides.example.com` or `203.0.113.10`
3. Copy the **Client ID** and **Client Secret**.

### Mapbox token
1. Create a free account at <https://account.mapbox.com/>.
2. Copy your **default public token** (starts with `pk.`), or create a scoped one with the
   "Static Images" scope.

> Free tiers are plenty for personal use: Strava allows 200 requests / 15 min (2000 / day);
> Mapbox allows 50,000 static image loads / month.

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
| `MAPBOX_TOKEN`         | your `pk.…` token                                                |
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
  (`map.summary_polyline`) is overlaid on a Mapbox static map, fetched server-side and
  embedded as a data URI (`lib/mapbox.ts`), then composited under the stats by `ShareCard`.

Fonts: `assets/fonts/Inter.ttf` is bundled and loaded at render time — no runtime font fetch.

> Per Strava's API brand guidelines, generated images include a "Powered by Strava" mark.
