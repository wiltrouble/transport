import { LiveTrackingView } from "@/components/live-tracking/live-tracking-view";
import { getLiveTrackingSnapshot } from "@/services/gpsService";

export const dynamic = "force-dynamic";

export default async function LiveMapPage() {
  const initialVehicles = await getLiveTrackingSnapshot();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mapa en vivo</h1>
        <p className="mt-1 text-sm text-slate-600">
          Monitoreo operativo de vehículos con sesión activa · actualización en tiempo real.
        </p>
      </div>
      <LiveTrackingView initialVehicles={initialVehicles} />
    </div>
  );
}
