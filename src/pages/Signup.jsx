import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

function createSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    ownerName: "",
    businessName: "",
    phone: "254",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    const phone = form.phone.replace(/\D/g, "");

    if (!/^254\d{9}$/.test(phone)) {
      setError("Enter a valid Kenyan WhatsApp number, for example 254712345678.");
      return;
    }

    const slug = createSlug(form.businessName);

    if (!slug) {
      setError("Enter a valid business name.");
      return;
    }

    try {
      setLoading(true);

      const userCredential = await signup(form.email, form.password);
      const user = userCredential.user;

      await setDoc(doc(db, "shops", user.uid), {
        ownerId: user.uid,
        ownerName: form.ownerName.trim(),
        businessName: form.businessName.trim(),
        slug: `${slug}-${user.uid.slice(0, 5)}`,
        phone,
        location: "",
        deliveryInfo: "",
        description: "",
        createdAt: serverTimestamp(),
      });

      navigate("/dashboard");
    } catch (firebaseError) {
      const messages = {
        "auth/email-already-in-use": "An account already exists with that email address.",
        "auth/invalid-email": "Enter a valid email address.",
        "auth/weak-password": "Choose a stronger password.",
      };

      setError(messages[firebaseError.code] || "Could not create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Create your storefront</p>
        <h1>Start selling with one link.</h1>
        <p className="auth-intro">
          Add your products, share your shop on WhatsApp, and receive orders directly.
        </p>

        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Your name
            <input
              type="text"
              name="ownerName"
              placeholder="e.g. Jane Wanjiku"
              value={form.ownerName}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Business name
            <input
              type="text"
              name="businessName"
              placeholder="e.g. Jane Fashion House"
              value={form.businessName}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            WhatsApp number
            <input
              type="tel"
              name="phone"
              placeholder="254712345678"
              value={form.phone}
              onChange={handleChange}
              required
            />
            <small>Use 254 followed by your 9-digit phone number.</small>
          </label>

          <label>
            Email address
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
              minLength="6"
              required
            />
          </label>

          <label>
            Confirm password
            <input
              type="password"
              name="confirmPassword"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </label>

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Creating your shop..." : "Create my shop"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/">Log in</Link>
        </p>
      </section>
    </main>
  );
}
