import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import publicApi from "../../services/publicApi";
import "./CustomerRegister.css";

const perks = [
  "Save your favourite weaves",
  "Track every order, door to door",
  "Be first to see new arrivals",
];

export default function CustomerRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await publicApi.post("admin/customer/register/", form);

      setSuccess(response.data.message || "Account created successfully!");

      setTimeout(() => {
        navigate("/customer/login", {
          state: { username: form.username },
        });
      }, 1200);
    } catch (err) {
      const data = err.response?.data;

      if (data && typeof data === "object") {
        const messages = Object.entries(data).map(([field, value]) => {
          const label = field.replaceAll("_", " ");
          const message = Array.isArray(value) ? value.join(" ") : String(value);

          return `${label}: ${message}`;
        });

        setError(messages.join(" "));
      } else {
        setError("Unable to create your account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const mismatch =
    form.confirm_password.length > 0 && form.password !== form.confirm_password;

  return (
    <main className="cr-page">
      {/* ───────── Form panel ───────── */}
      <section className="cr-panel">
        <div className="cr-card">
          <Link to="/" className="cr-mobile-brand">
            SĀRIKA
          </Link>

          <p className="cr-eyebrow">
            <Sparkles size={15} aria-hidden="true" />
            Join our world
          </p>

          <h1 className="cr-title">
            Create <em>your account.</em>
          </h1>

          <p className="cr-lead">
            Become part of SĀRIKA and discover the beauty of timeless Indian
            craftsmanship.
          </p>

          <div aria-live="assertive">
            {error && (
              <div className="cr-message cr-message--error" role="alert">
                {error}
              </div>
            )}
          </div>
          <div aria-live="polite">
            {success && (
              <div className="cr-message cr-message--success" role="status">
                {success}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="cr-field">
              <label htmlFor="cr-username">Username</label>
              <div className="cr-input">
                <UserRound size={18} aria-hidden="true" />
                <input
                  id="cr-username"
                  type="text"
                  name="username"
                  placeholder="Choose a username"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck="false"
                  required
                />
              </div>
            </div>

            <div className="cr-field">
              <label htmlFor="cr-email">Email address</label>
              <div className="cr-input">
                <Mail size={18} aria-hidden="true" />
                <input
                  id="cr-email"
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="cr-field">
              <label htmlFor="cr-password">Password</label>
              <div className="cr-input">
                <Lock size={18} aria-hidden="true" />
                <input
                  id="cr-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="cr-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className="cr-field">
              <label htmlFor="cr-confirm">Confirm password</label>
              <div className={`cr-input${mismatch ? " is-invalid" : ""}`}>
                <Lock size={18} aria-hidden="true" />
                <input
                  id="cr-confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirm_password"
                  placeholder="Confirm your password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  aria-invalid={mismatch}
                  aria-describedby={mismatch ? "cr-mismatch" : undefined}
                  required
                />
                <button
                  type="button"
                  className="cr-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
              {mismatch && (
                <p className="cr-hint" id="cr-mismatch">
                  The passwords don’t match yet.
                </p>
              )}
            </div>

            <button type="submit" className="cr-submit" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
              {!loading && <ArrowRight size={17} aria-hidden="true" />}
            </button>
          </form>

          <p className="cr-bottom">
            Already a member? <Link to="/customer/login">Sign in</Link>
          </p>

          <p className="cr-secure">
            <Lock size={13} aria-hidden="true" />
            Your personal information is securely protected.
          </p>
        </div>
      </section>

      {/* ───────── Editorial panel ───────── */}
      <aside className="cr-art" aria-hidden="true">
        {!imageFailed && (
          <img
            src="/images/kanjeevaram.jpg"
            alt=""
            width="900"
            height="1200"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        )}
        <div className="cr-art__shade" />

        <Link to="/" className="cr-art__brand" tabIndex={-1}>
          <span>SĀRIKA</span>
          <small>The art of elegance</small>
        </Link>

        <div className="cr-art__quote">
          <p>Some sarees are worn. Some are inherited. Begin yours here.</p>
          <ul>
            {perks.map((perk) => (
              <li key={perk}>{perk}</li>
            ))}
          </ul>
        </div>
      </aside>
    </main>
  );
}
