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
