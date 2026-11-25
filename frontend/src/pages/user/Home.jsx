import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  MoveDown,
  Gem,
  Award,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
} from "lucide-react";
import "./Home.css";

/* ───────────────────────── Resilient Image Fallbacks ───────────────────────── */
const FALLBACKS = {
  hero: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1800&q=85",
  burgundy: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=80",
  gold: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=80",
  green: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=900&q=80",
  organza: "https://images.unsplash.com/photo-1610030469668-932ec596e7fa?auto=format&fit=crop&w=900&q=80",
  banarasi: "https://images.unsplash.com/photo-1583391733975-22d7d7301c2c?auto=format&fit=crop&w=900&q=80",
  detail: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85",
};

/* ───────────────────────── Content Data ───────────────────────── */
const arrivals = [
  { local: "/images/saree-burgundy.jpg", fallback: FALLBACKS.burgundy, title: "Royal Crimson" },
  { local: "/images/organza.jpg", fallback: FALLBACKS.organza, title: "Pure Organza" },
  { local: "/images/banarasi.jpg", fallback: FALLBACKS.banarasi, title: "Antique Banarasi" },
  { local: "/images/saree-gold.jpg", fallback: FALLBACKS.gold, title: "Heritage Zari" },
];

const gallery = [
  { name: "Kanjeevaram", note: "The richness of royal tradition", image: "/images/kanjeevaram.jpg", fallback: FALLBACKS.gold },
  { name: "Banarasi", note: "Woven stories of royalty & gold", image: "/images/banarasi.jpg", fallback: FALLBACKS.banarasi },
  { name: "Organza", note: "Lightness in every sheer layer", image: "/images/organza.jpg", fallback: FALLBACKS.organza },
  { name: "Soft Silk", note: "Handwoven, endlessly graceful", image: "/images/saree-green.jpg", fallback: FALLBACKS.green },
  { name: "Gold Zari", note: "Threads of pure metallic gold", image: "/images/saree-gold.jpg", fallback: FALLBACKS.gold },
];

const palette = [
  { name: "Crimson", from: "#b01f35", to: "#4a0611", h: 480, image: "/images/kanjeevaram.jpg", fallback: FALLBACKS.burgundy },
  { name: "Emerald", from: "#2e7c58", to: "#0d2d20", h: 440, image: "/images/saree-green.jpg", fallback: FALLBACKS.green },
  { name: "Mustard", from: "#d4a43b", to: "#6d4404", h: 410, image: "/images/saree-gold.jpg", fallback: FALLBACKS.gold },
  { name: "Sapphire", from: "#3254a8", to: "#0b183c", h: 380, image: "/images/organza.jpg", fallback: FALLBACKS.organza },
  { name: "Rose", from: "#e47c9c", to: "#731f41", h: 350, image: "/images/saree-burgundy.jpg", fallback: FALLBACKS.burgundy },
  { name: "Plum", from: "#6b2c65", to: "#240a22", h: 320, image: "/images/banarasi.jpg", fallback: FALLBACKS.banarasi },
  { name: "Ivory", from: "#f3e8d4", to: "#927b55", h: 290, image: "/images/saree-detail.jpg", fallback: FALLBACKS.detail },
];

const featured = [
  {
    name: "The Royal Burgundy",
    detail: "Pure Silk · Antique Gold Zari",
    price: "₹12,999",
    image: "/images/saree-burgundy.jpg",
    fallback: FALLBACKS.burgundy,
  },
  {
    name: "The Golden Heritage",
    detail: "Kanjeevaram · Traditional Korvai Weave",
    price: "₹15,499",
    image: "/images/saree-gold.jpg",
    fallback: FALLBACKS.gold,
  },
  {
    name: "The Emerald Story",
    detail: "Soft Silk · Handspun Floral Pallu",
    price: "₹9,999",
    image: "/images/saree-green.jpg",
    fallback: FALLBACKS.green,
  },
];

const signature = [
  { icon: Gem, label: "Finest fabrics" },
  { icon: Award, label: "Heritage craftsmanship" },
  { icon: Sparkles, label: "Enduring elegance" },
];

/* ───────────────────────── Zari Mandala ───────────────────────── */
function Mandala({ className }) {
  const petals = Array.from({ length: 16 });

  return (
    <svg
      className={className}
      viewBox="-200 -200 400 400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden="true"
    >
      {[190, 150, 112, 76, 44].map((r) => (
        <circle key={r} r={r} strokeOpacity={r > 100 ? 0.45 : 0.8} />
      ))}
      {petals.map((_, i) => (
        <g key={i} transform={`rotate(${(360 / petals.length) * i})`}>
          <ellipse cy="-132" rx="13" ry="42" />
          <ellipse cy="-170" rx="5" ry="16" strokeOpacity="0.65" />
          <path d="M0 -76 L0 -44" strokeOpacity="0.8" />
        </g>
      ))}
    </svg>
  );
}

/* ───────────────────────── Lotus Motif ───────────────────────── */
function Lotus({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 70"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      aria-hidden="true"
    >
      <path d="M60 64 C48 52 48 24 60 6 C72 24 72 52 60 64Z" />
      <path d="M60 64 C40 58 24 40 22 20 C42 24 56 42 60 64Z" />
      <path d="M60 64 C80 58 96 40 98 20 C78 24 64 42 60 64Z" />
      <path d="M60 64 C32 64 10 54 2 40 C26 38 48 48 60 64Z" />
      <path d="M60 64 C88 64 110 54 118 40 C94 38 72 48 60 64Z" />
    </svg>
  );
}

/* ───────────────────────── Staggered Reveal Heading ───────────────────────── */
function Heading({ lines, className = "", as: Tag = "h2" }) {
  const reduce = useReducedMotion();

  return (
    <Tag className={className}>
      {lines.map((line, i) => {
        const item = typeof line === "string" ? { text: line } : line;

        return (
          <span className="sk-line" key={item.text}>
            <motion.span
              className={item.accent ? "sk-line__in is-accent" : "sk-line__in"}
              initial={reduce ? false : { y: "115%" }}
              whileInView={{ y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{
                duration: 1,
                delay: i * 0.12,
                ease: [0.22, 0.8, 0.3, 1],
              }}
            >
              {item.text}
            </motion.span>
          </span>
        );
      })}
    </Tag>
  );
}

const introSeen = () => {
  try {
    return Boolean(sessionStorage.getItem("sarika_intro_seen"));
  } catch {
    return true;
  }
};

/* ───────────────────────── Main Page ───────────────────────── */
export default function Home() {
  const reduce = useReducedMotion();
  const heroRef = useRef(null);
  const videoRef = useRef(null);

  const [showIntro, setShowIntro] = useState(() => !introSeen());
  const [activePanel, setActivePanel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);

  const delay = useRef(showIntro ? 1.6 : 0.15);

  /* Page progress thread */
  const { scrollYProgress: pageProgress } = useScroll();
  const progress = useSpring(pageProgress, { stiffness: 120, damping: 28 });

  /* Hero Parallax */
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const photoShift = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const copyShift = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const mandalaTurn = useTransform(scrollYProgress, [0, 1], [0, 50]);

  /* Golden Drifting Petals */
  const petals = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        x: (i * 7.3 + (i % 3) * 5) % 100,
        delay: (i * 1.7) % 11,
        time: 11 + ((i * 2.3) % 8),
        size: 10 + ((i * 5) % 14),
        sway: 30 + ((i * 11) % 60),
      })),
    []
  );

  useEffect(() => {
    if (!showIntro) return undefined;

    if (reduce) {
      setShowIntro(false);
      return undefined;
    }

    try {
      sessionStorage.setItem("sarika_intro_seen", "1");
    } catch {
      /* storage unavailable */
    }

    const timer = setTimeout(() => setShowIntro(false), 2900);
    return () => clearTimeout(timer);
  }, [showIntro, reduce]);

  /* Hero Video Playback Controller */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (reduce) {
      video.pause();
      setIsPlaying(false);
      return;
    }

    video.muted = isMuted;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [reduce, isMuted]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleImgFallback = (e, fallbackUrl) => {
    if (e.currentTarget.src !== fallbackUrl) {
      e.currentTarget.src = fallbackUrl;
    }
  };

  const fadeUp = (i = 0) => ({
    initial: reduce ? false : { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.25 },
    transition: { duration: 0.9, delay: i * 0.12, ease: [0.22, 0.8, 0.3, 1] },
  });

  const heroIn = (offset = 0) => ({
    initial: reduce ? false : { opacity: 0, y: 36 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 1.1,
      delay: delay.current + offset,
      ease: [0.22, 0.8, 0.3, 1],
    },
  });

  return (
    <main className="sk-home">
      <motion.div className="sk-progress" style={{ scaleX: progress }} aria-hidden="true" />

      {/* ───────── Opening Silk Curtain ───────── */}
      {showIntro && (
        <div className="sk-curtain" aria-hidden="true">
          <div className="sk-curtain__half sk-curtain__half--left" />
          <div className="sk-curtain__half sk-curtain__half--right" />
          <div className="sk-curtain__emblem">
            <Mandala className="sk-curtain__mandala" />
            <span>SĀRIKA</span>
            <small>ROYAL WEAVES OF INDIA</small>
          </div>
        </div>
      )}

      {/* ───────── Hero Section with Video ───────── */}
      <section className="sk-hero" ref={heroRef}>
        <motion.div className="sk-hero__mandala" style={{ rotate: mandalaTurn }}>
          <Mandala />
        </motion.div>

        {/* Ambient Video / Image Canvas */}
        <motion.div
          className="sk-hero__photo"
          style={reduce ? undefined : { y: photoShift }}
          initial={reduce ? false : { opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, delay: delay.current, ease: "easeOut" }}
        >
          {!videoError ? (
            <video
              ref={videoRef}
              className="sk-hero__video"
              playsInline
              loop
              autoPlay
              muted={isMuted}
              poster="/images/hero-saree-poster.jpg"
              onError={() => setVideoError(true)}
            >
              <source src="/videos/saree_drapping.mp4" type="video/mp4" />
              <source
                src="https://assets.mixkit.co/videos/preview/mixkit-traditional-indian-woman-dressed-in-a-saree-41712-large.mp4"
                type="video/mp4"
              />
            </video>
          ) : (
            <img
              src="/images/hero-saree.jpg"
              alt="Luxury silk saree hero drape"
              onError={(e) => handleImgFallback(e, FALLBACKS.hero)}
            />
          )}

          {/* Ambient Video Play / Mute Pill */}
          {!videoError && !reduce && (
            <div className="sk-hero__controls">
              <button
                type="button"
                onClick={togglePlay}
                className="sk-hero__control-btn"
                aria-label={isPlaying ? "Pause ambient video" : "Play ambient video"}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                <span>{isPlaying ? "Pause" : "Play"}</span>
              </button>
              <span className="sk-hero__control-sep" />
              <button
                type="button"
                onClick={toggleMute}
                className="sk-hero__control-btn"
                aria-label={isMuted ? "Unmute video sound" : "Mute video sound"}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                <span>{isMuted ? "Mute" : "Sound"}</span>
              </button>
            </div>
          )}
        </motion.div>

        <div className="sk-hero__shade" aria-hidden="true" />

        {/* Floating Golden Petals */}
        <div className="sk-hero__petals" aria-hidden="true">
          {petals.map((p, i) => (
            <i
              key={i}
              style={{
                "--x": `${p.x}%`,
                "--d": `${p.delay}s`,
                "--t": `${p.time}s`,
                "--s": `${p.size}px`,
                "--w": `${p.sway}px`,
              }}
            />
          ))}
        </div>

        {/* Reference Video Top-Right Motto */}
        {/* <div className="sk-hero__corner-motto" aria-hidden="true">
          <span>Crafted Elegance</span>
          <em>Woven Stories</em>
        </div>

        {/* Hero Copy matching Reference Video */}
        <motion.div
          className="sk-hero__copy"
          style={reduce ? undefined : { y: copyShift }}
        >
          <motion.p className="sk-hero__kicker" {...heroIn(0)}>
            <i />
            Sarees woven with
          </motion.p>

          <motion.h1 {...heroIn(0.1)}>
            <span className="sk-hero__big">
              Culture
              <svg viewBox="0 0 520 40" aria-hidden="true">
                <path d="M4 28 C90 6, 190 4, 280 18 S440 38, 516 8" />
                <path d="M470 12 C486 4, 500 6, 512 16" />
              </svg>
            </span>
            <span className="sk-hero__small">
              <em>woven</em> in every thread
            </span>
          </motion.h1>

          <motion.p className="sk-hero__tagline" {...heroIn(0.2)}>
            Heirloom drapes for modern stories
          </motion.p>

          <motion.p className="sk-hero__lead" {...heroIn(0.28)}>
            Discover the beauty of timeless Indian sarees, where every weave
            carries a story and every detail speaks of grace.
          </motion.p>

          <motion.div className="sk-hero__actions" {...heroIn(0.36)}>
            <Link to="/shop" className="sk-pill sk-pill--outline">
              Explore the collection <ArrowRight size={16} />
            </Link>
            <a href="#story" className="sk-hero__link">
              Our story
            </a>
          </motion.div>

          <motion.div className="sk-hero__signature" {...heroIn(0.46)}>
            <p>The SĀRIKA signature</p>
            <ul>
              {signature.map(({ icon: Icon, label }) => (
                <li key={label}>
                  <Icon size={18} strokeWidth={1.4} />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        {/* Circular Pure Silk Wax Seal */}
        <div className="sk-hero__seal" aria-hidden="true">
          <span>Pure</span>
          <strong>Art</strong>
          <span>of silk</span>
        </div>

        <a href="#story" className="sk-hero__scroll">
          <MoveDown size={16} />
          <span>Scroll to discover</span>
        </a> 
      </section>

      {/* ───────── Gold Border Marquee ───────── */}
      <div className="sk-marquee" aria-hidden="true">
        <div className="sk-marquee__track">
          {Array.from({ length: 2 }).map((_, index) => (
            <div className="sk-marquee__set" key={index}>
              <span>Timeless beauty</span>
              <Gem size={14} />
              <span>Indian craftsmanship</span>
              <Gem size={14} />
              <span>Woven with love</span>
              <Gem size={14} />
              <span>The art of elegance</span>
              <Gem size={14} />
              <span>Heirloom sarees</span>
              <Gem size={14} />
            </div>
          ))}
        </div>
      </div>

      {/* ───────── Story + Arrivals Collage ───────── */}
      <section className="sk-arrivals" id="story">
        <span className="sk-arrivals__blob" aria-hidden="true" />
        <span className="sk-arrivals__half" aria-hidden="true" />

        <div className="sk-arrivals__copy">
          <p className="sk-eyebrow">A world of heritage</p>

          <Heading
            className="sk-display"
            lines={["New weaves,", { text: "timeless grace.", accent: true }]}
          />

          <motion.p className="sk-arrivals__text" {...fadeUp(1)}>
            At SĀRIKA, we celebrate the art of Indian textiles. From intricate
            zari details to graceful silk textures, discover pieces that make
            every moment unforgettable.
          </motion.p>

          <motion.div {...fadeUp(2)}>
            <Link to="/shop" className="sk-pill sk-pill--wine sk-pill--square">
              Discover new arrivals <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>

        {/* Staggered Saree Cards — each opens /shop */}
        <div className="sk-collage">
          {arrivals.map((item, i) => (
            <motion.figure
              key={item.local}
              className={`sk-collage__card sk-collage__card--${i + 1}`}
              initial={reduce ? false : { opacity: 0, y: 120, rotate: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 1.1,
                delay: i * 0.14,
                ease: [0.22, 0.8, 0.3, 1],
              }}
            >
              <Link to="/shop" aria-label={`Shop ${item.title}`}>
                <img
                  src={item.local}
                  alt={item.title}
                  loading="lazy"
                  onError={(e) => handleImgFallback(e, item.fallback)}
                />
                <span className="sk-collage__tag">{item.title}</span>
              </Link>
            </motion.figure>
          ))}
        </div>
      </section>

      {/* ───────── Collections Accordion ───────── */}
      <section className="sk-collections" id="collections">
        <header className="sk-heading sk-heading--center">
          <p className="sk-eyebrow">Curated for you</p>
          <Heading className="sk-display" lines={["Explore our", { text: "collections", accent: true }]} />
        </header>

        {/* Expandable Weaves — each card opens /shop */}
        <div className="sk-accordion">
          {gallery.map((item, index) => (
            <div
              key={item.name}
              className={`sk-panel${activePanel === index ? " is-active" : ""}`}
              onMouseEnter={() => setActivePanel(index)}
              onFocus={() => setActivePanel(index)}
              onClick={() => setActivePanel(index)}
              tabIndex={0}
              role="group"
              aria-label={item.name}
            >
              <img
                src={item.image}
                alt={`${item.name} sarees`}
                loading="lazy"
                onError={(e) => handleImgFallback(e, item.fallback)}
              />
              <span className="sk-panel__shade" />
              <span className="sk-panel__no">0{index + 1}</span>
              <span className="sk-panel__vertical" aria-hidden="true">{item.name}</span>

              <div className="sk-panel__info">
                <small>{item.note}</small>
                <h3>{item.name}</h3>
                <Link to="/shop" className="sk-panel__go">
                  <span>Explore in shop</span>
                  <i>
                    <ArrowRight size={15} />
                  </i>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── Shop by Colour (Arch Pills matching Reference) ───────── */}
      <section className="sk-colour">
        <div className="sk-colour__intro">
          <p className="sk-eyebrow">Explore the palette</p>
          <Heading
            className="sk-display sk-display--caps"
            lines={["Shop by", "color"]}
          />
          <svg className="sk-colour__swash" viewBox="0 0 160 30" aria-hidden="true">
            <path d="M2 4 C40 4, 60 26, 158 24" />
          </svg>
          <motion.p className="sk-colour__text" {...fadeUp(1)}>
            Rich moods, woven in silk — find the shade that speaks to you.
          </motion.p>
          <motion.div {...fadeUp(2)}>
            <Link to="/shop" className="sk-round">
              <ArrowRight size={18} />
              <span>Explore every shade</span>
            </Link>
          </motion.div>
        </div>

        {/* Descending Arch Cards — clicking any card opens /shop */}
        <div className="sk-pills">
          {palette.map((colour, index) => (
            <motion.div
              key={colour.name}
              className="sk-pill-card"
              style={{ "--from": colour.from, "--to": colour.to, "--h": `${colour.h}px` }}
              initial={reduce ? false : { opacity: 0, scaleY: 0.15 }}
              whileInView={{ opacity: 1, scaleY: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 1.1,
                delay: index * 0.09,
                ease: [0.22, 0.8, 0.3, 1],
              }}
            >
              <Link to="/shop" aria-label={`Shop ${colour.name} sarees`}>
                <img
                  src={colour.image}
                  alt={colour.name}
                  loading="lazy"
                  onError={(e) => handleImgFallback(e, colour.fallback)}
                />
                <span className="sk-pill-card__label">{colour.name}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ───────── Best Sellers ───────── */}
      <section className="sk-best">
        <div className="sk-best__intro">
          <Lotus className="sk-best__lotus" />
          <p className="sk-eyebrow">Most loved</p>
          <Heading className="sk-display" lines={["Best", { text: "sellers", accent: true }]} />
          <motion.p className="sk-best__text" {...fadeUp(1)}>
            Our most loved drapes, chosen for their weave, colour and the
            stories they carry.
          </motion.p>
          <motion.div {...fadeUp(2)}>
            <Link to="/shop" className="sk-round">
              <ArrowRight size={18} />
              <span>Shop all sarees</span>
            </Link>
          </motion.div>
        </div>

        {/* Product Cards — clicking any image, title or button opens /shop */}
        <div className="sk-products">
          {featured.map((item, index) => (
            <motion.article
              className={`sk-product sk-product--${index + 1}`}
              key={item.name}
              initial={reduce ? false : { opacity: 0, y: 70 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.9, delay: index * 0.14, ease: [0.22, 0.8, 0.3, 1] }}
            >
              <Link to="/shop" className="sk-product__image" aria-label={`Shop ${item.name}`}>
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  onError={(e) => handleImgFallback(e, item.fallback)}
                />
                <span className="sk-product__tag">SĀRIKA edit</span>
                <span className="sk-product__go">
                  <ArrowUpRight size={18} />
                </span>
              </Link>

              <div className="sk-product__meta">
                <div>
                  <h3>
                    <Link to="/shop" className="sk-product__title-link">
                      {item.name}
                    </Link>
                  </h3>
                  <p>{item.detail}</p>
                </div>
                <strong>{item.price}</strong>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ───────── Craftsmanship Story ───────── */}
      <section className="sk-craft" id="craftsmanship">
        <div className="sk-craft__image">
          <img
            src="/images/saree-detail.jpg"
            alt="Close-up of silk and zari craftsmanship"
            loading="lazy"
            onError={(e) => handleImgFallback(e, FALLBACKS.detail)}
          />
        </div>

        <div className="sk-craft__copy">
          <p className="sk-eyebrow sk-eyebrow--light">Beauty in every detail</p>
          <Heading
            className="sk-display sk-display--light"
            lines={["The magic is", { text: "in the weaving.", accent: true }]}
          />
          <motion.p {...fadeUp(1)}>
            The delicate textures, rich colours and intricate borders make every
            saree a work of art. Discover the beauty that begins with a single
            thread.
          </motion.p>
          <motion.div {...fadeUp(2)}>
            <Link to="/shop" className="sk-pill sk-pill--gold">
              Explore the art <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ───────── Try-on Studio Teaser ───────── */}
      <section className="sk-tryon">
        <span className="sk-tryon__letter" aria-hidden="true">S</span>

        <div className="sk-tryon__inner">
          <p className="sk-eyebrow">Your style, your story</p>
          <Heading className="sk-display" lines={["Imagine it.", { text: "Wear it.", accent: true }]} />
          <motion.p {...fadeUp(1)}>
            Your favourite saree, your own style. Explore our virtual try-on
            experience and discover a new way to choose your saree.
          </motion.p>
          <motion.div {...fadeUp(2)}>
            <Link to="/shop" className="sk-pill sk-pill--wine">
              Find your SĀRIKA <ArrowRight size={16} />
            </Link>
          </motion.div>
          <small>Virtual try-on experience coming soon</small>
        </div>
      </section>

      {/* ───────── Contact (Matching Reference Video Frame 10) ───────── */}
      <section className="sk-contact">
        <div className="sk-contact__panel">
          <div className="sk-contact__copy">
            <p className="sk-eyebrow sk-eyebrow--light">Contact Us</p>
            <Heading
              className="sk-display sk-display--light"
              lines={["We’d Love", { text: "to Hear", accent: true }, "From You"]}
            />
            <motion.p {...fadeUp(1)}>
              Questions, styling advice, or a saree you can't stop thinking about —
              we're here, and we enjoy personally assisting you.
            </motion.p>

            <motion.div className="sk-contact__actions" {...fadeUp(2)}>
              <Link to="/contact" className="sk-pill sk-pill--gold">
                Send a message <ArrowRight size={16} />
              </Link>
              <Link to="/shop" className="sk-contact__link">
                Find your saree in shop
              </Link>
            </motion.div>
          </div>

          <div className="sk-contact__photo">
            <img
              src="/images/banarasi.jpg"
              alt="Luxury saree styling consultation"
              loading="lazy"
              onError={(e) => handleImgFallback(e, FALLBACKS.banarasi)}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
