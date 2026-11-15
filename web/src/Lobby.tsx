import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { PlayerName } from "@daevik-games/shared";
import { loadName, saveName } from "./name";
import SiteHeader from "./SiteHeader";
import "./odd-one.css";

const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export default function Lobby() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [name, setName] = useState(loadName);
  const [code, setCode] = useState(params.get("code") ?? "");
  const nameOk = PlayerName.safeParse(name).success;
  const tooShort = name.trim().length > 0 && !nameOk;

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
      <main className="stage odd-one-theme">
        <div className="stage-inner">
          <h1 className="show-title">The Odd One</h1>
          <div className="stage-bands" aria-hidden="true" />
          <div className="name-field">
            <label htmlFor="player-name">Your name</label>
            <input
              id="player-name"
              className="name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              autoComplete="nickname"
              placeholder="Ben..."
            />
            {tooShort && <p className="field-error">Names need 3 to 20 characters.</p>}
          </div>
          <div className="menu">
            <section className="menu-card" aria-labelledby="new-game">
              <h2 id="new-game">New game</h2>
              <button className="btn btn-primary" disabled={!nameOk} onClick={() => go(newCode())}>
                Start new game
              </button>
            </section>
            <form className="menu-card" aria-labelledby="join-game" onSubmit={join}>
              <h2 id="join-game">Join a game</h2>
              <div className="join-row">
                <label htmlFor="room-code" className="visually-hidden">
                  Room code
                </label>
                <input
                  id="room-code"
                  className="code-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={12}
                  spellCheck={false}
                  autoCapitalize="off"
                  placeholder="Code"
                />
                <button type="submit" className="btn btn-primary" disabled={!nameOk || !code.trim()}>
                  Join
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
