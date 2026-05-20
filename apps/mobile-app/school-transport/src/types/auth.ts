import type { Models } from "appwrite";
import type { Driver } from "@school/types";
import type { SessionStudent, TransportSession, Vehicle } from "@school/types";

/**
 * Mobile-only narrowed role. The mobile app accepts ONLY drivers and parents.
 * `null` represents "session present but no allowed role" — the auth store
 * surfaces this as a login failure (with logout) so admins/unknown accounts
 * cannot proceed past the login screen.
 */
export type UserRole = "driver" | "parent" | null;

export type AuthUser = Models.User<Models.Preferences>;

export type DriverOperationalContext = {
  driver: Driver;
  vehicle: Vehicle | null;
  session: TransportSession | null;
  students: SessionStudent[];
};
