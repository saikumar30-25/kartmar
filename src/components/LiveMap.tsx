import { useEffect, useRef, useState } from "react";

export type MapPin = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  kind: "farmer" | "buyer" | "partner" | "pickup" | "drop";
};

const PIN_COLORS: Record<MapPin["kind"], string> = {
  farmer: "#166534",
  buyer: "#c2410c",
  partner: "#1d4ed8",
  pickup: "#4d7c0f",
  drop: "#9333ea",
};

let scriptPromise: Promise<void> | null = null;

function loadMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  const w = window as any;
  if (w.google?.maps?.Map) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  const key = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"];
  const channel = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] ?? "";
  if (!key) return Promise.reject(new Error("Map key missing"));

  scriptPromise = new Promise<void>((resolve, reject) => {
    w.__kartmarMapReady = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__kartmarMapReady${
      channel ? `&channel=${channel}` : ""
    }`;
    s.async = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/** Live Google map with one coloured marker per participant. Client-only. */
export function LiveMap({
  pins,
  height = 320,
  className = "",
}: {
  pins: MapPin[];
  height?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadMaps()
      .then(() => {
        if (cancelled || !ref.current) return;
        const g = (window as any).google;
        mapRef.current = new g.maps.Map(ref.current, {
          center: { lat: pins[0]?.lat ?? 20.5937, lng: pins[0]?.lng ?? 78.9629 },
          zoom: pins.length ? 11 : 5,
          mapTypeControl: false,
          streetViewControl: false,
        });
        setReady(true);
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const g = (window as any).google;
    const seen = new Set<string>();

    for (const p of pins) {
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue;
      seen.add(p.id);
      const pos = { lat: p.lat, lng: p.lng };
      const existing = markersRef.current.get(p.id);
      if (existing) {
        existing.setPosition(pos);
        existing.setTitle(p.label);
      } else {
        markersRef.current.set(
          p.id,
          new g.maps.Marker({
            map: mapRef.current,
            position: pos,
            title: p.label,
            label: { text: p.label.slice(0, 1).toUpperCase(), color: "#ffffff", fontWeight: "700" },
            icon: {
              path: g.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: PIN_COLORS[p.kind],
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          }),
        );
      }
    }

    for (const [id, marker] of markersRef.current) {
      if (!seen.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    }

    const valid = pins.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    if (valid.length === 1) {
      mapRef.current.setCenter({ lat: valid[0]!.lat, lng: valid[0]!.lng });
      if (mapRef.current.getZoom() < 11) mapRef.current.setZoom(13);
    } else if (valid.length > 1) {
      const bounds = new g.maps.LatLngBounds();
      valid.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
      mapRef.current.fitBounds(bounds, 60);
    }
  }, [pins, ready]);

  if (error) {
    return (
      <div
        className={`grid place-items-center rounded-2xl bg-brand-cream ring-1 ring-border text-xs text-muted-foreground ${className}`}
        style={{ height }}
      >
        Map unavailable — {error}
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden ring-1 ring-border ${className}`} style={{ height }}>
      <div ref={ref} className="absolute inset-0" />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-brand-cream text-xs text-muted-foreground">
          Loading map…
        </div>
      )}
    </div>
  );
}

export function pinLegend(kind: MapPin["kind"]) {
  return PIN_COLORS[kind];
}
