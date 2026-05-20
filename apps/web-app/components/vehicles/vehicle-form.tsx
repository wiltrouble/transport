"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createVehicleAction, updateVehicleAction } from "@/app/actions/vehicles";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FormField } from "@/components/shared/form-field";
import { StatusFormField } from "@/components/shared/status-form-field";
import {
  SearchableEntitySelect,
  type SearchableOption,
} from "@/components/vehicle-drivers/searchable-entity-select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { Vehicle } from "@school/types";
import { vehicleFormSchema, type VehicleFormValues } from "@school/validations";

type VehicleFormProps = {
  mode: "create" | "edit";
  vehicle?: Vehicle;
  driverOptions: SearchableOption[];
  initialDriverId?: string;
};

export function VehicleForm({
  mode,
  vehicle,
  driverOptions,
  initialDriverId = "",
}: VehicleFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [pendingValues, setPendingValues] = useState<VehicleFormValues | null>(null);

  const selectableDrivers = useMemo(
    () => driverOptions.filter((o) => !o.disabled || o.id === initialDriverId),
    [driverOptions, initialDriverId],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: vehicle
      ? {
          plate: vehicle.plate,
          brand: vehicle.brand,
          model: vehicle.model,
          capacity: vehicle.capacity,
          color: vehicle.color,
          year: vehicle.year,
          status: vehicle.status,
          driverId: initialDriverId,
        }
      : {
          plate: "",
          brand: "",
          model: "",
          capacity: 20,
          color: "",
          year: new Date().getFullYear(),
          status: true,
          driverId: "",
        },
  });

  const driverId = watch("driverId");

  async function submitValues(values: VehicleFormValues) {
    setSubmitting(true);
    const result =
      mode === "create"
        ? await createVehicleAction(values)
        : await updateVehicleAction(vehicle!.id, values);
    setSubmitting(false);

    if (!result.ok) {
      const err = result.error;
      const formErr =
        err && "_form" in err && Array.isArray(err._form) ? err._form[0] : null;
      toast.error(formErr || "Revise los campos del formulario");
      return;
    }

    toast.success(mode === "create" ? "Vehículo y conductor asignados" : "Cambios guardados");
    const targetId = mode === "create" && "id" in result ? result.id : vehicle!.id;
    router.push(`/dashboard/vehicles/${targetId}`);
    router.refresh();
  }

  function onSubmit(values: VehicleFormValues) {
    const driverChanged =
      mode === "edit" && initialDriverId && values.driverId !== initialDriverId;

    if (driverChanged) {
      setPendingValues(values);
      setConfirmReplace(true);
      return;
    }

    void submitValues(values);
  }

  return (
    <>
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <SearchableEntitySelect
            id="driverId"
            label="Conductor asignado"
            placeholder="Buscar por nombre o licencia…"
            options={driverOptions}
            value={driverId}
            onChange={(id) => setValue("driverId", id, { shouldValidate: true })}
            error={errors.driverId?.message}
          />
          {selectableDrivers.length === 0 ? (
            <p className="text-sm text-amber-700">
              No hay conductores disponibles. Registre un conductor activo sin vehículo asignado.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Solo conductores activos sin otro vehículo asignado. Los no disponibles aparecen
              deshabilitados.
            </p>
          )}

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
              ) : mode === "create" ? (
                "Crear vehículo"
              ) : (
                "Guardar cambios"
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>

      <ConfirmDialog
        open={confirmReplace}
        title="Reemplazar conductor"
        description="La asignación anterior se marcará como inactiva y se conservará en el historial. ¿Desea continuar?"
        confirmLabel="Reemplazar"
        loading={submitting}
        onConfirm={() => {
          setConfirmReplace(false);
          if (pendingValues) void submitValues(pendingValues);
        }}
        onCancel={() => {
          setConfirmReplace(false);
          setPendingValues(null);
        }}
      />
    </>
  );
}
