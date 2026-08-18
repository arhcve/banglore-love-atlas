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
      const frameOffset = 0.00016;
      L.rectangle(
        [
          [place.lat - frameOffset, place.lng - frameOffset],
          [place.lat + frameOffset, place.lng + frameOffset],
        ],
        {
          color: CYAN,
          weight: 0.75,
          opacity: 0.5,
          fillColor: CYAN,
          fillOpacity: 0.035,
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
