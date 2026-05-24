import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";

/**
 * VideoMedia
 * - Tries to load /videos/*.mp4 with /posters/*.webp.
 * - If the video file is missing/fails, swaps to a premium gradient fallback
 *   (no broken element, no black box).
 * - Hover-to-play on desktop; static poster on mobile/touch.
 *
 * Pass eager={true} only for the hero. Everything else lazy-loads.
 */

export type Tone = "noir" | "amber" | "teal" | "violet" | "ember" | "ice";

const tonePalettes: Record<Tone, string> = {
  noir: "radial-gradient(120% 80% at 30% 20%, #1a1a22 0%, #08080c 70%)",
  amber: "radial-gradient(120% 80% at 70% 30%, #3a2412 0%, #0c0805 75%)",
  teal: "radial-gradient(120% 80% at 20% 70%, #0e2a30 0%, #060a0c 75%)",
  violet: "radial-gradient(120% 80% at 80% 20%, #221038 0%, #07060c 75%)",
  ember: "radial-gradient(120% 80% at 50% 80%, #3a1410 0%, #0a0606 75%)",
  ice: "radial-gradient(120% 80% at 30% 30%, #16243a 0%, #06090f 75%)",
};

export function VideoFallbackPoster({
  tone = "violet",
  label,
  className = "",
  showBars = false,
}: { tone?: Tone; label?: string; className?: string; showBars?: boolean }) {
  return (
    <div className={`relative overflow-hidden bg-[#06060c] ${className}`}>
      <div className="absolute inset-0" style={{ background: tonePalettes[tone] }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)]" />
      <motion.div
        className="absolute -inset-1/4 opacity-[0.18] blur-2xl"
        animate={{ x: ["-10%", "10%", "-10%"], y: ["0%", "8%", "0%"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: tonePalettes[tone] }}
      />
      <div className="vanta-grain absolute inset-0 opacity-[0.18] mix-blend-overlay" />
      {/* faint cyan/violet aura sweep */}
      <div className="absolute -inset-12 opacity-30 mix-blend-screen bg-[conic-gradient(from_180deg_at_50%_50%,rgba(139,92,246,0.25),rgba(34,211,238,0.18),transparent_70%)]" />
      {showBars && (
        <>
          <div className="absolute inset-x-0 top-0 h-[6%] bg-black" />
          <div className="absolute inset-x-0 bottom-0 h-[6%] bg-black" />
        </>
      )}
      {label && (
        <div className="absolute bottom-3 left-3 text-[10px] uppercase tracking-[0.2em] text-white/70 font-mono z-10">
          {label}
        </div>
      )}
    </div>
  );
}

type Props = {
  src?: string;
  poster?: string;
  tone?: Tone;
  label?: string;
  className?: string;
  videoClassName?: string;
  // hero-style: autoplay, loop, muted, plays continuously
  autoPlay?: boolean;
  // gallery-style: play only on hover (desktop)
  hoverPlay?: boolean;
  showBars?: boolean;
  // load metadata immediately (use only for hero)
  eager?: boolean;
};

export default function VideoMedia({
  src,
  poster,
  tone = "violet",
  label,
  className = "",
  videoClassName = "h-full w-full object-cover",
  autoPlay = false,
  hoverPlay = false,
  showBars = false,
  eager = false,
}: Props) {
  const [failed, setFailed] = useState(!src);
  const ref = useRef<HTMLVideoElement | null>(null);

  // pause when off-screen to save bandwidth
  useEffect(() => {
    if (!autoPlay || !ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [autoPlay]);

  if (failed || !src) {
    return <VideoFallbackPoster tone={tone} label={label} className={className} showBars={showBars} />;
  }

  return (
    <div className={`relative overflow-hidden bg-[#06060c] ${className}`}>
      <video
        ref={ref}
        className={videoClassName}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted
        loop
        playsInline
        preload={eager ? "auto" : "metadata"}
        onError={() => setFailed(true)}
        onMouseEnter={
          hoverPlay
            ? (e) => {
                e.currentTarget.play().catch(() => {});
              }
            : undefined
        }
        onMouseLeave={
          hoverPlay
            ? (e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }
            : undefined
        }
      />
      {showBars && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[6%] bg-black" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[6%] bg-black" />
        </>
      )}
      {label && (
        <div className="absolute bottom-3 left-3 text-[10px] uppercase tracking-[0.2em] text-white/70 font-mono z-10">
          {label}
        </div>
      )}
    </div>
  );
}

export { Play };
