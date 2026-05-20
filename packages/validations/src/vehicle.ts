import { z } from "zod";

/**
 * Schemas that power the integrated Vehicle workflows.
 *
 * - `vehicleInfoSchema` — fields stored in the `vehicles` Appwrite Table.
 * - `vehicleEditSchema` — info + the currently assigned driver (single source of truth
 *    used by the edit page).
 * - `vehicleCreateSchema` — multi-step wizard payload: vehicle info + driver + students.
 *
 * Assignment logic itself is enforced server-side by the vehicle services. The schemas
 * here exist to validate the request shape and the structural business rules
 * (driver required, capacity, unique pickup order).
 */
export const vehicleInfoSchema = z.object({
  plate: z
    .string()
    .min(4, "Placa obligatoria")
    .max(15, "Placa demasiado larga")
    .transform((v) => v.trim().toUpperCase()),
  brand: z.string().min(2, "Marca obligatoria"),
  model: z.string().min(1, "Modelo obligatorio"),
  capacity: z.coerce
    .number()
    .int("Capacidad debe ser un número entero")
    .min(1, "Capacidad debe ser mayor a 0")
    .max(200, "Capacidad demasiado alta"),
  color: z.string().min(2, "Color obligatorio"),
  year: z.coerce
    .number()
    .int()
    .min(1990, "Año no válido")
    .max(new Date().getFullYear() + 1, "Año no válido"),
  status: z.boolean(),
});

export type VehicleInfoValues = z.infer<typeof vehicleInfoSchema>;

const driverFieldSchema = z.object({
  driverId: z.string().min(1, "Seleccione un conductor"),
});

export const vehicleEditSchema = vehicleInfoSchema.merge(driverFieldSchema);
export type VehicleEditValues = z.infer<typeof vehicleEditSchema>;

/** @deprecated Use `vehicleEditSchema` */
export const vehicleFormSchema = vehicleEditSchema;
/** @deprecated Use `VehicleEditValues` */
export type VehicleFormValues = VehicleEditValues;

const wizardStudentSchema = z.object({
  studentId: z.string().min(1, "Estudiante obligatorio"),
  pickupOrder: z.coerce.number().int().min(1, "Orden inválido"),
  pickupTime: z.string().optional(),
  dropoffTime: z.string().optional(),
});

export type VehicleWizardStudent = z.infer<typeof wizardStudentSchema>;

export const vehicleCreateSchema = vehicleInfoSchema
  .merge(driverFieldSchema)
  .extend({
    students: z
      .array(wizardStudentSchema)
      .superRefine((arr, ctx) => {
        const orders = new Set<number>();
        const studentIds = new Set<string>();
        for (let i = 0; i < arr.length; i += 1) {
          const s = arr[i];
          if (orders.has(s.pickupOrder)) {
            ctx.addIssue({
              code: "custom",
              message: "Orden de recogida duplicado",
              path: [i, "pickupOrder"],
            });
          }
          orders.add(s.pickupOrder);
          if (studentIds.has(s.studentId)) {
            ctx.addIssue({
              code: "custom",
              message: "Estudiante duplicado",
              path: [i, "studentId"],
            });
          }
          studentIds.add(s.studentId);
        }
      }),
  })
  .superRefine((v, ctx) => {
    if (v.students.length > v.capacity) {
      ctx.addIssue({
        code: "custom",
        message: `Estudiantes (${v.students.length}) supera capacidad (${v.capacity})`,
        path: ["students"],
      });
    }
  });

export type VehicleCreateValues = z.infer<typeof vehicleCreateSchema>;
