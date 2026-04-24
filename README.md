# Iran Market Dashboard

Cloudflare Pages-ready static dashboard with a Pages Function proxy for Yahoo Finance quotes.

## Local preview

```sh
npm install
npm run dev
```

Open the local URL printed by Wrangler. Opening `index.html` directly in the browser will not load market data because `/api/quote` only exists in Cloudflare Pages/Wrangler.

## Deploy

```sh
npm run deploy
```

In Cloudflare Pages, set the project root to this folder and the build output directory to `/` or leave build settings empty for static deployment.
