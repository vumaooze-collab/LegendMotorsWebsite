import type { AppUser } from "@/types/auth";

export type Permission =
  | "dashboard:view"
  | "inventory:view"
  | "inventory:manage"
  | "customers:view"
  | "customers:manage"
  | "sales:view"
  | "sales:manage"
  | "expenses:view"
  | "expenses:manage"
  | "reports:view"
  | "users:manage"
  | "settings:manage"
  | "admin:full";

export const PERMISSIONS_BY_ROLE: Record<"ADMIN" | "MANAGER" | "STAFF", Permission[]> = {
  ADMIN: [
    "dashboard:view",
    "inventory:view",
    "inventory:manage",
    "customers:view",
    "customers:manage",
    "sales:view",
    "sales:manage",
    "expenses:view",
    "expenses:manage",
    "reports:view",
    "users:manage",
    "settings:manage",
    "admin:full",
  ],
  MANAGER: [
    "dashboard:view",
    "inventory:view",
    "inventory:manage",
    "customers:view",
    "customers:manage",
    "sales:view",
    "sales:manage",
    "expenses:view",
    "expenses:manage",
    "reports:view",
  ],
  STAFF: ["dashboard:view", "inventory:view", "customers:view", "sales:view"],
};

export function hasPermission(user: Pick<AppUser, "role"> | null, permission: Permission): boolean {
  const roleName = user?.role?.name as keyof typeof PERMISSIONS_BY_ROLE | undefined;

  if (!roleName) {
    return false;
  }

  return PERMISSIONS_BY_ROLE[roleName].includes(permission);
}

export function canAccessAdmin(user: Pick<AppUser, "role"> | null): boolean {
  return hasPermission(user, "admin:full") || hasPermission(user, "dashboard:view");
}
