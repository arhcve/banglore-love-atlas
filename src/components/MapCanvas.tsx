import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PLACES } from "@/data/places";

const CYAN = "#00d8ff";

type DriveEstimate = { km: string; minutes: number } | null;

function getTooltipContent(place: (typeof PLACES)[number], drive: DriveEstimate) {
  const driveLabel = drive ? `${drive.minutes} min` : "LOCATING…";
  const distanceLabel = drive ? ` · ${drive.km} km` : "";
  return `<div class="dot-tip"><div class="dot-tip-row"><strong>${place.name}</strong><span class="drive-badge"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11l1.5-4h11l1.5 4 2 2v5h-2v-2H5v2H3v-5l2-2zm2.2-2L6.5 11h11L16.8 9H7.2zM7 14.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></svg>${driveLabel}</span></div><span class="dot-coordinates">${place.lat.toFixed(4)}°N / ${place.lng.toFixed(4)}°E${distanceLabel}</span></div>`;
}

function getSequenceLabel(index: number) {
  let label = "";
  for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) {
    label = String.fromCharCode(65 + ((value - 1) % 26)) + label;
  }
  return label;
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

    const placeMarkers = new Map<string, L.CircleMarker>();
    let currentOrigin: L.LatLng | null = null;
    let lastRouteOrigin: L.LatLng | null = null;
    let routeRequest = 0;
    let routeMode = false;
    const selectedRoutePlaces: Array<(typeof PLACES)[number]> = [];
    const routeLayers: L.Layer[] = [];

    const clearRoute = () => {
      routeLayers.splice(0).forEach((layer) => map.removeLayer(layer));
      selectedRoutePlaces.splice(0);
    };

    const addRoutePoint = (place: (typeof PLACES)[number]) => {
      if (selectedRoutePlaces.some((selected) => selected.id === place.id)) return;

      const previous = selectedRoutePlaces[selectedRoutePlaces.length - 1];
      const label = getSequenceLabel(selectedRoutePlaces.length);
      selectedRoutePlaces.push(place);

      const pointLabel = L.marker([place.lat, place.lng], {
        interactive: false,
        zIndexOffset: 800,
        icon: L.divIcon({
          className: "route-point-label",
          html: `<span style="display:grid;place-items:center;width:24px;height:24px;border:1px solid #00d8ff;border-radius:50%;background:#090b0d;color:#00d8ff;font:700 12px/1 monospace;box-shadow:0 0 14px rgba(0,216,255,.55)">${label}</span>`,
          iconSize: [24, 24],
          iconAnchor: [12, 31],
        }),
      }).addTo(map);
      routeLayers.push(pointLabel);

      if (!previous) return;

      const line = L.polyline(
        [[previous.lat, previous.lng], [place.lat, place.lng]],
        { color: CYAN, weight: 1.5, opacity: 0.72, dashArray: "5 7", interactive: false },
      ).addTo(map);
      const midpoint = L.latLng(
        (previous.lat + place.lat) / 2,
        (previous.lng + place.lng) / 2,
      );
      const averageLatitude = ((previous.lat + place.lat) / 2) * (Math.PI / 180);
      const bearing =
        (Math.atan2(
          (place.lng - previous.lng) * Math.cos(averageLatitude),
          place.lat - previous.lat,
        ) *
          180) /
        Math.PI;
      const arrow = L.marker(midpoint, {
        interactive: false,
        zIndexOffset: 700,
        icon: L.divIcon({
          className: "route-arrow",
          html: `<span style="display:block;color:#00d8ff;font-size:19px;line-height:19px;text-shadow:0 0 8px rgba(0,216,255,.9);transform:rotate(${bearing}deg)">▲</span>`,
          iconSize: [19, 19],
          iconAnchor: [9.5, 9.5],
        }),
      }).addTo(map);
      routeLayers.push(line, arrow);
    };

    const locationControl = L.control({ position: "topright" });
    locationControl.onAdd = () => {
      const button = L.DomUtil.create("button", "live-location-control") as HTMLButtonElement;
      button.type = "button";
      button.title = "Go to my location";
      button.setAttribute("aria-label", "Go to my live location");
      button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l3.05 6.45L21.5 12l-6.45 3.05L12 21.5l-3.05-6.45L2.5 12l6.45-3.05L12 2.5zm0 6.25A3.25 3.25 0 1 0 12 15.25 3.25 3.25 0 0 0 12 8.75z"/></svg>';
      button.style.cssText = "width:44px;height:44px;margin:calc(50vh - 22px) 14px 0 0;border:1px solid rgba(0,216,255,.55);border-radius:50%;background:rgba(12,14,16,.88);color:#00d8ff;display:grid;place-items:center;cursor:pointer;box-shadow:0 0 22px rgba(0,216,255,.22);backdrop-filter:blur(10px);";
      const icon = button.querySelector("svg");
      if (icon instanceof SVGElement) {
        icon.style.width = "22px";
        icon.style.height = "22px";
        icon.style.fill = "currentColor";
      }
      L.DomEvent.disableClickPropagation(button);
      L.DomEvent.on(button, "click", (event) => {
        L.DomEvent.stop(event);
        if (currentOrigin) {
          map.flyTo(currentOrigin, Math.max(map.getZoom(), 16.5), { duration: 0.65 });
          return;
        }
        navigator.geolocation?.getCurrentPosition(
          ({ coords }) => {
            currentOrigin = L.latLng(coords.latitude, coords.longitude);
            map.flyTo(currentOrigin, 16.5, { duration: 0.65 });
          },
          () => undefined,
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 },
        );
      });
      return button;
    };
    locationControl.addTo(map);

    const routeControl = L.control({ position: "topright" });
    routeControl.onAdd = () => {
      const controls = L.DomUtil.create("div", "route-builder-control");
      controls.style.cssText = "display:flex;gap:6px;margin:8px 14px 0 0;";
      const routeButton = L.DomUtil.create("button", "route-builder-button", controls) as HTMLButtonElement;
      routeButton.type = "button";
      routeButton.title = "Build a route";
      routeButton.setAttribute("aria-label", "Toggle route-building mode");
      routeButton.textContent = "A → B";
      routeButton.style.cssText = "height:34px;padding:0 11px;border:1px solid rgba(0,216,255,.55);border-radius:17px;background:rgba(12,14,16,.88);color:#00d8ff;font:700 11px/1 monospace;letter-spacing:.04em;cursor:pointer;box-shadow:0 0 16px rgba(0,216,255,.16);backdrop-filter:blur(10px);";
      const clearButton = L.DomUtil.create("button", "route-clear-button", controls) as HTMLButtonElement;
      clearButton.type = "button";
      clearButton.title = "Clear route";
      clearButton.setAttribute("aria-label", "Clear selected route");
      clearButton.textContent = "×";
      clearButton.style.cssText = "width:34px;height:34px;border:1px solid rgba(255,255,255,.22);border-radius:50%;background:rgba(12,14,16,.88);color:#fff;font:400 21px/1 sans-serif;cursor:pointer;backdrop-filter:blur(10px);";
      L.DomEvent.disableClickPropagation(controls);
      L.DomEvent.on(routeButton, "click", (event) => {
        L.DomEvent.stop(event);
        routeMode = !routeMode;
        routeButton.textContent = routeMode ? "SELECTING…" : "A → B";
        routeButton.style.background = routeMode ? "#00d8ff" : "rgba(12,14,16,.88)";
        routeButton.style.color = routeMode ? "#071014" : "#00d8ff";
      });
      L.DomEvent.on(clearButton, "click", (event) => {
        L.DomEvent.stop(event);
        clearRoute();
      });
      return controls;
    };
    routeControl.addTo(map);

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
        getTooltipContent(place, null),
        {
          direction: "top",
          offset: [0, -8],
          opacity: 1,
          className: "place-tooltip",
        },
      );
      placeMarkers.set(place.id, marker);
      marker.on("click", () => {
        if (routeMode) {
          addRoutePoint(place);
          return;
        }
        const origin = currentOrigin ? `&origin=${currentOrigin.lat},${currentOrigin.lng}` : "";
        const directionsUrl = `https://www.google.com/maps/dir/?api=1${origin}&destination=${place.lat},${place.lng}&travelmode=driving`;
        window.open(directionsUrl, "_blank", "noopener,noreferrer");
      });
    }

    map.setView([12.9342, 77.6125], 15.5, { animate: false });

    const updateDrivingTimes = async (origin: L.LatLng) => {
      const requestId = ++routeRequest;
      const coordinates = [
        [origin.lng, origin.lat],
        ...PLACES.map((place) => [place.lng, place.lat]),
      ]
        .map(([lng, lat]) => `${lng},${lat}`)
        .join(";");

      try {
        const response = await fetch(
          `https://router.project-osrm.org/table/v1/driving/${coordinates}?sources=0&annotations=duration,distance`,
        );
        if (!response.ok) return;

        const routes = (await response.json()) as {
          durations?: (number | null)[][];
          distances?: (number | null)[][];
        };
        if (requestId !== routeRequest) return;

        PLACES.forEach((place, index) => {
          const seconds = routes.durations?.[0]?.[index + 1];
          const meters = routes.distances?.[0]?.[index + 1];
          if (seconds == null || meters == null) return;

          placeMarkers.get(place.id)?.setTooltipContent(
            getTooltipContent(place, {
              minutes: Math.max(1, Math.round(seconds / 60)),
              km: (meters / 1000).toFixed(1),
            }),
          );
        });
      } catch {
        // Keep the location prompt visible if routing is temporarily unavailable.
      }
    };

    let userMarker: L.Marker | null = null;
    let accuracyCircle: L.Circle | null = null;
    const locationWatchId = navigator.geolocation
      ? navigator.geolocation.watchPosition(
          ({ coords }) => {
            const position = L.latLng(coords.latitude, coords.longitude);
            currentOrigin = position;
            if (!lastRouteOrigin || lastRouteOrigin.distanceTo(position) >= 100) {
              lastRouteOrigin = position;
              void updateDrivingTimes(position);
            }
            if (!userMarker) {
              userMarker = L.marker(position, {
                interactive: true,
                zIndexOffset: 1000,
                icon: L.divIcon({
                  className: "user-location-marker",
                  html: '<span class="user-location-pulse"></span><span class="user-location-core"></span>',
                  iconSize: [22, 22],
                  iconAnchor: [11, 11],
                }),
              })
                .addTo(map)
                .bindTooltip("YOU ARE HERE", {
                  direction: "top",
                  offset: [0, -10],
                  className: "place-tooltip user-location-tooltip",
                });
              accuracyCircle = L.circle(position, {
                radius: Math.min(coords.accuracy, 250),
                color: "#4285f4",
                weight: 1,
                opacity: 0.35,
                fillColor: "#4285f4",
                fillOpacity: 0.08,
                interactive: false,
              }).addTo(map);
            } else {
              userMarker.setLatLng(position);
              accuracyCircle?.setLatLng(position).setRadius(Math.min(coords.accuracy, 250));
            }
          },
          () => undefined,
          { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 },
        )
      : null;


    return () => {
      if (locationWatchId !== null) navigator.geolocation.clearWatch(locationWatchId);
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
