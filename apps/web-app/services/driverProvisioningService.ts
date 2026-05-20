import "server-only";

import { provisionWithAuthUser } from "@/lib/provisioning/provision-auth-user";
import type { ProvisionDriverResult } from "@/lib/provisioning/types";
import { driverService } from "@/services/driverService";
import type { DriverFormValues } from "@school/validations";

export const driverProvisioningService = {
  /**
   * Creates Appwrite Auth user + drivers table row with linked appwriteUserId.
   * Rolls back the Auth user if the table row cannot be created.
   */
  async provision(values: DriverFormValues): Promise<ProvisionDriverResult> {
    const email = values.email.trim().toLowerCase();

    const { record, credentials } = await provisionWithAuthUser({
      email,
      fullName: values.fullName,
      role: "driver",
      assertBusinessEmailAvailable: async () => {
        if (await driverService.emailExists(email)) {
          throw new Error("Ya existe un conductor con este correo electrónico.");
        }
      },
      createRecord: (appwriteUserId) =>
        driverService.createWithAppwriteUserId(values, appwriteUserId),
    });

    return { driver: record, credentials };
  },
};
