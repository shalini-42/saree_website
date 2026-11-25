import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserRound,
  Mail,
  Phone,
  MapPin,
  Save,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  X,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import customerApi from "../../services/customerApi";
import useStoreSettings from "../../hooks/useStoreSettings";
import "./Profile.css";

const initialForm = {
  first_name: "",
  last_name: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

export default function Profile() {
  const navigate = useNavigate();

  const { settings } = useStoreSettings();

  const storeName = settings?.store_name || "SĀRIKA";
  const storeTagline =
    settings?.tagline || "THE ART OF ELEGANCE";

  const [form, setForm] = useState(initialForm);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // --------------------------------
  // FETCH CUSTOMER PROFILE
  // --------------------------------

  useEffect(() => {
    const token = localStorage.getItem("customer_access");

    if (!token) {
      navigate("/customer/login", { replace: true });
      return;
    }

    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await customerApi.get("customer/profile/");

      const data = response.data;

      setForm({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        phone: data.phone || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        pincode: data.pincode || "",
      });

      setEmail(data.email || "");
      setUsername(data.username || "");
    } catch (err) {
      console.error("Profile loading error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("customer_access");
        localStorage.removeItem("customer_refresh");
        localStorage.removeItem("customer_username");
        localStorage.removeItem("customer_email");

        window.dispatchEvent(new Event("customerAuthChanged"));

        navigate("/customer/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.error ||
          "Unable to load your profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // HANDLE INPUT CHANGES
  // --------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  // --------------------------------
  // VALIDATE PROFILE
  // --------------------------------

  const validateForm = () => {
    if (!form.first_name.trim()) {
      setError("Please enter your first name.");
      return false;
    }

    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return false;
    }

    if (form.pincode && !/^\d{6}$/.test(form.pincode)) {
      setError("Pincode must contain exactly 6 digits.");
      return false;
    }

    return true;
  };

  // --------------------------------
  // UPDATE CUSTOMER PROFILE
  // --------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await customerApi.patch(
        "customer/profile/",
        form
      );

      const updatedProfile =
        response.data.profile || response.data;

      setForm({
        first_name: updatedProfile.first_name || "",
        last_name: updatedProfile.last_name || "",
        phone: updatedProfile.phone || "",
        address: updatedProfile.address || "",
        city: updatedProfile.city || "",
        state: updatedProfile.state || "",
        pincode: updatedProfile.pincode || "",
      });

      // Show luxury success popup
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Profile update error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("customer_access");
        localStorage.removeItem("customer_refresh");

        window.dispatchEvent(new Event("customerAuthChanged"));

        navigate("/customer/login", { replace: true });
        return;
      }

      const responseData = err.response?.data;

      const firstError = responseData
        ? Object.values(responseData).flat()[0]
        : null;

      setError(
        typeof firstError === "string"
          ? firstError
          : "Unable to update your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Get user initials for luxury monogram
  const getInitials = () => {
    const first = form.first_name?.charAt(0) || username?.charAt(0) || "S";
    const last = form.last_name?.charAt(0) || "";
    return (first + last).toUpperCase();
  };

  // --------------------------------
  // LOADING SCREEN
  // --------------------------------

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="profile-loading-content">
          <div className="profile-spinner-ring">
            <LoaderCircle className="profile-spinner" size={36} />
          </div>
          <span className="profile-loading-brand">{storeName}</span>
          <p>Preparing your personal salon details...</p>
        </div>
      </div>
    );
  }

  // --------------------------------
  // PROFILE PAGE
  // --------------------------------

  return (
    <main className="profile-page">
      <div className="profile-container">

        {/* NAVIGATION / BACK LINK */}
        <div className="profile-nav-bar">
          <button
            type="button"
            className="profile-back"
            onClick={() => navigate("/")}
            aria-label="Back to Boutique Home"
          >
            <ArrowLeft size={16} />
            <span>Return to Boutique</span>
          </button>

          <div className="profile-salon-badge">
            <Sparkles size={13} />
            <span>Private Salon Member</span>
          </div>
        </div>

        {/* PAGE HEADING */}
        <section className="profile-heading">
          <div className="profile-eyebrow-wrap">
            <span className="profile-eyebrow-dash" />
            <span className="profile-eyebrow">
              {storeName.toUpperCase()} / PRIVATE CLIENT ATELIER
            </span>
            <span className="profile-eyebrow-dash" />
          </div>

          <h1>Client Profile & Sanctuary</h1>

          <p>
            Your private sanctuary. Maintain your delivery addresses and personal preferences
            to ensure an uninterrupted couture experience.
          </p>
        </section>

        {/* PROFILE LAYOUT */}
        <div className="profile-layout">

          {/* SIDEBAR / CLIENT CARD */}
          <aside className="profile-sidebar">
            <div className="profile-sidebar-glow" />

            <div className="profile-avatar-wrapper">
              <div className="profile-avatar-ring">
                <div className="profile-avatar">
                  {getInitials() ? (
                    <span className="profile-monogram">{getInitials()}</span>
                  ) : (
                    <UserRound size={34} strokeWidth={1.4} />
                  )}
                </div>
              </div>
              <div className="profile-verified-dot" title="Authenticated Member">
                <ShieldCheck size={12} />
              </div>
            </div>

            <h2 className="profile-user-name">
              {form.first_name || username || "Distinguished Client"}
              {form.last_name ? ` ${form.last_name}` : ""}
            </h2>

            <p className="profile-user-email">{email || username}</p>

            <div className="profile-membership-pill">
              <span className="profile-membership-dot" />
              <span>Verified Patron</span>
            </div>

            <div className="profile-sidebar-line" />

            <div className="profile-sidebar-note">
              <span>EXCLUSIVE PRIVILEGES</span>
              <p>
                As a valued member of {storeName}, your bespoke saree orders and heritage
                pieces are handled with white-glove curation and priority dispatch.
              </p>
            </div>

            <div className="profile-sidebar-brand">
              <span className="profile-brand-name">{storeName}</span>
              <small className="profile-brand-tagline">{storeTagline}</small>
            </div>
          </aside>

          {/* PROFILE FORM CARD */}
          <section className="profile-form-card">
            <div className="profile-form-heading">
              <div>
                <span className="profile-form-subtitle">BESPOKE DETAILS</span>
                <h2>Personal Information & Preferences</h2>
              </div>

              <div className="profile-heading-icon-wrap">
                <UserRound size={22} strokeWidth={1.5} />
              </div>
            </div>

            {/* ERROR MESSAGE ALERT */}
            {error && (
              <div className="profile-alert profile-error" role="alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* BASIC DETAILS SECTION */}
              <div className="profile-section-title">
                <UserRound size={17} />
                <span>Basic Details</span>
              </div>

              <div className="profile-input-grid">

                {/* FIRST NAME */}
                <div className="profile-field">
                  <label htmlFor="first_name">
                    First Name <span className="profile-req-star">*</span>
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    value={form.first_name}
                    onChange={handleChange}
                    placeholder="e.g. Shalini"
                    required
                    autoComplete="given-name"
                  />
                </div>

                {/* LAST NAME */}
                <div className="profile-field">
                  <label htmlFor="last_name">Last Name</label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    value={form.last_name}
                    onChange={handleChange}
                    placeholder="e.g. Sharoon"
                    autoComplete="family-name"
                  />
                </div>

                {/* EMAIL ADDRESS (READ-ONLY) */}
                <div className="profile-field">
                  <label htmlFor="email">Email Address</label>
                  <div className="profile-input-icon">
                    <Mail size={17} className="profile-field-icon" />
                    <input
                      id="email"
                      value={email}
                      readOnly
                      disabled
                      aria-readonly="true"
                    />
                  </div>
                  <small className="profile-helper-text">
                    Primary authentication email cannot be modified directly.
                  </small>
                </div>

                {/* PHONE NUMBER */}
                <div className="profile-field">
                  <label htmlFor="phone">Mobile Number</label>
                  <div className="profile-input-icon">
                    <Phone size={17} className="profile-field-icon" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      maxLength={10}
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="10-digit mobile number"
                      autoComplete="tel"
                    />
                  </div>
                  <small className="profile-helper-text">
                    Used for courier notifications and dispatch updates.
                  </small>
                </div>

              </div>

              {/* DELIVERY ADDRESS SECTION */}
              <div className="profile-section-title profile-address-title">
                <MapPin size={17} />
                <span>Delivery Sanctuary Address</span>
              </div>

              {/* FULL ADDRESS */}
              <div className="profile-field">
                <label htmlFor="address">Full Street Address</label>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Apartment, suite, street name, landmark..."
                  autoComplete="street-address"
                />
              </div>

              {/* CITY / STATE / PINCODE */}
              <div className="profile-input-grid profile-address-grid">

                <div className="profile-field">
                  <label htmlFor="city">City</label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="e.g. Mumbai"
                    autoComplete="address-level2"
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="state">State</label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="e.g. Maharashtra"
                    autoComplete="address-level1"
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="pincode">Postal Pincode</label>
                  <input
                    id="pincode"
                    name="pincode"
                    type="text"
                    maxLength={6}
                    value={form.pincode}
                    onChange={handleChange}
                    placeholder="6-digit postal code"
                    autoComplete="postal-code"
                  />
                </div>

              </div>

              {/* SUBMIT FOOTER */}
              <div className="profile-form-footer">
                <p className="profile-required-note">
                  <span className="profile-req-star">*</span> Essential for white-glove delivery
                </p>

                <button
                  type="submit"
                  className="profile-save-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <LoaderCircle
                        className="profile-spinner"
                        size={18}
                      />
                      <span>Saving Curations...</span>
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </section>

        </div>
      </div>

      {/* --------------------------------
          LUXURY SUCCESS POPUP / DIALOG
      -------------------------------- */}
      {showSuccessModal && (
        <div
          className="profile-success-overlay"
          onClick={() => setShowSuccessModal(false)}
        >
          <div
            className="profile-success-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-success-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON */}
            <button
              type="button"
              className="profile-success-x"
              onClick={() => setShowSuccessModal(false)}
              aria-label="Close confirmation dialog"
            >
              <X size={18} />
            </button>

            {/* SUCCESS ICON WITH LUXURY RING */}
            <div className="profile-success-icon-wrap">
              <div className="profile-success-icon">
                <CheckCircle2 size={36} strokeWidth={1.5} />
              </div>
            </div>

            <span className="profile-success-label">
              {storeName.toUpperCase()} SALON
            </span>

            <h2 id="profile-success-title">
              Profile Updated With Grace
            </h2>

            <p>
              Your personal information and delivery preferences have been securely recorded.
              Your upcoming saree shipments will honor these refined details.
            </p>

            {/* DECORATIVE DIVIDER */}
            <div className="profile-success-divider">
              <span className="profile-divider-line" />
              <span className="profile-divider-sparkle">✦</span>
              <span className="profile-divider-line" />
            </div>

            {/* CLOSE ACTION BUTTON */}
            <button
              type="button"
              className="profile-success-close"
              onClick={() => setShowSuccessModal(false)}
            >
              Return to Profile
            </button>

            <small className="profile-success-tagline">{storeTagline}</small>
          </div>
        </div>
      )}

    </main>
  );
}