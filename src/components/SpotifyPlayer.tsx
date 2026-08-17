import { useCallback, useEffect, useRef, useState } from "react";
import { PLAYLIST_TRACKS } from "@/data/playlist";

type EmbedController = {
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  seek: (milliseconds: number) => void;
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

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const track = PLAYLIST_TRACKS[index];

  const goTo = useCallback((next: number) => {
    const i = Math.max(0, Math.min(next, PLAYLIST_TRACKS.length - 1));
    setIndex(i);
    setPosition(0);
    setDuration(0);
    const c = ctrlRef.current;
    if (!c) return;
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
            setPosition(position);
            setDuration(duration);
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
    ctrlRef.current?.togglePlay();
  };

  const seek = (milliseconds: number) => {
    setPosition(milliseconds);
    ctrlRef.current?.seek(milliseconds);
  };

  const formatTime = (milliseconds: number) => {
    if (!Number.isFinite(milliseconds) || milliseconds <= 0) return "0:00";
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
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
          disabled={!ready || index === 0}
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
          disabled={!ready || index === PLAYLIST_TRACKS.length - 1}
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
        <div className="player-timeline">
          <span>{formatTime(position)}</span>
          <input
            type="range"
            min={0}
            max={Math.max(duration, 1)}
            step={1000}
            value={Math.min(position, Math.max(duration, 1))}
            onChange={(event) => seek(Number(event.currentTarget.value))}
            disabled={!ready || duration <= 0}
            aria-label="Seek through current track"
            style={
              {
                "--player-progress": `${duration ? (position / duration) * 100 : 0}%`,
              } as React.CSSProperties
            }
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      <div className="player-balance" aria-hidden="true" />
    </div>
  );
}
