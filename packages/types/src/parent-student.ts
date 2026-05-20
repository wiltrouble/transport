import type { Parent } from "./parent";
import type { Student } from "./student";

export type RelationshipType =
  | "father"
  | "mother"
  | "tutor"
  | "grandfather"
  | "grandmother"
  | "uncle"
  | "aunt"
  | "other";

export type ParentStudentRow = {
  id: string;
  parentId: string;
  studentId: string;
  relationshipType: RelationshipType;
};

export type ParentStudentAssignment = ParentStudentRow & {
  parent?: Parent | null;
  student?: Student | null;
};

export type AssignParentStudentInput = {
  parentId: string;
  studentId: string;
  relationshipType: RelationshipType;
};
