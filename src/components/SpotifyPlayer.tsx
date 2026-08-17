import { useCallback, useEffect, useRef, useState } from "react";
import { PLAYLIST_TRACKS } from "@/data/playlist";

type EmbedController = {
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  loadUri: (uri: string) => void;
  addListener: (
    event: string,
    cb: (e: { data: { isPaused: boolean; position: number; duration: number } }) => void,
  ) => void;
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
  const startedRef = useRef(false);
  const indexRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const track = PLAYLIST_TRACKS[index];

  const goTo = useCallback((next: number) => {
    const total = PLAYLIST_TRACKS.length;
    const i = ((next % total) + total) % total;
    indexRef.current = i;
    setIndex(i);
    setProgress(0);
    const c = ctrlRef.current;
    if (!c) return;
    startedRef.current = true;
    c.loadUri(PLAYLIST_TRACKS[i].uri);
    c.play();
  }, []);

  useEffect(() => {
    let cancelled = false;

    window.onSpotifyIframeApiReady = (api) => {
      if (cancelled || !hostRef.current) return;
      api.createController(
        hostRef.current,
        { uri: PLAYLIST_TRACKS[0].uri, width: "100%", height: 80 },
        (controller) => {
          ctrlRef.current = controller;
          setReady(true);
          controller.addListener("playback_update", (e) => {
            const { isPaused, position, duration } = e.data;
            setPlaying(!isPaused);
            setProgress(duration ? Math.min(1, position / duration) : 0);
            // Auto-advance in a loop when a track finishes.
            if (
              startedRef.current &&
              duration > 0 &&
              isPaused &&
              position >= duration - 1200
            ) {
              goTo(indexRef.current + 1);
            }
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

    return () => {
      cancelled = true;
    };
  }, [goTo]);

  const toggle = () => {
    startedRef.current = true;
    ctrlRef.current?.togglePlay();
  };

  return (
    <div className="player-bar">
      {/* Hidden Spotify embed drives audio; the bar below is the only control surface */}
      <div className="player-embed" aria-hidden>
        <div ref={hostRef} />
      </div>

      <div className="player-controls">
        <button
          type="button"
          className="player-btn"
          onClick={() => goTo(index - 1)}
          disabled={!ready}
          aria-label="Previous track"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <rect x="5" y="6" width="3" height="12" rx="1" />
            <path d="M19 6.5v11l-9-5.5 9-5.5z" />
          </svg>
        </button>

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
          onClick={() => goTo(index + 1)}
          disabled={!ready}
          aria-label="Next track"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M5 6.5v11l9-5.5-9-5.5z" />
            <rect x="16" y="6" width="3" height="12" rx="1" />
          </svg>
        </button>
      </div>

      <div className="player-now">
        <div className="player-title" title={`${track.title} — ${track.artist}`}>
          {track.title}
        </div>
        <div className="player-artist">{track.artist}</div>
        <div className="player-progress">
          <span style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      </div>

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
