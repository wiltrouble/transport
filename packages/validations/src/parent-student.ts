import { z } from "zod";

export const relationshipTypeSchema = z.enum([
  "father",
  "mother",
  "tutor",
  "grandfather",
  "grandmother",
  "uncle",
  "aunt",
  "other",
]);

export const assignParentStudentSchema = z.object({
  parentId: z.string().min(1, "Seleccione un padre/madre"),
  studentId: z.string().min(1, "Seleccione un estudiante"),
  relationshipType: relationshipTypeSchema,
});

export type AssignParentStudentValues = z.infer<typeof assignParentStudentSchema>;
