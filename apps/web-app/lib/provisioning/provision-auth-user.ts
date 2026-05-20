import "server-only";

import {
  createAuthUser,
  deleteAuthUser,
  findAuthUserByEmail,
} from "@/lib/appwrite-admin";
import { formatProvisioningError } from "@/lib/provisioning/errors";
import type { ProvisioningCredentials } from "@/lib/provisioning/types";
import { usersService } from "@/services/usersService";
import { generateTemporaryPassword } from "@/utils/generateTemporaryPassword";
import type { UserRole } from "@school/types";

export type ProvisionWithAuthUserInput<T> = {
  email: string;
  fullName: string;
  /** Role to assign in the users table (authoritative source for authorization). */
  role: UserRole;
  assertBusinessEmailAvailable: () => Promise<void>;
  createRecord: (appwriteUserId: string) => Promise<T>;
};

export type ProvisionWithAuthUserResult<T> = {
  record: T;
  credentials: ProvisioningCredentials;
};

/**
 * Shared flow used by driver/parent provisioning:
 *   1. Validate email is free in the business table.
 *   2. Create Appwrite Auth user.
 *   3. Create `users` row with the right role (authoritative for authorization).
 *   4. Create the business row (driver/parent) linked by appwriteUserId.
 *   5. Roll back Auth user (and users row) if anything fails.
 *
 * The users row is created BEFORE the business row so that if the business
 * row creation fails the auth user gets fully cleaned up — and so that the
 * user can never log in with a stale Auth account that has no role attached.
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
  let usersRowId: string | null = null;

  try {
    const authUser = await createAuthUser({
      email,
      password: temporaryPassword,
      name: input.fullName,
    });
    appwriteUserId = authUser.$id;

    const usersRow = await usersService.create({
      appwriteUserId,
      role: input.role,
      status: "active",
    });
    usersRowId = usersRow.id;

    const record = await input.createRecord(appwriteUserId);

    return {
      record,
      credentials: { email, temporaryPassword },
    };
  } catch (error) {
    if (usersRowId) {
      try {
        await usersService.delete(usersRowId);
      } catch {
        // Best-effort rollback
      }
    }
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
