export type AppRoleName = "ADMIN" | "MANAGER" | "STAFF";

export interface AppRole {
  id: string;
  name: AppRoleName;
  description?: string | null;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
  lastLoginAt?: Date | null;
  roleId?: string | null;
  role?: AppRole | null;
  passwordHash?: string | null;
}
