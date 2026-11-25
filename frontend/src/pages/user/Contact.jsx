
import React, { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  X,
  LoaderCircle,
  Sparkles,
} from "lucide-react";

import { submitContactMessage } from "../../services/contactApi";
import useStoreSettings from "../../hooks/useStoreSettings";

import "./Contact.css";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export default function Contact() {
  const { settings } = useStoreSettings();

  const storeName = settings?.store_name || "SĀRIKA";
  const storeEmail = settings?.store_email || "support@sarika.com";
  const storePhone = settings?.store_phone || "";
  const storeAddress = settings?.store_address || "";

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.subject.trim() ||
      !form.message.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (form.phone && !/^[0-9+\-\s]{10,15}$/.test(form.phone.trim())) {
      setError("Please enter a valid phone number.");
      return;
    }

    try {
      setLoading(true);

      await submitContactMessage({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });

      setForm(initialForm);
      setShowSuccess(true);
    } catch (err) {
      console.error("Contact submission error:", err);

      const data = err.response?.data;

      if (data?.errors) {
        const firstError = Object.values(data.errors).flat()[0];
        setError(
          typeof firstError === "string"
            ? firstError
            : "Please check your form details."
        );
      } else {
        setError(
          data?.message ||
          data?.detail ||
          "Unable to send your message. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="contact-page">

      {/* HERO SECTION */}

      <section className="contact-hero">
        <div className="contact-hero-content">
          <span className="contact-eyebrow">
            <Sparkles size={14} />
            WE WOULD LOVE TO HEAR FROM YOU
          </span>

          <h1>
            Let's Start a <span>Conversation.</span>
          </h1>

          <p>
            Have a question about our sarees, your order, or anything
            else? Our team is here to help you.
          </p>

          <div className="contact-hero-line">
            <span />
            ✦
            <span />
          </div>
        </div>
      </section>

      {/* CONTACT CONTENT */}

      <section className="contact-main">
        <div className="contact-section-heading">
          <span>GET IN TOUCH</span>
          <h2>We're Here for You</h2>
          <p>
            Connect with us and experience thoughtful customer service.
          </p>
        </div>

        <div className="contact-layout">

          {/* CONTACT INFORMATION */}

          <aside className="contact-info-card">
            <span className="contact-info-eyebrow">
              CONTACT INFORMATION
            </span>

            <h2>
              We'd love to hear from you.
            </h2>

            <p className="contact-info-description">
              Reach out to us for product enquiries, order assistance,
              or any questions about our collection.
            </p>

            <div className="contact-info-divider" />

            <div className="contact-info-item">
              <div className="contact-info-icon">
                <Mail size={20} />
              </div>

              <div>
                <span>EMAIL US</span>
                <a href={`mailto:${storeEmail}`}>
                  {storeEmail}
                </a>
              </div>
            </div>

            {storePhone && (
              <div className="contact-info-item">
                <div className="contact-info-icon">
                  <Phone size={20} />
                </div>

                <div>
                  <span>CALL US</span>
                  <a href={`tel:${storePhone}`}>
                    {storePhone}
                  </a>
                </div>
              </div>
            )}

            {storeAddress && (
              <div className="contact-info-item">
                <div className="contact-info-icon">
                  <MapPin size={20} />
                </div>

                <div>
                  <span>OUR ADDRESS</span>
                  <p>{storeAddress}</p>
                </div>
              </div>
            )}

            <div className="contact-info-item">
              <div className="contact-info-icon">
                <Clock size={20} />
              </div>

              <div>
                <span>SUPPORT HOURS</span>
                <p>Monday – Saturday</p>
                <p>9:00 AM – 6:00 PM</p>
              </div>
            </div>

            <div className="contact-info-bottom">
              <MessageCircle size={18} />
              <span>Every message matters to us.</span>
            </div>

            <div className="contact-info-brand">
              {storeName}
              <small>
                {settings?.tagline || "THE ART OF ELEGANCE"}
              </small>
            </div>
          </aside>

          {/* CONTACT FORM */}

          <div className="contact-form-card">
            <div className="contact-form-heading">
              <span>SEND US A MESSAGE</span>
              <h2>How Can We Help You?</h2>
              <p>
                Fill out the form below and our team will get back to you.
              </p>
            </div>

            {error && (
              <div className="contact-alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>

              <div className="contact-form-row">
                <div className="contact-field">
                  <label htmlFor="contact-name">
                    Your Name *
                  </label>

                  <input
                    id="contact-name"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    maxLength={150}
                    required
                  />
                </div>

                <div className="contact-field">
                  <label htmlFor="contact-email">
                    Email Address *
                  </label>

                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    maxLength={254}
                    required
                  />
                </div>
              </div>

              <div className="contact-form-row">
                <div className="contact-field">
                  <label htmlFor="contact-phone">
                    Phone Number
                  </label>

                  <input
                    id="contact-phone"
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    maxLength={15}
                  />
                </div>

                <div className="contact-field">
                  <label htmlFor="contact-subject">
                    Subject *
                  </label>

                  <input
                    id="contact-subject"
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="What is this about?"
                    maxLength={200}
                    required
                  />
                </div>
              </div>

              <div className="contact-field">
                <label htmlFor="contact-message">
                  Your Message *
                </label>

                <textarea
                  id="contact-message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Write your message here..."
                  rows={6}
                  required
                />
              </div>

              <div className="contact-form-footer">
                <p>
                  Fields marked with * are required.
                </p>

                <button
                  type="submit"
                  className="contact-submit-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <LoaderCircle
                        size={18}
                        className="contact-spinner"
                      />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send size={17} />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      </section>

      {/* SUCCESS MODAL */}

      {showSuccess && (
        <div
          className="contact-success-overlay"
          onClick={() => setShowSuccess(false)}
        >
          <div
            className="contact-success-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="contact-success-close"
              onClick={() => setShowSuccess(false)}
              aria-label="Close"
            >
              <X size={19} />
            </button>

            <div className="contact-success-icon">
              <CheckCircle2 size={42} />
            </div>

            <span>{storeName.toUpperCase()}</span>

            <h2>Message Received!</h2>

            <p>
              Thank you for reaching out to us. Your message has been
              submitted successfully. Our team will get back to you soon.
            </p>

            <div className="contact-success-divider">
              <span />
              ✦
              <span />
            </div>

            <button
              type="button"
              className="contact-success-button"
              onClick={() => setShowSuccess(false)}
            >
              Continue
            </button>

            <small>
              {settings?.tagline || "THE ART OF ELEGANCE"}
            </small>
          </div>
        </div>
      )}
    </main>
  );
}
