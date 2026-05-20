import { redirect } from "next/navigation";

/** @deprecated Use `/dashboard/live-map` */
export default function LiveTrackingRedirectPage() {
  redirect("/dashboard/live-map");
}
