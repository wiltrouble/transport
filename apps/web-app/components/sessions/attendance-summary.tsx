import { Card } from "@/components/ui/card";

type AttendanceSummaryProps = {
  total: number;
  boarded: number;
  droppedOff: number;
  absent: number;
  pending: number;
};

export function AttendanceSummary({
  total,
  boarded,
  droppedOff,
  absent,
  pending,
}: AttendanceSummaryProps) {
  const items = [
    { label: "Total", value: total },
    { label: "Abordaron", value: boarded },
    { label: "Entregados", value: droppedOff },
    { label: "Ausentes", value: absent },
    { label: "Pendientes", value: pending },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label} className="p-4">
          <p className="text-xs font-medium uppercase text-slate-500">{item.label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}
