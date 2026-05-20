"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createDriverAction, updateDriverAction } from "@/app/actions/drivers";
import { ProvisioningCredentialsDialog } from "@/components/provisioning/credentials-dialog";
import { FormField } from "@/components/shared/form-field";
import { StatusFormField } from "@/components/shared/status-form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { LICENSE_CATEGORIES } from "@school/utils";
import type { Driver } from "@school/types";
import type { ProvisioningCredentials } from "@/lib/provisioning/types";
import { driverFormSchema, type DriverFormValues } from "@school/validations";

type DriverFormProps = {
  mode: "create" | "edit";
  driver?: Driver;
};

export function DriverForm({ mode, driver }: DriverFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [createdDriverId, setCreatedDriverId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<ProvisioningCredentials | null>(null);
  const [createdDriverName, setCreatedDriverName] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DriverFormValues>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: driver
      ? {
          fullName: driver.fullName,
          email: driver.email,
          phone: driver.phone,
          licenseNumber: driver.licenseNumber,
          licenseCategory: driver.licenseCategory,
          licenseExpiration: driver.licenseExpiration.slice(0, 10),
          status: driver.status,
        }
      : {
          fullName: "",
          email: "",
          phone: "",
          licenseNumber: "",
          licenseCategory: "B",
          licenseExpiration: "",
          status: true,
        },
  });

  async function onSubmit(values: DriverFormValues) {
    setSubmitting(true);

    if (mode === "create") {
      const result = await createDriverAction(values);
      setSubmitting(false);

      if (!result.ok) {
        const err = result.error;
        const formErr =
          err && "_form" in err && Array.isArray(err._form) ? err._form[0] : null;
        toast.error(formErr || "Revise los campos del formulario");
        return;
      }

      setCreatedDriverId(result.id);
      setCreatedDriverName(values.fullName);
      setCredentials(result.credentials);
      toast.success("Conductor y cuenta de acceso creados");
      return;
    }

    const result = await updateDriverAction(driver!.id, values);
    setSubmitting(false);

    if (!result.ok) {
      const err = result.error;
      const formErr =
        err && "_form" in err && Array.isArray(err._form) ? err._form[0] : null;
      toast.error(formErr || "Revise los campos del formulario");
      return;
    }

    toast.success("Cambios guardados");
    router.push(`/dashboard/drivers/${driver!.id}`);
    router.refresh();
  }

  function handleViewDriver() {
    if (createdDriverId) {
      router.push(`/dashboard/drivers/${createdDriverId}`);
      router.refresh();
    }
    setCredentials(null);
  }

  function handleCreateAnother() {
    setCredentials(null);
    setCreatedDriverId(null);
    setCreatedDriverName("");
    reset({
      fullName: "",
      email: "",
      phone: "",
      licenseNumber: "",
      licenseCategory: "B",
      licenseExpiration: "",
      status: true,
    });
  }

  return (
    <>
      <Card>
        {mode === "create" ? (
          <p className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Se creará automáticamente una cuenta de Appwrite Auth con contraseña temporal. El
            conductor podrá iniciar sesión en la app móvil; las credenciales se mostrarán una sola
            vez al finalizar.
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
          <div className="grid gap-5 sm:grid-cols-3">
            <FormField
              label="Número de licencia"
              htmlFor="licenseNumber"
              error={errors.licenseNumber?.message}
            >
              <Input id="licenseNumber" {...register("licenseNumber")} />
            </FormField>
            <FormField label="Categoría" htmlFor="licenseCategory" error={errors.licenseCategory?.message}>
              <Select id="licenseCategory" {...register("licenseCategory")}>
                {LICENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              label="Vencimiento"
              htmlFor="licenseExpiration"
              error={errors.licenseExpiration?.message}
            >
              <Input id="licenseExpiration" type="date" {...register("licenseExpiration")} />
            </FormField>
          </div>
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
                "Crear conductor"
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
        role="driver"
        personName={createdDriverName}
        onPrimary={handleViewDriver}
        onCreateAnother={handleCreateAnother}
      />
    </>
  );
}
