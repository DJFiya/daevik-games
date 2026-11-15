import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { MAX_PLAYERS, MIN_PLAYERS, ServerMessage } from "@daevik-games/shared";

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
  await c.next("phase");
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
    expect((await a.next("players")).players).toEqual([{ id: a.you, name: "Ana", host: true }]);

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
    for (const bad of ["not json", { type: "join", name: "" }, { type: "join", name: "ab" }, { type: "join", name: "x".repeat(21) }, { type: "nope" }, "x".repeat(5000)]) {
      a.send(bad);
      expect(await a.next("rejected")).toEqual({ type: "rejected", reason: "invalid" });
    }
    expect(a.inbox.filter((m) => m.type === "players")).toEqual([]);
  });

  it("turns away a joiner once the room is full", async () => {
    for (let i = 0; i < MAX_PLAYERS; i++) await (await joined("full", `player${i}`)).next("players");
    const late = await connect("full");
    if (!late.ws) throw new Error("connect failed");
    await late.next("welcome");
    late.send({ type: "join", name: "late" });
    expect(await late.next("rejected")).toEqual({ type: "rejected", reason: "full" });
  });

  it("makes the first joiner host and hands it on when they leave", async () => {
    const a = await joined("host", "Ana");
    await a.next("players");
    const b = await joined("host", "Ben");
    await b.next("players");
    const hostOf = (m: { players: { name: string; host: boolean }[] }) => m.players.filter((p) => p.host).map((p) => p.name);
    expect(hostOf(await a.next("players"))).toEqual(["Ana"]);
    a.ws.close(1000, "bye");
    expect(hostOf(await b.next("players"))).toEqual(["Ben"]);
  });

  it("only lets the host start, and only with enough players", async () => {
    const room = "start";
    const players = [];
    for (let i = 0; i < MIN_PLAYERS; i++) {
      const p = await joined(room, `player${i}`);
      await p.next("players");
      players.push(p);
    }
    const [host, guest] = players;

    guest.send({ type: "start" });
    expect(await guest.next("rejected")).toEqual({ type: "rejected", reason: "invalid" });

    host.send({ type: "start" });
    for (const p of players) expect(await p.next("phase")).toEqual({ type: "phase", phase: "playing" });

    const late = await connect(room);
    if (!late.ws) throw new Error("connect failed");
    await late.next("welcome");
    expect(await late.next("phase")).toEqual({ type: "phase", phase: "playing" });
    late.send({ type: "join", name: "late" });
    expect(await late.next("rejected")).toEqual({ type: "rejected", reason: "started" });
  });

  it("refuses to start below the minimum player count", async () => {
    const host = await joined("too-few", "Ana");
    await host.next("players");
    host.send({ type: "start" });
    expect(await host.next("rejected")).toEqual({ type: "rejected", reason: "invalid" });
    expect(host.inbox.filter((m) => m.type === "phase" && m.phase === "playing")).toEqual([]);
  });

  it("goes back to the lobby once everyone has left", async () => {
    const players = [];
    for (let i = 0; i < MIN_PLAYERS; i++) {
      const p = await joined("reset", `player${i}`);
      await p.next("players");
      players.push(p);
    }
    players[0].send({ type: "start" });
    await players[0].next("phase");
    for (const p of players) p.ws.close(1000, "bye");
    await new Promise((r) => setTimeout(r, 50));

    const back = await connect("reset");
    if (!back.ws) throw new Error("connect failed");
    expect(await back.next("phase")).toEqual({ type: "phase", phase: "lobby" });
  });
});
