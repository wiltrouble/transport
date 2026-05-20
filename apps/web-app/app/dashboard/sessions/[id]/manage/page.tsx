import { notFound } from "next/navigation";
import { SessionManageView } from "@/components/sessions/session-manage-view";
import { transportSessionService } from "@/services/transportSessionService";

type Props = { params: Promise<{ id: string }> };

export default async function SessionManagePage({ params }: Props) {
  const { id } = await params;
  const session = await transportSessionService.getByIdWithDetails(id);
  if (!session) notFound();

  return <SessionManageView session={session} />;
}
