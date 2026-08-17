import { SPOTIFY_PLAYLIST_ID } from "@/data/places";

export function SpotifyPlayer() {
  return (
    <div className="spotify-shell">
      <iframe
        title="Spotify Playlist"
        src={`https://open.spotify.com/embed/playlist/${SPOTIFY_PLAYLIST_ID}?utm_source=generator&theme=0`}
        width="100%"
        height="152"
        frameBorder={0}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  );
}
