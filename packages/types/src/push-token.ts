export type PushTokenPlatform = "ios" | "android" | "web" | "unknown";

export type PushToken = {
  id: string;
  parentId: string;
  token: string;
  platform: PushTokenPlatform | string;
  deviceName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
