import assert from "node:assert/strict";
import test from "node:test";

import { hasPermission } from "@/lib/auth/authorization";
import {
  addImageSchema,
  createVehicleSchema,
  filterPublicVehicles,
  parsePublicationInput,
  toPublicVehicle,
  updateVehicleSchema,
} from "@/lib/inventory";

const validVehicle = {
  stockNumber: "LM-TEST-001",
  make: "Toyota",
  model: "Corolla",
  year: 2023,
  price: 1450000,
  currency: "MWK",
  mileage: 22000,
  transmission: "Automatic",
  fuelType: "Petrol",
  status: "DRAFT" as const,
  images: [{ url: "https://example.com/car.jpg", isPrimary: true }],
};

function sampleVehicle(published: boolean, status: "AVAILABLE" | "RESERVED" | "DRAFT" | "ARCHIVED") {
  return {
    id: "vehicle-1",
    stockNumber: "LM-TEST-001",
    make: "Toyota",
    model: "Corolla",
    variant: null,
    year: 2023,
    price: 1450000,
    currency: "MWK",
    mileage: 22000,
    transmission: "Automatic",
    fuelType: "Petrol",
    drivetrain: null,
    bodyType: "Saloon",
    color: null,
    engine: null,
    condition: null,
    description: "Test listing",
    status,
    featured: false,
    published,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    images: [{ id: "image-1", url: "https://example.com/car.jpg", altText: null, displayOrder: 0, isPrimary: true, createdAt: new Date().toISOString() }],
  };
}

test("vehicle create validation accepts valid required fields and default options", () => {
  const parsed = createVehicleSchema.parse(validVehicle);
  assert.equal(parsed.currency, "MWK");
  assert.equal(parsed.status, "DRAFT");
  assert.equal(parsed.images[0].displayOrder, 0);
});

test("vehicle can be created before the client supplies photographs", () => {
  const parsed = createVehicleSchema.parse({ ...validVehicle, images: undefined });
  assert.deepEqual(parsed.images, []);
});

test("vehicle image records require a valid HTTPS URL", () => {
  assert.equal(addImageSchema.safeParse({ url: "https://images.example.test/car.webp" }).success, true);
  assert.equal(addImageSchema.safeParse({ url: "http://images.example.test/car.jpg" }).success, false);
  assert.equal(addImageSchema.safeParse({ url: "not-a-url" }).success, false);
});

test("vehicle create validation rejects negative price, invalid year, mileage, missing fields, and malformed image URLs", () => {
  assert.equal(createVehicleSchema.safeParse({ ...validVehicle, price: -1 }).success, false);
  assert.equal(createVehicleSchema.safeParse({ ...validVehicle, year: 2200 }).success, false);
  assert.equal(createVehicleSchema.safeParse({ ...validVehicle, mileage: -1 }).success, false);
  assert.equal(createVehicleSchema.safeParse({ ...validVehicle, make: "" }).success, false);
  assert.equal(createVehicleSchema.safeParse({ ...validVehicle, currency: "US" }).success, false);
  assert.equal(createVehicleSchema.safeParse({ ...validVehicle, images: [{ url: "http://example.com/car.jpg" }] }).success, false);
  assert.equal(createVehicleSchema.safeParse({ ...validVehicle, images: [{ url: "not-a-url" }] }).success, false);
  assert.equal(createVehicleSchema.safeParse({ ...validVehicle, images: [{ url: "https://example.com/a.jpg", isPrimary: true }, { url: "https://example.com/b.jpg", isPrimary: true }] }).success, false);
});

test("vehicle update requires at least one known field and rejects unknown fields", () => {
  assert.equal(updateVehicleSchema.safeParse({}).success, false);
  assert.equal(updateVehicleSchema.safeParse({ price: 1200 }).success, true);
  assert.equal(updateVehicleSchema.safeParse({ passwordHash: "secret" }).success, false);
  assert.equal(updateVehicleSchema.safeParse({ status: "SOLD" }).success, false);
  assert.equal(updateVehicleSchema.safeParse({ published: true }).success, false);
});

test("public inventory filter excludes unpublished and non-public lifecycle states", () => {
  const records = [
    sampleVehicle(true, "AVAILABLE"),
    sampleVehicle(true, "RESERVED"),
    sampleVehicle(true, "DRAFT"),
    sampleVehicle(true, "ARCHIVED"),
    sampleVehicle(false, "AVAILABLE"),
  ];
  assert.deepEqual(filterPublicVehicles(records).map((vehicle) => vehicle.status), ["AVAILABLE", "RESERVED"]);
});

test("public vehicle DTO omits stock and publication administration fields", () => {
  const dto = toPublicVehicle(sampleVehicle(true, "AVAILABLE"));
  assert.equal("stockNumber" in dto, false);
  assert.equal("published" in dto, false);
  assert.equal("createdAt" in dto, false);
  assert.equal("updatedAt" in dto, false);
  assert.equal("vehicleImages" in dto, false);
  assert.equal(dto.images[0].url, "https://example.com/car.jpg");
});

test("publication input accepts booleans only and rejects string coercions and missing values", () => {
  assert.equal(parsePublicationInput({ published: true }), true);
  assert.equal(parsePublicationInput({ published: false }), false);
  for (const value of ["true", "false", undefined, null, 1, 0]) {
    assert.throws(() => parsePublicationInput(value === undefined ? {} : { published: value }));
  }
});

test("ADMIN and MANAGER manage inventory while STAFF remains read-only", () => {
  const admin = { role: { id: "admin-role", name: "ADMIN" as const } };
  const manager = { role: { id: "manager-role", name: "MANAGER" as const } };
  const staff = { role: { id: "staff-role", name: "STAFF" as const } };
  assert.equal(hasPermission(admin, "inventory:manage"), true);
  assert.equal(hasPermission(manager, "inventory:manage"), true);
  assert.equal(hasPermission(staff, "inventory:view"), true);
  assert.equal(hasPermission(staff, "inventory:manage"), false);
});
