import { InventoryAdmin } from "@/components/inventory-admin";
import { hasPermission } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";

export default async function InventoryAdminPage() {
  const user = await getCurrentUser();
  return <InventoryAdmin canManage={hasPermission(user, "inventory:manage")} />;
}
