import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Menu,
  X,
  LockKeyhole,
  MoveUpRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import "./AdminWelcome.css";

const collections = [
  {
    number: "01",
    title: "The Silk Edit",
    subtitle: "A legacy of pure Kanjeevaram weaves",
    image:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=90",
  },
  {
    number: "02",
    title: "The Wedding Edit",
    subtitle: "Made for unforgettable heirloom celebrations",
    image:
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=90",
  },
  {
    number: "03",
    title: "The Heritage Edit",
    subtitle: "Centuries of Banarasi zari, thoughtfully reimagined",
    image:
      "https://images.unsplash.com/photo-1583391733956-6c78276477e8?auto=format&fit=crop&w=1000&q=90",
  },
];

export default function AdminWelcome() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const reveal = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 32 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
      };

  return (
    <main className="sarika-luxury">
      {/* Top Announcement Bar */}
      <div className="sarika-announcement">
        <span>✦</span> AN INHERITANCE OF ELEGANCE · THE SĀRIKA EXPERIENCE <span>✦</span>
      </div>

      {/* Haute Couture Header */}
      <header className="sarika-header">
        <button
          className="sarika-menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <a className="sarika-wordmark" href="#home" aria-label="Sarika home">
          <span className="sarika-wordmark-title">SĀRIKA</span>
          <span className="sarika-wordmark-sub">THE ART OF DRAPING</span>
        </a>

        <nav className={`sarika-nav ${menuOpen ? "is-open" : ""}`}>
          <a href="#collections" onClick={() => setMenuOpen(false)}>
            COLLECTIONS
          </a>
          <a href="#story" onClick={() => setMenuOpen(false)}>
            OUR STORY
          </a>
          <a href="#craft" onClick={() => setMenuOpen(false)}>
            CRAFTSMANSHIP
          </a>
        </nav>

        <button
          className="sarika-header-access"
          onClick={() => goTo("/login")}
        >
          ADMIN ACCESS <ArrowUpRight size={14} />
        </button>
      </header>

      {/* Cinematic Hero */}
      <section className="sarika-hero" id="home">
        <div className="sarika-hero-image" />
        <div className="sarika-hero-overlay" />

        <div className="sarika-hero-content">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
          >
            <p className="sarika-eyebrow sarika-light">
              ✦ A CELEBRATION OF INDIAN HERITAGE ✦
            </p>
          </motion.div>

          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Woven in
            <br />
            <em>Timeless</em> Grace.
          </motion.h1>

          <motion.p
            className="sarika-hero-description"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
          >
            Where centuries of weaving tradition converge with the poetry of modern Indian luxury.
          </motion.p>

          <motion.div
            className="sarika-hero-actions"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.6 }}
          >
            <a href="#collections" className="sarika-button sarika-button-gold">
              DISCOVER THE EDITS <ArrowUpRight size={16} />
            </a>
            <button
              className="sarika-button sarika-button-outline"
              onClick={() => goTo("/login")}
            >
              ADMIN SIGN IN <ArrowUpRight size={16} />
            </button>
          </motion.div>
        </div>

        <div className="sarika-hero-caption">
          <span>01 / 03</span>
          <span>✦ THE SIGNATURE SHOWCASE</span>
        </div>

        <a className="sarika-scroll" href="#story">
          SCROLL TO EXPLORE <span />
        </a>
      </section>

      {/* Brand Philosophy / Story */}
      <section className="sarika-intro" id="story">
        <motion.div className="sarika-intro-inner" {...reveal}>
          <p className="sarika-eyebrow">THE SĀRIKA PHILOSOPHY</p>
          <h2>
            Not simply worn.
            <br />
            <em>Remembered for generations.</em>
          </h2>
          <div className="sarika-intro-bottom">
            <span className="sarika-ornament">❖</span>
            <p>
              Every drape chronicles an artisan’s lifetime. Every zari thread carries a legacy.
              SĀRIKA unites the mastery of ancient looms with a modern vision of regal Indian silhouettes.
            </p>
            <span className="sarika-intro-side">
              ROOTED IN HERITAGE · CRAFTED FOR ETERNITY
            </span>
          </div>
        </motion.div>
      </section>

      {/* Curated Collections Section */}
      <section className="sarika-collections" id="collections">
        <div className="sarika-section-heading">
          <div>
            <p className="sarika-eyebrow">CURATED WITH INTENTION</p>
            <h2>
              Discover the <em>edits.</em>
            </h2>
          </div>
          <span className="sarika-section-note">
            TIMELESS INDIAN OPULENCE
          </span>
        </div>

        <div className="sarika-collection-grid">
          {collections.map((item, index) => (
            <motion.article
              className="sarika-collection-card"
              key={item.number}
              initial={reduceMotion ? false : { opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.75, delay: index * 0.15 }}
            >
              <div className="sarika-collection-image">
                <img src={item.image} alt={item.title} loading="lazy" />
                <span className="sarika-collection-number">{item.number}</span>
                <span className="sarika-collection-arrow">
                  <ArrowUpRight size={20} />
                </span>
              </div>
              <div className="sarika-collection-info">
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.subtitle}</p>
                </div>
                <span>EXPLORE</span>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Craftsmanship Section */}
      <section className="sarika-craft" id="craft">
        <div className="sarika-craft-image" />
        <motion.div className="sarika-craft-content" {...reveal}>
          <p className="sarika-eyebrow sarika-light">BEYOND THE THREAD</p>
          <h2>
            The beauty
            <br />
            of <em>handcrafted</em>
            <br />
            heritage.
          </h2>
          <p>
            An ode to the masterful hands, enduring patience, and multi-generational artistry
            breathing soul into every SĀRIKA creation.
          </p>
          <a href="#collections" className="sarika-text-link">
            EXPLORE OUR REPERTOIRE <ArrowUpRight size={16} />
          </a>
        </motion.div>
      </section>

      {/* Private Admin Vault Section */}
      <section className="sarika-admin-section">
        <div className="sarika-admin-decoration">S</div>

        <motion.div className="sarika-admin-content" {...reveal}>
          <div className="sarika-admin-badge">
            <LockKeyhole size={24} strokeWidth={1.5} />
          </div>

          <p className="sarika-eyebrow sarika-light">THE ATELIER PORTAL</p>
          <h2>
            Behind the beauty,
            <br />
            <em>there is a vision.</em>
          </h2>

          <p className="sarika-admin-description">
            A secured command suite for curators, creators, and administrators orchestrating the SĀRIKA empire.
          </p>

          <div className="sarika-admin-actions">
            <button
              className="sarika-button sarika-button-gold"
              onClick={() => goTo("/login")}
            >
              ADMIN SIGN IN <ArrowUpRight size={16} />
            </button>
            <button
              className="sarika-button sarika-button-outline"
              onClick={() => goTo("/admin/signup")}
            >
              REGISTER ADMIN ACCESS <ArrowUpRight size={16} />
            </button>
          </div>
        </motion.div>
      </section>

      {/* Haute Couture Footer */}
      <footer className="sarika-footer">
        <div className="sarika-footer-main">
          <div className="sarika-footer-brand">
            <a href="#home" className="sarika-footer-logo">
              SĀRIKA
            </a>
            <p>THE ART OF DRAPING</p>
          </div>

          <div className="sarika-footer-message">
            <p>Tradition in every thread.</p>
            <p>Elegance in every drape.</p>
          </div>

          <div className="sarika-footer-links">
            <a href="#collections">COLLECTIONS</a>
            <a href="#story">OUR STORY</a>
            <a href="#craft">CRAFTSMANSHIP</a>
            <a href="/login">ADMIN VAULT</a>
          </div>
        </div>

        <div className="sarika-footer-bottom">
          <span>© {new Date().getFullYear()} SĀRIKA. ALL RIGHTS RESERVED.</span>
          <span>CURATED WITH AN APPRECIATION FOR INDIAN HERITAGE.</span>
          <a href="#home">
            BACK TO TOP <MoveUpRight size={13} />
          </a>
        </div>
      </footer>
    </main>
  );
}
