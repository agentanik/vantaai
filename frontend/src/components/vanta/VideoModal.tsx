import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { DemoClip } from "@/data/demoClips";
import VideoMedia from "./VideoMedia";

export default function VideoModal({
  clip,
  onClose,
}: {
  clip: DemoClip | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!clip) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [clip, onClose]);

  return (
    <AnimatePresence>
      {clip && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a12]/95 shadow-[0_60px_160px_-30px_rgba(0,0,0,0.9)]"
          >
            <button
              onClick={onClose}
              aria-label="Close preview"
              className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/60 text-white/80 hover:text-white hover:bg-black/80 backdrop-blur transition"
            >
              <X size={16} />
            </button>
            <div className="relative aspect-video">
              {clip.video ? (
                <video
                  className="h-full w-full object-cover"
                  src={clip.video}
                  poster={clip.poster}
                  controls
                  autoPlay
                  muted
                  playsInline
                />
              ) : (
                <VideoMedia tone={clip.tone} className="h-full w-full" />
              )}
            </div>
            <div className="px-6 py-5 sm:px-8 sm:py-6 border-t border-white/[0.06] flex flex-wrap items-start gap-x-6 gap-y-3">
              <div className="flex-1 min-w-[220px]">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/45 font-mono">
                  <span>{clip.category}</span>
                  <span className="h-px w-4 bg-white/15" />
                  <span>{clip.duration}</span>
                  <span className="h-px w-4 bg-white/15" />
                  <span>{clip.aspect}</span>
                </div>
                <h3 className="mt-2 text-white text-lg font-medium">{clip.title}</h3>
                <p className="mt-2 text-sm text-white/60 leading-relaxed">{clip.prompt}</p>
              </div>
              <p className="text-[11px] text-white/35 font-mono max-w-[240px]">
                Sample cinematic demo clip — used for layout only. Replace with VANTA-generated output before launch.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
