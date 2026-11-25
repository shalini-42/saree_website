
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  LockKeyhole,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  X,
  KeyRound,
  Check,
  LoaderCircle,
} from "lucide-react";

import customerApi from "../../services/customerApi";
import useStoreSettings from "../../hooks/useStoreSettings";
import "./ChangePassword.css";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { settings } = useStoreSettings();

  const storeName = settings?.store_name || "SĀRIKA";
  const tagline = settings?.tagline || "THE ART OF ELEGANCE";

  const [form, setForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const passwordRules = [
    {
      label: "At least 8 characters",
      valid: form.new_password.length >= 8,
    },
    {
      label: "One uppercase letter",
      valid: /[A-Z]/.test(form.new_password),
    },
    {
      label: "One lowercase letter",
      valid: /[a-z]/.test(form.new_password),
    },
    {
      label: "One number",
      valid: /\d/.test(form.new_password),
    },
  ];

  const handleChange = (e) => {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));

    setError("");
  };

  const togglePassword = (field) => {
    setShowPassword((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !form.old_password ||
      !form.new_password ||
      !form.confirm_password
    ) {
      setError("Please fill in all password fields.");
      return;
    }

    if (form.new_password.length < 8) {
      setError("New password must contain at least 8 characters.");
      return;
    }

    if (form.new_password !== form.confirm_password) {
      setError("New passwords do not match.");
      return;
    }

    if (form.old_password === form.new_password) {
      setError(
        "New password must be different from your current password."
      );
      return;
    }

    try {
      setLoading(true);

      await customerApi.post(
        "admin/customer/change-password/",
        form
      );

      setForm({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });

      setShowPassword({
        old: false,
        new: false,
        confirm: false,
      });

      setShowSuccessModal(true);
    } catch (err) {
      console.error("Change password error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("customer_access");
        localStorage.removeItem("customer_refresh");
        localStorage.removeItem("customer_username");
        localStorage.removeItem("customer_email");

        window.dispatchEvent(new Event("customerAuthChanged"));

        navigate("/customer/login", { replace: true });
        return;
      }

      const errorData = err.response?.data;

      if (typeof errorData?.error === "string") {
        setError(errorData.error);
      } else if (Array.isArray(errorData?.error)) {
        setError(errorData.error.join(" "));
      } else if (errorData?.detail) {
        setError(errorData.detail);
      } else {
        const firstError = errorData
          ? Object.values(errorData).flat()[0]
          : null;

        setError(
          typeof firstError === "string"
            ? firstError
            : "Unable to change password. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordField = (label, name, field) => (
    <div className="cp-field">
      <label htmlFor={name}>{label} *</label>

      <div className="cp-input-wrapper">
        <LockKeyhole size={18} className="cp-input-icon" />

        <input
          id={name}
          type={showPassword[field] ? "text" : "password"}
          name={name}
          value={form[name]}
          onChange={handleChange}
          placeholder={`Enter ${label.toLowerCase()}`}
          autoComplete="new-password"
          required
        />

        <button
          type="button"
          className="cp-eye-button"
          onClick={() => togglePassword(field)}
          aria-label={
            showPassword[field] ? "Hide password" : "Show password"
          }
        >
          {showPassword[field] ? (
            <EyeOff size={19} />
          ) : (
            <Eye size={19} />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <main className="cp-page">
      <div className="cp-container">

        <button
          type="button"
          className="cp-back-button"
          onClick={() => navigate("/profile")}
        >
          <ArrowLeft size={17} />
          Back to My Account
        </button>

        <div className="cp-heading">
          <span className="cp-heading-icon">
            <LockKeyhole size={23} />
          </span>

          <div>
            <p className="cp-eyebrow">
              {storeName.toUpperCase()} / ACCOUNT SECURITY
            </p>

            <h1>Change Password</h1>

            <p>
              Keep your account secure by updating your password regularly.
            </p>
          </div>
        </div>

        <div className="cp-layout">

          {/* SECURITY SIDEBAR */}

          <aside className="cp-sidebar">
            <div className="cp-shield-icon">
              <ShieldCheck size={42} />
            </div>

            <span className="cp-sidebar-label">
              YOUR SECURITY MATTERS
            </span>

            <h2>
              Your account deserves the best protection.
            </h2>

            <p>
              Choose a strong and unique password to keep your
              personal information safe.
            </p>

            <div className="cp-sidebar-divider" />

            <div className="cp-security-tip">
              <Check size={17} />
              Never share your password.
            </div>

            <div className="cp-security-tip">
              <Check size={17} />
              Avoid common passwords.
            </div>

            <div className="cp-security-tip">
              <Check size={17} />
              Use a unique password.
            </div>

            <div className="cp-sidebar-brand">
              {storeName}
              <small>{tagline}</small>
            </div>
          </aside>

          {/* PASSWORD FORM */}

          <section className="cp-card">
            <div className="cp-card-heading">
              <div>
                <span>ACCOUNT PROTECTION</span>
                <h2>Password & Security</h2>
                <p>Update your account password securely.</p>
              </div>

              <KeyRound size={27} />
            </div>

            {error && (
              <div className="cp-alert cp-error">
                <AlertCircle size={19} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {renderPasswordField(
                "Current Password",
                "old_password",
                "old"
              )}

              {renderPasswordField(
                "New Password",
                "new_password",
                "new"
              )}

              {/* PASSWORD REQUIREMENTS */}

              <div className="cp-password-rules">
                <span>Password requirements</span>

                {passwordRules.map((rule) => (
                  <div
                    key={rule.label}
                    className={
                      rule.valid ? "cp-rule valid" : "cp-rule"
                    }
                  >
                    <CheckCircle2 size={15} />
                    {rule.label}
                  </div>
                ))}
              </div>

              {renderPasswordField(
                "Confirm New Password",
                "confirm_password",
                "confirm"
              )}

              {form.confirm_password && (
                <div
                  className={
                    form.new_password === form.confirm_password
                      ? "cp-match valid"
                      : "cp-match invalid"
                  }
                >
                  {form.new_password === form.confirm_password ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <AlertCircle size={15} />
                  )}

                  {form.new_password === form.confirm_password
                    ? "Passwords match"
                    : "Passwords do not match"}
                </div>
              )}

              <div className="cp-password-hint">
                <ShieldCheck size={17} />
                Your password is securely updated through your account.
              </div>

              <button
                type="submit"
                className="cp-submit-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <LoaderCircle size={18} className="cp-spinner" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <LockKeyhole size={18} />
                    Update Password
                  </>
                )}
              </button>
            </form>
          </section>
        </div>

        <div className="cp-security-note">
          <ShieldCheck size={19} />
          <p>
            Never share your password with anyone. Keep your{" "}
            {storeName} account protected.
          </p>
        </div>
      </div>

      {/* SUCCESS MODAL */}

      {showSuccessModal && (
        <div
          className="cp-success-overlay"
          onClick={() => setShowSuccessModal(false)}
        >
          <div
            className="cp-success-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="cp-success-close"
              onClick={() => setShowSuccessModal(false)}
              aria-label="Close"
            >
              <X size={19} />
            </button>

            <div className="cp-success-icon">
              <ShieldCheck size={40} />
            </div>

            <span>{storeName.toUpperCase()}</span>

            <h2>Password Changed!</h2>

            <p>
              Your account password has been updated successfully.
              Your account is now protected with your new password.
            </p>

            <div className="cp-success-divider">
              <span />
              ✦
              <span />
            </div>

            <button
              type="button"
              className="cp-success-button"
              onClick={() => setShowSuccessModal(false)}
            >
              Continue
            </button>

            <small>{tagline}</small>
          </div>
        </div>
      )}
    </main>
  );
}
