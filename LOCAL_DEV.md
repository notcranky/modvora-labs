# Local dev stability notes

If the Next dev server ever starts acting weird again (listening but returning bad responses, hanging after edits, or showing stale compile behavior), use this order:

1. `npm run typecheck` — catches broken TS/TSX quickly, including root files like `app/layout.tsx`
2. `npm run dev:clean` — wipes `.next` and old dev logs before starting Next again
3. `npm run build` — confirms the app can compile from a clean state

Useful scripts:

- `npm run clean` — remove `.next` and the captured dev logs
- `npm run dev:clean` — clean start for local dev
- `npm run dev:doctor` — clean + typecheck + start dev server
- `npm run check` — lint + typecheck

Why this exists:

- this repo has already hit stale `.next` cache behavior
- a corrupted root file can make dev feel hung even when the process is still listening
- the quickest recovery is a clean cache plus a fast syntax/type pass
