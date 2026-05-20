"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateVehicleAssignmentsAction } from "@/app/actions/vehicles";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FormField } from "@/components/shared/form-field";
import {
  SearchableEntitySelect,
  type SearchableOption,
} from "@/components/shared/searchable-entity-select";
import { StatusFormField } from "@/components/shared/status-form-field";
import { VehicleDriverAssignmentsList } from "@/components/vehicle-drivers/vehicle-driver-assignments-list";
import { VehicleStudentAssignmentsList } from "@/components/vehicle-students/vehicle-student-assignments-list";
import { VehicleStudentsManager } from "@/components/vehicles/vehicle-students-manager";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  isActiveVehicleStudentAssignment,
  type VehicleWithDetails,
} from "@school/types";
import {
  vehicleEditSchema,
  type VehicleEditValues,
} from "@school/validations";

type Props = {
  vehicle: VehicleWithDetails;
  driverOptions: SearchableOption[];
  studentOptions: SearchableOption[];
  initialDriverId: string;
};

export function VehicleEditPanels({
  vehicle,
  driverOptions,
  studentOptions,
  initialDriverId,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [pendingValues, setPendingValues] = useState<VehicleEditValues | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VehicleEditValues>({
    resolver: zodResolver(vehicleEditSchema),
    defaultValues: {
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      capacity: vehicle.capacity,
      color: vehicle.color,
      year: vehicle.year,
      status: vehicle.status,
      driverId: initialDriverId,
    },
  });

  const selectableDrivers = useMemo(
    () => driverOptions.filter((o) => !o.disabled || o.id === initialDriverId),
    [driverOptions, initialDriverId],
  );

  async function submitValues(values: VehicleEditValues) {
    setSubmitting(true);
    const res = await updateVehicleAssignmentsAction(vehicle.id, values);
    setSubmitting(false);
    if (!res.ok) {
      const err = res.error;
      const formErr =
        err && typeof err === "object" && "_form" in err && Array.isArray(err._form)
          ? err._form[0]
          : null;
      toast.error(formErr ?? "Revise los campos del formulario");
      return;
    }
    toast.success("Cambios guardados");
    router.push(`/dashboard/vehicles/${vehicle.id}`);
    router.refresh();
  }

  function onSubmit(values: VehicleEditValues) {
    const driverChanged = initialDriverId && values.driverId !== initialDriverId;
    if (driverChanged) {
      setPendingValues(values);
      return;
    }
    void submitValues(values);
  }

  const inactiveStudentHistory = vehicle.studentAssignmentHistory.filter(
    (a) => !isActiveVehicleStudentAssignment(a),
  );

  return (
    <div className="space-y-8">
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              Información y conductor
            </h2>
            <p className="text-sm text-slate-500">
              El historial de conductores se conserva al reemplazar.
            </p>
          </div>

          <Controller
            control={control}
            name="driverId"
            render={({ field }) => (
              <SearchableEntitySelect
                id="driverId"
                label="Conductor asignado"
                placeholder="Buscar por nombre o licencia…"
                options={driverOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.driverId?.message}
              />
            )}
          />
          {selectableDrivers.length === 0 ? (
            <p className="text-sm text-amber-700">
              No hay conductores disponibles. Registre un conductor activo sin vehículo asignado.
            </p>
          ) : null}

          <hr className="border-slate-100" />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Placa" htmlFor="plate" error={errors.plate?.message}>
              <Input id="plate" {...register("plate")} className="uppercase" />
            </FormField>
            <FormField label="Color" htmlFor="color" error={errors.color?.message}>
              <Input id="color" {...register("color")} />
            </FormField>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <FormField label="Marca" htmlFor="brand" error={errors.brand?.message}>
              <Input id="brand" {...register("brand")} />
            </FormField>
            <FormField label="Modelo" htmlFor="model" error={errors.model?.message}>
              <Input id="model" {...register("model")} />
            </FormField>
            <FormField label="Año" htmlFor="year" error={errors.year?.message}>
              <Input id="year" type="number" {...register("year")} />
            </FormField>
          </div>
          <FormField
            label="Capacidad"
            htmlFor="capacity"
            error={errors.capacity?.message}
            hint="Número máximo de estudiantes"
          >
            <Input id="capacity" type="number" min={1} {...register("capacity")} />
          </FormField>
          <StatusFormField
            id="status"
            name="status"
            register={register}
            watch={watch}
            setValue={setValue}
            error={errors.status?.message}
          />

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={submitting || selectableDrivers.length === 0}>
              {submitting ? (
                <>
                  <Spinner tone="onPrimary" />
                  Guardando…
                </>
              ) : (
                "Guardar información"
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(`/dashboard/vehicles/${vehicle.id}`)}
              disabled={submitting}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Estudiantes y ruta diaria
          </h2>
          <p className="text-sm text-slate-500">
            Agregue, quite o reordene estudiantes. Las acciones se aplican al instante.
          </p>
        </div>
        <VehicleStudentsManager vehicle={vehicle} studentOptions={studentOptions} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Historial de conductores</h2>
        <VehicleDriverAssignmentsList
          assignments={vehicle.driverAssignmentHistory}
          showDriver
          emptyTitle="Sin historial de conductores"
          emptyDescription="Los reemplazos quedarán registrados aquí."
        />
      </section>

      {inactiveStudentHistory.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Historial de estudiantes
          </h2>
          <VehicleStudentAssignmentsList
            assignments={inactiveStudentHistory}
            showVehicle={false}
            showStudent
            emptyTitle="Sin historial"
          />
        </section>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingValues)}
        title="Reemplazar conductor"
        description="La asignación anterior se marcará como inactiva y se conservará en el historial. ¿Desea continuar?"
        confirmLabel="Reemplazar"
        loading={submitting}
        onConfirm={() => {
          const values = pendingValues;
          setPendingValues(null);
          if (values) void submitValues(values);
        }}
        onCancel={() => setPendingValues(null)}
      />
    </div>
  );
}
