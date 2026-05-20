import type { Driver, Parent } from "@school/types";

/** One-time credentials shown to an admin after provisioning. Never persisted. */
export type ProvisioningCredentials = {
  email: string;
  temporaryPassword: string;
};

export type ProvisionUserResult = {
  userId: string;
  credentials: ProvisioningCredentials;
};

export type ProvisionDriverResult = {
  driver: Driver;
  credentials: ProvisioningCredentials;
};

export type ProvisionParentResult = {
  parent: Parent;
  credentials: ProvisioningCredentials;
};

/** Future channels for delivering credentials (email, WhatsApp, etc.). */
export type CredentialDeliveryChannel = "manual" | "email" | "whatsapp";

export type CredentialDeliveryPayload = ProvisioningCredentials & {
  recipientName: string;
  role: "driver" | "parent" | "supervisor" | "admin";
};
