import { Link } from "react-router";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <Link to="/" className="site-name">
        daevik games
      </Link>
    </header>
  );
}
