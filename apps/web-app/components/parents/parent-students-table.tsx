import Link from "next/link";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { RELATIONSHIP_LABELS } from "@school/utils";
import type { ParentStudentAssignment } from "@school/types";

type ParentStudentsTableProps = {
  parentId: string;
  assignments: ParentStudentAssignment[];
};

export function ParentStudentsTable({ parentId, assignments }: ParentStudentsTableProps) {
  if (assignments.length === 0) {
    return (
      <EmptyState
        title="Sin estudiantes vinculados"
        description="Registre un nuevo estudiante o vincule uno existente."
        actionLabel="Agregar estudiante"
        actionHref={`/dashboard/parents/${parentId}/students/create`}
      />
    );
  }

  return (
    <DataTable
      columns={[
        {
          key: "student",
          header: "Estudiante",
          cell: (row) =>
            row.student ? (
              <Link
                href={`/dashboard/students/${row.studentId}`}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                {row.student.fullName}
              </Link>
            ) : (
              row.studentId
            ),
        },
        {
          key: "type",
          header: "Parentesco",
          cell: (row) => RELATIONSHIP_LABELS[row.relationshipType],
        },
        {
          key: "grade",
          header: "Grado",
          cell: (row) => row.student?.grade ?? "—",
        },
      ]}
      data={assignments}
      keyExtractor={(r) => r.id}
    />
  );
}
