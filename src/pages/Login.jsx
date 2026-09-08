import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);
      await login(email, password);
      navigate("/dashboard");
    } catch (firebaseError) {
      const messages = {
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/user-not-found": "No account was found with that email address.",
        "auth/wrong-password": "Incorrect email or password.",
        "auth/invalid-email": "Enter a valid email address.",
      };

      setError(messages[firebaseError.code] || "Could not log in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Welcome back</p>
        <h1>Manage your DukaLink shop.</h1>
        <p className="auth-intro">
          Sign in to update your products and share your storefront.
        </p>

        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email address
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="auth-switch">
          New to DukaLink? <Link to="/signup">Create your shop</Link>
        </p>
      </section>
    </main>
  );
}
