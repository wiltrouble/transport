import "server-only";

import {
  createAuthUser,
  deleteAuthUser,
  findAuthUserByEmail,
} from "@/lib/appwrite-admin";
import { formatProvisioningError } from "@/lib/provisioning/errors";
import type { ProvisioningCredentials } from "@/lib/provisioning/types";
import { generateTemporaryPassword } from "@/utils/generateTemporaryPassword";

export type ProvisionWithAuthUserInput<T> = {
  email: string;
  fullName: string;
  assertBusinessEmailAvailable: () => Promise<void>;
  createRecord: (appwriteUserId: string) => Promise<T>;
};

export type ProvisionWithAuthUserResult<T> = {
  record: T;
  credentials: ProvisioningCredentials;
};

/**
 * Shared flow: generate password → Appwrite Auth user → table row → rollback Auth on failure.
 */
export async function provisionWithAuthUser<T>(
  input: ProvisionWithAuthUserInput<T>,
): Promise<ProvisionWithAuthUserResult<T>> {
  const email = input.email.trim().toLowerCase();

  await input.assertBusinessEmailAvailable();

  if (await findAuthUserByEmail(email)) {
    throw new Error("Ya existe una cuenta de autenticación con este correo electrónico.");
  }

  const temporaryPassword = generateTemporaryPassword();
  let appwriteUserId: string | null = null;

  try {
    const authUser = await createAuthUser({
      email,
      password: temporaryPassword,
      name: input.fullName,
    });
    appwriteUserId = authUser.$id;

    const record = await input.createRecord(appwriteUserId);

    return {
      record,
      credentials: { email, temporaryPassword },
    };
  } catch (error) {
    if (appwriteUserId) {
      try {
        await deleteAuthUser(appwriteUserId);
      } catch {
        // Best-effort rollback
      }
    }
    throw new Error(formatProvisioningError(error));
  }
}
