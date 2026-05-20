import type { ParentStudentAssignment } from "./parent-student";
import type { VehicleStudentAssignment } from "./vehicle-student";

export type Gender = "male" | "female" | "other";

export type Student = {
  id: string;
  fullName: string;
  birthDate: string;
  gender: Gender;
  grade: string;
  address: string;
  photo: string | null;
  status: boolean;
};

export type StudentInput = Omit<Student, "id">;

export type StudentWithParents = Student & {
  assignments: ParentStudentAssignment[];
};

export type StudentWithTransport = Student & {
  currentVehicleAssignment: VehicleStudentAssignment | null;
  vehicleAssignmentHistory: VehicleStudentAssignment[];
};
