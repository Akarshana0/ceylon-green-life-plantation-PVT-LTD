"use client";

import Image from "next/image";
import { useEffect, useState, useRef, useCallback } from "react";

/* ──────────────────────────── ANIMATED COUNTER ──────────────────────────── */
function AnimatedCounter({
  end,
  suffix = "",
  duration = 2000,
  inView,
}: {
  end: number;
  suffix?: string;
  duration?: number;
  inView: boolean;
}) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);
  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ──────────────────────────── INTERSECTION HOOK ─────────────────────────── */
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ──────────────────────────── NAV LINK DATA ─────────────────────────────── */
const NAV_LINKS = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#services", label: "Services" },
  { href: "#stats", label: "Achievements" },
  { href: "#gallery", label: "Gallery" },
  { href: "#contact", label: "Contact" },
];

/* ──────────────────────────── SERVICES DATA ─────────────────────────────── */
const SERVICES = [
  {
    icon: "🌿",
    title: "Tea Cultivation",
    desc: "Premium Ceylon tea grown in Sri Lanka's lush highlands using sustainable organic farming methods.",
  },
  {
    icon: "🌱",
    title: "Sustainable Agriculture",
    desc: "Eco-friendly farming practices that protect biodiversity and enrich soil for future generations.",
  },
  {
    icon: "♻️",
    title: "Green Energy",
    desc: "Renewable energy integration across plantations — solar, biomass, and micro-hydro power solutions.",
  },
  {
    icon: "🏭",
    title: "Processing & Export",
    desc: "State-of-the-art processing facilities ensuring world-class quality for global export markets.",
  },
  {
    icon: "👥",
    title: "Community Development",
    desc: "Empowering local communities through education, healthcare, and fair employment opportunities.",
  },
  {
    icon: "🔬",
    title: "Research & Innovation",
    desc: "Cutting-edge agricultural research driving productivity while preserving the environment.",
  },
];

/* ──────────────────────────── STATS DATA ────────────────────────────────── */
const STATS = [
  { value: 5000, suffix: "+", label: "Acres of Plantation", icon: "🌾" },
  { value: 1200, suffix: "+", label: "Employees", icon: "👥" },
  { value: 15, suffix: "+", label: "Years of Excellence", icon: "📅" },
  { value: 20, suffix: "+", label: "Export Markets", icon: "🌍" },
];

/* ──────────────────────────── GALLERY DATA ──────────────────────────────── */
const GALLERY_ITEMS = [
  {
    title: "Highland Tea Gardens",
    desc: "Lush green tea plantations in Sri Lanka's central highlands",
  },
  {
    title: "Sustainable Farming",
    desc: "Eco-friendly agricultural practices and organic cultivation",
  },
  {
    title: "Processing Excellence",
    desc: "Modern tea processing and quality control facilities",
  },
  {
    title: "Community Engagement",
    desc: "Empowering local communities and creating opportunities",
  },
];

/* ════════════════════════════ MAIN COMPONENT ════════════════════════════ */

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const statsSection = useInView(0.3);

  /* ── scroll listener for navbar ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── reveal-on-scroll (IntersectionObserver) ── */
  useEffect(() => {
    const els = document.querySelectorAll(
      ".reveal, .reveal-left, .reveal-right, .reveal-scale"
    );
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            obs.unobserve(e.target);
          }
        }),
      { threshold: 0.15 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const scrollTo = useCallback((id: string) => {
    setMobileMenuOpen(false);
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  /* ═══════════════════════════════ JSX ═══════════════════════════════════ */
  return (
    <div className="relative overflow-x-hidden bg-[#060e06]">
      {/* ── Floating Leaf Particles ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <span
            key={i}
            className="leaf"
            style={{
              left: `${15 + i * 14}%`,
              animationDuration: `${12 + i * 4}s`,
              animationDelay: `${i * 2.5}s`,
              fontSize: `${16 + i * 3}px`,
            }}
          />
        ))}
      </div>

      {/* ═══════════════════════ NAVIGATION ═══════════════════════════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "glass-dark shadow-lg shadow-black/30 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo + Brand */}
          <button
            onClick={() => scrollTo("#home")}
            className="flex items-center gap-3 group cursor-pointer bg-transparent border-none"
          >
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden ring-2 ring-green-400/40 group-hover:ring-green-400 transition-all duration-300 animate-pulse-glow">
              <Image
                src="/assets/logo.png"
                alt="Ceylon Green Life Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <h1
                className="text-white font-bold text-base leading-tight tracking-wide"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Ceylon Green Life
              </h1>
              <p className="text-green-400/70 text-[10px] tracking-[0.2em] uppercase">
                Plantation (PVT) LTD
              </p>
            </div>
          </button>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => scrollTo(l.href)}
                className="relative px-4 py-2 text-sm text-white/80 hover:text-white font-medium transition-colors cursor-pointer bg-transparent border-none group"
              >
                {l.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-green-400 to-yellow-400 group-hover:w-3/4 transition-all duration-300" />
              </button>
            ))}
            <button
              onClick={() => scrollTo("#contact")}
              className="ml-3 px-5 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-400 hover:to-emerald-500 transition-all duration-300 shadow-lg shadow-green-900/40 hover:shadow-green-700/60 cursor-pointer border-none"
            >
              Get In Touch
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2 cursor-pointer bg-transparent border-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span
              className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`}
            />
            <span
              className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}
            />
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-500 ${
            mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="glass-dark mx-4 mt-3 rounded-2xl p-4 flex flex-col gap-2">
            {NAV_LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => scrollTo(l.href)}
                className="w-full text-left px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer bg-transparent border-none"
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ═══════════════════════ HERO SECTION ═════════════════════════════ */}
      <section
        id="home"
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/assets/bg.jpg"
            alt="Tea plantation landscape"
            fill
            className="object-cover"
            priority
            quality={90}
          />
          <div className="absolute inset-0 gradient-hero" />
          {/* Extra cinematic vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#060e06] via-transparent to-[#060e06]/40" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          {/* Animated Logo */}
          <div className="animate-fade-in-down mb-8">
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 mx-auto rounded-full overflow-hidden ring-4 ring-green-400/30 animate-pulse-glow shadow-2xl">
              <Image
                src="/assets/logo.png"
                alt="Ceylon Green Life Plantation Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Title */}
          <h1
            className="animate-fade-in-up text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-4 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Ceylon{" "}
            <span className="gradient-text">Green Life</span>
            <br />
            <span className="text-3xl sm:text-4xl md:text-5xl font-medium text-white/80">
              Plantation (PVT) LTD
            </span>
          </h1>

          {/* Tagline */}
          <p className="animate-fade-in-up delay-300 text-base sm:text-lg md:text-xl text-green-100/80 max-w-2xl mx-auto mb-10 leading-relaxed opacity-0">
            Nurturing Nature, Harvesting Excellence — Sri Lanka&apos;s premier
            sustainable plantation company committed to green innovation and
            community prosperity.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up delay-500 flex flex-col sm:flex-row gap-4 justify-center opacity-0">
            <button
              onClick={() => scrollTo("#about")}
              className="group px-8 py-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-lg shadow-xl shadow-green-900/50 hover:shadow-green-600/60 hover:from-green-400 hover:to-emerald-500 transition-all duration-300 hover:-translate-y-1 cursor-pointer border-none"
            >
              Discover Our Story
              <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">
                →
              </span>
            </button>
            <button
              onClick={() => scrollTo("#services")}
              className="px-8 py-4 rounded-full glass text-white font-semibold text-lg hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-white/20"
            >
              Our Services
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-7 h-12 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-green-400 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════ ABOUT SECTION ════════════════════════════ */}
      <section
        id="about"
        className="relative py-24 sm:py-32 bg-gradient-to-b from-[#060e06] via-[#0a1a0a] to-[#060e06]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16 reveal">
            <p className="text-green-400 font-semibold tracking-[0.3em] uppercase text-sm mb-3">
              Who We Are
            </p>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Rooted in <span className="gradient-text">Tradition</span>,
              <br />
              Growing with <span className="gradient-text">Innovation</span>
            </h2>
            <div className="w-20 h-1 mx-auto bg-gradient-to-r from-green-500 to-yellow-400 rounded-full" />
          </div>

          {/* About Grid */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Image */}
            <div className="reveal-left relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-green-900/30">
                <Image
                  src="/assets/bg.jpg"
                  alt="Ceylon Green Life Plantation"
                  width={600}
                  height={400}
                  className="object-cover w-full h-[400px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#060e06]/80 via-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="glass-dark rounded-xl p-4">
                    <p className="text-green-400 font-semibold text-lg">
                      🌿 Since 2010
                    </p>
                    <p className="text-white/70 text-sm">
                      Pioneering sustainable agriculture in Sri Lanka
                    </p>
                  </div>
                </div>
              </div>
              {/* Decorative */}
              <div className="absolute -top-4 -left-4 w-20 h-20 border-2 border-green-500/20 rounded-2xl" />
              <div className="absolute -bottom-4 -right-4 w-20 h-20 border-2 border-yellow-500/20 rounded-2xl" />
            </div>

            {/* Right: Text */}
            <div className="reveal-right space-y-6">
              <p className="text-white/80 text-lg leading-relaxed">
                <span className="text-green-400 font-semibold">
                  Ceylon Green Life Plantation (PVT) LTD
                </span>{" "}
                is a leading plantation enterprise headquartered in Sri Lanka,
                dedicated to cultivating the finest tea, spices, and sustainable
                crops across thousands of acres of lush green highlands.
              </p>
              <p className="text-white/70 leading-relaxed">
                We blend traditional Sri Lankan agricultural heritage with
                cutting-edge green technologies. Our commitment extends beyond
                the fields — we invest in our communities, protect our
                environment, and deliver world-class products to global markets.
              </p>

              {/* Value Cards */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                {[
                  {
                    icon: "🌍",
                    title: "Eco-Friendly",
                    desc: "100% sustainable practices",
                  },
                  {
                    icon: "⭐",
                    title: "Premium Quality",
                    desc: "Internationally certified",
                  },
                  {
                    icon: "🤝",
                    title: "Fair Trade",
                    desc: "Ethical labor practices",
                  },
                  {
                    icon: "🔬",
                    title: "Innovation",
                    desc: "Modern agri-tech solutions",
                  },
                ].map((v, i) => (
                  <div
                    key={i}
                    className="glass-green rounded-xl p-4 hover-lift cursor-default"
                  >
                    <span className="text-2xl mb-2 block">{v.icon}</span>
                    <h4 className="text-white font-semibold text-sm">
                      {v.title}
                    </h4>
                    <p className="text-white/50 text-xs mt-1">{v.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ SERVICES SECTION ═════════════════════════ */}
      <section
        id="services"
        className="relative py-24 sm:py-32 bg-gradient-to-b from-[#060e06] via-[#0d1f0d] to-[#060e06]"
      >
        {/* Decorative bg */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, rgba(34,197,94,0.3) 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16 reveal">
            <p className="text-green-400 font-semibold tracking-[0.3em] uppercase text-sm mb-3">
              What We Do
            </p>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Our <span className="gradient-text">Services</span>
            </h2>
            <div className="w-20 h-1 mx-auto bg-gradient-to-r from-green-500 to-yellow-400 rounded-full" />
          </div>

          {/* Services Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s, i) => (
              <div
                key={i}
                className="reveal-scale glass-green rounded-2xl p-8 hover-lift group cursor-default"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  {s.icon}
                </div>
                <h3
                  className="text-xl font-bold text-white mb-3"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {s.title}
                </h3>
                <p className="text-white/60 leading-relaxed text-sm">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ STATS SECTION ════════════════════════════ */}
      <section
        id="stats"
        ref={statsSection.ref}
        className="relative py-20 sm:py-28"
      >
        {/* Background with image */}
        <div className="absolute inset-0">
          <Image
            src="/assets/bg.jpg"
            alt="Plantation backdrop"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060e06]/95 via-[#14532d]/85 to-[#060e06]/95" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 reveal">
            <p className="text-green-400 font-semibold tracking-[0.3em] uppercase text-sm mb-3">
              Our Impact
            </p>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Achievements &amp; <span className="gradient-text">Numbers</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((s, i) => (
              <div
                key={i}
                className="reveal-scale glass rounded-2xl p-8 text-center hover-glow"
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <span className="text-4xl mb-4 block">{s.icon}</span>
                <p className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  <AnimatedCounter
                    end={s.value}
                    suffix={s.suffix}
                    inView={statsSection.visible}
                  />
                </p>
                <p className="text-green-300/70 font-medium text-sm">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ GALLERY SECTION ══════════════════════════ */}
      <section
        id="gallery"
        className="relative py-24 sm:py-32 bg-gradient-to-b from-[#060e06] via-[#0a1a0a] to-[#060e06]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <p className="text-green-400 font-semibold tracking-[0.3em] uppercase text-sm mb-3">
              Visual Journey
            </p>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Our <span className="gradient-text">Gallery</span>
            </h2>
            <div className="w-20 h-1 mx-auto bg-gradient-to-r from-green-500 to-yellow-400 rounded-full" />
          </div>

          {/* Gallery Grid */}
          <div className="grid sm:grid-cols-2 gap-6">
            {GALLERY_ITEMS.map((item, i) => (
              <div
                key={i}
                className="reveal-scale group relative rounded-2xl overflow-hidden shadow-2xl shadow-black/30 cursor-pointer"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="relative h-64 sm:h-80">
                  <Image
                    src="/assets/bg.jpg"
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    style={{
                      objectPosition:
                        i === 0
                          ? "center 30%"
                          : i === 1
                            ? "center 50%"
                            : i === 2
                              ? "center 70%"
                              : "center 90%",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060e06] via-[#060e06]/30 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <h3
                    className="text-xl font-bold text-white mb-1"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-green-300/70 text-sm">{item.desc}</p>
                </div>
                {/* Hover border glow */}
                <div className="absolute inset-0 border-2 border-green-400/0 group-hover:border-green-400/30 rounded-2xl transition-all duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ CONTACT SECTION ══════════════════════════ */}
      <section
        id="contact"
        className="relative py-24 sm:py-32 bg-gradient-to-b from-[#060e06] via-[#0d1f0d] to-[#060e06]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <p className="text-green-400 font-semibold tracking-[0.3em] uppercase text-sm mb-3">
              Reach Out
            </p>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Get In <span className="gradient-text">Touch</span>
            </h2>
            <div className="w-20 h-1 mx-auto bg-gradient-to-r from-green-500 to-yellow-400 rounded-full" />
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="reveal-left space-y-8">
              <div>
                <h3
                  className="text-2xl font-bold text-white mb-6"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Let&apos;s Connect
                </h3>
                <p className="text-white/60 leading-relaxed">
                  Whether you&apos;re interested in our premium plantation
                  products, partnership opportunities, or employment — we&apos;d
                  love to hear from you.
                </p>
              </div>

              {/* Info Cards */}
              {[
                {
                  icon: "📍",
                  title: "Head Office",
                  info: "Warakapola, Kegalle District, Sri Lanka",
                },
                {
                  icon: "📞",
                  title: "Phone",
                  info: "+94 35 222 XXXX",
                },
                {
                  icon: "✉️",
                  title: "Email",
                  info: "info@ceylongreenlife.lk",
                },
                {
                  icon: "🕐",
                  title: "Business Hours",
                  info: "Mon - Sat: 8:00 AM - 5:00 PM",
                },
              ].map((c, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 glass-green rounded-xl p-4 hover-lift"
                >
                  <span className="text-2xl mt-1">{c.icon}</span>
                  <div>
                    <h4 className="text-white font-semibold">{c.title}</h4>
                    <p className="text-white/60 text-sm">{c.info}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Form */}
            <div className="reveal-right">
              <form
                className="glass-green rounded-2xl p-8 space-y-5"
                onSubmit={(e) => e.preventDefault()}
              >
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="contact-name"
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-green-400/50 focus:ring-1 focus:ring-green-400/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-green-400/50 focus:ring-1 focus:ring-green-400/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="contact-subject"
                    placeholder="How can we help?"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-green-400/50 focus:ring-1 focus:ring-green-400/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    id="contact-message"
                    placeholder="Tell us about your inquiry..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-green-400/50 focus:ring-1 focus:ring-green-400/30 transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-lg shadow-lg shadow-green-900/40 hover:shadow-green-600/50 hover:from-green-400 hover:to-emerald-500 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer border-none"
                >
                  Send Message ✉️
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FOOTER ════════════════════════════════════ */}
      <footer className="relative bg-[#040a04] border-t border-white/5 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-5">
                <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-green-400/30">
                  <Image
                    src="/assets/logo.png"
                    alt="Logo"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3
                    className="text-white font-bold text-sm"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Ceylon Green Life
                  </h3>
                  <p className="text-green-400/60 text-[10px] tracking-[0.15em] uppercase">
                    Plantation (PVT) LTD
                  </p>
                </div>
              </div>
              <p className="text-white/40 text-sm leading-relaxed">
                Nurturing nature, harvesting excellence. Sri Lanka&apos;s
                trusted partner in sustainable plantation management.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm tracking-wide">
                Quick Links
              </h4>
              <ul className="space-y-3">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <button
                      onClick={() => scrollTo(l.href)}
                      className="text-white/40 hover:text-green-400 text-sm transition-colors cursor-pointer bg-transparent border-none"
                    >
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm tracking-wide">
                Services
              </h4>
              <ul className="space-y-3">
                {SERVICES.slice(0, 4).map((s, i) => (
                  <li
                    key={i}
                    className="text-white/40 text-sm flex items-center gap-2"
                  >
                    <span className="text-xs">{s.icon}</span> {s.title}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm tracking-wide">
                Contact
              </h4>
              <ul className="space-y-3 text-white/40 text-sm">
                <li className="flex items-center gap-2">
                  📍 Warakapola, Sri Lanka
                </li>
                <li className="flex items-center gap-2">
                  📞 +94 35 222 XXXX
                </li>
                <li className="flex items-center gap-2">
                  ✉️ info@ceylongreenlife.lk
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-14 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/30 text-sm">
              © {new Date().getFullYear()} Ceylon Green Life Plantation (PVT)
              LTD. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-white/20 text-xs">Made with</span>
              <span className="text-green-400 text-sm">🌿</span>
              <span className="text-white/20 text-xs">in Sri Lanka</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
