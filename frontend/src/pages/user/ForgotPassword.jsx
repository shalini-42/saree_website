
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import publicApi from "../../services/publicApi";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Form states
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");

  // Visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);

  // Password requirements
  const passwordChecks = [
    {
      label: "At least 8 characters",
      valid: password.length >= 8,
    },
    {
      label: "One uppercase letter",
      valid: /[A-Z]/.test(password),
    },
    {
      label: "One lowercase letter",
      valid: /[a-z]/.test(password),
    },
    {
      label: "One number",
      valid: /[0-9]/.test(password),
    },
    {
      label: "One special character",
      valid: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const passwordStrength = passwordChecks.filter(
    (check) => check.valid
  ).length;

  // OTP resend countdown
  useEffect(() => {
    if (resendSeconds <= 0) return;

    const timer = setTimeout(() => {
      setResendSeconds((previous) => previous - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const formatCountdown = () => {
    return `00:${String(resendSeconds).padStart(2, "0")}`;
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // STEP 1: Send OTP
  const handleSendOTP = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await publicApi.post(
        "admin/customer/forgot-password/",
        {
          email: email.trim().toLowerCase(),
        }
      );

      setSuccess(
        response.data.message || "OTP sent successfully. Check your email."
      );

      setStep(2);
      setOtp("");
      setResetToken("");
      setResendSeconds(60);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOTP = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await publicApi.post(
        "admin/customer/verify-reset-otp/",
        {
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
        }
      );

      const token = response.data.reset_token;

      if (!token) {
        setError("Reset token was not received. Please try again.");
        return;
      }

      setResetToken(token);
      setSuccess(
        response.data.message || "OTP verified successfully."
      );
      setStep(3);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Invalid OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // RESEND OTP
  const handleResendOTP = async () => {
    clearMessages();

    if (resendSeconds > 0 || loading) return;

    setLoading(true);

    try {
      const response = await publicApi.post(
        "admin/customer/forgot-password/",
        {
          email: email.trim().toLowerCase(),
        }
      );

      setSuccess(
        response.data.message || "A new OTP has been sent to your email."
      );

      setOtp("");
      setResetToken("");
      setPassword("");
      setConfirmPassword("");
      setStep(2);
      setResendSeconds(60);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to resend OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!password || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (passwordStrength !== 5) {
      setError("Please meet all password requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!resetToken) {
      setError("Your reset session is invalid. Please request a new OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await publicApi.post(
        "admin/customer/reset-password/",
        {
          email: email.trim().toLowerCase(),
          reset_token: resetToken,
          new_password: password,
          confirm_password: confirmPassword,
        }
      );

      setSuccess(
        response.data.message ||
          "Password reset successfully. Please log in."
      );

      setPassword("");
      setConfirmPassword("");
      setOtp("");
      setResetToken("");

      setTimeout(() => {
        navigate("/customer/login");
      }, 1800);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Change email
  const handleChangeEmail = () => {
    clearMessages();
    setStep(1);
    setOtp("");
    setResetToken("");
    setPassword("");
    setConfirmPassword("");
    setResendSeconds(0);
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card">

        {/* BRAND */}
        <div className="forgot-brand">
          <span className="forgot-brand-icon">
            <Sparkles size={20} />
          </span>
          <h2>SĀRIKA</h2>
          <p>TIMELESS ELEGANCE</p>
        </div>

        {/* HEADING */}
        <div className="forgot-heading">
          <div className="forgot-heading-icon">
            {step === 1 && <Mail size={25} />}
            {step === 2 && <ShieldCheck size={25} />}
            {step === 3 && <Lock size={25} />}
          </div>

          <h1>
            {step === 1 && "Forgot Password?"}
            {step === 2 && "Verify Your Email"}
            {step === 3 && "Create New Password"}
          </h1>

          <p>
            {step === 1 &&
              "Enter your registered email address. We will send you a verification code."}

            {step === 2 &&
              `We have sent a 6-digit verification code to ${email}.`}

            {step === 3 &&
              "Create a strong new password to secure your SĀRIKA account."}
          </p>
        </div>

        {/* PROGRESS */}
        <div className="forgot-progress">
          {[1, 2, 3].map((number) => (
            <React.Fragment key={number}>
              <div
                className={`forgot-progress-step ${
                  step >= number ? "active" : ""
                }`}
              >
                {step > number ? (
                  <CheckCircle2 size={18} />
                ) : (
                  number
                )}
              </div>

              {number !== 3 && (
                <div
                  className={`forgot-progress-line ${
                    step > number ? "active" : ""
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* MESSAGES */}
        {error && (
          <div className="forgot-message error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="forgot-message success" role="status">
            {success}
          </div>
        )}

        {/* STEP 1: EMAIL */}
        {step === 1 && (
          <form onSubmit={handleSendOTP}>
            <label htmlFor="forgot-email">Email Address</label>

            <div className="forgot-input">
              <Mail size={18} />
              <input
                id="forgot-email"
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearMessages();
                }}
                autoComplete="email"
                required
              />
            </div>

            <button
              type="submit"
              className="forgot-submit"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send Verification Code"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        )}

        {/* STEP 2: OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP}>
            <label htmlFor="forgot-otp">Enter 6-Digit OTP</label>

            <div className="forgot-input">
              <ShieldCheck size={18} />
              <input
                id="forgot-otp"
                type="text"
                inputMode="numeric"
                placeholder="Enter OTP"
                value={otp}
                onChange={(event) => {
                  const value = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6);

                  setOtp(value);
                  clearMessages();
                }}
                maxLength={6}
                autoComplete="one-time-code"
                required
              />
            </div>

            <button
              type="submit"
              className="forgot-submit"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
              {!loading && <ArrowRight size={18} />}
            </button>

            <div className="forgot-resend">
              <span>Didn't receive the code?</span>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading || resendSeconds > 0}
              >
                {resendSeconds > 0
                  ? `Resend OTP in ${formatCountdown()}`
                  : "Resend OTP"}
              </button>
            </div>

            <button
              type="button"
              className="forgot-back"
              onClick={handleChangeEmail}
            >
              <ArrowLeft size={16} />
              Change email address
            </button>
          </form>
        )}

        {/* STEP 3: NEW PASSWORD */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <label htmlFor="forgot-new-password">
              New Password
            </label>

            <div className="forgot-input">
              <Lock size={18} />

              <input
                id="forgot-new-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  clearMessages();
                }}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="forgot-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {/* PASSWORD STRENGTH */}
            {password.length > 0 && (
              <div className="password-strength">
                <div className="password-strength-heading">
                  <span>Password strength</span>

                  <strong>
                    {passwordStrength <= 2 && "Weak"}
                    {passwordStrength === 3 && "Medium"}
                    {passwordStrength === 4 && "Good"}
                    {passwordStrength === 5 && "Strong"}
                  </strong>
                </div>

                <div className="password-strength-bars">
                  {[1, 2, 3, 4, 5].map((number) => (
                    <span
                      key={number}
                      className={
                        number <= passwordStrength ? "filled" : ""
                      }
                    />
                  ))}
                </div>

                <div className="password-requirements">
                  {passwordChecks.map((check, index) => (
                    <p key={index}>
                      <CheckCircle2
                        size={15}
                        className={check.valid ? "valid" : ""}
                      />
                      {check.label}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <label htmlFor="forgot-confirm-password">
              Confirm New Password
            </label>

            <div className="forgot-input">
              <Lock size={18} />

              <input
                id="forgot-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  clearMessages();
                }}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="forgot-toggle"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {confirmPassword.length > 0 && (
              <p
                className={`forgot-password-hint ${
                  password === confirmPassword ? "matched" : "not-matched"
                }`}
              >
                {password === confirmPassword
                  ? "Passwords match"
                  : "Passwords do not match"}
              </p>
            )}

            <button
              type="submit"
              className="forgot-submit"
              disabled={loading}
            >
              {loading ? "Resetting Password..." : "Reset Password"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        )}

        {/* FOOTER */}
        <div className="forgot-security">
          <ShieldCheck size={16} />
          <span>Your account security is our priority.</span>
        </div>

        <div className="forgot-back">
          <Link to="/customer/login">
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
