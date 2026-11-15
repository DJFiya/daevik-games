import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { MAX_PLAYERS, ServerMessage } from "@daevik-games/shared";

const ORIGIN = "http://localhost:5173";

async function connect(room: string, origin = ORIGIN) {
  const res = await exports.default.fetch(`https://games-api.daevik.ca/parties/room/${room}`, {
    headers: { Upgrade: "websocket", Origin: origin },
  });
  const ws = res.webSocket;
  if (!ws) return { status: res.status };
  const inbox: ServerMessage[] = [];
  const waiters: Array<() => void> = [];
  ws.addEventListener("message", (e) => {
    inbox.push(ServerMessage.parse(JSON.parse(e.data as string)));
    waiters.splice(0).forEach((w) => w());
  });
  ws.accept();
  const next = async <T extends ServerMessage["type"]>(type: T) => {
    for (;;) {
      const i = inbox.findIndex((m) => m.type === type);
      if (i >= 0) return inbox.splice(i, 1)[0] as Extract<ServerMessage, { type: T }>;
      await new Promise<void>((r) => waiters.push(r));
    }
  };
  const send = (data: unknown) => ws.send(typeof data === "string" ? data : JSON.stringify(data));
  return { status: res.status, ws, next, send, inbox };
}

async function joined(room: string, name: string) {
  const c = await connect(room);
  if (!c.ws) throw new Error(`connect failed: ${c.status}`);
  const { you } = await c.next("welcome");
  await c.next("players");
  c.send({ type: "join", name });
  return { ...c, you };
}

describe("room server", () => {
  it("refuses sockets from origins not on the allowlist", async () => {
    expect((await connect("a", "https://evil.example")).status).toBe(403);
  });

  it("refuses plain HTTP requests to rooms", async () => {
    const res = await exports.default.fetch("https://games-api.daevik.ca/parties/room/a");
    expect(res.status).toBe(403);
  });

  it("broadcasts the player list when players join and leave", async () => {
    const a = await joined("join-leave", "Ana");
    expect((await a.next("players")).players).toEqual([{ id: a.you, name: "Ana" }]);

    const b = await joined("join-leave", "Ben");
    const names = (m: { players: { name: string }[] }) => m.players.map((p) => p.name).sort();
    expect(names(await a.next("players"))).toEqual(["Ana", "Ben"]);
    expect(names(await b.next("players"))).toEqual(["Ana", "Ben"]);

    b.ws.close(1000, "bye");
    expect(names(await a.next("players"))).toEqual(["Ana"]);
  });

  it("rejects malformed and oversized messages without changing state", async () => {
    const a = await joined("invalid", "Ana");
    await a.next("players");
    for (const bad of ["not json", { type: "join", name: "" }, { type: "nope" }, "x".repeat(5000)]) {
      a.send(bad);
      expect(await a.next("rejected")).toEqual({ type: "rejected", reason: "invalid" });
    }
    expect(a.inbox.filter((m) => m.type === "players")).toEqual([]);
  });

  it("turns away a joiner once the room is full", async () => {
    for (let i = 0; i < MAX_PLAYERS; i++) await (await joined("full", `p${i}`)).next("players");
    const late = await connect("full");
    if (!late.ws) throw new Error("connect failed");
    await late.next("welcome");
    late.send({ type: "join", name: "late" });
    expect(await late.next("rejected")).toEqual({ type: "rejected", reason: "full" });
  });
});
