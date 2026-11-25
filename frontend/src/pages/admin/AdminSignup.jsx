import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, ShieldCheck, Eye, EyeOff, ArrowUpRight } from "lucide-react";
import api from "../../services/api";
import "./AdminSignup.css";

const strengthLabels = ["Too short", "Weak", "Fair", "Good", "Strong"];

function getStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return password.length < 8 ? Math.min(score, 1) : score;
}

function AdminSignup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const strength = getStrength(form.password);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      await api.post("admin/register/", form);

      setSuccess(true);

      setTimeout(() => {
        navigate("/admin/products");
      }, 2500);
    } catch (err) {
      const data = err.response?.data;

      setError(
        data?.error ||
          data?.detail ||
          data?.username?.[0] ||
          data?.email?.[0] ||
          data?.password?.[0] ||
          data?.confirm_password?.[0] ||
          "Unable to create account. Please login as an administrator first."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="sarika-signup">
      {/* Brand panel */}
      <aside className="sarika-signup-brand">
        <div className="sarika-signup-brand-overlay" />

        <div className="sarika-signup-brand-top">
          <span className="sarika-signup-logo">SĀRIKA</span>
          <span className="sarika-signup-tagline">THE ART OF DRAPING</span>
        </div>

        <div className="sarika-signup-brand-bottom">
          <h2>
            Behind every drape,
            <br />
            <em>a team that cares.</em>
          </h2>
          <p>
            Admin access is limited to authorised members of the SĀRIKA team.
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <section className="sarika-signup-panel">
        <div className="sarika-signup-card">
          <div className="sarika-signup-badge">
            <ShieldCheck size={22} strokeWidth={1.3} />
            <span>ADMINISTRATOR REGISTRATION</span>
          </div>

          <h1>Create admin account</h1>
          <p className="sarika-signup-sub">
            Register a new authorised administrator for the SĀRIKA portal.
          </p>

          {error && (
            <div className="sarika-signup-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="sarika-signup-form">
            <div className="sarika-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                name="username"
                placeholder="Enter username"
                autoComplete="username"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="sarika-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter email address"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="sarika-field">
              <label htmlFor="password">Password</label>
              <div className="sarika-field-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="sarika-field-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div
                className={`sarika-strength ${form.password ? "is-visible" : ""}`}
                data-level={strength}
              >
                <div className="sarika-strength-bars">
                  {[1, 2, 3, 4].map((n) => (
                    <i key={n} className={n <= strength ? "is-on" : ""} />
                  ))}
                </div>
                <span>{strengthLabels[strength]}</span>
              </div>
            </div>

            <div className="sarika-field">
              <label htmlFor="confirm_password">Confirm password</label>
              <div className="sarika-field-wrap">
                <input
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirm_password"
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="sarika-field-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="sarika-signup-submit"
              disabled={loading || success}
            >
              {loading ? "Creating account..." : "Create admin account"}
              {!loading && <ArrowUpRight size={17} />}
            </button>
          </form>

          <p className="sarika-signup-login">
            Already have an admin account? <Link to="/login">Sign in</Link>
          </p>
        </div>

        <p className="sarika-signup-copy">
          © 2026 SĀRIKA Luxury Boutique. Admin Portal.
        </p>
      </section>

      {/* Success overlay */}
      {success && (
        <div className="sarika-success" role="status">
          <div className="sarika-success-card">
            <div className="sarika-success-icon">
              <Check size={34} strokeWidth={1.5} />
            </div>

            <h2>Account created</h2>
            <p>Your admin account is ready. Taking you to the dashboard.</p>

            <div className="sarika-success-progress">
              <span />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default AdminSignup;
