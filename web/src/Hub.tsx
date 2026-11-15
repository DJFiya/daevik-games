import { Link } from "react-router";
import { MAX_PLAYERS } from "@daevik-games/shared";
import SiteHeader from "./SiteHeader";
import "./odd-one.css";

export default function Hub() {
  return (
    <>
      <SiteHeader home />
      <main className="page">
        <ul className="games">
          <li>
            <Link to="/odd-one" className="game">
              <OddOneArt />
              <div className="game-text">
                <h2>The Odd One</h2>
                <p>Everyone gets the same word except one player. Give a clue each, then vote out who's bluffing.</p>
                <p className="meta">Up to {MAX_PLAYERS} players</p>
              </div>
            </Link>
          </li>
        </ul>
      </main>
    </>
  );
}

function OddOneArt() {
  // Five game-show podiums; the raised one is you.
  const podiums = [0, 1, 2, 3, 4];
  return (
    <svg className="game-art odd-one-theme" viewBox="0 0 320 160" aria-hidden="true">
      <rect width="320" height="160" style={{ fill: "var(--oo-wall)" }} />
      <rect y="62" width="320" height="10" style={{ fill: "var(--oo-band-a)" }} />
      <rect y="72" width="320" height="6" style={{ fill: "var(--oo-band-b)" }} />
      {podiums.map((i) => {
        const raised = i === 2;
        const x = 22 + i * 58;
        const top = raised ? 92 : 106;
        return (
          <g key={i}>
            <rect x={x + 6} y={top - 12} width="38" height="10" style={{ fill: "var(--oo-plate)" }} />
            <polygon points={`${x + 3},${top} ${x + 47},${top} ${x + 50},160 ${x},160`} style={{ fill: raised ? "var(--oo-podium-you)" : "var(--oo-podium)" }} />
          </g>
        );
      })}
    </svg>
  );
}
