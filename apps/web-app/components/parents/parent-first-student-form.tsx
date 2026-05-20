"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createStudentForParentAction } from "@/app/actions/students";
import { FormField } from "@/components/shared/form-field";
import { StatusFormField } from "@/components/shared/status-form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { GENDER_LABELS, RELATIONSHIP_LABELS } from "@school/utils";
import type { Parent } from "@school/types";
import type { RelationshipType } from "@school/types";
import {
  parentFirstStudentSchema,
  type ParentFirstStudentValues,
} from "@school/validations";

type ParentFirstStudentFormProps = {
  parent: Parent;
};

const defaultValues = (parent: Parent): ParentFirstStudentValues => ({
  fullName: "",
  birthDate: "",
  gender: "male",
  grade: "",
  address: parent.address,
  status: true,
  photo: "",
  relationshipType: "father",
});

export function ParentFirstStudentForm({ parent }: ParentFirstStudentFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [registeredName, setRegisteredName] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ParentFirstStudentValues>({
    resolver: zodResolver(parentFirstStudentSchema),
    defaultValues: defaultValues(parent),
  });

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
  }

  function resetForAnother() {
    reset(defaultValues(parent));
    setPhotoPreview(null);
    setRegisteredName(null);
    const fileInput = document.getElementById("photoFile") as HTMLInputElement | null;
    if (fileInput) fileInput.value = "";
  }

  async function onSubmit(values: ParentFirstStudentValues) {
    setSubmitting(true);
    const fileInput = document.getElementById("photoFile") as HTMLInputElement | null;
    const photoFile = fileInput?.files?.[0] ?? null;

    const result = await createStudentForParentAction(parent.id, values, photoFile);
    setSubmitting(false);

    if (!result.ok) {
      const err = result.error;
      const formErr =
        err && "_form" in err && Array.isArray(err._form) ? err._form[0] : null;
      toast.error(formErr || "Revise los campos del formulario");
      return;
    }

    toast.success("Estudiante registrado y vinculado");
    setRegisteredName(values.fullName);
    router.refresh();
  }

  if (registeredName) {
    return (
      <Card className="text-center">
        <p className="text-sm font-medium text-emerald-700">Registro exitoso</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">{registeredName}</h3>
        <p className="mt-1 text-sm text-slate-600">
          El estudiante quedó vinculado a {parent.fullName} como responsable.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={resetForAnother}>
            Agregar otro estudiante
          </Button>
          <Link
            href={`/dashboard/parents/${parent.id}`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Finalizar registro
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          label="Parentesco con el responsable"
          htmlFor="relationshipType"
          error={errors.relationshipType?.message}
        >
          <Select id="relationshipType" {...register("relationshipType")}>
            {(Object.keys(RELATIONSHIP_LABELS) as RelationshipType[]).map((k) => (
              <option key={k} value={k}>
                {RELATIONSHIP_LABELS[k]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Nombre completo" htmlFor="fullName" error={errors.fullName?.message}>
          <Input id="fullName" {...register("fullName")} />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Fecha de nacimiento" htmlFor="birthDate" error={errors.birthDate?.message}>
            <Input id="birthDate" type="date" {...register("birthDate")} />
          </FormField>
          <FormField label="Género" htmlFor="gender" error={errors.gender?.message}>
            <Select id="gender" {...register("gender")}>
              {(Object.keys(GENDER_LABELS) as Array<keyof typeof GENDER_LABELS>).map((k) => (
                <option key={k} value={k}>
                  {GENDER_LABELS[k]}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Grado" htmlFor="grade" error={errors.grade?.message}>
            <Input id="grade" {...register("grade")} placeholder="Ej. 5° primaria" />
          </FormField>
          <StatusFormField
            id="status"
            name="status"
            register={register}
            watch={watch}
            setValue={setValue}
            error={errors.status?.message}
          />
        </div>

        <FormField label="Dirección" htmlFor="address" error={errors.address?.message}>
          <Input id="address" {...register("address")} />
        </FormField>

        <FormField label="Foto" htmlFor="photoFile" hint="JPG o PNG, máx. 5 MB">
          <Input id="photoFile" type="file" accept="image/*" onChange={onPhotoChange} />
          {photoPreview ? (
            <div className="relative mt-3 h-32 w-32 overflow-hidden rounded-xl border border-slate-200">
              <Image src={photoPreview} alt="Vista previa" fill className="object-cover" unoptimized />
            </div>
          ) : null}
          <input type="hidden" {...register("photo")} />
        </FormField>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
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
          <Link
            href={`/dashboard/parents/${parent.id}`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
            aria-disabled={submitting}
          >
            Cancelar
          </Link>
        </div>
      </form>
    </Card>
  );
}
