import { getAppwriteConfig } from "@/lib/appwrite";
import { getTablesConfig } from "@/lib/tables-config";

/** Public view URL for a file stored in the students photos bucket. */
export function getStudentPhotoUrl(fileId: string | null | undefined): string | null {
  if (!fileId) return null;
  const { endpoint, projectId } = getAppwriteConfig();
  const { storageBucketId } = getTablesConfig();
  if (!storageBucketId) return null;
  return `${endpoint}/storage/buckets/${storageBucketId}/files/${fileId}/preview?project=${projectId}&width=400&height=400`;
}
