import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { PLACES } from "@/data/places";

const MAP_STYLE = {
  version: 8,
  sources: {
    openmaptiles: {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
    },
  },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#05070d" } },
    {
      id: "landcover",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landcover",
      paint: { "fill-color": "#0a0d11", "fill-opacity": 0.72 },
    },
    {
      id: "water",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "water",
      paint: { "fill-color": "#020407", "fill-opacity": 0.95 },
    },
    {
      id: "roads-shadow",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      paint: {
        "line-color": "#000000",
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.4, 16, 4],
      },
    },
    {
      id: "roads",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      paint: {
        "line-color": [
          "match",
          ["get", "class"],
          ["primary", "trunk", "motorway"],
          "#6d6030",
          "#25282a",
        ],
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.25, 16, 2.2],
        "line-opacity": 0.82,
      },
    },
    {
      id: "bangalore-3d-buildings",
      type: "fill-extrusion",
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 13.5,
      paint: {
        "fill-extrusion-color": [
          "interpolate",
          ["linear"],
          ["coalesce", ["get", "render_height"], ["get", "height"], 8],
          0,
          "#17191a",
          18,
          "#292b2b",
          55,
          "#4d4b43",
          140,
          "#77715d",
        ],
        "fill-extrusion-height": ["coalesce", ["get", "render_height"], ["get", "height"], 8],
        "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], ["get", "min_height"], 0],
        "fill-extrusion-opacity": 0.94,
        "fill-extrusion-vertical-gradient": true,
      },
    },
  ],
} as maplibregl.StyleSpecification;

export default function MapCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [77.6115, 12.9345],
      zoom: 14,
      pitch: 58,
      bearing: -18,
      attributionControl: false,
      antialias: true,
      maxPitch: 75,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
      maxTileCacheSize: 72,
      fadeDuration: 0,
      crossSourceCollisions: false,
      refreshExpiredTiles: false,
      renderWorldCopies: false,
    });
    mapRef.current = map;

    map.on("error", (event) => {
      containerRef.current?.setAttribute("data-map-error", event.error.message);
    });

    map.on("load", () => {
      containerRef.current?.setAttribute("data-map-ready", "true");
      for (const place of PLACES) {
        const markerElement = document.createElement("button");
        markerElement.type = "button";
        markerElement.className = "loved-dot loved-dot-3d";
        markerElement.setAttribute("aria-label", `Open ${place.name} in Google Maps`);

        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 16,
          className: "place-popup",
        }).setHTML(`<div class="dot-tip">${place.name}<span>${place.note ?? ""}</span></div>`);

        new maplibregl.Marker({ element: markerElement })
          .setLngLat([place.lng, place.lat])
          .addTo(map);

        markerElement.addEventListener("mouseenter", () =>
          popup.setLngLat([place.lng, place.lat]).addTo(map),
        );
        markerElement.addEventListener("mouseleave", () => popup.remove());
        markerElement.addEventListener("click", () => {
          window.open(place.url, "_blank", "noopener,noreferrer");
        });
      }

      map.jumpTo({
        center: [77.6115, 12.9345],
        zoom: 15.25,
        pitch: 58,
        bearing: -18,
      });
      containerRef.current?.setAttribute("data-map-zoom", map.getZoom().toFixed(2));
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="maplibre-map absolute inset-0 h-full w-full" />;
}
