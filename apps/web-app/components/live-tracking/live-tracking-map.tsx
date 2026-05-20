"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import type { LiveVehicleTracking } from "@school/types";
import { TrackingStatusBadge } from "@/components/live-tracking/tracking-status-badge";

const DEFAULT_CENTER = { latitude: 14.6349, longitude: -90.5069 };

const markerColor: Record<string, string> = {
  tracking: "#16a34a",
  online: "#2563eb",
  offline: "#dc2626",
  inactive: "#94a3b8",
};

type LiveTrackingMapProps = {
  vehicles: LiveVehicleTracking[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
};

export function LiveTrackingMap({
  vehicles,
  selectedSessionId,
  onSelectSession,
}: LiveTrackingMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [popupSessionId, setPopupSessionId] = useState<string | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  const markers = useMemo(
    () =>
      vehicles.filter(
        (v) => v.latestPoint && Number.isFinite(v.latestPoint.latitude),
      ),
    [vehicles],
  );

  const initialView = useMemo(() => {
    const focus =
      markers.find((m) => m.transportSessionId === selectedSessionId) ?? markers[0];
    if (focus?.latestPoint) {
      return {
        latitude: focus.latestPoint.latitude,
        longitude: focus.latestPoint.longitude,
        zoom: 14,
      };
    }
    return { ...DEFAULT_CENTER, zoom: 11 };
  }, [markers, selectedSessionId]);

  useEffect(() => {
    const focus = markers.find((m) => m.transportSessionId === selectedSessionId);
    if (!focus?.latestPoint || !mapRef.current) return;
    mapRef.current.easeTo({
      center: [focus.latestPoint.longitude, focus.latestPoint.latitude],
      duration: 800,
    });
  }, [markers, selectedSessionId]);

  if (!token) {
    return (
      <div className="flex h-full min-h-[420px] flex-1 items-center justify-center bg-slate-100 p-6 text-center text-sm text-slate-600">
        Configure <code className="mx-1 rounded bg-white px-1">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code>{" "}
        en <code className="mx-1 rounded bg-white px-1">.env.local</code> para ver el mapa en vivo.
      </div>
    );
  }

  const popupVehicle =
    vehicles.find((v) => v.transportSessionId === popupSessionId) ??
    vehicles.find((v) => v.transportSessionId === selectedSessionId);

  return (
    <div className="relative h-full min-h-[420px] flex-1">
      <Map
        ref={mapRef}
        mapboxAccessToken={token}
        initialViewState={{
          ...initialView,
          bearing: 0,
          pitch: 0,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        reuseMaps
      >
        {markers.map((vehicle) => {
          const point = vehicle.latestPoint!;
          const selected = vehicle.transportSessionId === selectedSessionId;
          return (
            <Marker
              key={vehicle.transportSessionId}
              latitude={point.latitude}
              longitude={point.longitude}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                onSelectSession(vehicle.transportSessionId);
                setPopupSessionId(vehicle.transportSessionId);
              }}
            >
              <button
                type="button"
                aria-label={`Vehículo ${vehicle.vehiclePlate}`}
                className="flex size-9 items-center justify-center rounded-full border-2 border-white shadow-lg transition-all duration-500 ease-out hover:scale-110"
                style={{
                  backgroundColor: markerColor[vehicle.status] ?? "#2563eb",
                  boxShadow: selected ? "0 0 0 3px rgba(99,102,241,0.6)" : undefined,
                  transform: selected ? "scale(1.1)" : undefined,
                }}
              >
                <span className="text-[10px] font-bold text-white">
                  {vehicle.vehiclePlate.slice(-2)}
                </span>
              </button>
            </Marker>
          );
        })}

        {popupVehicle?.latestPoint ? (
          <Popup
            latitude={popupVehicle.latestPoint.latitude}
            longitude={popupVehicle.latestPoint.longitude}
            anchor="top"
            onClose={() => setPopupSessionId(null)}
            closeOnClick={false}
          >
            <div className="min-w-[220px] space-y-2 p-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{popupVehicle.vehiclePlate}</p>
                  <p className="text-xs text-slate-600">{popupVehicle.driverName}</p>
                </div>
                <TrackingStatusBadge status={popupVehicle.status} />
              </div>
              <p className="text-xs text-slate-500">
                Sesión {popupVehicle.sessionStatus} · {popupVehicle.studentCount} estudiantes
              </p>
              <p className="text-xs text-slate-500">
                {(popupVehicle.latestPoint.speed * 3.6).toFixed(1)} km/h ·{" "}
                {new Date(popupVehicle.latestPoint.trackedAt).toLocaleString()}
              </p>
            </div>
          </Popup>
        ) : null}
      </Map>
    </div>
  );
}
