import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import usePartySocket from "partysocket/react";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  ServerMessage,
  type ClientMessage,
  type Phase,
  type Player,
} from "@daevik-games/shared";
import { loadName } from "./name";
import SiteHeader from "./SiteHeader";
import "./odd-one.css";

type Status = "connecting" | "open" | "reconnecting" | "full" | "started";

export default function Room() {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const [name] = useState(loadName);
  const [status, setStatus] = useState<Status>("connecting");
  const [phase, setPhase] = useState<Phase>("lobby");
  const [players, setPlayers] = useState<Player[]>([]);
  const [you, setYou] = useState<string>();
  const [copied, setCopied] = useState(false);
  const turnedAway = status === "full" || status === "started";

  const socket = usePartySocket({
    host: import.meta.env.VITE_SERVER_HOST,
    party: "room",
    room: code,
    enabled: Boolean(name) && !turnedAway,
    onOpen() {
      setStatus("open");
      send({ type: "join", name });
    },
    onClose() {
      setStatus((s) => (s === "full" || s === "started" ? s : "reconnecting"));
    },
    onMessage(event) {
      const parsed = parseServerMessage(event.data);
      if (!parsed?.success) return;
      const msg = parsed.data;
      if (msg.type === "welcome") setYou(msg.you);
      if (msg.type === "players") setPlayers(msg.players);
      if (msg.type === "phase") setPhase(msg.phase);
      if (msg.type === "rejected" && msg.reason !== "invalid") setStatus(msg.reason);
    },
  });

  function send(message: ClientMessage) {
    socket.send(JSON.stringify(message));
  }

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

  if (!name) return <Navigate to={`/odd-one?code=${encodeURIComponent(code)}`} replace />;

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const youAreHost = players.some((p) => p.id === you && p.host);
  const missing = Math.max(0, MIN_PLAYERS - players.length);
  const open = Math.max(0, MAX_PLAYERS - players.length);

  let statusText = "";
  if (status === "connecting") statusText = "Connecting";
  else if (status === "reconnecting") statusText = "Reconnecting";
  else if (phase === "playing") statusText = "Game started";
  else if (!youAreHost) statusText = `Waiting for ${players.find((p) => p.host)?.name ?? "the host"} to start`;

  return (
    <>
      <SiteHeader />
      <main className="stage odd-one-theme">
        <div className="stage-inner">
          <div className="room-top">
            <div className="scoreboard">
              <span className="scoreboard-label">Room</span>
              <div className="code-row">
                <h1 className="flaps" aria-label={`Room ${code}`}>
                  {[...code.toUpperCase()].map((c, i) => (
                    <span key={i} className="flap" aria-hidden="true">
                      {c}
                    </span>
                  ))}
                </h1>
                {!turnedAway && (
                  <button className="btn btn-secondary" onClick={copyLink}>
                    {copied ? "Link copied" : "Copy link"}
                  </button>
                )}
              </div>
            </div>
            <button className="btn btn-secondary" onClick={() => navigate("/odd-one")}>
              Leave
            </button>
          </div>
          <div className="stage-bands" aria-hidden="true" />
          {turnedAway ? (
            <p className="stage-notice">
              {status === "full" ? "This room is full." : "This game has already started."}
            </p>
          ) : (
            <>
              <p className="player-count">
                {players.length} / {MAX_PLAYERS} players
              </p>
              <ul className="podiums">
                {players.map((p) => (
                  <li key={p.id} className={p.id === you ? "podium podium-you" : "podium"}>
                    <span className="plate">{p.name}</span>
                    <span className="podium-front">
                      <span className="tag">{[p.id === you && "You", p.host && "Host"].filter(Boolean).join(" · ")}</span>
                    </span>
                  </li>
                ))}
                {Array.from({ length: open }, (_, i) => (
                  <li key={`open-${i}`} className="podium podium-open" aria-label="Open spot">
                    <span className="plate" />
                    <span className="podium-front" />
                  </li>
                ))}
              </ul>
              <div className="room-action">
                {youAreHost && phase === "lobby" && status === "open" && (
                  <button className="btn btn-primary btn-large" disabled={missing > 0} onClick={() => send({ type: "start" })}>
                    {missing > 0 ? `Need ${missing} more to start` : "Start game"}
                  </button>
                )}
                {statusText && (
                  <p className="stage-status" role="status">
                    {statusText}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}

function parseServerMessage(data: string) {
  try {
    return ServerMessage.safeParse(JSON.parse(data));
  } catch {
    return null;
  }
}
