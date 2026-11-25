import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  LockKeyhole,
  User,
  ArrowUpRight,
} from "lucide-react";
import api from "../services/api";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      // Clear any previous login
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("username");
      localStorage.removeItem("email");

      const response = await api.post("admin/login/", form);

      // Save admin authentication details
      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);
      localStorage.setItem("username", response.data.username);
      localStorage.setItem("email", response.data.email);

      // Open admin dashboard
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.error || "Invalid admin username or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="sarika-login">
      <div className="sarika-login-bg" />
      <div className="sarika-login-shade" />

      <header className="sarika-login-brand">
        <span className="sarika-login-logo">SĀRIKA</span>
        <span className="sarika-login-tagline">THE ART OF DRAPING</span>
      </header>

      <div className="sarika-login-stage">
        {/* Statement */}
        <div className="sarika-login-statement">
          <h2>
            Welcome back to
            <br />
            <em>the atelier.</em>
          </h2>
          <p>Sign in to manage collections, orders and your boutique.</p>
        </div>

        {/* Card */}
        <section className="sarika-login-card">
          <div className="sarika-login-card-head">
            <span className="sarika-login-seal">
              <ShieldCheck size={22} strokeWidth={1.3} />
            </span>
            <div>
              <h1>Admin sign in</h1>
              <p>Administrator portal</p>
            </div>
          </div>

          {error && (
            <div className="sarika-login-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="sarika-login-form">
            <div className="sarika-login-field">
              <label htmlFor="username">Admin username</label>
              <div className="sarika-login-input">
                <User size={17} strokeWidth={1.4} />
                <input
                  id="username"
                  type="text"
                  name="username"
                  placeholder="Enter your username"
                  autoComplete="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="sarika-login-field">
              <label htmlFor="password">Password</label>
              <div className="sarika-login-input">
                <LockKeyhole size={17} strokeWidth={1.4} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="sarika-login-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="sarika-login-submit"
              disabled={loading}
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Admin login <ArrowUpRight size={17} />
                </>
              )}
            </button>
          </form>

          <p className="sarika-login-alt">
            Need to create another admin account?
            <Link to="/admin/signup">Admin signup</Link>
          </p>
        </section>
      </div>

      <footer className="sarika-login-foot">
        © 2026 SĀRIKA Luxury Boutique. Admin Portal.
      </footer>
    </main>
  );
}

export default Login;
