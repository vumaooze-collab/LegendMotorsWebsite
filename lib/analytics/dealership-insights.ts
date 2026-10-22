import { prisma } from "@/lib/db/prisma";
import { getMarketNewsSignals } from "@/lib/analytics/market-feed";

const DAY_MS = 24 * 60 * 60 * 1000;
const money = (value: unknown) => Number(value ?? 0);

export async function getDealershipInsights() {
  const now = new Date();
  const salesSince = new Date(now.getTime() - 90 * DAY_MS);
  const enquiriesSince = new Date(now.getTime() - 30 * DAY_MS);

  const [vehicles, enquiries, recentSales, marketNews] = await Promise.all([
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
    getMarketNewsSignals(),
  ]);

  const activeStock = vehicles.filter((v) => v.status === "AVAILABLE" || v.status === "RESERVED");
  const inventoryValue = activeStock.reduce((sum, v) => sum + money(v.price), 0);
  const ageDays = (date: Date) => Math.max(0, Math.floor((now.getTime() - date.getTime()) / DAY_MS));

  const topValue = [...activeStock]
    .sort((a, b) => money(b.price) - money(a.price))
    .slice(0, 5)
    .map((v) => ({
      id: v.id, name: `${v.year} ${v.make} ${v.model}`, stockNumber: v.stockNumber,
      price: money(v.price), status: v.status, ageDays: ageDays(v.createdAt),
    }));

  const slowStock = activeStock
    .map((v) => ({
      id: v.id, name: `${v.year} ${v.make} ${v.model}`, stockNumber: v.stockNumber,
      price: money(v.price), ageDays: ageDays(v.createdAt),
      soldUnits90d: v.sales.reduce((sum, item) => sum + item.quantity, 0),
    }))
    .filter((v) => v.ageDays >= 45 && v.soldUnits90d === 0)
    .sort((a, b) => b.ageDays - a.ageDays)
    .slice(0, 10);

  const modelSales = new Map<string, { name: string; units: number; salesValue: number; latestSale: Date }>();
  for (const item of recentSales) {
    const name = `${item.vehicle.year} ${item.vehicle.make} ${item.vehicle.model}`;
    const existing = modelSales.get(item.vehicle.id) ?? { name, units: 0, salesValue: 0, latestSale: item.createdAt };
    existing.units += item.quantity;
    existing.salesValue += money(item.unitPrice) * item.quantity;
    if (item.createdAt > existing.latestSale) existing.latestSale = item.createdAt;
    modelSales.set(item.vehicle.id, existing);
  }
  const hotModels = [...modelSales.values()]
    .sort((a, b) => b.units - a.units || b.salesValue - a.salesValue)
    .slice(0, 5)
    .map((item) => ({ ...item, salesValue: Math.round(item.salesValue) }));

  const feedText = marketNews.items.map((item) => `${item.title} ${item.summary}`).join(" ").toLowerCase();
  const countOccurrences = (text: string, phrase: string) => {
    const normalizedPhrase = phrase.trim().toLowerCase();
    if (!normalizedPhrase) return 0;
    return text.split(normalizedPhrase).length - 1;
  };
  const stockMentions = vehicles.map((vehicle) => {
    const name = `${vehicle.make} ${vehicle.model}`;
    return { name, mentions: countOccurrences(feedText, name) };
  }).filter((item) => item.mentions > 0).sort((a, b) => b.mentions - a.mentions).slice(0, 5);
  const marketThemes = [
    { label: "Demand / popularity", terms: ["demand", "popular", "best-selling", "bestselling", "sales surge", "buyer interest"] },
    { label: "Price changes", terms: ["price", "pricing", "discount", "cheaper", "expensive", "cost"] },
    { label: "Fuel economy", terms: ["fuel economy", "fuel-efficient", "fuel efficient", "mileage", "consumption"] },
    { label: "Electric / hybrid", terms: ["electric vehicle", "electric car", "hybrid"] },
    { label: "Imports / supply", terms: ["import", "supply", "auction", "shipping", "customs"] },
  ].map((theme) => ({
    theme: theme.label,
    mentions: theme.terms.reduce((count, term) => count + countOccurrences(feedText, term), 0),
  })).filter((theme) => theme.mentions > 0).sort((a, b) => b.mentions - a.mentions);

  const interestCounts = new Map<string, number>();"), "gi")) || []).length,
  })).filter((item) => item.mentions > 0).sort((a, b) => b.mentions - a.mentions).slice(0, 5);
  const marketThemes = [
    { label: "Demand / popularity", terms: ["demand", "popular", "best-selling", "bestselling", "sales surge", "buyer interest"] },
    { label: "Price changes", terms: ["price", "pricing", "discount", "cheaper", "expensive", "cost"] },
    { label: "Fuel economy", terms: ["fuel economy", "fuel-efficient", "fuel efficient", "mileage", "consumption"] },
    { label: "Electric / hybrid", terms: ["electric vehicle", "electric car", "ev ", "hybrid"] },
    { label: "Imports / supply", terms: ["import", "supply", "auction", "shipping", "customs"] },
  ].map((theme) => ({ theme: theme.label, mentions: theme.terms.reduce((count, term) => count + (feedText.match(new RegExp(term.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\  const interestCounts = new Map<string, number>();"), "g")) || []).length, 0) }))
    .filter((theme) => theme.mentions > 0).sort((a, b) => b.mentions - a.mentions);

  const interestCounts = new Map<string, number>();
  for (const enquiry of enquiries) {
    const category = (enquiry.vehicleName || "unspecified").trim().toLowerCase();
    interestCounts.set(category, (interestCounts.get(category) ?? 0) + 1);
  }
  const enquiryInterests = [...interestCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([interest, enquiries]) => ({ interest, enquiries }));

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
    topValue,
    slowStock,
    hotModels,
    enquiryInterests,
    marketNews: { ...marketNews, stockMentions, marketThemes },
    notes: [
      "Hot models are ranked from recorded vehicle sales in the last 90 days, not national market data.",
      "Enquiry interests are grouped from the enquiry category stored by the website; they do not identify individual vehicles unless the enquiry form is updated to capture a stock number.",
      "Slow stock means available or reserved vehicles at least 45 days old with no recorded sale-item activity in the last 90 days. Review manually before discounting.",
      "Results are only as complete as the records entered into the connected database.",
      "Market-feed themes are simple keyword counts from the configured feed, not proof of local sales demand or statistically validated price estimates.",
    ],
  };
}
