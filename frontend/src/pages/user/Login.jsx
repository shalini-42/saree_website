import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  UserRound,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import publicApi from "../../services/publicApi";
import "./CustomerLogin.css";

export default function CustomerLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
    setLoading(true);

    try {
      const response = await publicApi.post("admin/customer/login/", form);

      localStorage.setItem("customer_access", response.data.access);
      localStorage.setItem("customer_refresh", response.data.refresh);
      localStorage.setItem("customer_username", response.data.username);
      localStorage.setItem("customer_email", response.data.email);

      window.dispatchEvent(new Event("customerAuthChanged"));

      navigate("/", { replace: true });
    } catch (err) {
      console.error("Customer login error:", err.response?.data || err);

      setError(
        err.response?.data?.error ||
          "Unable to sign in. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="cl-page">
      {/* ───────── Editorial panel ───────── */}
      <aside className="cl-art" aria-hidden="true">
        {!imageFailed && (
          <img
            src="/images/saree-detail.jpg"
            alt=""
            width="900"
            height="1200"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        )}
        <div className="cl-art__shade" />

        <Link to="/" className="cl-art__brand" tabIndex={-1}>
          <span>SĀRIKA</span>
          <small>The art of elegance</small>
        </Link>

        <div className="cl-art__quote">
          <p>
            Every saree begins with a single thread, and ends as a story you
            carry for a lifetime.
          </p>
          <ul>
            <li>Handloom certified</li>
            <li>Pure silk &amp; zari</li>
            <li>Free insured shipping</li>
          </ul>
        </div>
      </aside>

      {/* ───────── Form panel ───────── */}
      <section className="cl-panel">
        <div className="cl-card">
          <Link to="/" className="cl-mobile-brand">
            SĀRIKA
          </Link>

          <p className="cl-eyebrow">
            <Sparkles size={15} aria-hidden="true" />
            Welcome back
          </p>

          <h1 className="cl-title">
            Elegance <em>awaits you.</em>
          </h1>

          <p className="cl-lead">
            Sign in to revisit your favourite weaves, track your orders and
            continue your shopping journey.
          </p>

          <div aria-live="assertive">
            {error && (
              <div className="cl-error" role="alert">
                {error}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate={false}>
            <div className="cl-field">
              <label htmlFor="cl-username">Username</label>
              <div className="cl-input">
                <UserRound size={18} aria-hidden="true" />
                <input
                  id="cl-username"
                  type="text"
                  name="username"
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck="false"
                  required
                />
              </div>
            </div>

            <div className="cl-field">
              <div className="cl-field__row">
                <label htmlFor="cl-password">Password</label>
                <Link to="/customer/forgot-password" className="cl-forgot">
                  Forgot password?
                </Link>
              </div>
              <div className="cl-input">
                <Lock size={18} aria-hidden="true" />
                <input
                  id="cl-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="cl-toggle"
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

            <button type="submit" className="cl-submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
              {!loading && <ArrowRight size={17} aria-hidden="true" />}
            </button>
          </form>

          <p className="cl-bottom">
            New to SĀRIKA? <Link to="/customer/register">Create an account</Link>
          </p>

          <p className="cl-secure">
            <Lock size={13} aria-hidden="true" />
            Your account information is securely protected.
          </p>
        </div>
      </section>
    </main>
  );
}
