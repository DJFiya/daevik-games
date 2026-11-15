import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { PlayerName } from "@daevik-games/shared";
import { loadName, saveName } from "./name";
import SiteHeader from "./SiteHeader";

const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export default function Lobby() {
  const navigate = useNavigate();
  const [name, setName] = useState(loadName);
  const [code, setCode] = useState("");
  const nameOk = PlayerName.safeParse(name).success;

  function go(room: string) {
    saveName(name.trim());
    navigate(`/odd-one/${room}`);
  }

  function join(e: FormEvent) {
    e.preventDefault();
    const room = code.trim().toLowerCase();
    if (nameOk && room) go(room);
  }

  return (
    <>
      <SiteHeader />
      <main className="page narrow">
      <h1>The Odd One</h1>
      <label className="field">
        <span>Your name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} autoComplete="nickname" />
      </label>
      <button className="primary" disabled={!nameOk} onClick={() => go(newCode())}>
        Start a room
      </button>
      <form className="join" onSubmit={join}>
        <label className="field">
          <span>Room code</span>
          <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={12} spellCheck={false} />
        </label>
        <button type="submit" disabled={!nameOk || !code.trim()}>
          Join
        </button>
      </form>
      </main>
    </>
  );
}
