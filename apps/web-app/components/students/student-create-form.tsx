"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createStudentWithParentAction } from "@/app/actions/students";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { GENDER_LABELS, RELATIONSHIP_LABELS } from "@school/utils";
import { StatusFormField } from "@/components/shared/status-form-field";
import type { Parent } from "@school/types";
import type { RelationshipType } from "@school/types";
import {
  studentCreateFormSchema,
  type StudentCreateFormValues,
} from "@school/validations";

type StudentCreateFormProps = {
  parents: Parent[];
};

export function StudentCreateForm({ parents }: StudentCreateFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StudentCreateFormValues>({
    resolver: zodResolver(studentCreateFormSchema),
    defaultValues: {
      student: {
        fullName: "",
        birthDate: "",
        gender: "male",
        grade: "",
        address: "",
        status: true,
        photo: "",
      },
      parentMode: parents.length > 0 ? "existing" : "new",
      relationshipType: "mother",
      parentId: "",
      parent: {
        fullName: "",
        email: "",
        phone: "",
        address: "",
        emergencyPhone: "",
        status: true,
      },
    },
  });

  const parentMode = watch("parentMode");
  const studentAddress = watch("student.address");

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
  }

  function copyAddressToParent() {
    if (studentAddress) {
      setValue("parent.address", studentAddress, { shouldValidate: true });
    }
  }

  async function onSubmit(values: StudentCreateFormValues) {
    setSubmitting(true);
    const fileInput = document.getElementById("photoFile") as HTMLInputElement | null;
    const photoFile = fileInput?.files?.[0] ?? null;

    const result = await createStudentWithParentAction(values, photoFile);
    setSubmitting(false);

    if (!result.ok) {
      const err = result.error;
      const formErr =
        err && "_form" in err && Array.isArray(err._form) ? err._form[0] : null;
      toast.error(formErr || "Revise los campos del formulario");
      return;
    }

    toast.success("Estudiante y responsable registrados");
    router.push(`/dashboard/students/${result.id}`);
    router.refresh();
  }

  const studentErrors = errors.student;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Datos del estudiante</h2>
          <p className="mt-1 text-sm text-slate-500">
            Información académica y de contacto del estudiante.
          </p>
        </div>

        <FormField
          label="Nombre completo"
          htmlFor="student.fullName"
          error={studentErrors?.fullName?.message}
        >
          <Input id="student.fullName" {...register("student.fullName")} />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Fecha de nacimiento"
            htmlFor="student.birthDate"
            error={studentErrors?.birthDate?.message}
          >
            <Input id="student.birthDate" type="date" {...register("student.birthDate")} />
          </FormField>
          <FormField label="Género" htmlFor="student.gender" error={studentErrors?.gender?.message}>
            <Select id="student.gender" {...register("student.gender")}>
              {(Object.keys(GENDER_LABELS) as Array<keyof typeof GENDER_LABELS>).map((k) => (
                <option key={k} value={k}>
                  {GENDER_LABELS[k]}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Grado" htmlFor="student.grade" error={studentErrors?.grade?.message}>
            <Input id="student.grade" {...register("student.grade")} placeholder="Ej. 5° primaria" />
          </FormField>
          <StatusFormField
            id="student.status"
            name="student.status"
            register={register}
            watch={watch}
            setValue={setValue}
            error={studentErrors?.status?.message}
          />
        </div>

        <FormField label="Dirección" htmlFor="student.address" error={studentErrors?.address?.message}>
          <Input id="student.address" {...register("student.address")} />
        </FormField>

        <FormField label="Foto" htmlFor="photoFile" hint="JPG o PNG, máx. 5 MB">
          <Input id="photoFile" type="file" accept="image/*" onChange={onPhotoChange} />
          {photoPreview ? (
            <div className="relative mt-3 h-32 w-32 overflow-hidden rounded-xl border border-slate-200">
              <Image src={photoPreview} alt="Vista previa" fill className="object-cover" unoptimized />
            </div>
          ) : null}
          <input type="hidden" {...register("student.photo")} />
        </FormField>
      </Card>

      <Card className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Padre, madre o tutor</h2>
          <p className="mt-1 text-sm text-slate-500">
            Debe vincular al menos un responsable para el transporte escolar.
          </p>
        </div>

        <FormField label="Parentesco" htmlFor="relationshipType" error={errors.relationshipType?.message}>
          <Select id="relationshipType" {...register("relationshipType")}>
            {(Object.keys(RELATIONSHIP_LABELS) as RelationshipType[]).map((k) => (
              <option key={k} value={k}>
                {RELATIONSHIP_LABELS[k]}
              </option>
            ))}
          </Select>
        </FormField>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-slate-700">Responsable</legend>
          <div className="flex flex-wrap gap-4">
            {parents.length > 0 ? (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  value="existing"
                  {...register("parentMode")}
                  className="text-indigo-600"
                />
                Ya registrado
              </label>
            ) : null}
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                value="new"
                {...register("parentMode")}
                className="text-indigo-600"
              />
              Registrar nuevo
            </label>
          </div>
        </fieldset>

        {parentMode === "existing" ? (
          <FormField label="Seleccionar responsable" htmlFor="parentId" error={errors.parentId?.message}>
            <Select id="parentId" {...register("parentId")}>
              <option value="">Seleccionar…</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} — {p.email}
                </option>
              ))}
            </Select>
          </FormField>
        ) : (
          <div className="space-y-5 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-sm font-medium text-slate-700">Datos del nuevo responsable</p>
            <FormField
              label="Nombre completo"
              htmlFor="parent.fullName"
              error={errors.parent?.fullName?.message}
            >
              <Input id="parent.fullName" {...register("parent.fullName")} />
            </FormField>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Correo" htmlFor="parent.email" error={errors.parent?.email?.message}>
                <Input id="parent.email" type="email" {...register("parent.email")} />
              </FormField>
              <FormField label="Teléfono" htmlFor="parent.phone" error={errors.parent?.phone?.message}>
                <Input id="parent.phone" {...register("parent.phone")} />
              </FormField>
            </div>
            <FormField label="Dirección" htmlFor="parent.address" error={errors.parent?.address?.message}>
              <div className="flex gap-2">
                <Input id="parent.address" className="flex-1" {...register("parent.address")} />
                <Button type="button" variant="secondary" onClick={copyAddressToParent}>
                  Usar dirección del estudiante
                </Button>
              </div>
            </FormField>
            <FormField
              label="Teléfono de emergencia"
              htmlFor="parent.emergencyPhone"
              error={errors.parent?.emergencyPhone?.message}
            >
              <Input id="parent.emergencyPhone" {...register("parent.emergencyPhone")} />
            </FormField>
            <StatusFormField
              id="parent.status"
              name="parent.status"
              register={register}
              watch={watch}
              setValue={setValue}
              error={errors.parent?.status?.message}
            />
          </div>
        )}
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Spinner tone="onPrimary" />
              Registrando…
            </>
          ) : (
            "Registrar estudiante"
          )}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={submitting}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
