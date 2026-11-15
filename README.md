# daevik-games

Multiplayer browser games, live at https://games.daevik.ca.

- `web/` React client (Vercel)
- `server/` room server on Cloudflare Durable Objects
- `shared/` message schemas used by both

```sh
npm install
npm run dev -w server   # http://localhost:8787
npm run dev -w web      # http://localhost:5173
```
