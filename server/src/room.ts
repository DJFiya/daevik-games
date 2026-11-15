import { Server, type Connection, type WSMessage } from "partyserver";
import {
  ClientMessage,
  MAX_MESSAGE_BYTES,
  MAX_PLAYERS,
  type Player,
  type ServerMessage,
} from "@daevik-games/shared";

type PlayerState = { name: string } | null;

export class Room extends Server<Env> {
  static options = { hibernate: true };

  onConnect(connection: Connection<PlayerState>) {
    send(connection, { type: "welcome", you: connection.id });
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
        if (!connection.state && this.players().length >= MAX_PLAYERS) {
          send(connection, { type: "rejected", reason: "full" });
          connection.close(4000, "full");
          return;
        }
        connection.setState({ name: message.name });
        this.broadcastPlayers();
      }
    }
  }

  onClose() {
    this.broadcastPlayers();
  }

  private players(): Player[] {
    const players: Player[] = [];
    for (const c of this.getConnections<PlayerState>()) {
      if (c.state) players.push({ id: c.id, name: c.state.name });
    }
    return players;
  }

  private broadcastPlayers() {
    const message: ServerMessage = { type: "players", players: this.players() };
    this.broadcast(JSON.stringify(message));
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
