import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { demoClips, galleryCategories, type DemoClip } from "@/data/demoClips";
import VideoMedia from "@/components/vanta/VideoMedia";
import VideoModal from "@/components/vanta/VideoModal";
import { Play } from "lucide-react";

export const Route = createFileRoute("/_authenticated/showcase")({
  head: () => ({
    meta: [
      { title: "VANTA AI — Showcase" },
      { name: "description", content: "Sample cinematic demo clips and example scene previews from the VANTA AI workflow." },
    ],
  }),
  component: ShowcasePage,
});

function ShowcasePage() {
  return (
    <ClientOnly fallback={<div style={{ minHeight: "100vh", background: "#06060c" }} />}>
      <ShowcaseInner />
    </ClientOnly>
  );
}

function ShowcaseInner() {
  const [filter, setFilter] = useState<string>("All");
  const [open, setOpen] = useState<DemoClip | null>(null);
  const items = useMemo(
    () => (filter === "All" ? demoClips : demoClips.filter((c) => c.category === filter)),
    [filter],
  );
  return (
    <div className="min-h-screen bg-[#06060c] text-white antialiased px-5 sm:px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-mono">Showcase</div>
          <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-[-0.02em]">
            Sample cinematic demo clips.
          </h1>
          <p className="mt-4 text-white/55 leading-relaxed">
            Example scene previews used for layout and direction. Full demo library coming soon —
            and will be replaced with VANTA-generated outputs before public launch.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          {galleryCategories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.2em] font-mono border transition ${
                filter === c
                  ? "bg-white text-black border-white"
                  : "border-white/10 text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((clip) => (
            <article
              key={clip.id}
              onClick={() => setOpen(clip)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] hover:border-white/20 transition"
            >
              <div className="relative aspect-video">
                <VideoMedia
                  src={clip.video}
                  poster={clip.poster}
                  tone={clip.tone}
                  className="absolute inset-0 h-full w-full"
                  hoverPlay
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 rounded-full bg-black/55 border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/70 font-mono">
                  {clip.category}
                </div>
                <div className="absolute top-3 right-3 rounded-full bg-black/55 border border-white/10 px-2 py-0.5 text-[10px] text-white/70 font-mono">
                  {clip.duration}
                </div>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <div className="rounded-full border border-white/15 bg-white/10 p-3 backdrop-blur-xl">
                    <Play className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-3 left-4 right-4">
                  <div className="text-white text-sm font-medium">{clip.title}</div>
                  <div className="text-white/55 text-xs mt-0.5 line-clamp-1">{clip.prompt}</div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-12 text-center text-xs text-white/35 font-mono">
          Sample clips are used for demonstration. Verify license before using any third-party clip in production.
        </p>
      </div>
      <VideoModal clip={open} onClose={() => setOpen(null)} />
    </div>
  );
}
