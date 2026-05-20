import type { CredentialDeliveryChannel, CredentialDeliveryPayload } from "@/lib/provisioning/types";

/**
 * Placeholder for automated credential delivery.
 * Implement email / WhatsApp providers here without changing provisioning services.
 */
export async function deliverCredentials(
  channel: CredentialDeliveryChannel,
  _payload: CredentialDeliveryPayload,
): Promise<{ sent: boolean; channel: CredentialDeliveryChannel }> {
  if (channel === "manual") {
    return { sent: false, channel };
  }

  // Future: integrate Resend, SendGrid, Twilio WhatsApp, etc.
  throw new Error(`Canal de entrega "${channel}" aún no está configurado.`);
}
