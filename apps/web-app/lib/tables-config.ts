/**
 * Appwrite Tables (database + table IDs). Set these in `.env.local`.
 */
export function getTablesConfig() {
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const parentsTableId = process.env.NEXT_PUBLIC_APPWRITE_STUDENT_PARENT_TABLE;
  const studentsTableId = process.env.NEXT_PUBLIC_APPWRITE_STUDENT_STUDENT_TABLE;
  const parentStudentsTableId =
    process.env.NEXT_PUBLIC_APPWRITE_PARENT_STUDENTS_TABLE;
  const driversTableId = process.env.NEXT_PUBLIC_APPWRITE_DRIVERS_TABLE;
  const vehiclesTableId = process.env.NEXT_PUBLIC_APPWRITE_VEHICLES_TABLE;
  const vehicleStudentsTableId =
    process.env.NEXT_PUBLIC_APPWRITE_VEHICLE_STUDENTS_TABLE;
  const vehicleDriversTableId =
    process.env.NEXT_PUBLIC_APPWRITE_VEHICLE_DRIVERS_TABLE;
  const transportSessionsTableId =
    process.env.NEXT_PUBLIC_APPWRITE_TRANSPORT_SESSIONS_TABLE;
  const sessionStudentsTableId =
    process.env.NEXT_PUBLIC_APPWRITE_SESSION_STUDENTS_TABLE;
  const storageBucketId = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID;
  const gpsTrackingTableId = process.env.NEXT_PUBLIC_APPWRITE_GPS_TRACKING_TABLE;
  const notificationsTableId =
    process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_TABLE?.trim() || "notifications";
  const usersTableId =
    process.env.NEXT_PUBLIC_APPWRITE_USERS_TABLE?.trim() || "users";

  if (
    !databaseId ||
    !parentsTableId ||
    !studentsTableId ||
    !parentStudentsTableId ||
    !driversTableId ||
    !vehiclesTableId ||
    !vehicleStudentsTableId ||
    !vehicleDriversTableId ||
    !transportSessionsTableId ||
    !sessionStudentsTableId ||
    !gpsTrackingTableId
  ) {
    throw new Error(
      "Missing Appwrite Tables env: DATABASE_ID, parent/student tables, drivers, vehicles, vehicle_students, vehicle_drivers, transport_sessions, session_students, gps_tracking",
    );
  }

  return {
    databaseId,
    parentsTableId,
    studentsTableId,
    parentStudentsTableId,
    driversTableId,
    vehiclesTableId,
    vehicleStudentsTableId,
    vehicleDriversTableId,
    transportSessionsTableId,
    sessionStudentsTableId,
    gpsTrackingTableId,
    notificationsTableId,
    usersTableId,
    storageBucketId: storageBucketId ?? "",
  };
}
