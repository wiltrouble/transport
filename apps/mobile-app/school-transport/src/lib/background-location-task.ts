/**
 * Background GPS architecture placeholder (expo-task-manager).
 * Foreground-only tracking is active; background will plug in here later.
 */
export const BACKGROUND_GPS_TASK_NAME = "school-transport-background-gps";

/** No-op until background tracking is implemented. */
export async function registerBackgroundGpsTask(): Promise<void> {
  if (__DEV__) {
    console.info(
      `[gps] Background task "${BACKGROUND_GPS_TASK_NAME}" reserved — foreground tracking only.`,
    );
  }
}
