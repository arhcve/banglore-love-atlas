import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ClientOnly } from "@/components/ClientOnly";
import { LiveClock } from "@/components/LiveClock";
import { SpotifyPlayer } from "@/components/SpotifyPlayer";

const MapCanvas = lazy(() => import("@/components/MapCanvas"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Places I Love — Bangalore" },
      { name: "description", content: "A hand-picked map of my favourite spots in Bangalore." },
      { property: "og:title", content: "Places I Love — Bangalore" },
      { property: "og:description", content: "A hand-picked map of my favourite spots in Bangalore." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#05070d] text-foreground">
      {/* Animated contour background — sits under the map, subtly drifting */}
      <div className="contour-bg" aria-hidden />
      <div className="grain" aria-hidden />

      {/* Map */}
      <ClientOnly fallback={<div className="absolute inset-0 grid place-items-center text-xs tracking-widest text-[color:var(--ink-dim)]">LOADING MAP…</div>}>
        <Suspense fallback={null}>
          <MapCanvas />
        </Suspense>
      </ClientOnly>

      {/* Vignette on top of map for depth */}
      <div className="vignette" aria-hidden />

      {/* Title bottom-left */}
      <div className="title-block">
        <div className="title-eyebrow">{"\n"}</div>
        <div className="title-scale">
          <span>0</span>
          <span className="bar" />
          <span>500m</span>
        </div>
        <div className="title-place">
          <div>PLACES I LOVE</div>
          <div className="title-city">IN BANGALORE</div>
        </div>
      </div>

      {/* Clock top-right */}
      <div className="fixed right-6 top-6 z-[1000]">
        <LiveClock />
      </div>

      {/* Spotify bottom-right */}
      <div className="fixed bottom-6 right-6 z-[1000] w-[min(360px,calc(100vw-3rem))]">
        <SpotifyPlayer />
      </div>
    </div>
  );
}import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ClientOnly } from "@/components/ClientOnly";
import { LiveClock } from "@/components/LiveClock";
import { SpotifyPlayer } from "@/components/SpotifyPlayer";

const MapCanvas = lazy(() => import("@/components/MapCanvas"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Places I Love — Bangalore" },
      { name: "description", content: "A hand-picked map of my favourite spots in Bangalore." },
      { property: "og:title", content: "Places I Love — Bangalore" },
      { property: "og:description", content: "A hand-picked map of my favourite spots in Bangalore." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#05070d] text-foreground">
      {/* Animated contour background — sits under the map, subtly drifting */}
      <div className="contour-bg" aria-hidden />
      <div className="grain" aria-hidden />

      {/* Map */}
      <ClientOnly fallback={<div className="absolute inset-0 grid place-items-center text-xs tracking-widest text-[color:var(--ink-dim)]">LOADING MAP…</div>}>
        <Suspense fallback={null}>
          <MapCanvas />
        </Suspense>
      </ClientOnly>

      {/* Vignette on top of map for depth */}
      <div className="vignette" aria-hidden />

      {/* Title bottom-left */}
      <div className="title-block">
        <div className="title-eyebrow">{"\n"}</div>
        <div className="title-scale">
          <span>0</span>
          <span className="bar" />
          <span>500m</span>
        </div>
        <div className="title-place">
          <div>PLACES I LOVE</div>
          <div className="title-city">IN BANGALORE</div>
        </div>
      </div>

      {/* Clock top-right */}
      <div className="fixed right-6 top-6 z-[1000]">
        <LiveClock />
      </div>

      {/* Player bar centered at the bottom */}
      <div className="fixed bottom-6 left-1/2 z-[1000] -translate-x-1/2">
        <SpotifyPlayer />
      </div>
    </div>
  );
}
