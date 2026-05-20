export type Driver = {
  id: string;
  appwriteUserId: string | null;
  fullName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiration: string;
  status: boolean;
};

export type DriverInput = Omit<Driver, "id" | "appwriteUserId"> & {
  appwriteUserId?: string | null;
};
