import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PLACES } from "@/data/places";

const CYAN = "#00d8ff";
const FEATURED_PLACES = new Set(["christ-university", "bobs-bar", "milano-ice-cream-koramangala"]);

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
      const frameOffset = 0.0002;
      L.rectangle(
        [
          [place.lat - frameOffset, place.lng - frameOffset],
          [place.lat + frameOffset, place.lng + frameOffset],
        ],
        {
          color: CYAN,
          weight: 1.15,
          opacity: 0.95,
          fillColor: CYAN,
          fillOpacity: 0.3,
          interactive: false,
          className: "site-frame",
        },
      ).addTo(map);

      const marker = L.circleMarker([place.lat, place.lng], {
        radius: 7,
        color: CYAN,
        weight: 1.5,
        fillColor: CYAN,
        fillOpacity: 0.72,
        className: "loved-dot",
      }).addTo(map);

      const featured = FEATURED_PLACES.has(place.id);
      marker.bindTooltip(
        `<div class="dot-tip"><strong>${place.name}</strong><span>${place.lat.toFixed(4)}°N / ${place.lng.toFixed(4)}°E</span></div>`,
        {
          direction: place.id === "bobs-bar" ? "left" : "top",
          offset: place.id === "bobs-bar" ? [-14, 0] : [0, -14],
          opacity: 1,
          permanent: featured,
          className: featured ? "site-callout" : "place-tooltip",
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
      <svg
        className="topographic-overlay"
        viewBox="0 0 1000 700"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <g className="contour-lines">
          <path d="M-80 76 C75 18 176 45 243 112 S338 211 443 157" />
          <path d="M-90 108 C64 49 165 75 228 140 S322 237 426 188" />
          <path d="M-96 143 C53 82 151 106 211 167 S305 260 407 220" />
          <path d="M653 525 C722 438 820 426 907 477 S1023 556 1092 487" />
          <path d="M632 562 C710 468 816 456 913 510 S1030 589 1096 526" />
          <path d="M610 603 C698 501 812 491 918 546 S1038 626 1105 568" />
          <path d="M-65 590 C61 519 154 530 219 595 S330 690 445 638" />
        </g>
        <g className="survey-ticks">
          <path d="M28 64h42M49 43v42M930 78h42M951 57v42" />
          <path d="M28 622h42M49 601v42M930 622h42M951 601v42" />
        </g>
      </svg>
    </div>
  );
}
