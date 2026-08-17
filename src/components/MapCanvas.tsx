import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { PLACES } from "@/data/places";

const MAP_STYLE = {
  version: 8,
  sources: {
    satellite: {
      type: "raster",
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      maxzoom: 20,
      attribution: "Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    },
    openmaptiles: { type: "vector", url: "https://tiles.openfreemap.org/planet" },
  },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#02050a" } },
    {
      id: "satellite-ground",
      type: "raster",
      source: "satellite",
      paint: {
        "raster-opacity": 0.97,
        "raster-saturation": -0.16,
        "raster-contrast": 0.18,
        "raster-brightness-min": 0.04,
        "raster-brightness-max": 0.82,
        "raster-fade-duration": 0,
      },
    },
    {
      id: "parks",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landuse",
      filter: ["match", ["get", "class"], ["park", "grass", "cemetery"], true, false],
      paint: { "fill-color": "#29442d", "fill-opacity": 0.1 },
    },
    {
      id: "roads",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 8,
      paint: {
        "line-color": ["match", ["get", "class"], ["primary", "trunk", "motorway"], "#8a7635", "#313638"],
        "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.15, 16, 2.1],
        "line-opacity": 0.58,
      },
    },
    {
      id: "bangalore-3d-buildings",
      type: "fill-extrusion",
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 13.2,
      paint: {
        "fill-extrusion-color": ["interpolate", ["linear"], ["coalesce", ["get", "render_height"], ["get", "height"], 8], 0, "#181b1d", 18, "#303335", 55, "#555248", 140, "#837a61"],
        "fill-extrusion-height": ["coalesce", ["get", "render_height"], ["get", "height"], 8],
        "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], ["get", "min_height"], 0],
        "fill-extrusion-opacity": 0.9,
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
      center: [77.6115, 12.951],
      zoom: 13.6,
      minZoom: 1.2,
      pitch: 52,
      bearing: -18,
      attributionControl: { compact: true },
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

    map.on("load", () => {
      map.setProjection({ type: "globe" });
      map.setSky({
        "sky-color": "#01030a",
        "horizon-color": "#1c3342",
        "fog-color": "#080d13",
        "fog-ground-blend": 0.65,
        "horizon-fog-blend": 0.28,
        "sky-horizon-blend": 0.68,
        "atmosphere-blend": 0.72,
      });

      const markerElements: HTMLButtonElement[] = [];
      for (const place of PLACES) {
        const markerElement = document.createElement("button");
        markerElement.type = "button";
        markerElement.className = "loved-dot loved-dot-3d";
        markerElement.setAttribute("aria-label", `Open ${place.name} in Google Maps`);
        markerElements.push(markerElement);
        const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12 })
          .setHTML(`<div class="dot-tip">${place.name}<span>${place.note ?? ""}</span></div>`);
        new maplibregl.Marker({ element: markerElement }).setLngLat([place.lng, place.lat]).addTo(map);
        markerElement.addEventListener("mouseenter", () => popup.setLngLat([place.lng, place.lat]).addTo(map));
        markerElement.addEventListener("mouseleave", () => popup.remove());
        markerElement.addEventListener("click", () => window.open(place.url, "_blank", "noopener,noreferrer"));
      }

      const updateScale = () => {
        const zoom = map.getZoom();
        const size = Math.max(3.5, Math.min(8, 3.5 + (zoom - 7) * 0.55));
        const pitch = zoom <= 5 ? 0 : zoom >= 10 ? 52 : ((zoom - 5) / 5) * 52;
        if (Math.abs(map.getPitch() - pitch) > 0.5) map.setPitch(pitch);
        for (const marker of markerElements) {
          marker.style.width = `${size}px`;
          marker.style.height = `${size}px`;
          marker.style.visibility = zoom < 6.5 ? "hidden" : "visible";
          marker.style.pointerEvents = zoom < 7 ? "none" : "auto";
        }
      };
      updateScale();
      map.on("zoom", updateScale);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="maplibre-map absolute inset-0 h-full w-full" />;
}
