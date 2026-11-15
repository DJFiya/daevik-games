import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import usePartySocket from "partysocket/react";
import { ServerMessage, type ClientMessage, type Player } from "@daevik-games/shared";
import { loadName } from "./name";

type Status = "connecting" | "open" | "reconnecting" | "full";

export default function Room() {
  const { code = "" } = useParams();
  const [name] = useState(loadName);
  const [status, setStatus] = useState<Status>("connecting");
  const [players, setPlayers] = useState<Player[]>([]);
  const [you, setYou] = useState<string>();
  const [copied, setCopied] = useState(false);

  const socket = usePartySocket({
    host: import.meta.env.VITE_SERVER_HOST,
    party: "room",
    room: code,
    enabled: Boolean(name) && status !== "full",
    onOpen() {
      setStatus("open");
      const join: ClientMessage = { type: "join", name };
      socket.send(JSON.stringify(join));
    },
    onClose() {
      setStatus((s) => (s === "full" ? s : "reconnecting"));
    },
    onMessage(event) {
      const parsed = parseServerMessage(event.data);
      if (!parsed?.success) return;
      const msg = parsed.data;
      if (msg.type === "welcome") setYou(msg.you);
      if (msg.type === "players") setPlayers(msg.players);
      if (msg.type === "rejected" && msg.reason === "full") setStatus("full");
    },
  });

  // A page kept in the back/forward cache would otherwise hold its socket open as a ghost player.
  useEffect(() => {
    const leave = () => socket.close();
    const back = (e: PageTransitionEvent) => e.persisted && socket.reconnect();
    window.addEventListener("pagehide", leave);
    window.addEventListener("pageshow", back);
    return () => {
      window.removeEventListener("pagehide", leave);
      window.removeEventListener("pageshow", back);
    };
  }, [socket]);

  if (!name) return <Navigate to="/" replace />;

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const label = { connecting: "Connecting", reconnecting: "Reconnecting", open: `${players.length} in the room` };

  return (
    <main className="page">
      <Link to="/" className="back">
        Leave
      </Link>
      <h1 className="code">{code}</h1>
      <button onClick={copyLink}>{copied ? "Link copied" : "Copy invite link"}</button>
      {status === "full" ? (
        <p className="notice">This room is full.</p>
      ) : (
        <>
          <p className="status" data-status={status}>
            {label[status]}
          </p>
          <ul className="players">
            {players.map((p) => (
              <li key={p.id}>
                {p.name}
                {p.id === you && <span className="you">you</span>}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

function parseServerMessage(data: string) {
  try {
    return ServerMessage.safeParse(JSON.parse(data));
  } catch {
    return null;
  }
}
