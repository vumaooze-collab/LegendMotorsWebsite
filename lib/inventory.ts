import { Prisma, VehicleStatus } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";

export const INVENTORY_STATUSES = ["AVAILABLE", "RESERVED", "SOLD", "DRAFT", "ARCHIVED"] as const;
export type InventoryStatus = (typeof INVENTORY_STATUSES)[number];

const imageInputSchema = z.object({
  url: z.string().url().max(2048).refine((value) => /^https:\/\//i.test(value), "Image URL must use HTTPS."),
  altText: z.string().trim().max(160).optional().nullable(),
  displayOrder: z.number().int().min(0).default(0),
  isPrimary: z.boolean().default(false),
}).strict();

const vehicleInputSchema = z.object({
  stockNumber: z.string().trim().min(2).max(40),
  make: z.string().trim().min(2).max(60),
  model: z.string().trim().min(2).max(80),
  variant: z.string().trim().max(80).optional().nullable(),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 2),
  price: z.number().finite().nonnegative(),
  currency: z.string().trim().regex(/^[A-Z]{3}$/).default("MWK"),
  mileage: z.number().int().nonnegative(),
  transmission: z.string().trim().min(2).max(40),
  fuelType: z.string().trim().min(2).max(40),
  drivetrain: z.string().trim().max(40).optional().nullable(),
  bodyType: z.string().trim().max(40).optional().nullable(),
  color: z.string().trim().max(60).optional().nullable(),
  engine: z.string().trim().max(80).optional().nullable(),
  condition: z.string().trim().max(80).optional().nullable(),
  description: z.string().trim().max(4000).optional().nullable(),
  status: z.enum(INVENTORY_STATUSES).default("DRAFT"),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  images: z.array(imageInputSchema).max(30).default([]),
}).strict();

export const createVehicleSchema = vehicleInputSchema.refine(
  (vehicle) => vehicle.images.filter((image) => image.isPrimary).length <= 1,
  "Only one image may be primary.",
);

export const updateVehicleSchema = z.object({
  stockNumber: z.string().trim().min(2).max(40).optional(),
  make: z.string().trim().min(2).max(60).optional(),
  model: z.string().trim().min(2).max(80).optional(),
  variant: z.string().trim().max(80).nullable().optional(),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 2).optional(),
  price: z.number().finite().nonnegative().optional(),
  currency: z.string().trim().regex(/^[A-Z]{3}$/).optional(),
  mileage: z.number().int().nonnegative().optional(),
  transmission: z.string().trim().min(2).max(40).optional(),
  fuelType: z.string().trim().min(2).max(40).optional(),
  drivetrain: z.string().trim().max(40).nullable().optional(),
  bodyType: z.string().trim().max(40).nullable().optional(),
  color: z.string().trim().max(60).nullable().optional(),
  engine: z.string().trim().max(80).nullable().optional(),
  condition: z.string().trim().max(80).nullable().optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  featured: z.boolean().optional(),
}).strict().refine(
  (payload) => Object.keys(payload).length > 0,
  "At least one vehicle field is required.",
);

export const statusSchema = z.object({ status: z.enum(INVENTORY_STATUSES) }).strict();
export const publicationSchema = z.object({ published: z.boolean() }).strict();
export const addImageSchema = imageInputSchema.omit({ isPrimary: true }).extend({ isPrimary: z.boolean().default(false) }).strict();
export const updateImageSchema = z.object({
  url: z.string().url().max(2048).refine((value) => /^https:\/\//i.test(value), "Image URL must use HTTPS.").optional(),
  altText: z.string().trim().max(160).nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isPrimary: z.boolean().optional(),
}).strict().refine(
  (payload) => Object.keys(payload).length > 0,
  "At least one image field is required.",
);

const vehicleInclude = {
  vehicleImages: { orderBy: [{ displayOrder: "asc" as const }, { createdAt: "asc" as const }] },
};

type VehicleRow = Prisma.VehicleGetPayload<{ include: typeof vehicleInclude }>;
type ImageInput = z.infer<typeof imageInputSchema>;

export interface InventoryImage {
  id: string;
  url: string;
  altText: string | null;
  displayOrder: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface InventoryVehicle {
  id: string;
  stockNumber: string;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  price: number;
  currency: string;
  mileage: number;
  transmission: string;
  fuelType: string;
  drivetrain: string | null;
  bodyType: string | null;
  color: string | null;
  engine: string | null;
  condition: string | null;
  description: string | null;
  status: InventoryStatus;
  featured: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  images: InventoryImage[];
}

export interface PublicVehicle extends Pick<InventoryVehicle,
  "id" | "make" | "model" | "variant" | "year" | "price" | "currency" | "mileage" |
  "transmission" | "fuelType" | "drivetrain" | "bodyType" | "color" | "engine" |
  "condition" | "description" | "status" | "featured"> {
  images: Array<Pick<InventoryImage, "id" | "url" | "altText" | "displayOrder" | "isPrimary">>;
}

function mapVehicle(row: VehicleRow | (Prisma.VehicleGetPayload<object> & { vehicleImages?: Prisma.VehicleImageGetPayload<object>[] })): InventoryVehicle {
  return {
    id: row.id,
    stockNumber: row.stockNumber,
    make: row.make,
    model: row.model,
    variant: row.variant,
    year: row.year,
    price: Number(row.price),
    currency: row.currency,
    mileage: row.mileage,
    transmission: row.transmission,
    fuelType: row.fuelType,
    drivetrain: row.drivetrain,
    bodyType: row.bodyType,
    color: row.color,
    engine: row.engine,
    condition: row.condition,
    description: row.description,
    status: row.status,
    featured: row.featured,
    published: row.published,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    images: (row.vehicleImages ?? []).map((image) => ({
      id: image.id,
      url: image.url,
      altText: image.altText,
      displayOrder: image.displayOrder,
      isPrimary: image.isPrimary,
      createdAt: image.createdAt.toISOString(),
    })),
  };
}

export function toPublicVehicle(vehicle: InventoryVehicle): PublicVehicle {
  return {
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    variant: vehicle.variant,
    year: vehicle.year,
    price: vehicle.price,
    currency: vehicle.currency,
    mileage: vehicle.mileage,
    transmission: vehicle.transmission,
    fuelType: vehicle.fuelType,
    drivetrain: vehicle.drivetrain,
    bodyType: vehicle.bodyType,
    color: vehicle.color,
    engine: vehicle.engine,
    condition: vehicle.condition,
    description: vehicle.description,
    status: vehicle.status,
    featured: vehicle.featured,
    images: vehicle.images.map(({ id, url, altText, displayOrder, isPrimary }) => ({
      id, url, altText, displayOrder, isPrimary,
    })),
  };
}

function vehicleData(input: z.infer<typeof createVehicleSchema>) {
  const data = Object.fromEntries(Object.entries(input).filter(([key]) => key !== "images")) as Omit<z.infer<typeof createVehicleSchema>, "images">;
  return {
    ...data,
    price: new Prisma.Decimal(data.price),
    status: data.status as VehicleStatus,
  };
}

function vehicleUpdateData(input: z.infer<typeof updateVehicleSchema>): Prisma.VehicleUpdateInput {
  const data: Prisma.VehicleUpdateInput = { ...input };
  if (input.price !== undefined) data.price = new Prisma.Decimal(input.price);
  return data;
}

async function audit(
  tx: Prisma.TransactionClient,
  userId: string,
  action: string,
  entityId: string,
  details: Record<string, unknown>,
) {
  await tx.auditLog.create({
    data: { userId, action, entity: "Vehicle", entityId, details: JSON.stringify(details) },
  });
}

export async function listInventoryVehicles() {
  const rows = await prisma.vehicle.findMany({ include: vehicleInclude, orderBy: { updatedAt: "desc" } });
  return rows.map(mapVehicle);
}

export async function getInventoryVehicle(id: string) {
  const row = await prisma.vehicle.findUnique({ where: { id }, include: vehicleInclude });
  return row ? mapVehicle(row) : null;
}

export async function listPublicVehicles(filters: {
  query?: string;
  make?: string;
  year?: number;
  minPrice?: number;
  maxPrice?: number;
  maxMileage?: number;
  fuelType?: string;
  transmission?: string;
  page?: number;
  pageSize?: number;
  sort?: "recent" | "price-asc" | "price-desc";
} = {}) {
  const where: Prisma.VehicleWhereInput = {
    published: true,
    status: { in: ["AVAILABLE", "RESERVED"] },
    ...(filters.make ? { make: { equals: filters.make, mode: "insensitive" } } : {}),
    ...(filters.year ? { year: filters.year } : {}),
    ...(filters.maxMileage !== undefined ? { mileage: { lte: filters.maxMileage } } : {}),
    ...(filters.fuelType ? { fuelType: { equals: filters.fuelType, mode: "insensitive" as const } } : {}),
    ...(filters.transmission ? { transmission: { equals: filters.transmission, mode: "insensitive" as const } } : {}),
    ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
      ? { price: { ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}), ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}) } }
      : {}),
    ...(filters.query ? {
      OR: [
        { make: { contains: filters.query, mode: "insensitive" } },
        { model: { contains: filters.query, mode: "insensitive" } },
        { variant: { contains: filters.query, mode: "insensitive" } },
        { bodyType: { contains: filters.query, mode: "insensitive" } },
      ],
    } : {}),
  };
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 24;
  const orderBy: Prisma.VehicleOrderByWithRelationInput[] = filters.sort === "price-asc"
    ? [{ price: "asc" }, { createdAt: "desc" }]
    : filters.sort === "price-desc"
      ? [{ price: "desc" }, { createdAt: "desc" }]
      : [{ featured: "desc" }, { createdAt: "desc" }];
  const [rows, total] = await Promise.all([
    prisma.vehicle.findMany({ where, include: vehicleInclude, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.vehicle.count({ where }),
  ]);
  return { vehicles: rows.map(mapVehicle).map(toPublicVehicle), total, page, pageSize, pageCount: Math.ceil(total / pageSize) };
}

export async function getPublicVehicle(id: string) {
  const vehicle = await getInventoryVehicle(id);
  return vehicle && isPublicVehicle(vehicle) ? toPublicVehicle(vehicle) : null;
}

export async function createInventoryVehicle(input: unknown, userId: string) {
  const parsed = createVehicleSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const row = await tx.vehicle.create({
      data: {
        ...vehicleData(parsed),
        vehicleImages: parsed.images.length ? { create: parsed.images as ImageInput[] } : undefined,
      },
      include: vehicleInclude,
    });
    await audit(tx, userId, "VEHICLE_CREATED", row.id, { stockNumber: row.stockNumber });
    return mapVehicle(row);
  });
}

export async function updateInventoryVehicle(id: string, input: unknown, userId: string) {
  const parsed = updateVehicleSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const row = await tx.vehicle.update({ where: { id }, data: vehicleUpdateData(parsed), include: vehicleInclude });
    await audit(tx, userId, "VEHICLE_UPDATED", row.id, { fields: Object.keys(parsed) });
    return mapVehicle(row);
  });
}

export async function setInventoryStatus(id: string, status: InventoryStatus, userId: string) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.vehicle.findUniqueOrThrow({ where: { id }, select: { status: true } });
    const row = await tx.vehicle.update({ where: { id }, data: { status }, include: vehicleInclude });
    await audit(tx, userId, "VEHICLE_STATUS_CHANGED", id, { from: before.status, to: status });
    return mapVehicle(row);
  });
}

export async function setInventoryPublication(id: string, published: boolean, userId: string) {
  return prisma.$transaction(async (tx) => {
    const row = await tx.vehicle.update({ where: { id }, data: { published }, include: vehicleInclude });
    await audit(tx, userId, published ? "VEHICLE_PUBLISHED" : "VEHICLE_UNPUBLISHED", id, { published });
    return mapVehicle(row);
  });
}

export async function archiveInventoryVehicle(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const row = await tx.vehicle.update({ where: { id }, data: { status: "ARCHIVED", published: false }, include: vehicleInclude });
    await audit(tx, userId, "VEHICLE_ARCHIVED", id, { status: row.status, published: row.published });
    return mapVehicle(row);
  });
}

export async function addInventoryImage(vehicleId: string, input: unknown, userId: string) {
  const parsed = addImageSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    await tx.vehicle.findUniqueOrThrow({ where: { id: vehicleId }, select: { id: true } });
    if (parsed.isPrimary) {
      await tx.vehicleImage.updateMany({ where: { vehicleId }, data: { isPrimary: false } });
    }
    const image = await tx.vehicleImage.create({ data: { ...parsed, vehicleId } });
    await audit(tx, userId, "VEHICLE_IMAGE_ADDED", vehicleId, { imageId: image.id, url: image.url });
    return image;
  });
}

export async function updateInventoryImage(vehicleId: string, imageId: string, input: unknown, userId: string) {
  const parsed = updateImageSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const current = await tx.vehicleImage.findFirstOrThrow({ where: { id: imageId, vehicleId }, select: { id: true, displayOrder: true } });
    if (parsed.isPrimary) {
      await tx.vehicleImage.updateMany({ where: { vehicleId }, data: { isPrimary: false } });
    }
    if (parsed.displayOrder !== undefined && parsed.displayOrder !== current.displayOrder) {
      const target = await tx.vehicleImage.findFirst({ where: { vehicleId, displayOrder: parsed.displayOrder, id: { not: imageId } }, select: { id: true } });
      if (target) {
        await tx.vehicleImage.update({ where: { id: target.id }, data: { displayOrder: current.displayOrder } });
      }
    }
    const image = await tx.vehicleImage.update({ where: { id: imageId }, data: parsed });
    await audit(tx, userId, "VEHICLE_IMAGE_UPDATED", vehicleId, { imageId, fields: Object.keys(parsed) });
    return image;
  });
}

export async function removeInventoryImage(vehicleId: string, imageId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const image = await tx.vehicleImage.findFirstOrThrow({ where: { id: imageId, vehicleId } });
    await tx.vehicleImage.delete({ where: { id: imageId } });
    await audit(tx, userId, "VEHICLE_IMAGE_REMOVED", vehicleId, { imageId, url: image.url });
    return { id: imageId };
  });
}

export function isPublicVehicle(vehicle: Pick<InventoryVehicle, "published" | "status">): boolean {
  return vehicle.published && (vehicle.status === "AVAILABLE" || vehicle.status === "RESERVED");
}

export function filterPublicVehicles<T extends Pick<InventoryVehicle, "published" | "status">>(vehicles: T[]): T[] {
  return vehicles.filter(isPublicVehicle);
}

export function parsePublicationInput(input: unknown): boolean {
  return publicationSchema.parse(input).published;
}

export function inventoryError(error: unknown) {
  if (error instanceof z.ZodError) {
    return { status: 400, message: "Invalid inventory data.", issues: error.issues };
  }
  if (error instanceof SyntaxError) return { status: 400, message: "Invalid JSON request body." };
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return { status: 409, message: "A record with that value already exists." };
    if (error.code === "P2025") return { status: 404, message: "Inventory record not found." };
  }
  return { status: 500, message: "Unable to complete the inventory request." };
}
