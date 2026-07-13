---
name: PWA service worker masks dev fixes
description: A cache-first service worker registered during development can serve a stale/broken bundle indefinitely, making legitimate code fixes appear not to take effect.
---

## The problem

If a PWA-style `sw.js` is registered unconditionally (in `main.tsx`/`index.tsx`) and its
`fetch` handler is cache-first (`caches.match(request) || fetch(...)`), then once a page/route
has been loaded once with a bug present, the browser's Cache Storage permanently serves that
broken response for the same request — even after the source is fixed and the workflow is
restarted. Restarting the server does nothing because the browser never asks the network again
for that URL. Symptoms: a blank page or a render error that doesn't change no matter what you
fix in the source, especially confusing because *other* routes not yet visited/cached work fine.

**Why:** SW-controlled fetches happen entirely client-side, ahead of network dispatch — server
logs stay clean and workflow restarts are irrelevant. The active worker keeps controlling
already-open/soon-to-be-opened clients via `clients.claim()`, and its own cached response wins
before the new build is ever requested.

## How to apply

- Register the service worker only in production builds (gate on `import.meta.env.PROD` or
  equivalent), never in dev. In dev, actively unregister any existing SW and clear
  `caches.keys()` on load as a safety net for anyone who loaded an older build.
- Prefer a network-first `fetch` strategy in the SW itself (try network, fall back to cache),
  not cache-first — this keeps production resilient to being offline while never pinning a
  stale bundle when online.
- If you suspect this while debugging a "fix doesn't seem to apply" issue in a screenshot/browser
  tool that reuses a persistent profile, append a throwaway query string to the URL
  (e.g. `?cachebust=2`) — a cache-first SW keys on exact request URL, so a new query string
  forces a real network fetch and reveals whether the source fix actually works.
