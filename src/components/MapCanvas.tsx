import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PLACES } from "@/data/places";

const CYAN = "#00d8ff";

export default function MapCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [12.9342, 77.6125],
      zoom: 15.5,
      zoomSnap: 0.25,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
      minZoom: 3,
      maxZoom: 19,
    });
    mapRef.current = map;

    // Aerial photography is converted to the reference's dense monochrome print.
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, updateWhenZooming: false, keepBuffer: 3 },
    ).addTo(map);

    for (const place of PLACES) {
      const marker = L.circleMarker([place.lat, place.lng], {
        radius: 7,
        color: CYAN,
        weight: 1.5,
        fillColor: CYAN,
        fillOpacity: 0.72,
        className: "loved-dot",
      }).addTo(map);

      marker.bindTooltip(
        `<div class="dot-tip"><strong>${place.name}</strong><span>${place.lat.toFixed(4)}°N / ${place.lng.toFixed(4)}°E</span></div>`,
        {
          direction: "top",
          offset: [0, -8],
          opacity: 1,
          className: "place-tooltip",
        },
      );
      marker.on("click", () => window.open(place.url, "_blank", "noopener,noreferrer"));
    }

    map.setView([12.9342, 77.6125], 15.5, { animate: false });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="map-stage absolute inset-0">
      <div ref={containerRef} className="aerial-map absolute inset-0 h-full w-full" />
    </div>
  );
}
