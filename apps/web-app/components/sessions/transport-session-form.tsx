"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createTransportSessionAction } from "@/app/actions/transport-sessions";
import { FormField } from "@/components/shared/form-field";
import { SearchableEntitySelect } from "@/components/vehicle-drivers/searchable-entity-select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SESSION_SHIFT_LABELS, SESSION_SHIFTS } from "@school/utils";
import type { Driver } from "@school/types";
import type { Vehicle } from "@school/types";
import {
  createTransportSessionSchema,
  type CreateTransportSessionValues,
} from "@school/validations";
import { Spinner } from "@/components/ui/spinner";

type TransportSessionFormProps = {
  vehicles: Vehicle[];
  drivers: Driver[];
  defaultVehicleId?: string;
  defaultDriverId?: string;
};

export function TransportSessionForm({
  vehicles,
  drivers,
  defaultVehicleId,
  defaultDriverId,
}: TransportSessionFormProps) {
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

  const driverOptions = useMemo(
    () =>
      drivers.map((d) => ({
        id: d.id,
        label: d.fullName,
        hint: d.licenseNumber,
      })),
    [drivers],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTransportSessionValues>({
    resolver: zodResolver(createTransportSessionSchema),
    defaultValues: {
      vehicleId: defaultVehicleId ?? "",
      driverId: defaultDriverId ?? "",
      sessionDate: new Date().toISOString().slice(0, 10),
      shift: "morning",
      notes: "",
    },
  });

  const vehicleId = watch("vehicleId");
  const driverId = watch("driverId");

  useEffect(() => {
    if (defaultVehicleId) setValue("vehicleId", defaultVehicleId);
    if (defaultDriverId) setValue("driverId", defaultDriverId);
  }, [defaultVehicleId, defaultDriverId, setValue]);

  async function onSubmit(values: CreateTransportSessionValues) {
    setSubmitting(true);
    const res = await createTransportSessionAction(values);
    setSubmitting(false);
    if (!res.ok) {
      const err = res.error;
      toast.error(typeof err === "string" ? err : "Revise los campos del formulario");
      return;
    }
    toast.success("Sesión creada. Estudiantes cargados.");
    router.push(`/dashboard/sessions/${res.id}/manage`);
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {!defaultVehicleId ? (
          <SearchableEntitySelect
            id="vehicleId"
            label="Vehículo"
            placeholder="Buscar placa…"
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
            placeholder="Buscar conductor…"
            options={driverOptions}
            value={driverId}
            onChange={(id) => setValue("driverId", id, { shouldValidate: true })}
            error={errors.driverId?.message}
          />
        ) : null}
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Fecha" htmlFor="sessionDate" error={errors.sessionDate?.message}>
            <input
              id="sessionDate"
              type="date"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              {...register("sessionDate")}
            />
          </FormField>
          <FormField label="Turno" htmlFor="shift" error={errors.shift?.message}>
            <Select id="shift" {...register("shift")}>
              {SESSION_SHIFTS.map((s) => (
                <option key={s} value={s}>
                  {SESSION_SHIFT_LABELS[s]}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <FormField label="Notas" htmlFor="notes" error={errors.notes?.message}>
          <Textarea id="notes" rows={3} {...register("notes")} placeholder="Opcional" />
        </FormField>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Spinner tone="onPrimary" />
              Creando…
            </>
          ) : (
            "Crear sesión y cargar estudiantes"
          )}
        </Button>
      </form>
    </Card>
  );
}
