import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { currentUser, logout } = useAuth();

  return (
    <header className="site-nav">
      <div className="nav-inner">
        <Link className="brand" to="/">
          DukaLink
        </Link>

        <nav className="nav-links" aria-label="Main navigation">
          {currentUser ? (
            <>
              <Link className="nav-link" to="/dashboard">
                Dashboard
              </Link>
              <button className="nav-logout" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link className="nav-link" to="/">
                Log in
              </Link>
              <Link className="nav-link" to="/signup">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
