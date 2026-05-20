import type { ParentStudentAssignment } from "./parent-student";

export type Parent = {
  id: string;
  fullName: string;
  appwriteUserId?: string | null;
  email: string;
  phone: string;
  address: string;
  emergencyPhone: string;
  status: boolean;
};

export type ParentInput = Omit<Parent, "id" | "appwriteUserId">;

export type ParentWithStudents = Parent & {
  assignments: ParentStudentAssignment[];
};
