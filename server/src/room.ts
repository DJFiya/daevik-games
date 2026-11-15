import { Server, type Connection, type WSMessage } from "partyserver";
import {
  ClientMessage,
  MAX_MESSAGE_BYTES,
  MAX_PLAYERS,
  MIN_PLAYERS,
  type Phase,
  type Player,
  type ServerMessage,
} from "@daevik-games/shared";

type PlayerState = { name: string; order: number } | null;

export class Room extends Server<Env> {
  static options = { hibernate: true };

  onConnect(connection: Connection<PlayerState>) {
    send(connection, { type: "welcome", you: connection.id });
    send(connection, { type: "phase", phase: this.phase() });
    send(connection, { type: "players", players: this.players() });
  }

  onMessage(connection: Connection<PlayerState>, raw: WSMessage) {
    const parsed = typeof raw === "string" && raw.length <= MAX_MESSAGE_BYTES ? parse(raw) : null;
    if (!parsed?.success) {
      send(connection, { type: "rejected", reason: "invalid" });
      return;
    }
    const message = parsed.data;
    switch (message.type) {
      case "join": {
        if (!connection.state && this.phase() !== "lobby") {
          send(connection, { type: "rejected", reason: "started" });
          connection.close(4001, "started");
          return;
        }
        if (!connection.state && this.players().length >= MAX_PLAYERS) {
          send(connection, { type: "rejected", reason: "full" });
          connection.close(4000, "full");
          return;
        }
        connection.setState({ name: message.name, order: connection.state?.order ?? this.nextOrder() });
        this.broadcastPlayers();
        return;
      }
      case "start": {
        const players = this.players();
        const isHost = players.some((p) => p.id === connection.id && p.host);
        if (!isHost || players.length < MIN_PLAYERS || this.phase() !== "lobby") {
          send(connection, { type: "rejected", reason: "invalid" });
          return;
        }
        this.setPhase("playing");
        return;
      }
    }
  }

  onClose() {
    if (this.players().length === 0) this.ctx.storage.kv.delete("phase");
    this.broadcastPlayers();
  }

  private phase(): Phase {
    return this.ctx.storage.kv.get<Phase>("phase") ?? "lobby";
  }

  private setPhase(phase: Phase) {
    this.ctx.storage.kv.put("phase", phase);
    this.broadcast(JSON.stringify({ type: "phase", phase } satisfies ServerMessage));
  }

  // A counter, not Date.now(): Workers clocks only advance after I/O, so joins can share a timestamp.
  private nextOrder() {
    const order = (this.ctx.storage.kv.get<number>("order") ?? 0) + 1;
    this.ctx.storage.kv.put("order", order);
    return order;
  }

  // The earliest player still connected is the host, so leaving hands it on.
  private players(): Player[] {
    const joined: { id: string; name: string; order: number }[] = [];
    for (const c of this.getConnections<PlayerState>()) {
      if (c.state) joined.push({ id: c.id, ...c.state });
    }
    joined.sort((a, b) => a.order - b.order);
    return joined.map((p, i) => ({ id: p.id, name: p.name, host: i === 0 }));
  }

  private broadcastPlayers() {
    this.broadcast(JSON.stringify({ type: "players", players: this.players() } satisfies ServerMessage));
  }
}

function parse(raw: string) {
  try {
    return ClientMessage.safeParse(JSON.parse(raw));
  } catch {
    return null;
  }
}

function send(connection: Connection, message: ServerMessage) {
  connection.send(JSON.stringify(message));
}
