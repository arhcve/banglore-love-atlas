import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PLACES } from "@/data/places";

export default function MapCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [12.9345, 77.6115],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
    });
    mapRef.current = map;

    // Dark, low-color base — feels like the topographic reference.
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
      {
        subdomains: "abcd",
        maxZoom: 20,
      },
    ).addTo(map);

    // Faint street labels on top for context.
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png",
      {
        subdomains: "abcd",
        maxZoom: 20,
        opacity: 0.55,
      },
    ).addTo(map);

    // Loved places
    for (const place of PLACES) {
      const marker = L.circleMarker([place.lat, place.lng], {
        radius: 9,
        color: "#7ec8ff",
        weight: 2,
        fillColor: "#3b9dff",
        fillOpacity: 0.9,
        className: "loved-dot",
      }).addTo(map);

      marker.bindTooltip(
        `<div class="dot-tip">${place.name}<span>${place.note ?? ""}</span></div>`,
        { direction: "top", offset: [0, -10], opacity: 1 },
      );

      marker.on("click", () => {
        window.open(place.url, "_blank", "noopener,noreferrer");
      });
    }

    // Fit to markers with breathing room
    const bounds = L.latLngBounds(PLACES.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [80, 80] });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" />;
}
