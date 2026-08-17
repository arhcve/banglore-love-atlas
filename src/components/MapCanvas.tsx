import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { PLACES } from "@/data/places";

const DARK_VECTOR_STYLE = "https://tiles.openfreemap.org/styles/dark";

export default function MapCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_VECTOR_STYLE,
      center: [77.6115, 12.951],
      zoom: 13.6,
      minZoom: 1.2,
      pitch: 34,
      bearing: 0,
      attributionControl: { compact: true },
      antialias: true,
      maxPitch: 70,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
      maxTileCacheSize: 64,
      fadeDuration: 0,
      crossSourceCollisions: false,
      refreshExpiredTiles: false,
      renderWorldCopies: false,
    });
    mapRef.current = map;

    map.on("load", () => {
      // Keep the close view architectural while retaining the full globe at world zoom.
      map.setProjection({ type: "globe" });
      map.setSky({
        "sky-color": "#02050a",
        "horizon-color": "#111a22",
        "fog-color": "#080d12",
        "fog-ground-blend": 0.7,
        "horizon-fog-blend": 0.22,
        "sky-horizon-blend": 0.72,
        "atmosphere-blend": 0.55,
      });

      const labelLayer = map
        .getStyle()
        .layers?.find((layer) => layer.type === "symbol" && "layout" in layer && layer.layout?.["text-field"]);

      map.addLayer(
        {
          id: "bangalore-stylized-buildings",
          type: "fill-extrusion",
          source: "openmaptiles",
          "source-layer": "building",
          minzoom: 13,
          paint: {
            "fill-extrusion-color": [
              "interpolate",
              ["linear"],
              ["coalesce", ["get", "render_height"], ["get", "height"], 7],
              0,
              "#171b20",
              18,
              "#252b31",
              55,
              "#394149",
              140,
              "#505961",
            ],
            "fill-extrusion-height": ["coalesce", ["get", "render_height"], ["get", "height"], 7],
            "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], ["get", "min_height"], 0],
            "fill-extrusion-opacity": 0.86,
            "fill-extrusion-vertical-gradient": true,
          },
        },
        labelLayer?.id,
      );

      const markerElements: HTMLButtonElement[] = [];
      for (const place of PLACES) {
        const markerElement = document.createElement("button");
        markerElement.type = "button";
        markerElement.className = "loved-dot";
        markerElement.setAttribute("aria-label", `Open ${place.name} in Google Maps`);
        markerElements.push(markerElement);

        const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10 }).setHTML(
          `<div class="dot-tip">${place.name}<span>${place.note ?? ""}</span></div>`,
        );

        new maplibregl.Marker({ element: markerElement }).setLngLat([place.lng, place.lat]).addTo(map);
        markerElement.addEventListener("mouseenter", () => popup.setLngLat([place.lng, place.lat]).addTo(map));
        markerElement.addEventListener("mouseleave", () => popup.remove());
        markerElement.addEventListener("click", () => window.open(place.url, "_blank", "noopener,noreferrer"));
      }

      const updateView = () => {
        const zoom = map.getZoom();
        const size = Math.max(4, Math.min(7, 4 + (zoom - 8) * 0.4));
        const pitch = zoom <= 5 ? 0 : zoom >= 10 ? 34 : ((zoom - 5) / 5) * 34;
        if (Math.abs(map.getPitch() - pitch) > 0.5) map.setPitch(pitch);

        for (const marker of markerElements) {
          marker.style.width = `${size}px`;
          marker.style.height = `${size}px`;
          marker.style.visibility = zoom < 6.5 ? "hidden" : "visible";
          marker.style.pointerEvents = zoom < 7 ? "none" : "auto";
        }
      };

      updateView();
      map.on("zoom", updateView);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="maplibre-map absolute inset-0 h-full w-full" />;
}
