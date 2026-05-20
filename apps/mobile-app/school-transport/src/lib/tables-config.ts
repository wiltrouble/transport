const TABLE_DEFAULTS = {
  EXPO_PUBLIC_APPWRITE_PARENTS_TABLE: "parents",
  EXPO_PUBLIC_APPWRITE_DRIVERS_TABLE: "drivers",
  EXPO_PUBLIC_APPWRITE_VEHICLES_TABLE: "vehicles",
  EXPO_PUBLIC_APPWRITE_VEHICLE_DRIVERS_TABLE: "vehicle_drivers",
  EXPO_PUBLIC_APPWRITE_PARENT_STUDENTS_TABLE: "parent_student",
  EXPO_PUBLIC_APPWRITE_TRANSPORT_SESSIONS_TABLE: "transport_sessions",
  EXPO_PUBLIC_APPWRITE_SESSION_STUDENTS_TABLE: "session_students",
  EXPO_PUBLIC_APPWRITE_STUDENT_STUDENT_TABLE: "students",
  EXPO_PUBLIC_APPWRITE_GPS_TRACKING_TABLE: "gps_tracking",
  EXPO_PUBLIC_APPWRITE_NOTIFICATIONS_TABLE: "notifications",
  EXPO_PUBLIC_APPWRITE_PUSH_TOKENS_TABLE: "push_tokens",
  EXPO_PUBLIC_APPWRITE_USERS_TABLE: "users",
} as const;

function tableId(key: keyof typeof TABLE_DEFAULTS): string {
  return process.env[key]?.trim() || TABLE_DEFAULTS[key];
}

export function getTablesConfig() {
  const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID?.trim();

  if (!databaseId) {
    throw new Error(
      "Missing EXPO_PUBLIC_APPWRITE_DATABASE_ID. Copy env.local.template to .env and set your Appwrite database id.",
    );
  }

  return {
    databaseId,
    parentsTableId: tableId("EXPO_PUBLIC_APPWRITE_PARENTS_TABLE"),
    driversTableId: tableId("EXPO_PUBLIC_APPWRITE_DRIVERS_TABLE"),
    vehiclesTableId: tableId("EXPO_PUBLIC_APPWRITE_VEHICLES_TABLE"),
    vehicleDriversTableId: tableId("EXPO_PUBLIC_APPWRITE_VEHICLE_DRIVERS_TABLE"),
    parentStudentsTableId: tableId("EXPO_PUBLIC_APPWRITE_PARENT_STUDENTS_TABLE"),
    transportSessionsTableId: tableId("EXPO_PUBLIC_APPWRITE_TRANSPORT_SESSIONS_TABLE"),
    sessionStudentsTableId: tableId("EXPO_PUBLIC_APPWRITE_SESSION_STUDENTS_TABLE"),
    studentsTableId: tableId("EXPO_PUBLIC_APPWRITE_STUDENT_STUDENT_TABLE"),
    gpsTrackingTableId: tableId("EXPO_PUBLIC_APPWRITE_GPS_TRACKING_TABLE"),
    notificationsTableId: tableId("EXPO_PUBLIC_APPWRITE_NOTIFICATIONS_TABLE"),
    pushTokensTableId: tableId("EXPO_PUBLIC_APPWRITE_PUSH_TOKENS_TABLE"),
    usersTableId: tableId("EXPO_PUBLIC_APPWRITE_USERS_TABLE"),
  };
}
