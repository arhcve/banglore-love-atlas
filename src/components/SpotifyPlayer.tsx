import { useEffect, useRef, useState } from "react";
import { SPOTIFY_PLAYLIST_ID } from "@/data/places";

type EmbedController = {
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  loadUri: (uri: string) => void;
  addListener: (event: string, cb: (e: { data: { isPaused: boolean; position: number; duration: number } }) => void) => void;
};

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: {
      createController: (
        el: HTMLElement,
        opts: { uri: string; width: string | number; height: string | number },
        cb: (c: EmbedController) => void,
      ) => void;
    }) => void;
  }
}

export function SpotifyPlayer() {
  const hostRef = useRef<HTMLDivElement>(null);
  const ctrlRef = useRef<EmbedController | null>(null);
  const stateRef = useRef({ position: 0, duration: 0 });
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const boot = () => {
      window.onSpotifyIframeApiReady = (api) => {
        if (cancelled || !hostRef.current) return;
        api.createController(
          hostRef.current,
          { uri: `spotify:playlist:${SPOTIFY_PLAYLIST_ID}`, width: "100%", height: 80 },
          (controller) => {
            ctrlRef.current = controller;
            setReady(true);
            controller.addListener("playback_update", (e) => {
              (window as any).__spEvt = e.data;
              stateRef.current = { position: e.data.position, duration: e.data.duration };
              setPlaying(!e.data.isPaused);
            });
          },
        );
      };

      if (!document.getElementById("spotify-iframe-api")) {
        const s = document.createElement("script");
        s.id = "spotify-iframe-api";
        s.src = "https://open.spotify.com/embed/iframe-api/v1";
        s.async = true;
        document.body.appendChild(s);
      }
    };

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = () => ctrlRef.current?.togglePlay();

  const next = () => {
    const c = ctrlRef.current;
    if (!c) return;
    const { duration } = stateRef.current;
    // Seek to the very end so the embed advances to the next playlist track.
    c.seek(Math.max(0, duration / 1000 - 0.4));
    c.play();
  };

  return (
    <div className="player-bar">
      {/* Hidden Spotify embed drives audio; UI below is the only control surface */}
      <div className="player-embed" aria-hidden>
        <div ref={hostRef} />
      </div>

      <button
        type="button"
        className="player-btn player-btn-main"
        onClick={toggle}
        disabled={!ready}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M8 5.5v13l11-6.5-11-6.5z" />
          </svg>
        )}
      </button>

      <button
        type="button"
        className="player-btn"
        onClick={next}
        disabled={!ready}
        aria-label="Next track"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M5 5.5v13l9-6.5-9-6.5z" />
          <rect x="16" y="5" width="3" height="13" rx="1" />
        </svg>
      </button>

      <div className="player-label">
        <span className="player-loop">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 2l4 4-4 4" />
            <path d="M3 12V10a4 4 0 014-4h14" />
            <path d="M7 22l-4-4 4-4" />
            <path d="M21 12v2a4 4 0 01-4 4H3" />
          </svg>
        </span>
        ON LOOP
      </div>
    </div>
  );
}
