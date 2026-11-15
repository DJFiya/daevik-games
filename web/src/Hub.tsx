import { Link } from "react-router";
import SiteHeader from "./SiteHeader";

export default function Hub() {
  return (
    <>
      <SiteHeader />
      <main className="page">
        <h1>Games</h1>
        <ul className="games">
          <li>
            <Link to="/odd-one" className="game">
              <OddOneArt />
              <div className="game-text">
                <h2>The Odd One</h2>
                <p>Everyone gets the same word except one player. Give a clue each, then vote out who's bluffing.</p>
                <p className="meta">3–10 players · about 5 min</p>
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
    <svg className="game-art" viewBox="0 0 320 160" aria-hidden="true">
      <rect width="320" height="160" fill="#2a3550" />
      <rect y="62" width="320" height="10" fill="#e2572b" />
      <rect y="72" width="320" height="6" fill="#f2b630" />
      {podiums.map((i) => {
        const raised = i === 2;
        const x = 22 + i * 58;
        const top = raised ? 92 : 106;
        return (
          <g key={i}>
            <rect x={x + 6} y={top - 12} width="38" height="10" fill="#efe6d2" />
            <polygon points={`${x + 3},${top} ${x + 47},${top} ${x + 50},160 ${x},160`} fill={raised ? "#f2b630" : "#e2572b"} />
          </g>
        );
      })}
    </svg>
  );
}
