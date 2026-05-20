"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { createVehicleWithAssignmentsAction } from "@/app/actions/vehicles";
import { FormField } from "@/components/shared/form-field";
import { OccupancyBar } from "@/components/shared/occupancy-bar";
import {
  SearchableEntitySelect,
  type SearchableOption,
} from "@/components/shared/searchable-entity-select";
import { StatusFormField } from "@/components/shared/status-form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@school/utils";
import {
  vehicleCreateSchema,
  vehicleInfoSchema,
  type VehicleCreateValues,
} from "@school/validations";

type Props = {
  driverOptions: SearchableOption[];
  studentOptions: SearchableOption[];
};

type Step = 1 | 2 | 3 | 4;

const STEPS: { id: Step; title: string; description: string }[] = [
  { id: 1, title: "Información", description: "Datos del vehículo" },
  { id: 2, title: "Conductor", description: "Asignación obligatoria" },
  { id: 3, title: "Estudiantes", description: "Ruta y orden de recogida" },
  { id: 4, title: "Revisión", description: "Confirmar y guardar" },
];

const INFO_FIELDS = ["plate", "brand", "model", "year", "capacity", "color", "status"] as const;

export function VehicleCreateWizard({ driverOptions, studentOptions }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const form = useForm<VehicleCreateValues>({
    resolver: zodResolver(vehicleCreateSchema),
    mode: "onBlur",
    defaultValues: {
      plate: "",
      brand: "",
      model: "",
      capacity: 20,
      color: "",
      year: new Date().getFullYear(),
      status: true,
      driverId: "",
      students: [],
    },
  });

  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = form;

  const capacity = Number(watch("capacity") ?? 0);
  const rawStudents = watch("students");
  const students = useMemo(() => rawStudents ?? [], [rawStudents]);
  const occupancyPercent =
    capacity > 0 ? Math.min(100, Math.round((students.length / capacity) * 100)) : 0;

  const studentMap = useMemo(() => {
    const map = new Map<string, SearchableOption>();
    for (const opt of studentOptions) map.set(opt.id, opt);
    return map;
  }, [studentOptions]);

  const selectableStudents = useMemo(() => {
    const selectedIds = new Set(students.map((s) => s.studentId));
    return studentOptions.map((opt) => ({
      ...opt,
      disabled: opt.disabled || selectedIds.has(opt.id),
    }));
  }, [studentOptions, students]);

  function addStudent(studentId: string) {
    if (!studentId) return;
    if (students.length >= capacity) {
      toast.error(`Capacidad alcanzada (${capacity} asientos).`);
      return;
    }
    if (students.some((s) => s.studentId === studentId)) {
      toast.error("Estudiante ya agregado.");
      return;
    }
    setValue(
      "students",
      [...students, { studentId, pickupOrder: students.length + 1 }],
      { shouldValidate: true, shouldDirty: true },
    );
  }

  function removeStudent(index: number) {
    const next = students.filter((_, i) => i !== index).map((s, i) => ({ ...s, pickupOrder: i + 1 }));
    setValue("students", next, { shouldValidate: true, shouldDirty: true });
  }

  function reorderStudents(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= students.length) return;
    const next = [...students];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setValue(
      "students",
      next.map((s, i) => ({ ...s, pickupOrder: i + 1 })),
      { shouldValidate: true, shouldDirty: true },
    );
  }

  async function goNext() {
    if (step === 1) {
      const ok = await trigger(INFO_FIELDS as unknown as (keyof VehicleCreateValues)[]);
      if (!ok) return;
      const info = getValues();
      const infoParse = vehicleInfoSchema.safeParse(info);
      if (!infoParse.success) return;
    }
    if (step === 2) {
      const ok = await trigger("driverId");
      if (!ok) return;
    }
    if (step === 3) {
      const ok = await trigger("students");
      if (!ok) return;
    }
    setStep((s) => (Math.min(4, s + 1) as Step));
  }

  function goBack() {
    setStep((s) => (Math.max(1, s - 1) as Step));
  }

  async function onSubmit(values: VehicleCreateValues) {
    setSubmitting(true);
    const res = await createVehicleWithAssignmentsAction(values);
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
    toast.success(
      values.students.length > 0
        ? `Vehículo creado con ${values.students.length} estudiante(s) y conductor`
        : "Vehículo creado con conductor asignado",
    );
    router.push(`/dashboard/vehicles/${res.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Stepper current={step} />

      {step === 1 ? (
        <Card className="space-y-5">
          <h2 className="text-lg font-semibold text-slate-900">Datos del vehículo</h2>
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
            hint="Número máximo de estudiantes en este vehículo"
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
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Asignar conductor</h2>
            <p className="text-sm text-slate-500">
              Solo conductores activos sin otro vehículo asignado. La asignación es obligatoria.
            </p>
          </div>
          <Controller
            control={control}
            name="driverId"
            render={({ field }) => (
              <SearchableEntitySelect
                id="driverId"
                label="Conductor"
                placeholder="Buscar por nombre o licencia…"
                options={driverOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.driverId?.message}
              />
            )}
          />
          {driverOptions.every((o) => o.disabled) ? (
            <p className="text-sm text-amber-700">
              No hay conductores disponibles. Registre un conductor activo sin vehículo asignado.
            </p>
          ) : null}
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Asignar estudiantes</h2>
              <p className="text-sm text-slate-500">
                Opcional. Arrastre para definir el orden de recogida.
              </p>
            </div>
            <p className="text-sm font-medium text-slate-700">
              {students.length}/{capacity} asientos ({occupancyPercent}%)
            </p>
          </div>
          <OccupancyBar percent={occupancyPercent} />

          <SearchableEntitySelect
            id="studentPicker"
            label="Agregar estudiante"
            placeholder="Buscar por nombre o grado…"
            options={selectableStudents}
            value=""
            onChange={addStudent}
            disabled={students.length >= capacity}
          />

          {students.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-8 text-center text-sm text-slate-500">
              Sin estudiantes agregados. Puede continuar y asignarlos después.
            </p>
          ) : (
            <ul className="space-y-2">
              {students.map((s, index) => {
                const opt = studentMap.get(s.studentId);
                return (
                  <li
                    key={s.studentId}
                    draggable
                    onDragStart={() => setDragId(s.studentId)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (!dragId) return;
                      const from = students.findIndex((x) => x.studentId === dragId);
                      reorderStudents(from, index);
                      setDragId(null);
                    }}
                    className="flex cursor-grab items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex size-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                        {s.pickupOrder}
                      </span>
                      <div>
                        <p className="font-medium text-slate-900">
                          {opt?.label ?? s.studentId}
                        </p>
                        {opt?.hint ? (
                          <p className="text-xs text-slate-500">{opt.hint}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-500">
                        Recogida
                        <Input
                          type="time"
                          value={s.pickupTime ?? ""}
                          onChange={(e) => {
                            const next = [...students];
                            next[index] = { ...next[index], pickupTime: e.target.value };
                            setValue("students", next, { shouldDirty: true });
                          }}
                          className="mt-1 w-28"
                        />
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => removeStudent(index)}
                      >
                        Quitar
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {errors.students?.message ? (
            <p className="text-xs text-red-600" role="alert">
              {errors.students.message}
            </p>
          ) : null}
        </Card>
      ) : null}

      {step === 4 ? (
        <Card className="space-y-5">
          <h2 className="text-lg font-semibold text-slate-900">Revisión final</h2>
          <ReviewSummary
            values={getValues()}
            driverOptions={driverOptions}
            studentOptions={studentOptions}
            occupancyPercent={occupancyPercent}
          />
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={goBack}
          disabled={step === 1 || submitting}
        >
          Anterior
        </Button>
        {step < 4 ? (
          <Button type="button" onClick={() => void goNext()} disabled={submitting}>
            Siguiente
          </Button>
        ) : (
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner tone="onPrimary" />
                Creando…
              </>
            ) : (
              "Crear vehículo"
            )}
          </Button>
        )}
      </div>
    </form>
  );
}

function Stepper({ current }: { current: Step }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-4">
      {STEPS.map((s) => {
        const done = current > s.id;
        const active = current === s.id;
        return (
          <li
            key={s.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3 transition",
              active
                ? "border-indigo-200 bg-indigo-50"
                : done
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-slate-200 bg-white",
            )}
          >
            <span
              className={cn(
                "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                done
                  ? "bg-emerald-600 text-white"
                  : active
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600",
              )}
            >
              {done ? <Check className="size-4" aria-hidden /> : s.id}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{s.title}</p>
              <p className="truncate text-xs text-slate-500">{s.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ReviewSummary({
  values,
  driverOptions,
  studentOptions,
  occupancyPercent,
}: {
  values: VehicleCreateValues;
  driverOptions: SearchableOption[];
  studentOptions: SearchableOption[];
  occupancyPercent: number;
}) {
  const driver = driverOptions.find((o) => o.id === values.driverId);
  const studentMap = new Map(studentOptions.map((o) => [o.id, o]));
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase text-slate-500">Vehículo</h3>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <SummaryItem label="Placa" value={values.plate} />
          <SummaryItem label="Color" value={values.color} />
          <SummaryItem label="Marca" value={values.brand} />
          <SummaryItem label="Modelo" value={values.model} />
          <SummaryItem label="Año" value={String(values.year)} />
          <SummaryItem label="Capacidad" value={`${values.capacity} asientos`} />
          <SummaryItem label="Estado" value={values.status ? "Activo" : "Inactivo"} />
          <SummaryItem
            label="Ocupación prevista"
            value={`${values.students.length}/${values.capacity} (${occupancyPercent}%)`}
          />
        </dl>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase text-slate-500">Conductor</h3>
        <p className="text-sm text-slate-900">
          {driver ? (
            <>
              <span className="font-medium">{driver.label}</span>
              {driver.hint ? <span className="text-slate-500"> · {driver.hint}</span> : null}
            </>
          ) : (
            "—"
          )}
        </p>
        <h3 className="text-sm font-semibold uppercase text-slate-500">
          Estudiantes ({values.students.length})
        </h3>
        {values.students.length === 0 ? (
          <p className="text-sm text-slate-500">Sin asignaciones iniciales.</p>
        ) : (
          <ol className="space-y-1 text-sm">
            {values.students.map((s) => {
              const opt = studentMap.get(s.studentId);
              return (
                <li key={s.studentId} className="flex items-center gap-3">
                  <span className="inline-flex size-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                    {s.pickupOrder}
                  </span>
                  <span className="text-slate-900">{opt?.label ?? s.studentId}</span>
                  {opt?.hint ? (
                    <span className="text-xs text-slate-500">{opt.hint}</span>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value || "—"}</dd>
    </div>
  );
}
