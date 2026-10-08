export type FinancialMetric = number;

export interface InventorySummary {
  inventoryValue: number;
  potentialSalesValue: number;
  potentialProfit: number;
  averageSellingPrice: number;
  averageProfitPerVehicle: number;
}

export interface DealershipSummary {
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
}

export function calculateGrossProfit(sellingPrice: number, vehicleCost: number): number {
  return Math.max(sellingPrice - vehicleCost, 0);
}

export function calculateNetProfit(grossProfit: number, operatingExpenses: number): number {
  return grossProfit - operatingExpenses;
}

export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function calculateInventorySummary(
  vehicles: Array<{ purchasePrice?: number | null; sellingPrice?: number | null }>,
): InventorySummary {
  const inventoryValue = vehicles.reduce(
    (total, vehicle) => total + (vehicle.purchasePrice ?? 0),
    0,
  );

  const potentialSalesValue = vehicles.reduce(
    (total, vehicle) => total + (vehicle.sellingPrice ?? 0),
    0,
  );

  const potentialProfit = vehicles.reduce(
    (total, vehicle) =>
      total + calculateGrossProfit(vehicle.sellingPrice ?? 0, vehicle.purchasePrice ?? 0),
    0,
  );

  return {
    inventoryValue,
    potentialSalesValue,
    potentialProfit,
    averageSellingPrice: calculateAverage(
      vehicles.map((vehicle) => vehicle.sellingPrice ?? 0).filter((value) => value > 0),
    ),
    averageProfitPerVehicle: calculateAverage(
      vehicles.map((vehicle) =>
        calculateGrossProfit(vehicle.sellingPrice ?? 0, vehicle.purchasePrice ?? 0),
      ),
    ),
  };
}

export function calculateDealershipSummary(
  salesRevenue: number,
  vehicleCosts: number,
  operatingExpenses: number,
): DealershipSummary {
  const grossProfit = calculateGrossProfit(salesRevenue, vehicleCosts);

  return {
    revenue: salesRevenue,
    costOfGoodsSold: vehicleCosts,
    grossProfit,
    operatingExpenses,
    netProfit: calculateNetProfit(grossProfit, operatingExpenses),
  };
}
