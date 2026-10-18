import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, Menu, X, LogIn } from "lucide-react";
import { useRef, useState, type CSSProperties } from "react";

/* ---------------- WordsPullUp ---------------- */
interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  style?: CSSProperties;
}

export const WordsPullUp = ({
  text,
  className = "",
  showAsterisk = false,
  style,
}: WordsPullUpProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(" ");

  return (
    <div ref={ref} className={`inline-flex flex-wrap ${className}`} style={style}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <motion.span
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block relative"
            style={{ marginRight: isLast ? 0 : "0.25em" }}
          >
            {word}
            {showAsterisk && isLast && (
              <span className="absolute top-[0.65em] -right-[0.3em] text-[0.31em]">*</span>
            )}
          </motion.span>
        );
      })}
    </div>
  );
};

/* ---------------- WordsPullUpMultiStyle ---------------- */
interface Segment {
  text: string;
  className?: string;
}

interface WordsPullUpMultiStyleProps {
  segments: Segment[];
  className?: string;
  style?: CSSProperties;
}

export const WordsPullUpMultiStyle = ({
  segments,
  className = "",
  style,
}: WordsPullUpMultiStyleProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const words: { word: string; className?: string }[] = [];
  segments.forEach((seg) => {
    seg.text.split(" ").forEach((w) => {
      if (w) words.push({ word: w, className: seg.className });
    });
  });

  return (
    <div ref={ref} className={`inline-flex flex-wrap justify-center ${className}`} style={style}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className={`inline-block ${w.className ?? ""}`}
          style={{ marginRight: "0.25em" }}
        >
          {w.word}
        </motion.span>
      ))}
    </div>
  );
};

/* ---------------- Hero ---------------- */
const defaultNavItems = ["Features", "IMEI Vault", "Dividends", "Security", "Sign In"];

export interface PrismaHeroProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  videoSrc?: string;
  navItems?: Array<{ label: string; href: string }> | string[];
  onCtaClick?: () => void;
}

export const PrismaHero = ({
  title = "PhoneTrack",
  subtitle = "Next-generation operating system for phone and IMEI retail businesses. Complete hardware indexing, transparent partner dividends, and real-time inventory control.",
  ctaText = "Open Console",
  ctaLink = "/login",
  videoSrc = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4",
  navItems = defaultNavItems,
  onCtaClick,
}: PrismaHeroProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <section className="min-h-screen w-full p-2 sm:p-4">
      <div className="relative h-[94vh] min-h-[600px] w-full overflow-hidden rounded-2xl md:rounded-[2rem] border border-white/10 shadow-2xl">
        {/* Background video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          src={videoSrc}
        />

        {/* Noise overlay */}
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.55] mix-blend-overlay bg-black/20" />

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/85" />

        {/* Floating Navbar (Mobile & Desktop) */}
        <header className="absolute top-3 sm:top-5 left-0 right-0 z-30 px-3 sm:px-6 flex flex-col items-center">
          {/* Desktop Navigation Pill */}
          <nav className="hidden md:flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-2xl px-3 py-1.5 border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-2 pl-2 pr-3 border-r border-white/10">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-cyan-400" />
              </span>
              <span className="text-xs font-black tracking-wider uppercase text-white/90">
                {title}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {navItems.map((item, idx) => {
                const label = typeof item === "string" ? item : item.label;
                const href =
                  typeof item === "string"
                    ? label === "Sign In"
                      ? "/login"
                      : `#${label.toLowerCase().replace(/\s+/g, "-")}`
                    : item.href;
                const isSignIn =
                  label.toLowerCase().includes("sign in") || label.toLowerCase().includes("login");

                if (isSignIn) {
                  return (
                    <a
                      key={idx}
                      href={href}
                      className="ml-2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 text-slate-950 shadow-md shadow-cyan-500/30 hover:shadow-cyan-400/50 hover:scale-105 active:scale-95 transition-all duration-200"
                    >
                      <LogIn className="size-3" />
                      <span>{label}</span>
                    </a>
                  );
                }

                return (
                  <a
                    key={idx}
                    href={href}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                  >
                    {label}
                  </a>
                );
              })}
            </div>
          </nav>

          {/* Mobile Navigation Bar */}
          <div className="flex md:hidden w-full max-w-sm flex-col">
            <div className="flex items-center justify-between rounded-full bg-black/80 backdrop-blur-2xl px-3.5 py-2 border border-white/15 shadow-2xl">
              {/* Brand Indicator */}
              <a href="#" className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2 bg-cyan-400" />
                </span>
                <span className="text-xs font-black tracking-wider uppercase text-white">
                  {title}
                </span>
              </a>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <a
                  href="/login"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-sm"
                >
                  <LogIn className="size-2.5" />
                  <span>Sign In</span>
                </a>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle Navigation Menu"
                  className="size-7 rounded-full bg-white/10 hover:bg-white/15 text-slate-200 flex items-center justify-center transition border border-white/10 cursor-pointer"
                >
                  {mobileMenuOpen ? <X className="size-3.5" /> : <Menu className="size-3.5" />}
                </button>
              </div>
            </div>

            {/* Mobile Dropdown Menu Drawer */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="mt-2 rounded-2xl bg-black/95 backdrop-blur-2xl border border-white/15 p-3 shadow-2xl space-y-1.5"
                >
                  {navItems.map((item, idx) => {
                    const label = typeof item === "string" ? item : item.label;
                    const href =
                      typeof item === "string"
                        ? label === "Sign In"
                          ? "/login"
                          : `#${label.toLowerCase().replace(/\s+/g, "-")}`
                        : item.href;
                    const isSignIn =
                      label.toLowerCase().includes("sign in") || label.toLowerCase().includes("login");

                    return (
                      <a
                        key={idx}
                        href={href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                          isSignIn
                            ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30"
                            : "text-slate-300 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <span>{label}</span>
                        {isSignIn ? (
                          <LogIn className="size-3.5 text-cyan-400" />
                        ) : (
                          <ArrowRight className="size-3 text-slate-500" />
                        )}
                      </a>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 sm:px-6 sm:pb-8 md:px-10 md:pb-10">
          <div className="grid grid-cols-12 items-end gap-6">
            <div className="col-span-12 lg:col-span-8">
              <h1
                className="font-black leading-[0.85] tracking-[-0.07em] text-[18vw] sm:text-[18vw] md:text-[16vw] lg:text-[13vw] xl:text-[12vw]"
                style={{ color: "#E1E0CC" }}
              >
                <WordsPullUp text={title} showAsterisk />
              </h1>
            </div>

            <div className="col-span-12 flex flex-col gap-5 pb-2 lg:col-span-4 lg:pb-4">
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-xs text-[#E1E0CC]/80 sm:text-sm md:text-base leading-relaxed"
              >
                {subtitle}
              </motion.p>

              <a
                href={ctaLink}
                onClick={onCtaClick}
                className="self-start"
              >
                <motion.button
                  type="button"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="group inline-flex items-center gap-3 self-start rounded-full bg-cyan-400 hover:bg-cyan-300 py-1.5 pl-6 pr-1.5 text-sm font-bold text-black transition-all hover:gap-4 sm:text-base cursor-pointer shadow-lg shadow-cyan-500/25"
                >
                  {ctaText}
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black transition-transform group-hover:scale-110 sm:h-10 sm:w-10">
                    <ArrowRight className="h-4 w-4 text-cyan-300" />
                  </span>
                </motion.button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrismaHero;
