import { z } from "zod";
import { parentFormSchema } from "./parent";
import { relationshipTypeSchema } from "./parent-student";
import { studentFormSchema } from "./student";

/** Student + required parent link (existing or new) for registration. */
export const studentCreateFormSchema = z
  .object({
    student: studentFormSchema,
    parentMode: z.enum(["existing", "new"]),
    relationshipType: relationshipTypeSchema,
    parentId: z.string().optional(),
    parent: parentFormSchema.partial().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.parentMode === "existing") {
      if (!data.parentId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Seleccione un padre/madre registrado",
          path: ["parentId"],
        });
      }
      return;
    }

    const parsed = parentFormSchema.safeParse(data.parent ?? {});
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({
          ...issue,
          path: ["parent", ...(issue.path as string[])],
        });
      }
    }
  });

export type StudentCreateFormValues = z.infer<typeof studentCreateFormSchema>;
