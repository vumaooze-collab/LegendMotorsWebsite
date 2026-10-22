import { InventoryAdmin } from "@/components/inventory-admin";
import { InventoryCsvImport } from "@/components/inventory-csv-import";
import { hasPermission } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";

export default async function InventoryAdminPage() {
  const user = await getCurrentUser();
  const canManage = hasPermission(user, "inventory:manage");
  return (
    <>
      <main className="admin-main" style={{ maxWidth: 1280, margin: "0 auto", paddingBottom: 0 }}>
        <InventoryCsvImport canManage={canManage} />
      </main>
      <InventoryAdmin canManage={canManage} />
    </>
  );
}
