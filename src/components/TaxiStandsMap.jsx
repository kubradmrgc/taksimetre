import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function standIcon(active) {
  const bg = active ? "#f5c400" : "#14151a";
  const fg = active ? "#14151a" : "#f5c400";
  return L.divIcon({
    className: "taksimetre-map-pin",
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:28px;height:28px;border-radius:9999px;
      background:${bg};color:${fg};font:700 11px/1 Outfit,sans-serif;
      border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);
    ">T</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function popupHtml(stand) {
  const phone = stand.phone
    ? `<a href="${stand.telHref}" style="color:#c9a000;font-weight:600;text-decoration:none">${stand.phone}</a>`
    : "<span style='opacity:.7'>Telefon yok</span>";
  const dist = stand.distanceLabel
    ? `<div style="opacity:.7;font-size:11px;margin-top:2px">${stand.distanceLabel}</div>`
    : "";
  const call = stand.telHref
    ? `<div style="margin-top:8px"><a href="${stand.telHref}" style="display:inline-block;background:#f5c400;color:#14151a;font-weight:700;font-size:12px;padding:6px 10px;border-radius:10px;text-decoration:none">Ara</a></div>`
    : "";
  return `<div style="min-width:140px;font:500 13px/1.35 Outfit,sans-serif;color:#14151a">
    <strong>${stand.name}</strong>
    ${dist}
    <div style="margin-top:4px">${phone}</div>
    ${call}
  </div>`;
}

/**
 * Filtrelenmiş taksi duraklarını Leaflet haritasında gösterir.
 * Marker tıklanınca onSelect(stand) çağrılır.
 */
export function TaxiStandsMap({
  stands = [],
  selectedId = null,
  center = null,
  onSelect,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const markersRef = useRef(new Map());
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const mappable = useMemo(
    () =>
      stands.filter(
        (stand) => Number.isFinite(stand.lat) && Number.isFinite(stand.lon),
      ),
    [stands],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const start = center
      ? [center.lat, center.lon]
      : [41.0082, 28.9784];

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(start, 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const resize = () => map.invalidateSize();
    const timer = setTimeout(resize, 80);
    window.addEventListener("resize", resize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", resize);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      markersRef.current = new Map();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    markersRef.current = new Map();

    if (mappable.length === 0) {
      if (center?.lat && center?.lon) {
        map.setView([center.lat, center.lon], 12);
      }
      return;
    }

    const bounds = L.latLngBounds([]);

    for (const stand of mappable) {
      const active = stand.id === selectedId;
      const marker = L.marker([stand.lat, stand.lon], {
        icon: standIcon(active),
        title: stand.name,
      });

      marker.bindPopup(popupHtml(stand), { maxWidth: 220 });
      marker.on("click", () => {
        onSelectRef.current?.(stand);
      });

      marker.addTo(layer);
      markersRef.current.set(stand.id, marker);
      bounds.extend([stand.lat, stand.lon]);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.2));
    }
  }, [mappable, selectedId, center?.lat, center?.lon]);

  // Seçili marker'ı öne al / popup aç
  useEffect(() => {
    if (!selectedId) return;
    const marker = markersRef.current.get(selectedId);
    if (marker) {
      marker.setIcon(standIcon(true));
      marker.openPopup();
    }
  }, [selectedId, mappable]);

  if (mappable.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-300/70 px-4 py-3 text-sm text-stone-500 dark:border-white/10 dark:text-stone-400">
        Haritada gösterilecek konumlu durak yok. İlçe seçin veya konumu
        yenileyin.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-ink dark:text-stone-200">
            Durak haritası
          </p>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            {mappable.length} konumlu durak · işarete tıklayınca listede
            vurgulanır.
          </p>
        </div>
      </div>
      <div
        ref={containerRef}
        className="mt-2 h-56 w-full overflow-hidden rounded-2xl border border-stone-300/80 dark:border-white/10 sm:h-72"
      />
    </div>
  );
}
