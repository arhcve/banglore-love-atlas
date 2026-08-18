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
      center: [12.944, 77.612],
      zoom: 14,
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

    const bounds = L.latLngBounds(PLACES.map((place) => [place.lat, place.lng]));
    const centre = bounds.getCenter();

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
        `<div class="dot-tip">${place.name}<span>${place.note ?? ""}</span></div>`,
        { direction: "top", offset: [0, -8], opacity: 1 },
      );
      marker.on("click", () => window.open(place.url, "_blank", "noopener,noreferrer"));
    }

    // A crisp cyan perimeter makes the mapped collection read like a site plan.
    const hull = PLACES
      .map((place) => L.latLng(place.lat, place.lng))
      .sort((a, b) => Math.atan2(a.lat - centre.lat, a.lng - centre.lng) - Math.atan2(b.lat - centre.lat, b.lng - centre.lng));
    L.polygon(hull, {
      color: CYAN,
      weight: 1.35,
      opacity: 0.9,
      fillColor: CYAN,
      fillOpacity: 0.035,
      interactive: false,
      className: "survey-boundary",
    }).addTo(map);

    map.fitBounds(bounds, { paddingTopLeft: [70, 70], paddingBottomRight: [90, 110] });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="aerial-map absolute inset-0 h-full w-full" />;
}
