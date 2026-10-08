import { DEMO_VEHICLES } from "@/data/vehicles";

export type InventoryStatus = "AVAILABLE" | "RESERVED" | "SOLD" | "SERVICE" | "ARCHIVED";

export interface InventoryVehicle {
  id: string;
  stockNumber: string;
  make: string;
  model: string;
  year: number;
  registration?: string;
  vin?: string;
  mileage: number;
  fuelType: string;
  transmission: string;
  colour?: string;
  condition?: string;
  status: InventoryStatus;
  purchasePrice: number;
  sellingPrice: number;
  supplier: string;
  dateAcquired: string;
  dateSold?: string;
  description: string;
  featured: boolean;
  image: string;
  imageAlt: string;
}

export const INVENTORY_STATUSES: InventoryStatus[] = [
  "AVAILABLE",
  "RESERVED",
  "SOLD",
  "SERVICE",
  "ARCHIVED",
];

export function getInventoryRecords(): InventoryVehicle[] {
  return DEMO_VEHICLES.map((vehicle, index) => ({
    id: vehicle.id,
    stockNumber: `LM-${String(index + 1).padStart(4, "0")}`,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    registration: `${vehicle.make.slice(0, 2).toUpperCase()}-${vehicle.year}`,
    vin: `VIN-${vehicle.make.slice(0, 3).toUpperCase()}-${String(index + 1).padStart(4, "0")}`,
    mileage: vehicle.mileage,
    fuelType: vehicle.fuel,
    transmission: vehicle.transmission,
    colour: "Silver",
    condition: "Excellent",
    status: index % 4 === 0 ? "AVAILABLE" : index % 4 === 1 ? "RESERVED" : index % 4 === 2 ? "SERVICE" : "AVAILABLE",
    purchasePrice: Math.round(vehicle.price * 0.82),
    sellingPrice: vehicle.price,
    supplier: "Legend Motors Procurement",
    dateAcquired: "2025-01-12",
    dateSold: index % 5 === 0 ? "2025-02-15" : undefined,
    description: vehicle.description,
    featured: vehicle.featured,
    image: vehicle.image,
    imageAlt: vehicle.imageAlt,
  }));
}

export function getInventorySnapshot() {
  const vehicles = getInventoryRecords();
  const summary = {
    total: vehicles.length,
    available: vehicles.filter((vehicle) => vehicle.status === "AVAILABLE").length,
    reserved: vehicles.filter((vehicle) => vehicle.status === "RESERVED").length,
    sold: vehicles.filter((vehicle) => vehicle.status === "SOLD").length,
    service: vehicles.filter((vehicle) => vehicle.status === "SERVICE").length,
    archived: vehicles.filter((vehicle) => vehicle.status === "ARCHIVED").length,
    inventoryValue: vehicles.reduce((total, vehicle) => total + vehicle.purchasePrice, 0),
    potentialSalesValue: vehicles.reduce((total, vehicle) => total + vehicle.sellingPrice, 0),
  };

  return { vehicles, summary };
}

export function searchInventory(
  query: string,
  filters: {
    make?: string;
    fuelType?: string;
    status?: InventoryStatus | "ALL";
  } = {},
) {
  const normalized = query.trim().toLowerCase();

  return getInventoryRecords().filter((vehicle) => {
    const matchesQuery =
      normalized.length === 0 ||
      `${vehicle.make} ${vehicle.model} ${vehicle.year} ${vehicle.fuelType} ${vehicle.transmission}`
        .toLowerCase()
        .includes(normalized);

    const matchesMake = !filters.make || filters.make === "ALL" || vehicle.make === filters.make;
    const matchesFuel = !filters.fuelType || filters.fuelType === "ALL" || vehicle.fuelType === filters.fuelType;
    const matchesStatus = !filters.status || filters.status === "ALL" || vehicle.status === filters.status;

    return matchesQuery && matchesMake && matchesFuel && matchesStatus;
  });
}
