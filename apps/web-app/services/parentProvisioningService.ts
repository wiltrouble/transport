import "server-only";

import { provisionWithAuthUser } from "@/lib/provisioning/provision-auth-user";
import type { ProvisionParentResult } from "@/lib/provisioning/types";
import { parentService } from "@/services/parentService";
import type { ParentFormValues } from "@school/validations";

export const parentProvisioningService = {
  /**
   * Creates Appwrite Auth user + parents table row with linked appwriteUserId.
   * Rolls back the Auth user if the table row cannot be created.
   */
  async provision(values: ParentFormValues): Promise<ProvisionParentResult> {
    const email = values.email.trim().toLowerCase();

    const { record, credentials } = await provisionWithAuthUser({
      email,
      fullName: values.fullName,
      role: "parent",
      assertBusinessEmailAvailable: async () => {
        if (await parentService.emailExists(email)) {
          throw new Error("Ya existe un padre/madre registrado con este correo electrónico.");
        }
      },
      createRecord: (appwriteUserId) =>
        parentService.createWithAppwriteUserId(values, appwriteUserId),
    });

    return { parent: record, credentials };
  },
};
