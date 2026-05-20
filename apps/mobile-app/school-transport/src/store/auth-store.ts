import { create } from "zustand";
import type { Models } from "appwrite";
import type { Driver, Parent, SessionStudent, TransportSession, Vehicle } from "@school/types";
import type { UserRole } from "@/types/auth";
import { authService } from "@/services/authService";
import { driverService } from "@/services/driverService";
import { parentService } from "@/services/parentService";
import { pushNotificationService } from "@/services/pushNotificationService";
import { transportSessionService } from "@/services/transportSessionService";
import { sessionStudentService } from "@/services/sessionStudentService";
import { usersService } from "@/services/usersService";
import { useParentNotificationsStore } from "@/store/parent-notifications-store";
import { useParentStore } from "@/store/parent-store";
import { useParentTrackingStore } from "@/store/parent-tracking-store";
import { useTrackingStore } from "@/store/tracking-store";

class MobileAuthorizationError extends Error {
  constructor(
    message: string,
    public readonly reason: "admin-blocked" | "inactive" | "unlinked",
  ) {
    super(message);
    this.name = "MobileAuthorizationError";
  }
}

type AuthState = {
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  user: Models.User<Models.Preferences> | null;
  role: UserRole;
  driver: Driver | null;
  parent: Parent | null;
  vehicle: Vehicle | null;
  activeSession: TransportSession | null;
  sessionStudents: SessionStudent[];
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<UserRole>;
  logout: () => Promise<void>;
  refreshOperationalData: () => Promise<void>;
  refreshParentData: () => Promise<void>;
  setActiveSession: (session: TransportSession | null) => void;
  setSessionStudents: (students: SessionStudent[]) => void;
  updateSessionStudent: (student: SessionStudent) => void;
};

/**
 * Resolve the authoritative role for a mobile login.
 *
 * The mobile app accepts ONLY drivers and parents. We:
 *   1. Look up the `users` table (source of truth). Reject `admin` and any
 *      `inactive` account immediately so the user cannot proceed.
 *   2. Fall back to drivers/parents tables when the users row doesn't exist
 *      (backward compatibility with accounts provisioned before the users
 *      table existed).
 *
 * Throws `MobileAuthorizationError` for any condition that requires the user
 * to be logged out (admin trying mobile, inactive account, etc.).
 */
async function resolveRole(
  user: Models.User<Models.Preferences>,
): Promise<{ role: UserRole; driver: Driver | null; parent: Parent | null }> {
  let canonicalRole: "admin" | "driver" | "parent" | null = null;
  try {
    const usersRow = await usersService.getByAppwriteUserId(user.$id);
    if (usersRow) {
      if (usersRow.status !== "active") {
        throw new MobileAuthorizationError(
          "Su cuenta está inactiva. Contacte al administrador.",
          "inactive",
        );
      }
      canonicalRole = usersRow.role;
    }
  } catch (error) {
    if (error instanceof MobileAuthorizationError) throw error;
    // Users table unavailable or row missing — fall through to legacy lookup.
  }

  if (canonicalRole === "admin") {
    throw new MobileAuthorizationError(
      "Las cuentas de administrador solo pueden iniciar sesión en el panel web. Use el portal web.",
      "admin-blocked",
    );
  }

  if (canonicalRole === "driver" || canonicalRole === null) {
    const driver = await driverService.getByAppwriteUserId(user.$id);
    if (driver?.status) {
      return { role: "driver", driver, parent: null };
    }
    if (canonicalRole === "driver") {
      throw new MobileAuthorizationError(
        "Su cuenta de conductor no está activa. Contacte al administrador.",
        "inactive",
      );
    }
  }

  if (canonicalRole === "parent" || canonicalRole === null) {
    const parent = await parentService.getByAppwriteUserId(user.$id);
    if (parent?.status) {
      return { role: "parent", driver: null, parent };
    }
    if (canonicalRole === "parent") {
      throw new MobileAuthorizationError(
        "Su cuenta de padre/madre no está activa. Contacte al administrador.",
        "inactive",
      );
    }
  }

  return { role: null, driver: null, parent: null };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isHydrated: false,
  isLoading: false,
  error: null,
  user: null,
  role: null,
  driver: null,
  parent: null,
  vehicle: null,
  activeSession: null,
  sessionStudents: [],

  hydrate: async () => {
    set({ isLoading: true, error: null });
    try {
      const restored = await authService.restoreSession();
      if (!restored) {
        set({ isHydrated: true, isLoading: false });
        return;
      }
      const user = await authService.getCurrentUser();
      if (!user) {
        set({ isHydrated: true, isLoading: false });
        return;
      }
      let resolved: { role: UserRole; driver: Driver | null; parent: Parent | null };
      try {
        resolved = await resolveRole(user);
      } catch (error) {
        // Persisted session belongs to an account that should not be in this
        // app (admin, inactive, etc.) — clear it on disk so we land on /login.
        await authService.logout();
        throw error;
      }
      const { role, driver, parent } = resolved;
      set({ user, role, driver, parent });
      if (role === "driver" && driver) {
        await get().refreshOperationalData();
      }
      if (role === "parent" && parent) {
        useParentStore.getState().setParent(parent);
        await get().refreshParentData();
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "No se pudo restaurar la sesión",
      });
    } finally {
      set({ isHydrated: true, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      await authService.login(email, password);
      const user = await authService.getCurrentUser();
      if (!user) throw new Error("No se pudo obtener el usuario autenticado.");

      let resolved: { role: UserRole; driver: Driver | null; parent: Parent | null };
      try {
        resolved = await resolveRole(user);
      } catch (error) {
        // Reject the just-created Appwrite session so the user cannot keep
        // a half-authenticated state on the device.
        await authService.logout();
        throw error;
      }

      const { role, driver, parent } = resolved;
      if (!role) {
        await authService.logout();
        throw new Error(
          "Su cuenta no está vinculada a un conductor o padre activo. Contacte al administrador.",
        );
      }

      set({ user, role, driver, parent });
      if (role === "driver" && driver) {
        await get().refreshOperationalData();
      }
      if (role === "parent" && parent) {
        useParentStore.getState().setParent(parent);
        await get().refreshParentData();
        void pushNotificationService.registerPushToken(parent.id);
      }
      return role;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al iniciar sesión";
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    const { parent } = get();
    useTrackingStore.getState().stopTracking();
    if (parent) {
      await pushNotificationService.deactivateTokensForParent(parent.id).catch(() => undefined);
    }
    useParentStore.getState().reset();
    useParentNotificationsStore.getState().reset();
    useParentTrackingStore.getState().reset();
    await authService.logout();
    set({
      user: null,
      role: null,
      driver: null,
      parent: null,
      vehicle: null,
      activeSession: null,
      sessionStudents: [],
      error: null,
    });
  },

  refreshOperationalData: async () => {
    const { driver } = get();
    if (!driver) return;

    const [vehicle, session] = await Promise.all([
      driverService.getAssignedVehicle(driver.id),
      transportSessionService.getOperationalSessionForDriver(driver.id),
    ]);

    let students: SessionStudent[] = [];
    if (session) {
      students = await sessionStudentService.getSessionStudents(session.id);
    }

    set({ vehicle, activeSession: session, sessionStudents: students });
  },

  refreshParentData: async () => {
    const { parent } = get();
    if (!parent) return;
    await useParentStore.getState().refreshParentData(parent.id);
    await useParentNotificationsStore.getState().loadNotifications(parent.id);
  },

  setActiveSession: (session) => set({ activeSession: session }),
  setSessionStudents: (students) => set({ sessionStudents: students }),

  updateSessionStudent: (student) => {
    set((state) => ({
      sessionStudents: state.sessionStudents.map((s) =>
        s.id === student.id ? student : s,
      ),
    }));
  },
}));
