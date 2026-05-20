"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  assignStudentToVehicleAction,
  unassignVehicleStudentAction,
  reorderVehicleStudentsAction,
  updateVehicleStudentAction,
} from "@/app/actions/vehicle-students";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  SearchableEntitySelect,
  type SearchableOption,
} from "@/components/shared/searchable-entity-select";
import { StudentAssignmentStatusBadge } from "@/components/vehicle-students/student-assignment-status-badge";
import { VehicleStudentAssignmentsList } from "@/components/vehicle-students/vehicle-student-assignments-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { VehicleWithDetails } from "@school/types";
import type { VehicleStudentAssignment } from "@school/types";

type Props = {
  vehicle: VehicleWithDetails;
  studentOptions: SearchableOption[];
};

function actionErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  return "Ocurrió un error";
}

function OccupancyBar({ percent }: { percent: number }) {
  const tone =
    percent >= 100 ? "bg-red-500" : percent >= 80 ? "bg-amber-500" : "bg-indigo-500";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full transition-all ${tone}`}
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
}

export function VehicleStudentsManager({ vehicle, studentOptions }: Props) {
  const router = useRouter();
  // Sync local optimistic state with the prop without an effect — see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [assignments, setAssignments] = useState(vehicle.assignments);
  const [lastSyncedAssignments, setLastSyncedAssignments] = useState(vehicle.assignments);
  if (vehicle.assignments !== lastSyncedAssignments) {
    setLastSyncedAssignments(vehicle.assignments);
    setAssignments(vehicle.assignments);
  }

  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<VehicleStudentAssignment | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const selectableStudents = useMemo(
    () => studentOptions.filter((o) => !o.disabled),
    [studentOptions],
  );

  const atCapacity = assignments.length >= vehicle.capacity;

  async function handleAssign() {
    if (!studentId) {
      toast.error("Seleccione un estudiante");
      return;
    }
    if (atCapacity) {
      toast.error(`Capacidad alcanzada (${vehicle.capacity} asientos)`);
      return;
    }
    setLoading(true);
    const res = await assignStudentToVehicleAction({ vehicleId: vehicle.id, studentId });
    setLoading(false);
    if (!res.ok) {
      toast.error(actionErrorMessage(res.error));
      return;
    }
    toast.success("Estudiante asignado");
    setStudentId("");
    router.refresh();
  }

  async function saveSchedule(
    a: VehicleStudentAssignment,
    pickupTime: string,
    dropoffTime: string,
  ) {
    setLoading(true);
    const res = await updateVehicleStudentAction(a.id, vehicle.id, a.studentId, {
      pickupTime,
      dropoffTime,
    });
    setLoading(false);
    if (!res.ok) {
      toast.error(actionErrorMessage(res.error));
      return;
    }
    toast.success("Horario actualizado");
    router.refresh();
  }

  async function confirmUnassign() {
    if (!removeTarget) return;
    setLoading(true);
    const res = await unassignVehicleStudentAction(
      removeTarget.id,
      vehicle.id,
      removeTarget.studentId,
    );
    setLoading(false);
    setRemoveTarget(null);
    if (!res.ok) {
      toast.error(actionErrorMessage(res.error));
      return;
    }
    toast.success("Asignación finalizada");
    router.refresh();
  }

  function onDragStart(id: string) {
    setDragId(id);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const ids = assignments.map((a) => a.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;

    const next = [...ids];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    setAssignments((prev) => {
      const map = new Map(prev.map((a) => [a.id, a]));
      return next.map((id, i) => ({ ...map.get(id)!, pickupOrder: i + 1 }));
    });

    setLoading(true);
    const res = await reorderVehicleStudentsAction({
      vehicleId: vehicle.id,
      orderedAssignmentIds: next,
    });
    setLoading(false);
    setDragId(null);
    if (!res.ok) {
      toast.error(actionErrorMessage(res.error));
      router.refresh();
      return;
    }
    toast.success("Orden de recogida actualizado");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-slate-900">Asignar estudiante</h3>
            <p className="text-sm text-slate-500">
              {assignments.length}/{vehicle.capacity} asientos ({vehicle.occupancyPercent}%
              ocupación)
            </p>
          </div>
        </div>
        <OccupancyBar percent={vehicle.occupancyPercent} />
        <SearchableEntitySelect
          id="studentId"
          label="Estudiante"
          placeholder="Buscar por nombre o grado…"
          options={studentOptions}
          value={studentId}
          onChange={setStudentId}
          disabled={atCapacity}
        />
        {selectableStudents.length === 0 ? (
          <p className="text-sm text-amber-700">
            No hay estudiantes disponibles. Solo se muestran estudiantes activos sin otro vehículo
            asignado.
          </p>
        ) : (
          <p className="text-xs text-slate-500">
            Solo estudiantes activos sin asignación activa en otro vehículo. Los no disponibles
            aparecen deshabilitados.
          </p>
        )}
        <Button
          type="button"
          onClick={() => void handleAssign()}
          disabled={loading || atCapacity || !studentId}
        >
          {loading ? <Spinner tone="onPrimary" /> : "Asignar al vehículo"}
        </Button>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold text-slate-900">Ruta diaria — orden de recogida</h3>
        {assignments.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Sin estudiantes asignados</p>
        ) : (
          <ul className="space-y-3">
            {assignments.map((a) => (
              <li
                key={a.id}
                draggable
                onDragStart={() => onDragStart(a.id)}
                onDragOver={onDragOver}
                onDrop={() => void onDrop(a.id)}
                className="cursor-grab rounded-xl border border-slate-200 bg-slate-50/80 p-4 active:cursor-grabbing"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-indigo-600">
                      Orden #{a.pickupOrder}
                    </p>
                    <p className="font-medium text-slate-900">
                      {a.student?.fullName ?? a.studentId}
                    </p>
                    <p className="text-sm text-slate-500">
                      {a.student?.grade ?? "—"} · {a.student?.address ?? ""}
                    </p>
                    <div className="mt-2">
                      <StudentAssignmentStatusBadge assignment={a} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <label className="text-xs text-slate-500">
                      Recogida
                      <Input
                        type="time"
                        defaultValue={a.pickupTime}
                        className="mt-1"
                        onBlur={(e) => void saveSchedule(a, e.target.value, a.dropoffTime)}
                      />
                    </label>
                    <label className="text-xs text-slate-500">
                      Entrega
                      <Input
                        type="time"
                        defaultValue={a.dropoffTime}
                        className="mt-1"
                        onBlur={(e) => void saveSchedule(a, a.pickupTime, e.target.value)}
                      />
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => setRemoveTarget(a)}
                    >
                      Quitar
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {vehicle.studentAssignmentHistory.length > assignments.length ? (
        <>
          <h2 className="text-lg font-semibold text-slate-900">Historial de asignaciones</h2>
          <VehicleStudentAssignmentsList
            assignments={vehicle.studentAssignmentHistory}
            showVehicle={false}
            showStudent
            emptyTitle="Sin historial"
          />
        </>
      ) : null}

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="Finalizar asignación"
        description="La asignación se marcará como inactiva y se conservará en el historial. ¿Continuar?"
        confirmLabel="Finalizar"
        variant="danger"
        loading={loading}
        onConfirm={() => void confirmUnassign()}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
