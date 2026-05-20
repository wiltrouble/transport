"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  assignParentStudentAction,
  removeParentStudentAction,
} from "@/app/actions/parent-students";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { RELATIONSHIP_LABELS } from "@school/utils";
import type { Parent } from "@school/types";
import type { ParentStudentAssignment } from "@school/types";
import type { Student } from "@school/types";
import type { RelationshipType } from "@school/types";

type AssignRelationshipFormProps = {
  mode: "parent" | "student";
  entityId: string;
  assignments: ParentStudentAssignment[];
  parents: Parent[];
  students: Student[];
  /** When true, only show the assign controls (no assignments table). */
  assignOnly?: boolean;
};

export function AssignRelationshipForm({
  mode,
  entityId,
  assignments,
  parents,
  students,
  assignOnly = false,
}: AssignRelationshipFormProps) {
  const router = useRouter();
  const [relatedId, setRelatedId] = useState("");
  const [relationshipType, setRelationshipType] = useState<RelationshipType>("father");
  const [loading, setLoading] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [removeMeta, setRemoveMeta] = useState<{ parentId: string; studentId: string } | null>(
    null,
  );

  const options = mode === "parent" ? students : parents;
  const label = mode === "parent" ? "Estudiante" : "Padre / madre";

  async function handleAssign() {
    if (!relatedId) {
      toast.error(`Seleccione un ${label.toLowerCase()}`);
      return;
    }
    setLoading(true);
    const payload =
      mode === "parent"
        ? { parentId: entityId, studentId: relatedId, relationshipType }
        : { parentId: relatedId, studentId: entityId, relationshipType };

    const result = await assignParentStudentAction(payload);
    setLoading(false);

    if (!result.ok) {
      toast.error(result.error || "No se pudo asignar");
      return;
    }
    toast.success("Relación asignada");
    setRelatedId("");
    router.refresh();
  }

  async function confirmRemove() {
    if (!removeId || !removeMeta) return;
    setLoading(true);
    const result = await removeParentStudentAction(
      removeId,
      removeMeta.parentId,
      removeMeta.studentId,
    );
    setLoading(false);
    setRemoveId(null);
    setRemoveMeta(null);
    if (!result.ok) {
      toast.error(result.error || "No se pudo eliminar");
      return;
    }
    toast.success("Relación eliminada");
    router.refresh();
  }

  return (
    <Card className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium text-slate-700">{label}</label>
          <Select value={relatedId} onChange={(e) => setRelatedId(e.target.value)}>
            <option value="">Seleccionar…</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.fullName}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium text-slate-700">Parentesco</label>
          <Select
            value={relationshipType}
            onChange={(e) => setRelationshipType(e.target.value as RelationshipType)}
          >
            {(Object.keys(RELATIONSHIP_LABELS) as RelationshipType[]).map((k) => (
              <option key={k} value={k}>
                {RELATIONSHIP_LABELS[k]}
              </option>
            ))}
          </Select>
        </div>
        <Button type="button" onClick={() => void handleAssign()} disabled={loading}>
          Asignar
        </Button>
      </div>

      {!assignOnly ? (
      <DataTable
        columns={[
          {
            key: "name",
            header: mode === "parent" ? "Estudiante" : "Padre / madre",
            cell: (row) =>
              mode === "parent"
                ? row.student?.fullName ?? row.studentId
                : row.parent?.fullName ?? row.parentId,
          },
          {
            key: "type",
            header: "Parentesco",
            cell: (row) => RELATIONSHIP_LABELS[row.relationshipType],
          },
          {
            key: "actions",
            header: "",
            className: "text-right",
            cell: (row) => (
              <Button
                type="button"
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                onClick={() => {
                  setRemoveId(row.id);
                  setRemoveMeta({ parentId: row.parentId, studentId: row.studentId });
                }}
              >
                Quitar
              </Button>
            ),
          },
        ]}
        data={assignments}
        keyExtractor={(r) => r.id}
        emptyMessage="Sin relaciones asignadas"
      />
      ) : null}

      <ConfirmDialog
        open={Boolean(removeId)}
        title="Quitar relación"
        description="¿Desea eliminar esta asignación padre-estudiante?"
        confirmLabel="Quitar"
        variant="danger"
        loading={loading}
        onConfirm={() => void confirmRemove()}
        onCancel={() => {
          setRemoveId(null);
          setRemoveMeta(null);
        }}
      />
    </Card>
  );
}
