-- Disposable integration-test schema only. Mirrors columns queried by the PHP API.
DROP TABLE IF EXISTS "VehicleImage";
DROP TABLE IF EXISTS "Vehicle";

CREATE TABLE "Vehicle" (
  "id" TEXT PRIMARY KEY,
  "stockNumber" TEXT NOT NULL,
  "make" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "variant" TEXT,
  "year" INTEGER NOT NULL,
  "price" NUMERIC(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'MWK',
  "mileage" INTEGER,
  "transmission" TEXT,
  "fuelType" TEXT,
  "bodyType" TEXT,
  "color" TEXT,
  "description" TEXT,
  "featured" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "published" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE "VehicleImage" (
  "id" TEXT PRIMARY KEY,
  "vehicleId" TEXT NOT NULL REFERENCES "Vehicle"("id") ON DELETE CASCADE,
  "url" TEXT NOT NULL,
  "altText" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT FALSE,
  "displayOrder" INTEGER NOT NULL DEFAULT 0
);

INSERT INTO "Vehicle" ("id","stockNumber","make","model","variant","year","price","currency","mileage","transmission","fuelType","bodyType","color","description","featured","createdAt","updatedAt","status","published") VALUES
('vehicle-public','LM-001','Toyota','Corolla','LE',2022,12500000,'MWK',25000,'Automatic','Petrol','Sedan','White','Integration test public listing',TRUE,NOW(),NOW(),'AVAILABLE',TRUE),
('vehicle-draft','LM-002','Honda','Fit','Base',2021,8000000,'MWK',40000,'Automatic','Petrol','Hatchback','Blue','Must remain private',FALSE,NOW(),NOW(),'DRAFT',FALSE),
('vehicle-sold','LM-003','Mazda','CX-5','Touring',2020,18000000,'MWK',50000,'Automatic','Diesel','SUV','Black','Must not appear in public inventory',FALSE,NOW(),NOW(),'SOLD',TRUE);

INSERT INTO "VehicleImage" ("id","vehicleId","url","altText","isPrimary","displayOrder") VALUES
('image-public','vehicle-public','https://example.test/car.jpg','White Toyota Corolla',TRUE,0),
('image-draft','vehicle-draft','https://example.test/draft.jpg','Draft car',TRUE,0);
