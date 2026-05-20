import type { LiveMapSummary } from "@/services/liveMapService";
import { Activity, Bus, MapPin, Radio } from "lucide-react";

type LiveMapSummaryCardsProps = {
  summary: LiveMapSummary;
  connected: boolean;
};

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: typeof MapPin;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3">
        <span
          className={`flex size-10 items-center justify-center rounded-xl ${accent}`}
          aria-hidden
        >
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function LiveMapSummaryCards({ summary, connected }: LiveMapSummaryCardsProps) {
  const lastUpdate = summary.lastGpsUpdate
    ? new Date(summary.lastGpsUpdate).toLocaleTimeString("es", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

  return (
    <div className="pointer-events-none absolute left-4 right-4 top-4 z-10 flex flex-col gap-3 lg:left-auto lg:right-4 lg:max-w-md">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
        <SummaryCard
          label="Sesiones activas"
          value={summary.activeSessions}
          icon={Bus}
          accent="bg-indigo-100 text-indigo-700"
        />
        <SummaryCard
          label="Vehículos activos"
          value={summary.activeVehicles}
          icon={MapPin}
          accent="bg-sky-100 text-sky-700"
        />
        <SummaryCard
          label="Rastreando ahora"
          value={summary.trackingVehicles}
          icon={Radio}
          accent="bg-emerald-100 text-emerald-700"
        />
        <SummaryCard
          label="Último GPS"
          value={lastUpdate}
          icon={Activity}
          accent="bg-amber-100 text-amber-800"
        />
      </div>
      <span
        className={`pointer-events-auto self-start rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
          connected ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
        }`}
      >
        {connected ? "Realtime conectado" : "Conectando realtime…"}
      </span>
    </div>
  );
}
