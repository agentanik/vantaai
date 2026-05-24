# AURA Studio — Brutalist Tech Redesign

Goal: kill the "AI-generated dark glass" look. Rebuild the shell with a cream/black brutalist system, oversized editorial type, a raw asymmetric grid, and a real Three.js 3D hero — while keeping every existing feature (image/video tabs, fal.ai live engine, sandbox simulation, gallery, lightbox, remix, delete, credentials, localStorage).

Inspiration distilled from your refs: Grok's confident minimal capsule, Luma/Flow's spatial 3D framing, Kling's grid density, invideo's bold typographic blocks, Creative Fabrica Studio's tool-belt density.

## Design system (locked tokens)

- Background: `#f5f3ee` (warm paper). Ink: `#0d0d0d`. Accent: `#ff5722` (signal orange). Highlight: `#ffeb3b` (tape yellow, used sparingly on hover/active only).
- Type: `Space Grotesk` (display, used at 64–180px, tight tracking, mixed-case) + `JetBrains Mono` (UI labels, metadata, terminal checklist). Drop Outfit.
- Borders: 1.5px solid ink, no rounded corners except on the prompt capsule (pill). No glassmorphism. No backdrop-blur. No neon glow.
- Motion: snappy 180–240ms cubic-bezier(0.2, 0.8, 0.2, 1). One signature: orange "tape highlight" sweeps under labels on hover.
- Grid: 12-col asymmetric. Generous whitespace at top, dense tool blocks below.

## Layout (full page rebuild)

```text
┌─────────────────────────────────────────────────────────┐
│  AURA/STUDIO ●   [001] IMG  [002] VID   ⊕ CREDENTIALS  │  top bar, mono, ticker style
├──────────────────────┬──────────────────────────────────┤
│  FORGE              │                                   │
│  IMAGES &           │     [ THREE.JS 3D CANVAS ]        │  hero split
│  MOTION.            │     rotating low-poly object,     │
│  ── since 2025      │     mouse-parallax, orange wire   │
│                     │                                   │
├──────────────────────┴──────────────────────────────────┤
│  ▌ARCHIVE / 04 ASSETS                    [grid] [list] │  section header w/ orange bar
│                                                         │
│  ┌──────┐ ┌────────────┐ ┌──────┐                      │
│  │ img  │ │   img      │ │ vid  │   asymmetric         │
│  └──────┘ │            │ └──────┘   masonry, hard      │
│  ┌────┐   └────────────┘ ┌──────┐   borders, no        │
│  │img │   ┌──────┐       │ img  │   rounded            │
│  └────┘   │ vid  │       └──────┘                      │
│           └──────┘                                      │
└─────────────────────────────────────────────────────────┘
        ┌──────────────────────────────────────┐
        │ ▌ describe the frame...          [→] │  floating capsule
        │   schnell · 1:1 · 28 steps  [⚙ TUNE] │  bottom-center, pill
        └──────────────────────────────────────┘
```

Parameter drawer slides in from right as a hard-edged panel (no blur), full-height, with brutalist toggles for model / aspect / steps. Progress checklist becomes a top-right mono terminal card with orange progress bar.

## Components to build

- `BrutalistShell` — page frame, top bar, footer ticker.
- `Hero3D` — Three.js canvas (react-three-fiber + drei). Low-poly rotating geometry, orange wireframe overlay, mouse parallax. Suspense fallback = static SVG.
- `ForgeCapsule` — replaces current floating input. Pill, hard border, mono meta row.
- `ParameterDrawer` — slide-from-right, no blur, brutalist controls.
- `ProgressTerminal` — mono checklist, orange bar.
- `ArchiveGrid` — asymmetric masonry, hard hover overlay with REMIX / DELETE as inverted ink buttons.
- `Lightbox` — full-bleed, ink backdrop, mono metadata sidebar.

## Files

- New: `src/components/aura/Hero3D.tsx`, `BrutalistShell.tsx`, `ForgeCapsule.tsx`, `ParameterDrawer.tsx`, `ProgressTerminal.tsx`, `ArchiveGrid.tsx`, `Lightbox.tsx`, `CredentialsModal.tsx`.
- Refactor: `src/components/AuraStudio.tsx` → thin orchestrator holding state + fal.ai/sandbox logic, composes the new components. All existing logic (localStorage gallery, dual engine, remix) preserved verbatim.
- Rewrite: aura section of `src/styles.css` — purge glass/neon, add brutalist tokens.
- Update: `src/routes/__root.tsx` — swap Outfit for Space Grotesk + JetBrains Mono.

## Dependencies

`bun add three @react-three/fiber @react-three/drei` (Three.js stack). Keep `@fal-ai/client`, `lucide-react`.

## Technical notes

- Three.js mounted client-only (already inside `ClientOnly` in `routes/index.tsx`). Use `Suspense` + lazy import for the canvas so SSR/build doesn't choke.
- No backdrop-filter anywhere (sandbox + perf).
- All existing state shape (gallery item: url, type, prompt, model, aspectRatio, timestamp) untouched → remix/lightbox/localStorage keep working.
- Sandbox simulation + fal.ai live path unchanged; only the UI surface around them changes.

## Out of scope

- No backend / auth / DB changes.
- No new generation features.
- No mobile-specific redesign beyond responsive collapse of the hero split.

Approve and I'll switch to build mode and execute.