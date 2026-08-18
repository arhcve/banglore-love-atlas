import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PLACES } from "@/data/places";

const CYAN = "#00d8ff";

const MAP_ORIGIN = { lat: 12.9342, lng: 77.6125 };

function getDrivingEstimate(lat: number, lng: number) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(lat - MAP_ORIGIN.lat);
  const dLng = toRadians(lng - MAP_ORIGIN.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(MAP_ORIGIN.lat)) * Math.cos(toRadians(lat)) * Math.sin(dLng / 2) ** 2;
  const directKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const roadKm = Math.max(0.4, directKm * 1.28);
  const minutes = Math.max(2, Math.round((roadKm / 24) * 60));
  return { km: roadKm.toFixed(1), minutes };
}


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
      const drive = getDrivingEstimate(place.lat, place.lng);
      const marker = L.circleMarker([place.lat, place.lng], {
        radius: 7,
        color: CYAN,
        weight: 1.5,
        fillColor: CYAN,
        fillOpacity: 0.72,
        className: "loved-dot",
      }).addTo(map);

      marker.bindTooltip(
        `<div class="dot-tip"><div class="dot-tip-row"><strong>${place.name}</strong><span class="drive-badge"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11l1.5-4h11l1.5 4 2 2v5h-2v-2H5v2H3v-5l2-2zm2.2-2L6.5 11h11L16.8 9H7.2zM7 14.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></svg>${drive.minutes} min</span></div><span class="dot-coordinates">${place.lat.toFixed(4)}°N / ${place.lng.toFixed(4)}°E · ${drive.km} km</span></div>`,
        {
          direction: "top",
          offset: [0, -8],
          opacity: 1,
          className: "place-tooltip",
        },
      );
      marker.on("click", () => {
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&travelmode=driving`;
        window.open(directionsUrl, "_blank", "noopener,noreferrer");
      });
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
