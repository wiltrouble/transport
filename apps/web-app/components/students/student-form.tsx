"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createStudentAction, updateStudentAction } from "@/app/actions/students";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { GENDER_LABELS } from "@school/utils";
import { StatusFormField } from "@/components/shared/status-form-field";
import { getStudentPhotoUrl } from "@/lib/storage-url";
import type { Student } from "@school/types";
import { studentFormSchema, type StudentFormValues } from "@school/validations";

type StudentFormProps = {
  mode: "create" | "edit";
  student?: Student;
};

export function StudentForm({ mode, student }: StudentFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    student?.photo ? getStudentPhotoUrl(student.photo) : null,
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: student
      ? {
          fullName: student.fullName,
          birthDate: student.birthDate.slice(0, 10),
          gender: student.gender,
          grade: student.grade,
          address: student.address,
          status: student.status,
          photo: student.photo ?? "",
        }
      : {
          fullName: "",
          birthDate: "",
          gender: "male",
          grade: "",
          address: "",
          status: true,
          photo: "",
        },
  });

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function onSubmit(values: StudentFormValues) {
    setSubmitting(true);
    const fileInput = document.getElementById("photoFile") as HTMLInputElement | null;
    const photoFile = fileInput?.files?.[0] ?? null;

    const result =
      mode === "create"
        ? await createStudentAction(values, photoFile)
        : await updateStudentAction(student!.id, values, photoFile);
    setSubmitting(false);

    if (!result.ok) {
      const err = result.error;
      const formErr =
        err && "_form" in err && Array.isArray(err._form) ? err._form[0] : null;
      toast.error(formErr || "Revise los campos del formulario");
      return;
    }

    toast.success(mode === "create" ? "Estudiante creado" : "Cambios guardados");
    if (mode === "create" && "id" in result) {
      router.push(`/dashboard/students/${result.id}`);
    } else {
      router.push(`/dashboard/students/${student!.id}`);
    }
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner tone="onPrimary" />
                Guardando…
              </>
            ) : mode === "create" ? (
              "Crear estudiante"
            ) : (
              "Guardar cambios"
            )}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()} disabled={submitting}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
