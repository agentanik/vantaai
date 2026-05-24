import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Play, Wand2, Image as ImageIcon, Layers, Rocket,
  Cpu, FileCode2, Wand, Film, Check, ChevronDown, ArrowRight, Zap,
  Clapperboard, Workflow, Monitor, Smartphone, Square, LogOut, Loader2, AlertCircle
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import VideoMedia, { VideoFallbackPoster, type Tone } from "@/components/vanta/VideoMedia";
import VideoModal from "@/components/vanta/VideoModal";
import { demoClips, heroClip, type DemoClip } from "@/data/demoClips";
import { useAuth } from "@/contexts/AuthContext";



/* ===========================================================
   VANTA AI — premium dark landing page
   NOTE: Replace gradient placeholders with real <video> tags
         pointing to your generated cinematic clips later.
   =========================================================== */

const nav = [
  { label: "Create", href: "#create" },
  { label: "Features", href: "#features" },
  { label: "Workflows", href: "#workflows" },
  { label: "API", href: "#api" },
  { label: "Pricing", href: "#pricing" },
  { label: "Gallery", href: "#gallery" },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // Gate: anonymous visitors clicking any nav item are sent to signup first.
  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (!user) {
      e.preventDefault();
      setOpen(false);
      navigate({ to: "/auth", search: { redirect: "/", mode: "signup" } });
    }
  };

  const goShowcase = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    if (user) navigate({ to: "/showcase" });
    else navigate({ to: "/auth", search: { redirect: "/showcase", mode: "signup" } });
  };

  const goStart = () => {
    if (user) navigate({ to: "/showcase" });
    else navigate({ to: "/auth", search: { redirect: "/showcase", mode: "signup" } });
  };

  const initial = user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-xl bg-black/40 border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 shadow-[0_0_30px_-5px_rgba(139,92,246,0.6)]" />
          <span className="text-white font-semibold tracking-tight text-lg">VANTA<span className="text-violet-400"> AI</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {nav.map((n) => (
            <a
              key={n.label}
              href={n.href}
              onClick={(e) => handleNavClick(e, n.href)}
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              {n.label}
            </a>
          ))}
          <a href="/showcase" onClick={goShowcase} className="text-sm text-white/70 hover:text-white transition-colors">
            Showcase
          </a>
        </nav>
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-semibold text-white" title={user.email ?? ""}>
                {initial}
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
              >
                <LogOut size={14} /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" search={{ redirect: "/", mode: "signin" }} className="text-sm text-white/70 hover:text-white">
                Sign in
              </Link>
              <button onClick={goStart} className="group relative overflow-hidden rounded-full bg-white text-black px-5 py-2 text-sm font-medium hover:bg-white/90 transition">
                Start Creating
              </button>
            </>
          )}
        </div>
        <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-black/80 backdrop-blur-xl border-t border-white/5"
          >
            <div className="flex flex-col gap-3 px-6 py-5">
              {nav.map((n) => (
                <a key={n.label} href={n.href} onClick={(e) => handleNavClick(e, n.href)} className="text-white/80 py-1">{n.label}</a>
              ))}
              <a href="/showcase" onClick={goShowcase} className="text-white/80 py-1">Showcase</a>
              <div className="flex gap-3 pt-2">
                {user ? (
                  <button onClick={() => signOut()} className="flex-1 rounded-full border border-white/15 px-4 py-2 text-white/80 text-sm">Sign out</button>
                ) : (
                  <>
                    <Link to="/auth" search={{ redirect: "/", mode: "signin" }} className="flex-1 rounded-full border border-white/15 px-4 py-2 text-white/80 text-sm text-center">Sign in</Link>
                    <button onClick={goStart} className="flex-1 rounded-full bg-white text-black px-4 py-2 text-sm font-medium">Start</button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}


/* Cinematic gradient placeholder used inside non-video chrome. For real media,
   use <VideoMedia> from @/components/vanta/VideoMedia which auto-falls back to
   a gradient if the underlying file is missing. */
function VideoPlaceholder({
  className = "", label, tone = "noir", showBars = false,
}: { className?: string; label?: string; tone?: Tone; showBars?: boolean }) {
  return <VideoFallbackPoster className={className} label={label} tone={tone} showBars={showBars} />;
}
const toneCycle: Tone[] = ["violet", "amber", "teal", "ember", "ice", "noir"];


function Hero() {
  const [dur, setDur] = useState("10s");
  const [ar, setAr] = useState("16:9");
  const [style, setStyle] = useState("Cinematic");

  const [mode, setMode] = useState<"Text" | "Image" | "Video">("Text");
  const [prompt, setPrompt] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [generatedClip, setGeneratedClip] = useState<DemoClip | null>(null);

  const handleGenerate = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenerationProgress(0);
    setErrorMsg("");

    try {
      const { generateVideo, getJobStatus, fetchOutputVideo } = await import("../lib/vantaApi");
      setGenerationProgress(10);
      
      const payload = {
        prompt: prompt.trim(),
        modelId: "wan2.2-ti2v-5b",
        width: ar === "16:9" ? 854 : ar === "9:16" ? 480 : 704,
        height: ar === "16:9" ? 480 : ar === "9:16" ? 854 : 704,
        durationSeconds: dur === "5s" ? 5 : 10,
        fps: 16,
        seed: 12345,
        autoStop: true,
        upscale: false
      };

      const genRes = await generateVideo(payload);
      if (!genRes.success || !genRes.data?.jobId) throw new Error("Failed to get job ID");

      const jobId = genRes.data.jobId;
      let isDone = false;
      let finalUrl = "";

      while (!isDone) {
        await new Promise(r => setTimeout(r, 5000));
        const statusRes = await getJobStatus(jobId);
        const status = statusRes.data?.status;

        if (status === "queued") setGenerationProgress(15);
        else if (status === "starting_pod") setGenerationProgress(25);
        else if (status === "waiting_for_comfyui") setGenerationProgress(35);
        else if (status === "generating") setGenerationProgress(60);
        else if (status === "collecting_output") setGenerationProgress(85);
        else if (status === "completed") {
          setGenerationProgress(95);
          const outUrl = statusRes.data?.outputUrl;
          if (outUrl) {
            if (outUrl.startsWith("http")) {
              finalUrl = outUrl;
            } else {
              const outputName = outUrl.split("/").pop();
              finalUrl = await fetchOutputVideo(outputName);
            }
          }
          isDone = true;
        } else if (status === "failed") {
          const failMsg = statusRes.data?.error || "Generation failed on backend";
          throw new Error(failMsg);
        }
      }

      setGeneratedClip({
        id: jobId,
        title: "Generated Scene",
        prompt: prompt.trim(),
        video: finalUrl,
        poster: "",
        category: "Generated",
        duration: dur,
        tone: "violet" as Tone
      });
      setGenerationProgress(100);
      setIsGenerating(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "Pipeline failure");
      setIsGenerating(false);
    }
  };

  return (
    <section id="create" className="relative min-h-screen pt-32 pb-20 lg:pb-28 overflow-hidden">
      {/* Cinematic hero stage — uses /videos/hero-vanta-reel.mp4 with auto-fallback */}
      <div className="absolute inset-0 -z-10">
        <VideoMedia
          className="absolute inset-0 h-full w-full"
          videoClassName="h-full w-full object-cover opacity-50"
          src={heroClip.video}
          poster={heroClip.poster}
          tone={heroClip.tone}
          autoPlay
          eager
        />
        {/* dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/55" />
        {/* anamorphic letterbox feel */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#06060c] via-[#06060c]/85 to-transparent" />
        {/* faint horizontal scanlines for a film feel */}
        <div className="absolute inset-0 opacity-[0.05] bg-[repeating-linear-gradient(0deg,transparent_0,transparent_2px,#fff_2px,#fff_3px)]" />
        {/* safe attribution label */}
        <div className="absolute bottom-4 right-5 text-[10px] uppercase tracking-[0.25em] text-white/40 font-mono z-10">
          Sample cinematic scene preview
        </div>
      </div>


      <div className="mx-auto max-w-7xl px-5 sm:px-6 grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur px-3 py-1 text-xs text-white/70"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Batch scene generation · live on the GPU pipeline
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.05 }}
            className="mt-6 text-white text-[44px] sm:text-6xl lg:text-[88px] font-semibold tracking-[-0.03em] leading-[0.95]"
          >
            Direct your <span className="italic font-light text-white/85">whole</span> video.
            <br/>
            Not just one clip.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-7 max-w-xl text-white/60 text-base sm:text-lg leading-relaxed"
          >
            VANTA AI turns a script into a shot list, generates every scene in parallel, upscales the result,
            and hands you clips ready to cut into a 10-minute YouTube video, ad, or short.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <button className="group inline-flex items-center gap-2 rounded-full bg-white text-black pl-5 pr-2 py-2 text-sm font-medium hover:shadow-[0_18px_50px_-12px_rgba(255,255,255,0.35)] transition-all">
              Start Creating
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black text-white transition-transform group-hover:translate-x-0.5">
                <ArrowRight size={14} />
              </span>
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/15 text-white/85 px-5 py-2.5 text-sm hover:bg-white/[0.04] transition">
              <Play size={13} className="text-white/70" /> Watch the pipeline
            </button>
          </motion.div>
        </div>

        {/* Floating preview reel — moved beside the headline */}
        <div className="lg:col-span-5 relative hidden lg:block h-[460px]">
          {[
            { t: "SCENE_01", s: "Neon alley · dolly in", tone: "violet" as Tone, x: 30, y: 0, d: 0, w: 260, h: 150 },
            { t: "SCENE_02", s: "Product loop · macro", tone: "amber" as Tone,  x: 220, y: 110, d: 0.1, w: 230, h: 130 },
            { t: "SCENE_03", s: "Rain rooftop · anime", tone: "teal" as Tone,   x: 0, y: 250, d: 0.2, w: 250, h: 140 },
            { t: "SCENE_04", s: "Talking head · doc",   tone: "ember" as Tone,  x: 240, y: 290, d: 0.3, w: 220, h: 120 },
          ].map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: [0, -8, 0] }}
              transition={{
                opacity: { duration: 0.6, delay: 0.4 + c.d },
                y: { duration: 7 + i, repeat: Infinity, ease: "easeInOut", delay: c.d },
              }}
              style={{ left: c.x, top: c.y, width: c.w }}
              whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
              className="absolute rounded-xl border border-white/10 bg-black/40 backdrop-blur overflow-hidden shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]"
            >
              <div style={{ height: c.h }} className="relative">
                <VideoPlaceholder className="absolute inset-0" tone={c.tone} showBars />
              </div>
              <div className="px-3 py-2.5 bg-black/60 border-t border-white/[0.06]">
                <div className="text-[10px] tracking-[0.25em] text-white/45 font-mono">{c.t}</div>
                <div className="text-white text-xs mt-0.5">{c.s}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Real product UI prompt — floating panel anchored at bottom of hero */}
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
        className="relative mx-auto mt-14 lg:mt-20 max-w-3xl px-5 sm:px-0"
      >
        <div className="rounded-2xl border border-white/10 bg-[#0b0b12]/90 backdrop-blur-2xl shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-1">
              {(["Text", "Image", "Video"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    mode === m ? "bg-white/10 text-white" : "text-white/45 hover:text-white/80"
                  }`}
                >
                  {m === "Text" ? "Text → Video" : m === "Image" ? "Image → Video" : "Video → Video"}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 text-xs text-white/55 hover:text-white px-2 py-1 rounded-md hover:bg-white/[0.04] transition">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              Vanta-v2 · 1080p
              <ChevronDown size={12} />
            </button>
          </div>
          {/* Textarea */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 600))}
            rows={3}
            placeholder="Describe the shot — “Slow dolly through a rain-soaked Tokyo alley at night, neon kanji signs reflecting in puddles, anamorphic lens flare…”"
            className="w-full resize-none bg-transparent text-white/90 placeholder:text-white/30 outline-none text-[15px] leading-relaxed px-4 py-4"
          />
          {/* Bottom toolbar */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-white/[0.06] flex-wrap">
            <button title="Attach reference image" className="h-8 w-8 grid place-items-center rounded-md text-white/55 hover:text-white hover:bg-white/[0.05] transition">
              <ImageIcon size={15} />
            </button>
            <span className="h-5 w-px bg-white/10" />
            <ToolChip label={dur} onClick={() => setDur(dur === "5s" ? "10s" : "5s")} />
            <ToolChip label={ar} onClick={() => setAr(ar === "16:9" ? "9:16" : ar === "9:16" ? "1:1" : "16:9")}
              icon={ar === "16:9" ? <Monitor size={11}/> : ar === "9:16" ? <Smartphone size={11}/> : <Square size={11}/>} />
            <ToolChip label={style} onClick={() => {
              const opts = ["Cinematic", "Product", "Documentary", "Anime"];
              setStyle(opts[(opts.indexOf(style) + 1) % opts.length]);
            }} />
            <div className="ml-auto flex items-center gap-3">
              <span className="text-[11px] font-mono text-white/30">{prompt.length}/600</span>
              <button
                disabled={!prompt.trim() || isGenerating}
                onClick={handleGenerate}
                className="group inline-flex items-center gap-2 rounded-lg bg-white text-black px-4 py-1.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:shadow-[0_10px_30px_-8px_rgba(255,255,255,0.4)] transition-all"
              >
                {isGenerating ? <Loader2 size={13} className="animate-spin" /> : "Generate"} 
                {!isGenerating && <ArrowRight size={13} className="transition-transform group-enabled:group-hover:translate-x-0.5" />}
              </button>
            </div>
          </div>
          {isGenerating && (
            <div className="absolute bottom-0 left-0 h-1 bg-violet-500 transition-all duration-300" style={{ width: `${generationProgress}%` }} />
          )}
          {errorMsg && (
            <div className="bg-red-500/20 text-red-200 text-xs px-4 py-2 flex items-center gap-2 border-t border-red-500/30">
              <AlertCircle size={14} /> {errorMsg}
            </div>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-white/35">
          Runs on private GPU nodes · queued batch jobs · webhook delivery
        </p>
      </motion.div>
      <VideoModal clip={generatedClip} onClose={() => setGeneratedClip(null)} />
    </section>
  );
}

function ToolChip({ label, icon, onClick }: { label: string; icon?: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[12px] text-white/70 hover:text-white hover:bg-white/[0.05] transition border border-transparent hover:border-white/10"
    >
      {icon} {label}
    </button>
  );
}


function Stats() {
  const items = [
    { k: "Scene-by-scene", v: "render in parallel batches" },
    { k: "5–10s clips", v: "in 16:9, 9:16, 1:1" },
    { k: "Private GPU", v: "your jobs, your queue" },
    { k: "Upscale pass", v: "post-process for delivery" },
    { k: "API-first", v: "wire into your stack" },
  ];
  return (
    <section className="border-y border-white/[0.06] bg-black/30">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 py-7 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
        {items.map((s) => (
          <div key={s.k} className="flex flex-col">
            <span className="text-white/90 text-sm font-medium">{s.k}</span>
            <span className="text-white/45 text-xs mt-1">{s.v}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, sub, align = "center" }: { eyebrow: string; title: string; sub?: string; align?: "center" | "left" }) {
  const a = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`${a} max-w-3xl`}>
      <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/40 font-mono">
        <span className="h-px w-6 bg-white/20" /> {eyebrow}
      </div>
      <h2 className="mt-4 text-white text-3xl sm:text-4xl lg:text-[52px] font-semibold tracking-[-0.02em] leading-[1.05]">{title}</h2>
      {sub && <p className="mt-5 text-white/55 text-base sm:text-lg leading-relaxed">{sub}</p>}
    </div>
  );
}

function Comparison() {
  const rows: [string, boolean, boolean][] = [
    ["Single prompt clip", true, true],
    ["Batch scene generation", false, true],
    ["Script → shot list planning", false, true],
    ["Upscale & post-process pass", false, true],
    ["Private GPU queue", false, true],
    ["Long-form assembly workflow", false, true],
    ["API & webhooks", false, true],
  ];
  return (
    <section className="relative py-24 sm:py-28 px-5 sm:px-6">
      <SectionHeading
        eyebrow="Built for full videos"
        title="Most tools stop at one clip. We start there."
        sub="Quick one-shot generators are great for memes. If you're shipping a 10-minute YouTube video, an ad, or a launch sequence, you need a pipeline — not a single button."
      />
      <div className="mx-auto mt-16 max-w-6xl grid md:grid-cols-2 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/10">
        <div className="bg-[#0a0a10] p-8">
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/35 font-mono">Short clip tools</div>
          <h3 className="mt-3 text-xl text-white/85 font-medium">Single-shot generators</h3>
          <ul className="mt-7 space-y-3.5 text-white/55 text-sm">
            {["Good for quick one-off clips", "Tight duration ceilings", "No long-form planning", "Limited control over batch production"].map((x) => (
              <li key={x} className="flex gap-3"><span className="mt-2 h-px w-3 bg-white/20" /> {x}</li>
            ))}
          </ul>
        </div>
        <div className="relative bg-[#0c0c14] p-8">
          <div className="absolute top-0 left-0 h-px w-24 bg-gradient-to-r from-white/50 to-transparent" />
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/55 font-mono">VANTA AI</div>
          <h3 className="mt-3 text-xl text-white font-medium">A creator pipeline</h3>
          <ul className="mt-7 space-y-3.5 text-white/85 text-sm">
            {[
              "Batch clip generation across scenes",
              "Script → scene-by-scene plan",
              "Reusable prompt templates per format",
              "Upscale & post-process pass",
              "Designed for 10–15 min finished cuts",
            ].map((x) => (
              <li key={x} className="flex gap-3"><Check size={15} className="mt-0.5 text-white shrink-0" /> {x}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Table */}
      <div className="mx-auto mt-10 max-w-6xl rounded-2xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-[1.5fr_1fr_1fr] px-5 sm:px-6 py-4 text-[10px] uppercase tracking-[0.25em] text-white/40 font-mono border-b border-white/[0.06] bg-white/[0.02]">
          <div>Capability</div>
          <div className="text-center">Short clip tools</div>
          <div className="text-center text-white/70">VANTA AI</div>
        </div>
        {rows.map(([f, a, b], i) => (
          <div key={f} className={`grid grid-cols-[1.5fr_1fr_1fr] px-5 sm:px-6 py-4 items-center border-b border-white/[0.04] last:border-0 ${i % 2 ? "bg-white/[0.012]" : ""}`}>
            <div className="text-white/80 text-sm">{f}</div>
            <div className="text-center">{a ? <Check className="inline text-white/35" size={15} /> : <span className="text-white/15">—</span>}</div>
            <div className="text-center">{b ? <Check className="inline text-white" size={15} /> : <span className="text-white/15">—</span>}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

type Feat = { i: React.ReactNode; t: string; d: string; size?: "sm" | "md" | "lg" };
const features: Feat[] = [
  { i: <Wand2 size={18} />, t: "Text → Video", d: "Describe the shot. Get a cinematic clip back with controllable camera, style, and pacing.", size: "lg" },
  { i: <ImageIcon size={18} />, t: "Image → Video", d: "Animate product shots, characters, and reference frames.", size: "md" },
  { i: <Layers size={18} />, t: "Batch scene generation", d: "Dozens of clips queued from one shot list — not one prompt at a time.", size: "md" },
  { i: <Clapperboard size={18} />, t: "Script → shots", d: "Paste a YouTube script. Get a scene-by-scene plan ready to render.", size: "lg" },
  { i: <Rocket size={18} />, t: "Upscale pass", d: "Cleaner edges, denoise, and resolution lift after generation.", size: "sm" },
  { i: <Wand size={18} />, t: "Prompt templates", d: "Cinematic, product, doc, horror, business, anime — built-in.", size: "sm" },
  { i: <Cpu size={18} />, t: "Private GPU pipeline", d: "Your own queue. No throttled public sandbox.", size: "sm" },
  { i: <FileCode2 size={18} />, t: "API & webhooks", d: "Wire generations into dashboards, SaaS, and creator tools.", size: "sm" },
];

function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-28 px-5 sm:px-6">
      <SectionHeading
        eyebrow="Features"
        title="A pipeline, not a prompt box."
        sub="Every surface is designed for shipping real content — not one-off demo clips."
      />
      <div className="mx-auto mt-16 max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 auto-rows-[180px] gap-4">
        {features.map((f, i) => {
          const span = f.size === "lg" ? "lg:col-span-3 lg:row-span-2"
                    : f.size === "md" ? "lg:col-span-3"
                    : "lg:col-span-2";
          return (
            <motion.div
              key={f.t}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: (i % 4) * 0.05 }}
              className={`group relative rounded-2xl border border-white/[0.08] bg-[#0a0a12] p-6 overflow-hidden transition-all hover:border-white/20 hover:bg-[#0d0d18] ${span}`}
            >
              {/* per-card accent stroke */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {/* feature-specific visual on large cards */}
              {f.size === "lg" && (
                <div className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity">
                  <VideoPlaceholder className="absolute inset-0" tone={toneCycle[i % toneCycle.length]} />
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0a12] via-[#0a0a12]/85 to-transparent" />
                </div>
              )}
              <div className="relative flex flex-col h-full">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-white/85 border border-white/[0.08] group-hover:bg-white/10 group-hover:border-white/20 transition">
                  {f.i}
                </div>
                <div className="mt-auto pt-6">
                  <h3 className="text-white font-medium tracking-tight">{f.t}</h3>
                  <p className="mt-2 text-sm text-white/50 leading-relaxed max-w-md">{f.d}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * DemoVideoCard — gallery tile that previews a sample clip.
 * Desktop: video plays on hover. Mobile/touch: poster shown, tap opens modal.
 * Use compressed web versions in /public/videos. Keep raw 4K masters outside.
 */
function DemoVideoCard({
  clip, large = false, onOpen,
}: { clip: DemoClip; large?: boolean; onOpen: (c: DemoClip) => void }) {
  return (
    <article
      onClick={() => onOpen(clip)}
      className={`group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] shadow-[0_24px_80px_rgba(3,6,18,0.45)] transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_30px_100px_-20px_rgba(139,92,246,0.35)] ${large ? "lg:row-span-2" : ""}`}
    >
      <div className={`relative overflow-hidden bg-[#080A12] ${large ? "aspect-[4/5] lg:aspect-auto lg:h-full" : "aspect-video"}`}>
        <VideoMedia
          src={clip.video}
          poster={clip.poster}
          tone={clip.tone}
          className="absolute inset-0 h-full w-full"
          videoClassName="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          hoverPlay
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
        <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/70 backdrop-blur">
          {clip.category}
        </div>
        <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-xs text-white/70 backdrop-blur">
          {clip.duration}
        </div>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100">
          <div className="rounded-full border border-white/15 bg-white/10 p-4 backdrop-blur-xl">
            <Play className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-base font-semibold text-white">{clip.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-white/55">{clip.prompt}</p>
        </div>
      </div>
    </article>
  );
}

function Gallery() {
  const [open, setOpen] = useState<DemoClip | null>(null);
  // Homepage shows max 7 clips. Use compressed web versions here.
  const items = demoClips.slice(0, 7);
  return (
    <section id="gallery" className="relative py-28 px-6">
      <SectionHeading
        eyebrow="Gallery"
        title="From prompt to cinematic sequence."
        sub="Sample cinematic scenes for the VANTA AI workflow. Replace with your own generated outputs before public launch."
      />
      <div className="mx-auto mt-14 max-w-7xl grid sm:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[260px] gap-5">
        {items.map((clip, i) => (
          <DemoVideoCard
            key={clip.id}
            clip={clip}
            large={i === 0 || i === 4}
            onOpen={setOpen}
          />
        ))}
      </div>
      <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-white/35 font-mono">
        Demo clips are used as visual examples. Final launch reels should be replaced with VANTA-generated outputs.
        {/* Verify license before using any third-party demo clip in production. */}
      </p>
      <VideoModal clip={open} onClose={() => setOpen(null)} />
    </section>
  );
}


const steps = [
  { i: <FileCode2 size={16} />, t: "Write prompt or import script", d: "Start from text, image, or a full video script." },
  { i: <Workflow size={16} />, t: "Plan scenes", d: "Auto-break into shots with prompt templates." },
  { i: <Wand2 size={16} />, t: "Generate clips", d: "Batch render all scenes in the queue." },
  { i: <Rocket size={16} />, t: "Upscale and refine", d: "Post-process for higher clarity and resolution." },
  { i: <Film size={16} />, t: "Export", d: "Deliver to YouTube, Shorts, ads, or social." },
];

function WorkflowSection() {
  return (
    <section id="workflows" className="relative py-28 px-6">
      <SectionHeading eyebrow="Workflow" title="A complete workflow for creators." />
      <div className="mx-auto mt-14 max-w-7xl grid lg:grid-cols-2 gap-12 items-center">
        <div className="relative">
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-violet-500/60 via-fuchsia-400/30 to-cyan-400/60" />
          <ol className="space-y-6">
            {steps.map((s, i) => (
              <motion.li
                key={s.t}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="relative flex gap-4 items-start"
              >
                <div className="relative z-10 h-10 w-10 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-400/20 border border-white/15 flex items-center justify-center text-white shadow-[0_0_30px_-8px_rgba(139,92,246,0.6)]">
                  {s.i}
                </div>
                <div className="pt-1">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/40 font-mono">Step {i + 1}</div>
                  <div className="text-white font-medium mt-1">{s.t}</div>
                  <div className="text-white/55 text-sm mt-1">{s.d}</div>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>

        {/* fake dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 shadow-[0_30px_100px_-30px_rgba(139,92,246,0.4)]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-mono text-white/40">vanta · dashboard</div>
            <div className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-white/15"/><span className="h-2 w-2 rounded-full bg-white/15"/><span className="h-2 w-2 rounded-full bg-white/15"/>
            </div>
          </div>
          {[
            { l: "Queue", s: "scene_07_cyber_alley", st: "queued", c: "bg-white/40" },
            { l: "Generating", s: "scene_06_neon_rain", st: "00:08 / 00:10", c: "bg-violet-400", anim: true },
            { l: "Generating", s: "scene_05_skybridge", st: "00:04 / 00:10", c: "bg-fuchsia-400", anim: true },
            { l: "Completed", s: "scene_04_intro_logo", st: "ready", c: "bg-emerald-400" },
            { l: "Download", s: "scene_03_product_loop", st: "1080p · mp4", c: "bg-cyan-400" },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-t border-white/5">
              <div className={`h-2 w-2 rounded-full ${r.c} ${r.anim ? "animate-pulse" : ""}`} />
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono w-24">{r.l}</div>
              <div className="text-sm text-white/85 font-mono">{r.s}</div>
              <div className="ml-auto text-xs text-white/45 font-mono">{r.st}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const templates = [
  { k: "YouTube Documentary", p: "A slow drone shot revealing a remote mountain village at sunrise, soft fog, warm color grade, anamorphic lens flare." },
  { k: "Product Ad", p: "A cinematic close-up of a black luxury hoodie rotating slowly in a dark studio, soft rim light, premium commercial look, smooth camera motion." },
  { k: "Horror Story", p: "Handheld push into a candle-lit hallway, paint peeling on walls, distant whispers, desaturated palette with deep shadows." },
  { k: "Business Motivation", p: "Founder walking onto a rooftop at sunrise, lens flare, slow tracking shot, inspiring orange/teal grade." },
  { k: "Tech Explainer", p: "Floating holographic UI panels orbit a glowing neural core, particles drifting, clean studio lighting." },
  { k: "Anime Scene", p: "Hero leaps between rain-soaked rooftops, neon city below, dynamic motion blur, dramatic backlight." },
];

function Templates() {
  const [active, setActive] = useState(0);
  return (
    <section className="relative py-28 px-6">
      <SectionHeading eyebrow="Templates" title="Start with templates built for real content." />
      <div className="mx-auto mt-14 max-w-5xl rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-wrap gap-2">
          {templates.map((t, i) => (
            <button
              key={t.k}
              onClick={() => setActive(i)}
              className={`px-4 py-2 rounded-full text-sm transition border ${
                active === i
                  ? "bg-white text-black border-white"
                  : "border-white/10 text-white/65 hover:text-white hover:bg-white/5"
              }`}
            >{t.k}</button>
          ))}
        </div>
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="mt-6 grid md:grid-cols-2 gap-6 items-center"
        >
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/40 font-mono">Sample prompt</div>
            <p className="mt-3 text-white/85 leading-relaxed">{templates[active].p}</p>
            <button className="mt-6 inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2 text-sm font-medium">
              Use this template <ArrowRight size={14} />
            </button>
          </div>
          <div className="h-[240px] rounded-2xl border border-white/10 overflow-hidden relative">
            <VideoMedia
              src={demoClips[active % demoClips.length]?.video}
              poster={demoClips[active % demoClips.length]?.poster}
              tone={demoClips[active % demoClips.length]?.tone ?? "violet"}
              className="absolute inset-0 h-full w-full"
              label={templates[active].k}
              hoverPlay
            />
          </div>

        </motion.div>
      </div>
    </section>
  );
}

function ApiSection() {
  return (
    <section id="api" className="relative py-28 px-6">
      <SectionHeading
        eyebrow="API"
        title="Built for creators today. API-ready for platforms tomorrow."
      />
      <div className="mx-auto mt-14 max-w-6xl grid lg:grid-cols-2 gap-8">
        <div className="rounded-3xl border border-white/10 bg-[#0a0a14] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70"/><span className="h-2.5 w-2.5 rounded-full bg-amber-400/70"/><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70"/>
            <span className="ml-3 text-xs font-mono text-white/40">POST /api/v1/video/generate</span>
          </div>
          <pre className="p-6 text-sm font-mono leading-relaxed overflow-x-auto">
<span className="text-violet-300">POST</span> <span className="text-white/80">/api/v1/video/generate</span>{"\n"}
<span className="text-white/40">Content-Type:</span> <span className="text-cyan-300">application/json</span>{"\n\n"}
<span className="text-white/80">{`{`}</span>{"\n"}
{`  `}<span className="text-fuchsia-300">"prompt"</span>: <span className="text-emerald-300">"cinematic futuristic city at night"</span>,{"\n"}
{`  `}<span className="text-fuchsia-300">"durationSeconds"</span>: <span className="text-amber-300">10</span>,{"\n"}
{`  `}<span className="text-fuchsia-300">"aspectRatio"</span>: <span className="text-emerald-300">"16:9"</span>,{"\n"}
{`  `}<span className="text-fuchsia-300">"style"</span>: <span className="text-emerald-300">"cinematic"</span>{"\n"}
<span className="text-white/80">{`}`}</span>
          </pre>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { i: <Cpu size={18}/>, t: "Secure backend", d: "Auth, rate limiting, isolated job runners." },
            { i: <Layers size={18}/>, t: "Job queue", d: "Submit batches and poll status webhooks." },
            { i: <Zap size={18}/>, t: "Auto-stop GPU protection", d: "Idle GPUs spin down to control cost." },
            { i: <Film size={18}/>, t: "Output delivery", d: "Signed URLs and S3-compatible storage." },
            { i: <Workflow size={18}/>, t: "Batch generation", d: "One request, many scene clips." },
            { i: <FileCode2 size={18}/>, t: "Webhook events", d: "Integrate into your stack." },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-violet-400/30 transition">
              <div className="text-violet-200">{x.i}</div>
              <div className="mt-3 text-white text-sm font-medium">{x.t}</div>
              <div className="text-white/55 text-xs mt-1">{x.d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const tiers = [
  { n: "Starter", p: "Free", d: "For testing", f: ["Limited monthly generations", "Standard queue", "16:9 + 9:16 outputs", "Community templates"], cta: "Start free" },
  { n: "Creator", p: "$29", d: "For daily content", featured: true, f: ["Batch generation", "Upscale-ready workflow", "Prompt template library", "Priority generation"], cta: "Choose Creator" },
  { n: "Pro Studio", p: "$99", d: "For teams & agencies", f: ["Priority queue", "API access", "Higher batch limits", "Team seats & roles"], cta: "Contact sales" },
];

function Pricing() {
  return (
    <section id="pricing" className="relative py-28 px-6">
      <SectionHeading
        eyebrow="Pricing preview"
        title="Structured for testing, daily creation, and studios."
        sub="Example pricing shown for layout only. Final launch pricing and limits will be confirmed before release."
      />
      <div className="mx-auto mt-14 max-w-6xl grid md:grid-cols-3 gap-5">
        {tiers.map((t) => (
          <div
            key={t.n}
            className={`relative rounded-3xl border p-7 overflow-hidden ${
              t.featured
                ? "border-violet-400/30 bg-gradient-to-br from-violet-500/[0.10] via-fuchsia-500/[0.05] to-cyan-400/[0.06]"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            {t.featured && (
              <div className="absolute top-4 right-4 text-[10px] uppercase tracking-[0.2em] font-mono text-violet-200 border border-violet-400/30 rounded-full px-2 py-0.5">Most picked</div>
            )}
            <div className="text-xs uppercase tracking-[0.2em] text-white/40 font-mono">{t.n}</div>
            <div className="mt-3 flex items-end gap-1">
              <div className="text-white text-4xl font-semibold">{t.p}</div>
              {t.p !== "Free" && <div className="text-white/40 text-sm mb-1">/mo</div>}
            </div>
            <div className="mt-1 text-white/55 text-sm">{t.d}</div>
            <ul className="mt-6 space-y-3">
              {t.f.map((x) => (
                <li key={x} className="flex gap-2 text-sm text-white/75"><Check size={16} className="mt-0.5 text-cyan-300"/> {x}</li>
              ))}
            </ul>
            <button className={`mt-8 w-full rounded-full py-2.5 text-sm font-medium transition ${
              t.featured ? "bg-white text-black hover:shadow-[0_10px_40px_-5px_rgba(139,92,246,0.5)]"
                         : "border border-white/15 text-white hover:bg-white/5"
            }`}>{t.cta}</button>
          </div>
        ))}
      </div>
    </section>
  );
}

const faqs = [
  { q: "Can I create long videos?", a: "VANTA AI generates short clips and helps assemble many clips into longer final videos such as YouTube videos, explainers, ads, and Shorts." },
  { q: "Is it only text-to-video?", a: "No. The system is designed for text-to-video, image-to-video, batch clips, upscaling, and future post-processing workflows." },
  { q: "Why use this instead of a simple short clip generator?", a: "VANTA AI focuses on full creator workflows: scene planning, batch generation, consistent prompt templates, upscaling, and output management." },
  { q: "Will there be API access?", a: "Yes, the backend is designed for API-based generation and future SaaS integration." },
  { q: "Can I make YouTube automation videos?", a: "Yes, the workflow is designed to generate multiple clips that can be edited into 10–15 minute videos." },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="relative py-28 px-6">
      <SectionHeading eyebrow="FAQ" title="Questions creators ask before they switch." />
      <div className="mx-auto mt-12 max-w-3xl">
        {faqs.map((f, i) => (
          <div key={f.q} className="border-b border-white/10">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full py-5 flex items-center justify-between text-left">
              <span className="text-white text-base">{f.q}</span>
              <ChevronDown size={18} className={`text-white/50 transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <p className="pb-5 text-white/60 text-sm leading-relaxed">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.25),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#06060c] to-transparent" />
        {/* video strip — TODO: swap placeholders with real clips */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 grid grid-cols-6 gap-2 opacity-30">
          {Array.from({ length: 6 }).map((_, i) => (
            <VideoPlaceholder key={i} className="h-40" />
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-3xl text-center relative">
        <h2 className="text-white text-4xl sm:text-6xl font-semibold tracking-tight">Build your next video scene by scene.</h2>
        <p className="mt-5 text-white/70 text-lg">Start with one prompt, scale into full creator workflows.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button className="rounded-full bg-white text-black px-6 py-3 text-sm font-medium hover:shadow-[0_10px_40px_-5px_rgba(139,92,246,0.55)] transition">Start Creating</button>
          <button className="rounded-full border border-white/15 bg-white/5 backdrop-blur-md text-white px-6 py-3 text-sm hover:bg-white/10">Join Waitlist</button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols: { h: string; links: string[] }[] = [
    { h: "Product",    links: ["Create", "Workflow", "Templates", "Gallery", "Pricing"] },
    { h: "Developers", links: ["API", "Docs", "Webhooks", "Status"] },
    { h: "Company",    links: ["Contact", "Privacy", "Terms"] },
  ];
  return (
    <footer className="relative border-t border-white/[0.06] px-5 sm:px-6 pt-16 pb-10">
      <div className="mx-auto max-w-7xl grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400" />
            <span className="text-white font-semibold tracking-tight">VANTA<span className="text-violet-400"> AI</span></span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-white/55 leading-relaxed">
            Cinematic AI video workflows for creators, teams, and the tools they build.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-mono text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Private GPU workflow
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.h} className="lg:col-span-2">
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/35 font-mono">{c.h}</div>
            <ul className="mt-4 space-y-2.5">
              {c.links.map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm text-white/65 hover:text-white transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto max-w-7xl mt-14 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40 font-mono">
        <div>© {new Date().getFullYear()} VANTA AI · all rights reserved</div>
        <div className="flex gap-5"><a href="#" className="hover:text-white/70">Privacy</a><a href="#" className="hover:text-white/70">Terms</a><a href="#" className="hover:text-white/70">Security</a></div>
      </div>
    </footer>
  );
}

export default function VantaLanding() {
  // Force dark page background (project default body is cream).
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = "#06060c";
    document.body.style.color = "#fff";
    return () => { document.body.style.background = prev; };
  }, []);
  return (
    <div className="vanta-page-grain relative min-h-screen bg-[#06060c] text-white antialiased overflow-x-hidden font-[Inter,ui-sans-serif,system-ui]">
      <Navbar />
      <Hero />
      <Stats />
      <Comparison />
      <Features />
      <Gallery />
      <WorkflowSection />
      <Templates />
      <ApiSection />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
