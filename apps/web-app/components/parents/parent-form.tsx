"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createParentAction, updateParentAction } from "@/app/actions/parents";
import { ProvisioningCredentialsDialog } from "@/components/provisioning/credentials-dialog";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { StatusFormField } from "@/components/shared/status-form-field";
import type { Parent } from "@school/types";
import type { ProvisioningCredentials } from "@/lib/provisioning/types";
import { parentFormSchema, type ParentFormValues } from "@school/validations";

type ParentFormProps = {
  mode: "create" | "edit";
  parent?: Parent;
};

export function ParentForm({ mode, parent }: ParentFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [createdParentId, setCreatedParentId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<ProvisioningCredentials | null>(null);
  const [createdParentName, setCreatedParentName] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ParentFormValues>({
    resolver: zodResolver(parentFormSchema),
    defaultValues: parent
      ? {
          fullName: parent.fullName,
          email: parent.email,
          phone: parent.phone,
          address: parent.address,
          emergencyPhone: parent.emergencyPhone,
          status: parent.status,
        }
      : {
          fullName: "",
          email: "",
          phone: "",
          address: "",
          emergencyPhone: "",
          status: true,
        },
  });

  async function onSubmit(values: ParentFormValues) {
    setSubmitting(true);

    if (mode === "create") {
      const result = await createParentAction(values);
      setSubmitting(false);

      if (!result.ok) {
        const err = result.error;
        const formErr =
          err && "_form" in err && Array.isArray(err._form) ? err._form[0] : null;
        toast.error(formErr || "Revise los campos del formulario");
        return;
      }

      setCreatedParentId(result.id);
      setCreatedParentName(values.fullName);
      setCredentials(result.credentials);
      toast.success("Cuenta de padre/madre y acceso móvil creados");
      return;
    }

    const result = await updateParentAction(parent!.id, values);
    setSubmitting(false);

    if (!result.ok) {
      const err = result.error;
      const formErr =
        err && "_form" in err && Array.isArray(err._form) ? err._form[0] : null;
      toast.error(formErr || "Revise los campos del formulario");
      return;
    }

    toast.success("Cambios guardados");
    router.push(`/dashboard/parents/${parent!.id}`);
    router.refresh();
  }

  function handleViewParent() {
    if (createdParentId) {
      router.push(`/dashboard/parents/${createdParentId}`);
      router.refresh();
    }
    setCredentials(null);
  }

  function handleContinueStudents() {
    if (createdParentId) {
      router.push(`/dashboard/parents/${createdParentId}/students/create`);
      router.refresh();
    }
    setCredentials(null);
  }

  function handleCreateAnother() {
    setCredentials(null);
    setCreatedParentId(null);
    setCreatedParentName("");
    reset({
      fullName: "",
      email: "",
      phone: "",
      address: "",
      emergencyPhone: "",
      status: true,
    });
  }

  return (
    <>
      <Card>
        {mode === "create" ? (
          <p className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Se creará automáticamente una cuenta de Appwrite Auth con contraseña temporal. El
            padre/madre podrá iniciar sesión en la app móvil; las credenciales se mostrarán una
            sola vez al finalizar.
          </p>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField label="Nombre completo" htmlFor="fullName" error={errors.fullName?.message}>
            <Input id="fullName" {...register("fullName")} />
          </FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Correo" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" autoComplete="off" {...register("email")} />
            </FormField>
            <FormField label="Teléfono" htmlFor="phone" error={errors.phone?.message}>
              <Input id="phone" {...register("phone")} />
            </FormField>
          </div>
          <FormField label="Dirección" htmlFor="address" error={errors.address?.message}>
            <Input id="address" {...register("address")} />
          </FormField>
          <FormField
            label="Teléfono de emergencia"
            htmlFor="emergencyPhone"
            error={errors.emergencyPhone?.message}
          >
            <Input id="emergencyPhone" {...register("emergencyPhone")} />
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
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner tone="onPrimary" />
                  {mode === "create" ? "Aprovisionando…" : "Guardando…"}
                </>
              ) : mode === "create" ? (
                "Crear padre/madre"
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

      <ProvisioningCredentialsDialog
        open={Boolean(credentials)}
        credentials={credentials}
        role="parent"
        personName={createdParentName}
        onPrimary={handleViewParent}
        onCreateAnother={handleCreateAnother}
        extraAction={{
          label: "Registrar estudiantes",
          onClick: handleContinueStudents,
        }}
      />
    </>
  );
}
