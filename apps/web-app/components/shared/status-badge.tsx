import { Badge } from "@/components/ui/badge";
import { statusLabel } from "@school/utils";

export function StatusBadge({ status }: { status: boolean }) {
  return (
    <Badge variant={status ? "success" : "warning"}>
      {statusLabel(status)}
    </Badge>
  );
}
