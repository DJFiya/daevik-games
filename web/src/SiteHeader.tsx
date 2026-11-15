import { Link } from "react-router";

export default function SiteHeader({ home = false }: { home?: boolean }) {
  return (
    <header className="site-header">
      {home ? (
        <h1 className="site-name">daevik games</h1>
      ) : (
        <Link to="/" className="site-name">
          daevik games
        </Link>
      )}
    </header>
  );
}
