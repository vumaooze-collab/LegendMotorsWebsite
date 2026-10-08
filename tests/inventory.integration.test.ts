import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { join } from "node:path";
import test from "node:test";

import { loadEnvConfig } from "@next/env";

import { prisma } from "@/lib/db/prisma";
import { hashSessionToken, SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from "@/lib/auth/session";

loadEnvConfig(process.cwd());
const hasDatabase = Boolean(process.env.DATABASE_URL);

test("PostgreSQL inventory API persists CRUD, permissions, images, and audit records", { skip: !hasDatabase, timeout: 120_000 }, async () => {
  const suffix = randomUUID();
  const adminRole = await prisma.role.upsert({ where: { name: "ADMIN" }, update: {}, create: { name: "ADMIN" } });
  const staffRole = await prisma.role.upsert({ where: { name: "STAFF" }, update: {}, create: { name: "STAFF" } });
  const admin = await prisma.user.create({ data: { name: "Inventory API Admin", email: `inventory-admin-${suffix}@example.test`, roleId: adminRole.id } });
  const staff = await prisma.user.create({ data: { name: "Inventory API Staff", email: `inventory-staff-${suffix}@example.test`, roleId: staffRole.id } });
  const adminToken = randomBytes(32).toString("hex");
  const staffToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await prisma.session.createMany({ data: [
    { userId: admin.id, tokenHash: hashSessionToken(adminToken), expiresAt, isActive: true },
    { userId: staff.id, tokenHash: hashSessionToken(staffToken), expiresAt, isActive: true },
  ] });

  const portServer = createServer();
  await new Promise<void>((resolve, reject) => {
    portServer.once("error", reject);
    portServer.listen(0, "127.0.0.1", () => resolve());
  });
  const port = (portServer.address() as { port: number }).port;
  await new Promise<void>((resolve, reject) => portServer.close((error) => error ? reject(error) : resolve()));

  const nextCli = join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const baseUrl = `http://127.0.0.1:${port}`;
  let vehicleId: string | undefined;
  let serverOutput = "";
  let webServer: ReturnType<typeof spawn> | undefined;

  function startServer() {
    serverOutput = "";
    webServer = spawn(process.execPath, [nextCli, "start", "--hostname", "127.0.0.1", "--port", String(port)], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    webServer.stdout?.on("data", (chunk: Buffer) => { serverOutput = `${serverOutput}${chunk.toString()}`.slice(-12000); });
    webServer.stderr?.on("data", (chunk: Buffer) => { serverOutput = `${serverOutput}${chunk.toString()}`.slice(-12000); });
    return webServer;
  }

  async function waitForServer(server: ReturnType<typeof spawn>) {
    const deadline = Date.now() + 90_000;
    while (Date.now() < deadline) {
      if (server.exitCode !== null) {
        const safeOutput = process.env.DATABASE_URL ? serverOutput.replaceAll(process.env.DATABASE_URL, "[redacted]") : serverOutput;
        throw new Error(`Next.js exited during startup (${server.exitCode}). ${safeOutput}`);
      }
      try {
        const response = await fetch(`${baseUrl}/login`);
        if (response.ok) return;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
    throw new Error(`Next.js server did not become ready. ${serverOutput}`);
  }

  async function stopServer(server: ReturnType<typeof spawn>) {
    if (server.exitCode !== null) return;
    await new Promise<void>((resolve) => {
      server.once("exit", () => resolve());
      server.kill();
    });
  }

  async function request(path: string, token?: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    if (token) headers.set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);
    if (init.body !== undefined) headers.set("Content-Type", "application/json");
    return fetch(`${baseUrl}${path}`, { ...init, headers });
  }

  try {
    await waitForServer(startServer());

    const unauthenticated = await request("/api/admin/inventory", undefined);
    assert.equal(unauthenticated.status, 401);
    const staffMutation = await request("/api/admin/inventory", staffToken, { method: "POST", body: JSON.stringify({}) });
    assert.equal(staffMutation.status, 403);

    const createdResponse = await request("/api/admin/inventory", adminToken, {
      method: "POST",
      body: JSON.stringify({
        stockNumber: `LM-${suffix.slice(0, 12)}`,
        make: "Toyota",
        model: "Corolla",
        year: 2023,
        price: 1450000,
        currency: "MWK",
        mileage: 22000,
        transmission: "Automatic",
        fuelType: "Petrol",
        status: "DRAFT",
        published: false,
        images: [{ url: "https://example.test/initial.jpg", altText: "Initial image", isPrimary: true }],
      }),
    });
    assert.equal(createdResponse.status, 201);
    const { vehicle: created } = await createdResponse.json() as { vehicle: { id: string; stockNumber: string } };
    vehicleId = created.id;

    const persistedCreate = await prisma.vehicle.findUniqueOrThrow({ where: { id: created.id }, include: { vehicleImages: true } });
    assert.equal(persistedCreate.stockNumber, created.stockNumber);
    assert.equal(persistedCreate.vehicleImages.length, 1);

    await stopServer(webServer!);
    await waitForServer(startServer());
    const restartedRead = await request(`/api/admin/inventory/${created.id}`, adminToken);
    assert.equal(restartedRead.status, 200);
    assert.equal((await restartedRead.json() as { vehicle: { id: string } }).vehicle.id, created.id);

    const updateResponse = await request(`/api/admin/inventory/${created.id}`, adminToken, {
      method: "PATCH",
      body: JSON.stringify({ price: 1600000, description: "Persisted edit" }),
    });
    assert.equal(updateResponse.status, 200);
    const persistedUpdate = await prisma.vehicle.findUniqueOrThrow({ where: { id: created.id } });
    assert.equal(Number(persistedUpdate.price), 1600000);
    const readAfterRefresh = await request(`/api/admin/inventory/${created.id}`, adminToken);
    assert.equal((await readAfterRefresh.json() as { vehicle: { description: string } }).vehicle.description, "Persisted edit");

    const invalidStatus = await request(`/api/admin/inventory/${created.id}/status`, adminToken, { method: "PATCH", body: JSON.stringify({ status: "NOT_A_STATUS" }) });
    assert.equal(invalidStatus.status, 400);
    const statusResponse = await request(`/api/admin/inventory/${created.id}/status`, adminToken, { method: "PATCH", body: JSON.stringify({ status: "AVAILABLE" }) });
    assert.equal(statusResponse.status, 200);

    const invalidPublish = await request(`/api/admin/inventory/${created.id}/publish`, adminToken, { method: "PATCH", body: JSON.stringify({ published: "false" }) });
    assert.equal(invalidPublish.status, 400);
    const publishResponse = await request(`/api/admin/inventory/${created.id}/publish`, adminToken, { method: "PATCH", body: JSON.stringify({ published: true }) });
    assert.equal(publishResponse.status, 200);
    assert.equal((await prisma.vehicle.findUniqueOrThrow({ where: { id: created.id } })).published, true);

    const publicResponse = await request(`/api/vehicles/${created.id}`);
    assert.equal(publicResponse.status, 200);
    const publicPayload = await publicResponse.json() as { vehicle: Record<string, unknown> };
    assert.equal("stockNumber" in publicPayload.vehicle, false);
    assert.equal("published" in publicPayload.vehicle, false);
    const publicListResponse = await request("/api/vehicles");
    assert.equal(publicListResponse.status, 200);
    const publicList = await publicListResponse.json() as { vehicles: Array<Record<string, unknown>> };
    const publicListVehicle = publicList.vehicles.find((vehicle) => vehicle.id === created.id);
    assert.ok(publicListVehicle);
    assert.equal("stockNumber" in publicListVehicle, false);
    assert.equal("published" in publicListVehicle, false);

    const imageResponse = await request(`/api/admin/inventory/${created.id}/images`, adminToken, {
      method: "POST",
      body: JSON.stringify({ url: "https://example.test/second.jpg", altText: "Second image", displayOrder: 1 }),
    });
    assert.equal(imageResponse.status, 201);
    const { image } = await imageResponse.json() as { image: { id: string } };
    assert.equal(await prisma.vehicleImage.count({ where: { vehicleId: created.id } }), 2);

    const primaryResponse = await request(`/api/admin/inventory/${created.id}/images/${image.id}`, adminToken, {
      method: "PATCH",
      body: JSON.stringify({ isPrimary: true, displayOrder: 0 }),
    });
    assert.equal(primaryResponse.status, 200);
    const persistedImages = await prisma.vehicleImage.findMany({ where: { vehicleId: created.id }, orderBy: { displayOrder: "asc" } });
    assert.equal(persistedImages.filter((item) => item.isPrimary).length, 1);
    assert.equal(persistedImages[0].id, image.id);
    assert.equal(persistedImages[0].displayOrder, 0);
    assert.equal(persistedImages[1].displayOrder, 1);

    const imageList = await request(`/api/admin/inventory/${created.id}/images`, adminToken);
    assert.equal((await imageList.json() as { images: unknown[] }).images.length, 2);
    const removeImage = await request(`/api/admin/inventory/${created.id}/images/${image.id}`, adminToken, { method: "DELETE" });
    assert.equal(removeImage.status, 200);
    assert.equal(await prisma.vehicleImage.count({ where: { vehicleId: created.id } }), 1);

    const unpublishResponse = await request(`/api/admin/inventory/${created.id}/publish`, adminToken, { method: "PATCH", body: JSON.stringify({ published: false }) });
    assert.equal(unpublishResponse.status, 200);
    assert.equal(await request(`/api/vehicles/${created.id}`).then((response) => response.status), 404);

    const archiveResponse = await request(`/api/admin/inventory/${created.id}`, adminToken, { method: "DELETE" });
    assert.equal(archiveResponse.status, 200);
    assert.equal((await prisma.vehicle.findUniqueOrThrow({ where: { id: created.id } })).status, "ARCHIVED");

    const auditActions = await prisma.auditLog.findMany({ where: { entityId: created.id, userId: admin.id }, select: { action: true } });
    assert.deepEqual(new Set(auditActions.map((item) => item.action)), new Set([
      "VEHICLE_CREATED",
      "VEHICLE_UPDATED",
      "VEHICLE_STATUS_CHANGED",
      "VEHICLE_PUBLISHED",
      "VEHICLE_IMAGE_ADDED",
      "VEHICLE_IMAGE_UPDATED",
      "VEHICLE_IMAGE_REMOVED",
      "VEHICLE_UNPUBLISHED",
      "VEHICLE_ARCHIVED",
    ]));
  } finally {
    if (webServer) await stopServer(webServer);
    if (vehicleId) await prisma.vehicle.deleteMany({ where: { id: vehicleId } });
    await prisma.auditLog.deleteMany({ where: { userId: { in: [admin.id, staff.id] } } });
    await prisma.session.deleteMany({ where: { userId: { in: [admin.id, staff.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [admin.id, staff.id] } } });
  }
});
