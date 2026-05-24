import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import VantaLanding from "@/components/VantaLanding";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VANTA AI — Cinematic AI Video Generation for Creators" },
      {
        name: "description",
        content:
          "Generate cinematic AI video clips from prompts, images, and scripts. Batch scene generation, upscale-ready pipeline, and API access — built for creators and agencies.",
      },
      { property: "og:title", content: "VANTA AI — Cinematic AI Video Generation" },
      { property: "og:description", content: "Plan scenes, batch generate clips, upscale, and assemble longer videos faster." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ClientOnly fallback={<div style={{ minHeight: "100vh", background: "#06060c" }} />}>
      <VantaLanding />
    </ClientOnly>
  );
}
