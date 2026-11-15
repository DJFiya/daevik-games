# daevik-games

Multiplayer browser games at games.daevik.ca.

## Layout

- `web/` Vite + React client, hosted on Vercel at `games.daevik.ca`.
- `server/` Cloudflare Worker; one Durable Object per room (PartyServer), served at `games-api.daevik.ca`.
- `shared/` message schemas (zod) imported by both sides. The wire format lives only here.

## Commands

- `npm install` at the root (npm workspaces).
- `npm run dev -w server` (port 8787) and `npm run dev -w web` (port 5173) in two terminals.
- Before each commit: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

## Multiplayer rules

- The server owns game state. Clients send intents; the server validates, applies and broadcasts.
- Every incoming message is parsed with a `shared/` schema. Invalid messages are dropped, never trusted.
- Per-player data lives in `connection.setState` so it survives hibernation; never in plain class fields.
- Only origins in `ALLOWED_ORIGINS` (server/wrangler.jsonc) may open a socket.
- Errors and ids for debugging go to server logs, never into messages players see.

## Design rules

Use the local design skills (impeccable, emil-design-eng, design-taste-frontend, animation skills) for any UI work. They are installed per machine and gitignored.

The UI must not read as AI-generated:
- No glossy rounded tiles with thin neon line icons, no glows, no gradient-for-polish, no stacked drop shadows.
- No generic icon-library glyphs in uniform squares; draw from each game's own art and palette.
- No taglines, subtitles or explainer copy where the UI can speak for itself. Plain, confident copy, no puns.
- Default accent is slate blue, not green.
- Show personality through interaction, not text. Offer two or three visual options before a redesign.
- Check every screen at phone width and desktop before calling it done.

## Commits

One line, `type(component): one sentence`, lowercase. No body, no co-author or AI attribution. Split by independently testable part; no micro-commits. Small changes go straight to `main`.
