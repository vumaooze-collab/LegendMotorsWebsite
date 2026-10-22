import { prisma } from "@/lib/db/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;
const money = (value: unknown) => Number(value ?? 0);

export async function getDealershipInsights() {
  const now = new Date();
  const salesSince = new Date(now.getTime() - 90 * DAY_MS);
  const enquiriesSince = new Date(now.getTime() - 30 * DAY_MS);

  const [vehicles, enquiries, recentSales] = await Promise.all([
    prisma.vehicle.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true, stockNumber: true, make: true, model: true, year: true,
        price: true, status: true, published: true, createdAt: true,
        sales: {
          where: { createdAt: { gte: salesSince } },
          select: { createdAt: true, quantity: true, unitPrice: true },
        },
      },
    }),
    prisma.enquiry.findMany({
      where: { createdAt: { gte: enquiriesSince } },
      select: { vehicleName: true, createdAt: true, status: true },
    }),
    prisma.saleItem.findMany({
      where: { createdAt: { gte: salesSince } },
      select: {
        quantity: true, unitPrice: true, createdAt: true,
        vehicle: { select: { id: true, make: true, model: true, year: true } },
      },
    }),
  ]);

  const activeStock = vehicles.filter((v) => v.status === "AVAILABLE" || v.status === "RESERVED");
  const inventoryValue = activeStock.reduce((sum, v) => sum + money(v.price), 0);
  const ageDays = (date: Date) => Math.max(0, Math.floor((now.getTime() - date.getTime()) / DAY_MS));

  const topValue = [...activeStock]
    .sort((a, b) => money(b.price) - money(a.price))
    .slice(0, 5)
    .map((v) => ({ id: v.id, name: `${v.year} ${v.make} ${v.model}`, stockNumber: v.stockNumber, price: money(v.price), status: v.status, ageDays: ageDays(v.createdAt) }));

  const slowStock = activeStock
    .map((v) => ({ id: v.id, name: `${v.year} ${v.make} ${v.model}`, stockNumber: v.stockNumber, price: money(v.price), ageDays: ageDays(v.createdAt), soldUnits90d: v.sales.reduce((sum, item) => sum + item.quantity, 0) }))
    .filter((v) => v.ageDays >= 45 && v.soldUnits90d === 0)
    .sort((a, b) => b.ageDays - a.ageDays)
    .slice(0, 10);

  // Combine all stock units of the same make/model/year.
  const modelSales = new Map<string, { name: string; units: number; salesValue: number; latestSale: Date }>();
  for (const item of recentSales) {
    const key = `${item.vehicle.make.trim().toLowerCase()}::${item.vehicle.model.trim().toLowerCase()}::${item.vehicle.year}`;
    const name = `${item.vehicle.year} ${item.vehicle.make} ${item.vehicle.model}`;
    const current = modelSales.get(key) ?? { name, units: 0, salesValue: 0, latestSale: item.createdAt };
    current.units += item.quantity;
    current.salesValue += money(item.unitPrice) * item.quantity;
    if (item.createdAt > current.latestSale) current.latestSale = item.createdAt;
    modelSales.set(key, current);
  }
  const hotModels = [...modelSales.values()]
    .sort((a, b) => b.units - a.units || b.salesValue - a.salesValue)
    .slice(0, 5)
    .map((v) => ({ ...v, salesValue: Math.round(v.salesValue) }));

  const interestCounts = new Map<string, number>();
  for (const enquiry of enquiries) {
    const key = (enquiry.vehicleName || "unspecified").trim().toLowerCase();
    interestCounts.set(key, (interestCounts.get(key) ?? 0) + 1);
  }
  const enquiryInterests = [...interestCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([interest, count]) => ({ interest, enquiries: count }));

  return {
    generatedAt: now.toISOString(),
    dataWindows: { salesDays: 90, enquiryDays: 30, slowStockDays: 45 },
    inventory: {
      totalVehicles: vehicles.length,
      activeVehicles: activeStock.length,
      available: vehicles.filter((v) => v.status === "AVAILABLE").length,
      reserved: vehicles.filter((v) => v.status === "RESERVED").length,
      sold: vehicles.filter((v) => v.status === "SOLD").length,
      activeInventoryValue: Math.round(inventoryValue),
      staleStockCount: slowStock.length,
      enquiriesLast30Days: enquiries.length,
      recordedUnitsSoldLast90Days: recentSales.reduce((sum, item) => sum + item.quantity, 0),
    },
    topValue, slowStock, hotModels, enquiryInterests,
    notes: [
      "Hot models combine recorded sales by make, model and year for the last 90 days; they do not represent national market demand.",
      "Enquiry interests are grouped from vehicle categories stored by the website.",
      "Slow stock means available or reserved vehicles at least 45 days old with no recorded sale-item activity in the last 90 days. Review manually before discounting.",
      "Results are only as complete as the records entered into the connected database.",
    ],
  };
}
