"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { assignVehicleDriverAction } from "@/app/actions/vehicle-drivers";
import { FormField } from "@/components/shared/form-field";
import {
  SearchableEntitySelect,
  type SearchableOption,
} from "@/components/vehicle-drivers/searchable-entity-select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { Vehicle } from "@school/types";
import {
  assignVehicleDriverSchema,
  type AssignVehicleDriverValues,
} from "@school/validations";

type AssignVehicleDriverFormProps = {
  vehicles: Vehicle[];
  driverOptions: SearchableOption[];
  defaultVehicleId?: string;
  defaultDriverId?: string;
};

function toDatetimeLocalValue(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function datetimeLocalToIso(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Fecha de asignación no válida");
  }
  return d.toISOString();
}

export function AssignVehicleDriverForm({
  vehicles,
  driverOptions,
  defaultVehicleId,
  defaultDriverId,
}: AssignVehicleDriverFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const vehicleOptions = useMemo(
    () =>
      vehicles.map((v) => ({
        id: v.id,
        label: v.plate,
        hint: `${v.brand} ${v.model}`,
      })),
    [vehicles],
  );

  const selectableDrivers = useMemo(
    () => driverOptions.filter((o) => !o.disabled || o.id === defaultDriverId),
    [driverOptions, defaultDriverId],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AssignVehicleDriverValues>({
    resolver: zodResolver(assignVehicleDriverSchema),
    defaultValues: {
      vehicleId: defaultVehicleId ?? "",
      driverId: defaultDriverId ?? "",
      assignedAt: toDatetimeLocalValue(),
      isPrimary: true,
      status: true,
    },
  });

  const vehicleId = watch("vehicleId");
  const driverId = watch("driverId");

  useEffect(() => {
    if (defaultVehicleId) {
      setValue("vehicleId", defaultVehicleId);
    }
    if (defaultDriverId) {
      setValue("driverId", defaultDriverId);
    }
  }, [defaultVehicleId, defaultDriverId, setValue]);

  async function onSubmit(values: AssignVehicleDriverValues) {
    setSubmitting(true);
    try {
      const res = await assignVehicleDriverAction({
        ...values,
        assignedAt: datetimeLocalToIso(values.assignedAt),
      });
      setSubmitting(false);
      if (!res.ok) {
        const err = res.error;
        toast.error(typeof err === "string" ? err : "Revise los campos del formulario");
        return;
      }
      toast.success("Conductor asignado al vehículo");
      router.refresh();
    } catch (e) {
      setSubmitting(false);
      toast.error((e as Error).message);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {!defaultVehicleId ? (
          <SearchableEntitySelect
            id="vehicleId"
            label="Vehículo"
            placeholder="Buscar por placa o modelo…"
            options={vehicleOptions}
            value={vehicleId}
            onChange={(id) => setValue("vehicleId", id, { shouldValidate: true })}
            error={errors.vehicleId?.message}
          />
        ) : null}

        {!defaultDriverId ? (
          <SearchableEntitySelect
            id="driverId"
            label="Conductor"
            placeholder="Buscar por nombre o licencia…"
            options={driverOptions}
            value={driverId}
            onChange={(id) => setValue("driverId", id, { shouldValidate: true })}
            error={errors.driverId?.message}
          />
        ) : null}

        <FormField label="Fecha de asignación" htmlFor="assignedAt" error={errors.assignedAt?.message}>
          <Input id="assignedAt" type="datetime-local" {...register("assignedAt")} />
        </FormField>

        <p className="text-xs text-slate-500">
          Solo conductores activos sin otro vehículo asignado. Si el vehículo ya tiene conductor,
          se reemplazará y el anterior quedará en el historial.
        </p>

        <Button type="submit" disabled={submitting || selectableDrivers.length === 0}>
          {submitting ? (
            <>
              <Spinner tone="onPrimary" />
              Asignando…
            </>
          ) : (
            "Asignar conductor"
          )}
        </Button>
      </form>
    </Card>
  );
}
