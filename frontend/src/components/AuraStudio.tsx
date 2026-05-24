import { useState, useEffect, lazy, Suspense } from "react";
import {
  ArrowUpRight,
  Image as ImageIcon,
  Video as VideoIcon,
  Settings2,
  Key,
  Download,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  Play,
  Plus,
} from "lucide-react";
import { fal } from "@fal-ai/client";

const Hero3D = lazy(() => import("./aura/Hero3D"));

type AssetType = "image" | "video";
type AspectRatio = "1:1" | "16:9" | "9:16";

interface Asset {
  id: string;
  type: AssetType;
  url: string;
  prompt: string;
  model: string;
  aspectRatio: AspectRatio;
  timestamp: string;
}

const INITIAL_GALLERY: Asset[] = [
  {
    id: "demo-1",
    type: "image",
    url: "/cyberpunk_city.png",
    prompt:
      "A vibrant cyberpunk metropolis at dusk, looming neon-lit towers, airborne cruisers hovering above damp reflecting roadways, persistent rain, high-fidelity.",
    model: "fal-ai/flux/schnell",
    aspectRatio: "16:9",
    timestamp: "00:32",
  },
  {
    id: "demo-2",
    type: "image",
    url: "/astronaut_mars.png",
    prompt:
      "An explorer walking on the rust-colored soil of Mars, gazing at a massive blue sunset over deep alien valleys, intricate reflective visor.",
    model: "fal-ai/flux/schnell",
    aspectRatio: "1:1",
    timestamp: "01:14",
  },
  {
    id: "demo-3",
    type: "image",
    url: "/mystical_forest.png",
    prompt:
      "An ethereal woodland passage winding beneath giant glowing bioluminescent trees, shimmering dust motes, soft ambient mist, surreal dreamscape.",
    model: "fal-ai/flux/schnell",
    aspectRatio: "9:16",
    timestamp: "02:08",
  },
  {
    id: "demo-4",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-futuristic-subway-station-with-neon-lights-43954-large.mp4",
    prompt:
      "Cinematic tracking shot of a high-tech subway station filled with glowing cyan and violet lighting, slow motion, retro-futuristic vibes.",
    model: "fal-ai/hunyuan-video",
    aspectRatio: "16:9",
    timestamp: "04:01",
  },
];

const SUGGESTIONS: Record<AssetType, string[]> = {
  image: [
    "A majestic dragon perched on a snowy mountain peak, volumetric light",
    "Bust of an ancient philosopher carved from rainbow obsidian, lava veins",
    "Cozy room overlooking a rainy Tokyo street at midnight, amber lights",
    "Hyper-realistic chameleon made of polished gemstones and mechanical gears",
  ],
  video: [
    "Slow tracking shot of a spacecraft entering a swirling wormhole, epic sci-fi",
    "Eruption of liquid gold cooling into intricate metallic patterns, high speed",
    "A lone lighthouse battling giant ocean waves under a lightning storm, 4k",
    "Red panda chef cooking ramen in a busy kitchen, animated film style",
  ],
};

export default function AuraStudio() {
  const [apiKey, setApiKey] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("fal_api_key") || "" : ""
  );
  const [tempKey, setTempKey] = useState(apiKey);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [showDrawer, setShowDrawer] = useState(false);

  const [activeTab, setActiveTab] = useState<AssetType>("image");
  const [prompt, setPrompt] = useState("");
  const [imageModel, setImageModel] = useState("fal-ai/flux/schnell");
  const [videoModel, setVideoModel] = useState("fal-ai/hunyuan-video");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [steps, setSteps] = useState(28);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const [testBackend, setTestBackend] = useState<string>("");
  const [testRunPod, setTestRunPod] = useState<string>("");
  const [testWorkflow, setTestWorkflow] = useState<string>("");

  const [checklist, setChecklist] = useState([
    { id: 1, text: "ALLOC_GPU_NODE", status: "pending" as "pending" | "active" | "done" },
    { id: 2, text: "EXEC_INFERENCE_LATENTS", status: "pending" as "pending" | "active" | "done" },
    { id: 3, text: "APPLY_TEXTURE_MAP", status: "pending" as "pending" | "active" | "done" },
    { id: 4, text: "EXPORT_MEDIA_MATRIX", status: "pending" as "pending" | "active" | "done" },
  ]);

  const [gallery, setGallery] = useState<Asset[]>(() => {
    if (typeof window === "undefined") return INITIAL_GALLERY;
    const saved = localStorage.getItem("aura_gallery");
    return saved ? (JSON.parse(saved) as Asset[]) : INITIAL_GALLERY;
  });
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  useEffect(() => {
    localStorage.setItem("aura_gallery", JSON.stringify(gallery));
  }, [gallery]);

  useEffect(() => {
    setTempKey(apiKey);
  }, [apiKey]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedAsset) return;
      if (e.key === "Escape") setSelectedAsset(null);
      else if (e.key === "ArrowRight") {
        const i = gallery.findIndex((x) => x.id === selectedAsset.id);
        if (i !== -1 && i < gallery.length - 1) setSelectedAsset(gallery[i + 1]);
      } else if (e.key === "ArrowLeft") {
        const i = gallery.findIndex((x) => x.id === selectedAsset.id);
        if (i > 0) setSelectedAsset(gallery[i - 1]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedAsset, gallery]);

  useEffect(() => {
    if (!isGenerating) return;
    setChecklist((prev) =>
      prev.map((step) => {
        const p = generationProgress;
        const thresholds = [25, 60, 85, 100];
        const t = thresholds[step.id - 1];
        const prevT = step.id === 1 ? 0 : thresholds[step.id - 2];
        if (p >= t) return { ...step, status: "done" };
        if (p >= prevT && p > 0) return { ...step, status: "active" };
        return { ...step, status: "pending" };
      })
    );
  }, [generationProgress, isGenerating]);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = tempKey.trim();
    setApiKey(cleanKey);
    if (cleanKey) localStorage.setItem("MANAGER_API_KEY", cleanKey);
    else localStorage.removeItem("MANAGER_API_KEY");
  };

  const handleTestBackend = async () => {
    try {
      setTestBackend("Testing...");
      const { healthCheck } = await import("../lib/vantaApi");
      await healthCheck();
      setTestBackend("Healthy ✓");
    } catch (e: any) {
      setTestBackend(`Failed: ${e.message}`);
    }
  };

  const handleTestRunPod = async () => {
    try {
      setTestRunPod("Testing...");
      const { runpodHealth } = await import("../lib/vantaApi");
      await runpodHealth();
      setTestRunPod("Ready ✓");
    } catch (e: any) {
      setTestRunPod(`Failed: ${e.message}`);
    }
  };

  const handleTestWorkflow = async () => {
    try {
      setTestWorkflow("Testing...");
      const { validateWorkflow } = await import("../lib/vantaApi");
      await validateWorkflow("wan2.2-ti2v-5b");
      setTestWorkflow("Valid ✓");
    } catch (e: any) {
      setTestWorkflow(`Failed: ${e.message}`);
    }
  };

  const handleRemix = (item: Asset, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPrompt(item.prompt);
    setAspectRatio(item.aspectRatio);
    if (item.type === "image") {
      setActiveTab("image");
      setImageModel(item.model);
    } else {
      setActiveTab("video");
      setVideoModel(item.model);
    }
    setShowDrawer(true);
    setSelectedAsset(null);
  };

  const handleGenerate = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGenerationProgress(0);
    setErrorMsg("");

    try {
      const { generateVideo, getJobStatus, fetchOutputVideo } = await import("../lib/vantaApi");

      setGenerationProgress(10);
      
      const payload = {
        prompt: prompt.trim(),
        modelId: "wan2.2-ti2v-5b",
        width: 704,
        height: 704,
        durationSeconds: 5,
        fps: 16,
        seed: 12345,
        autoStop: true,
        upscale: false
      };

      const genRes = await generateVideo(payload);
      const jobId = genRes.data?.jobId || genRes.data?.id;
      if (!genRes.success || !jobId) throw new Error("Failed to get job ID");
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
          const outputName = statusRes.data?.outputUrl.split("/").pop();
          if (outputName) {
            finalUrl = await fetchOutputVideo(outputName);
          }
          isDone = true;
        } else if (status === "failed") {
          throw new Error("Generation failed on backend");
        }
      }

      const newAsset: Asset = {
        id: `gen-${Date.now()}`,
        type: "video",
        url: finalUrl,
        prompt: prompt.trim(),
        model: "wan2.2-ti2v-5b",
        aspectRatio: "1:1",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setGallery((prev) => [newAsset, ...prev]);
      setGenerationProgress(100);
      setTimeout(() => setIsGenerating(false), 500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "Pipeline failure");
      setIsGenerating(false);
    }
  };

  const handleDeleteAsset = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setGallery((prev) => prev.filter((x) => x.id !== id));
    if (selectedAsset?.id === id) setSelectedAsset(null);
  };

  const triggerDownload = async (url: string, filename: string) => {
    try {
      const r = await fetch(url);
      const b = await r.blob();
      const u = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = u;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(u);
    } catch {
      window.open(url, "_blank");
    }
  };

  const currentModel = activeTab === "image" ? imageModel : videoModel;

  return (
    <div className="bru">
      {/* TOP BAR */}
      <header className="bru-topbar">
        <div className="bru-brand">
          <div className="bru-logo-mark">A</div>
          <div className="bru-brand-text">
            <span className="bru-brand-name">AURA/STUDIO</span>
            <span className="bru-brand-meta">v2.6 — FORGE ENGINE</span>
          </div>
        </div>

        <nav className="bru-nav">
          <a className="bru-nav-item" href="#archive">[001] ARCHIVE</a>
          <a className="bru-nav-item" href="#forge">[002] FORGE</a>
          <a className="bru-nav-item" href="#models">[003] MODELS</a>
        </nav>

        <div className="bru-top-actions">
          <span className={`bru-pill ${apiKey ? "bru-pill--live" : "bru-pill--demo"}`}>
            <span className="bru-pill-dot" />
            {apiKey ? "LIVE GPU" : "SANDBOX"}
          </span>
          <button className="bru-btn bru-btn--ghost" onClick={() => setShowKeyModal(true)}>
            <Key size={14} /> CREDENTIALS
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="bru-hero" id="forge">
        <div className="bru-hero-left">
          <p className="bru-eyebrow">[ EST. 2025 — INDEPENDENT FORGE ]</p>
          <h1 className="bru-hero-title">
            FORGE<br />
            IMAGES&nbsp;<span className="bru-amp">&amp;</span><br />
            <span className="bru-hero-italic">motion.</span>
          </h1>
          <p className="bru-hero-sub">
            A no-nonsense studio for production-grade neural imagery and cinematic
            video. Type. Tune. Forge.
          </p>
          <div className="bru-hero-tags">
            <span className="bru-tag">FLUX.1</span>
            <span className="bru-tag">HUNYUAN</span>
            <span className="bru-tag">LUMA</span>
            <span className="bru-tag">KLING</span>
          </div>

          <div className="bru-stats">
            <div className="bru-stat">
              <span className="bru-stat-num">{String(gallery.length).padStart(2, "0")}</span>
              <span className="bru-stat-lbl">ASSETS IN ARCHIVE</span>
            </div>
            <div className="bru-stat">
              <span className="bru-stat-num">04</span>
              <span className="bru-stat-lbl">PIPELINES ACTIVE</span>
            </div>
            <div className="bru-stat">
              <span className="bru-stat-num">{steps}</span>
              <span className="bru-stat-lbl">INFERENCE STEPS</span>
            </div>
          </div>
        </div>

        <div className="bru-hero-right">
          <div className="bru-canvas-frame">
            <Suspense fallback={<div className="bru-canvas-fallback" />}>
              <Hero3D />
            </Suspense>
            <div className="bru-canvas-label bru-canvas-label--tl">[ FORGE_NODE_01 ]</div>
            <div className="bru-canvas-label bru-canvas-label--tr">●&nbsp;LIVE</div>
            <div className="bru-canvas-label bru-canvas-label--bl">XYZ: 0.412 / 0.998 / -0.221</div>
            <div className="bru-canvas-label bru-canvas-label--br">RENDER: WEBGL2</div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="bru-marquee" aria-hidden>
        <div className="bru-marquee-track">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i}>
              FORGE / REMIX / RENDER / DOWNLOAD / ARCHIVE — &nbsp;✱&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ARCHIVE */}
      <section className="bru-archive" id="archive">
        <div className="bru-section-head">
          <div className="bru-section-head-l">
            <span className="bru-bar" />
            <h2 className="bru-section-title">ARCHIVE / {String(gallery.length).padStart(2, "0")} ASSETS</h2>
          </div>
          <span className="bru-section-meta">SORTED — NEWEST FIRST</span>
        </div>

        {gallery.length === 0 && !isGenerating && (
          <div className="bru-empty">
            <p className="bru-empty-title">NOTHING FORGED YET.</p>
            <p className="bru-empty-sub">PICK A PROMPT BELOW OR WRITE YOUR OWN.</p>
            <div className="bru-suggestions">
              {(activeTab === "image" ? SUGGESTIONS.image : SUGGESTIONS.video).map((s, i) => (
                <button key={i} className="bru-suggestion" onClick={() => setPrompt(s)}>
                  <span className="bru-suggestion-idx">{String(i + 1).padStart(2, "0")}</span>
                  <span>{s}</span>
                  <Plus size={14} />
                </button>
              ))}
            </div>
          </div>
        )}

        {gallery.length > 0 && (
          <div className="bru-grid">
            {gallery.map((item, i) => (
              <article
                key={item.id}
                className={`bru-card bru-card--${item.aspectRatio.replace(":", "x")}`}
                onClick={() => setSelectedAsset(item)}
              >
                <div className="bru-card-media">
                  {item.type === "video" ? (
                    <>
                      <video
                        src={item.url}
                        muted
                        loop
                        playsInline
                        onMouseOver={(e) => (e.currentTarget as HTMLVideoElement).play()}
                        onMouseOut={(e) => {
                          const v = e.currentTarget as HTMLVideoElement;
                          v.pause();
                          v.currentTime = 0;
                        }}
                      />
                      <span className="bru-card-tag bru-card-tag--video">
                        <Play size={10} fill="currentColor" /> VIDEO
                      </span>
                    </>
                  ) : (
                    <>
                      <img src={item.url} alt={item.prompt} loading="lazy" />
                      <span className="bru-card-tag">IMG</span>
                    </>
                  )}

                  <div className="bru-card-actions">
                    <button
                      type="button"
                      className="bru-icon-btn"
                      title="Remix"
                      onClick={(e) => handleRemix(item, e)}
                    >
                      <RefreshCw size={13} />
                    </button>
                    <button
                      type="button"
                      className="bru-icon-btn bru-icon-btn--danger"
                      title="Delete"
                      onClick={(e) => handleDeleteAsset(item.id, e)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="bru-card-foot">
                  <div className="bru-card-meta">
                    <span>#{String(i + 1).padStart(3, "0")}</span>
                    <span>{item.aspectRatio}</span>
                    <span>{item.timestamp}</span>
                  </div>
                  <p className="bru-card-prompt">{item.prompt}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="bru-footer">
        <span>© 2025 AURA/STUDIO — INDEPENDENT FORGE</span>
        <span>BUILT FOR MAKERS, NOT MARKETERS.</span>
        <span>v2.6.0</span>
      </footer>

      {/* PROGRESS TERMINAL */}
      {isGenerating && (
        <aside className="bru-terminal">
          <div className="bru-terminal-head">
            <span>FORGE_PROCESS.exe</span>
            <span className="bru-terminal-pct">{generationProgress}%</span>
          </div>
          <div className="bru-terminal-bar">
            <div className="bru-terminal-fill" style={{ width: `${generationProgress}%` }} />
          </div>
          <ul className="bru-terminal-list">
            {checklist.map((s) => (
              <li key={s.id} className={`bru-terminal-row bru-terminal-row--${s.status}`}>
                <span className="bru-terminal-marker">
                  {s.status === "done" ? "[✓]" : s.status === "active" ? "[~]" : "[ ]"}
                </span>
                <span>{s.text}</span>
                {s.status === "active" && <Loader2 size={11} className="bru-spin" />}
                {s.status === "done" && <Check size={11} />}
              </li>
            ))}
          </ul>
        </aside>
      )}

      {/* FORGE CAPSULE */}
      <div className="bru-capsule">
        <form onSubmit={handleGenerate}>
          <div className="bru-cap-top">
            <button
              type="button"
              className="bru-cap-plus"
              onClick={() => setShowDrawer(true)}
              aria-label="Open tune drawer"
            >
              <Plus size={18} />
            </button>
            <textarea
              className="bru-cap-input"
              rows={1}
              placeholder="Type to imagine"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate(e);
                }
              }}
            />
          </div>

          <div className="bru-cap-bottom">
            <div className="bru-cap-chips">
              <button type="button" className="bru-chip" onClick={() => setShowDrawer(true)}>
                <Settings2 size={13} /> Agent <span className="bru-chip-beta">(Beta)</span>
              </button>
              <button
                type="button"
                className={`bru-chip ${activeTab === "image" ? "is-active" : ""}`}
                onClick={() => { setActiveTab("image"); setErrorMsg(""); }}
              >
                <ImageIcon size={13} /> Image
              </button>
              <button
                type="button"
                className={`bru-chip ${activeTab === "video" ? "is-active" : ""}`}
                onClick={() => { setActiveTab("video"); setErrorMsg(""); }}
              >
                <VideoIcon size={13} /> Video
              </button>
              <button
                type="button"
                className="bru-chip bru-chip--ratio"
                onClick={() => setShowDrawer(true)}
              >
                <span className="bru-chip-swatch" /> {aspectRatio}
                <span className="bru-chip-caret">⌄</span>
              </button>
            </div>

            <button
              type="submit"
              className="bru-cap-send"
              disabled={isGenerating || !prompt.trim()}
              aria-label="Send"
            >
              {isGenerating ? <Loader2 size={16} className="bru-spin" /> : <ArrowUpRight size={16} />}
            </button>
          </div>

          {errorMsg && (
            <div className="bru-capsule-error">
              <AlertCircle size={12} /> {errorMsg}
            </div>
          )}
        </form>
      </div>

      {/* PARAMETER DRAWER */}
      <div className={`bru-drawer ${showDrawer ? "is-open" : ""}`}>
        <div className="bru-drawer-head">
          <div>
            <span className="bru-drawer-eyebrow">[ TUNE ]</span>
            <h3 className="bru-drawer-title">PIPELINE</h3>
          </div>
          <button className="bru-icon-btn" onClick={() => setShowDrawer(false)}><X size={16} /></button>
        </div>

        <div className="bru-drawer-body">
          <div className="bru-field">
            <label className="bru-field-label">MODEL</label>
            <div className="bru-model-list">
              {(activeTab === "image"
                ? [
                    { v: "fal-ai/flux/schnell", n: "Flux.1 Schnell", d: "Fast · high quality" },
                    { v: "fal-ai/flux/dev", n: "Flux.1 Dev", d: "Pro detail" },
                    { v: "fal-ai/sd-cascade", n: "SD Cascade", d: "Photorealistic" },
                    { v: "fal-ai/fooocus", n: "Fooocus V2", d: "Stylized" },
                  ]
                : [
                    { v: "fal-ai/hunyuan-video", n: "Tencent Hunyuan", d: "SOTA video" },
                    { v: "fal-ai/luma-dream-machine", n: "Luma Dream Machine", d: "Motion" },
                    { v: "fal-ai/kling-video", n: "Kling AI", d: "Physics sim" },
                    { v: "fal-ai/stable-video", n: "Stable Video", d: "Cinematic" },
                  ]
              ).map((m) => {
                const isActive = currentModel === m.v;
                return (
                  <button
                    type="button"
                    key={m.v}
                    className={`bru-model-row ${isActive ? "is-active" : ""}`}
                    onClick={() =>
                      activeTab === "image" ? setImageModel(m.v) : setVideoModel(m.v)
                    }
                  >
                    <div>
                      <div className="bru-model-name">{m.n}</div>
                      <div className="bru-model-desc">{m.d}</div>
                    </div>
                    {isActive && <Check size={14} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bru-field">
            <label className="bru-field-label">ASPECT</label>
            <div className="bru-ratios">
              {(["1:1", "16:9", "9:16"] as AspectRatio[]).map((r) => (
                <button
                  type="button"
                  key={r}
                  className={`bru-ratio ${aspectRatio === r ? "is-active" : ""}`}
                  onClick={() => setAspectRatio(r)}
                >
                  <div className={`bru-ratio-box bru-ratio-box--${r.replace(":", "x")}`} />
                  <span>{r}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bru-field">
            <div className="bru-field-label-row">
              <label className="bru-field-label">INFERENCE STEPS</label>
              <span className="bru-field-val">{steps}</span>
            </div>
            <input
              type="range"
              min={10}
              max={50}
              step={1}
              value={steps}
              onChange={(e) => setSteps(Number(e.target.value))}
              className="bru-slider"
            />
            <div className="bru-slider-axis">
              <span>10</span><span>30</span><span>50</span>
            </div>
          </div>
        </div>

        <button className="bru-btn bru-btn--solid bru-btn--full" onClick={() => setShowDrawer(false)}>
          APPLY <ArrowUpRight size={14} />
        </button>
      </div>

      {/* SETTINGS MODAL */}
      {showKeyModal && (
        <div className="bru-modal" onClick={() => setShowKeyModal(false)}>
          <div className="bru-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="bru-icon-btn bru-modal-x" onClick={() => setShowKeyModal(false)}>
              <X size={16} />
            </button>
            <span className="bru-drawer-eyebrow">[ CONFIG ]</span>
            <h2 className="bru-modal-title">VANTA SETTINGS</h2>
            <p className="bru-modal-desc">
              Local testing only. Do not expose manager keys in public production.
            </p>

            <form onSubmit={handleSaveKey}>
              <div className="bru-field" style={{ marginBottom: 16 }}>
                <label className="bru-field-label">API BASE URL</label>
                <div className="bru-input" style={{ opacity: 0.7 }}>
                  {import.meta.env.VITE_VANTA_API_BASE_URL || "http://localhost:3001"}
                </div>
              </div>

              <label className="bru-field-label">MANAGER API KEY</label>
              <div className="bru-key-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  className="bru-input"
                  placeholder="mgr_sec_key_..."
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                />
                <button
                  type="button"
                  className="bru-key-eye"
                  onClick={() => setShowPassword((p) => !p)}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#888" }}>
                  <button type="button" onClick={handleTestBackend} style={{ textDecoration: "underline" }}>Test Backend</button>
                  <span>{testBackend}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#888" }}>
                  <button type="button" onClick={handleTestRunPod} style={{ textDecoration: "underline" }}>Test RunPod</button>
                  <span>{testRunPod}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#888" }}>
                  <button type="button" onClick={handleTestWorkflow} style={{ textDecoration: "underline" }}>Validate Workflow</button>
                  <span>{testWorkflow}</span>
                </div>
              </div>

              <div className="bru-modal-actions" style={{ marginTop: "24px" }}>
                <button
                  type="button"
                  className="bru-btn bru-btn--ghost"
                  onClick={() => {
                    setTempKey("");
                    setApiKey("");
                    localStorage.removeItem("MANAGER_API_KEY");
                    setShowKeyModal(false);
                  }}
                >CLEAR</button>
                <button type="submit" className="bru-btn bru-btn--solid" onClick={() => setShowKeyModal(false)}>SAVE</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {selectedAsset && (
        <div className="bru-lightbox" onClick={() => setSelectedAsset(null)}>
          <div className="bru-lightbox-card" onClick={(e) => e.stopPropagation()}>
            <button className="bru-icon-btn bru-modal-x" onClick={() => setSelectedAsset(null)}>
              <X size={16} />
            </button>

            <div className="bru-lightbox-media">
              {selectedAsset.type === "video" ? (
                <video src={selectedAsset.url} controls autoPlay loop />
              ) : (
                <img src={selectedAsset.url} alt={selectedAsset.prompt} />
              )}
            </div>

            <aside className="bru-lightbox-side">
              <span className="bru-drawer-eyebrow">[ ASSET ]</span>
              <h3 className="bru-lightbox-title">COMPILE DETAILS</h3>

              <p className="bru-lightbox-prompt">{selectedAsset.prompt}</p>

              <dl className="bru-lightbox-meta">
                <div><dt>TYPE</dt><dd>{selectedAsset.type.toUpperCase()}</dd></div>
                <div><dt>MODEL</dt><dd>{selectedAsset.model}</dd></div>
                <div><dt>ASPECT</dt><dd>{selectedAsset.aspectRatio}</dd></div>
                <div><dt>FORGED</dt><dd>{selectedAsset.timestamp}</dd></div>
              </dl>

              <div className="bru-lightbox-actions">
                <button
                  className="bru-btn bru-btn--solid bru-btn--full"
                  onClick={() => triggerDownload(selectedAsset.url, `aura-${selectedAsset.id}`)}
                >
                  <Download size={14} /> DOWNLOAD
                </button>
                <button
                  className="bru-btn bru-btn--ghost bru-btn--full"
                  onClick={(e) => handleRemix(selectedAsset, e)}
                >
                  <RefreshCw size={14} /> REMIX
                </button>
                <button
                  className="bru-btn bru-btn--danger bru-btn--full"
                  onClick={() => handleDeleteAsset(selectedAsset.id)}
                >
                  <Trash2 size={14} /> DELETE
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
