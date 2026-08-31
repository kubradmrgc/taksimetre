import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function makePinIcon(letter, color) {
  return L.divIcon({
    className: "taksimetre-map-pin",
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:32px;height:32px;border-radius:9999px;
      background:${color};color:#14151a;font:700 14px/1 Outfit,sans-serif;
      border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);
    ">${letter}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

const ORIGIN_ICON = makePinIcon("A", "#f5c400");
const DEST_ICON = makePinIcon("B", "#ece8df");


function toLatLngs(polyline) {
  if (!Array.isArray(polyline) || polyline.length === 0) return [];
  return polyline
    .map((pair) => {
      const lon = Number(pair?.[0]);
      const lat = Number(pair?.[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      return [lat, lon];
    })
    .filter(Boolean);
}


export function RouteMap({
  origin,
  destination,
  polyline = null,
  onOriginChange,
  onDestinationChange,
  disabled = false,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const originMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const callbacksRef = useRef({ onOriginChange, onDestinationChange, disabled });

  useEffect(() => {
    callbacksRef.current = { onOriginChange, onDestinationChange, disabled };
  }, [onOriginChange, onDestinationChange, disabled]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const center = origin
      ? [origin.lat, origin.lon]
      : [41.0082, 28.9784];

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(center, 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    map.on("click", (event) => {
      const { disabled: isDisabled, onDestinationChange: setDest } =
        callbacksRef.current;
      if (isDisabled || !setDest) return;
      setDest({
        id: `map-${event.latlng.lat.toFixed(5)}-${event.latlng.lng.toFixed(5)}`,
        label: `Harita noktası (${event.latlng.lat.toFixed(4)}, ${event.latlng.lng.toFixed(4)})`,
        lat: event.latlng.lat,
        lon: event.latlng.lng,
      });
    });

    mapRef.current = map;

    const resize = () => map.invalidateSize();
    const timer = setTimeout(resize, 80);
    window.addEventListener("resize", resize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", resize);
      map.remove();
      mapRef.current = null;
      originMarkerRef.current = null;
      destMarkerRef.current = null;
      routeLineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !origin) return;

    if (!originMarkerRef.current) {
      const marker = L.marker([origin.lat, origin.lon], {
        icon: ORIGIN_ICON,
        draggable: !disabled,
        title: "Başlangıç (A)",
      }).addTo(map);

      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        callbacksRef.current.onOriginChange?.({
          id: "origin-map",
          label: `Başlangıç (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          lat,
          lon: lng,
        });
      });

      originMarkerRef.current = marker;
    } else {
      const marker = originMarkerRef.current;
      const current = marker.getLatLng();
      if (
        Math.abs(current.lat - origin.lat) > 1e-6 ||
        Math.abs(current.lng - origin.lon) > 1e-6
      ) {
        marker.setLatLng([origin.lat, origin.lon]);
      }
      if (marker.dragging) {
        if (disabled) marker.dragging.disable();
        else marker.dragging.enable();
      }
    }
  }, [origin, disabled]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!destination) {
      if (destMarkerRef.current) {
        destMarkerRef.current.remove();
        destMarkerRef.current = null;
      }
      return;
    }

    if (!destMarkerRef.current) {
      const marker = L.marker([destination.lat, destination.lon], {
        icon: DEST_ICON,
        draggable: !disabled,
        title: "Varış (B)",
      }).addTo(map);

      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        callbacksRef.current.onDestinationChange?.({
          id: `map-${lat.toFixed(5)}-${lng.toFixed(5)}`,
          label: `Harita noktası (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          lat,
          lon: lng,
        });
      });

      destMarkerRef.current = marker;
    } else {
      const marker = destMarkerRef.current;
      const current = marker.getLatLng();
      if (
        Math.abs(current.lat - destination.lat) > 1e-6 ||
        Math.abs(current.lng - destination.lon) > 1e-6
      ) {
        marker.setLatLng([destination.lat, destination.lon]);
      }
      if (marker.dragging) {
        if (disabled) marker.dragging.disable();
        else marker.dragging.enable();
      }
    }
  }, [destination, disabled]);

  // OSRM sürüş rotası çizgisi
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const latLngs = toLatLngs(polyline);

    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    if (latLngs.length < 2) {
      // Çizgi yoksa en azından pinlere sığdır
      if (origin && destination) {
        map.fitBounds(
          L.latLngBounds(
            [origin.lat, origin.lon],
            [destination.lat, destination.lon],
          ).pad(0.2),
        );
      }
      return;
    }

    const line = L.polyline(latLngs, {
      color: "#f5c400",
      weight: 5,
      opacity: 0.92,
      lineJoin: "round",
      lineCap: "round",
    }).addTo(map);

    routeLineRef.current = line;
    map.fitBounds(line.getBounds().pad(0.15));
  }, [polyline, origin?.lat, origin?.lon, destination?.lat, destination?.lon]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !origin) return;
    // Polyline varken fitBounds orada yapılıyor; yoksa merkeze al
    if (toLatLngs(polyline).length >= 2) return;
    if (!destination) {
      map.setView([origin.lat, origin.lon], map.getZoom() || 12);
    }
  }, [origin?.lat, origin?.lon, destination, polyline]);

  const hasRoute = toLatLngs(polyline).length >= 2;

  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-ink dark:text-stone-200">
            Rota haritası
          </p>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            {hasRoute
              ? "Sarı çizgi tahmini sürüş rotasıdır (OSRM)."
              : "A başlangıç, B varış — pinleri sürükleyin veya haritaya tıklayın."}
          </p>
        </div>
      </div>
      <div
        ref={containerRef}
        className="mt-2 h-64 w-full overflow-hidden rounded-2xl border border-stone-300/80 dark:border-white/10 sm:h-80"
      />
    </div>
  );
}
