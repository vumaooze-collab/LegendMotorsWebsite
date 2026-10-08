import assert from "node:assert/strict";
import test from "node:test";

import bcrypt from "bcryptjs";

import { hasPermission, PERMISSIONS_BY_ROLE } from "@/lib/auth/authorization";
import { createSessionToken, hashSessionToken } from "@/lib/auth/session";

test("session token generation creates a non-empty value", () => {
  const token = createSessionToken();

  assert.ok(token.length > 20);
  assert.ok(token !== "");
});

test("session hashing is deterministic for the same token", () => {
  const token = "demo-session-token";

  assert.equal(hashSessionToken(token), hashSessionToken(token));
});

test("password hashing is valid", async () => {
  const password = "Password123!";
  const hash = await bcrypt.hash(password, 12);

  assert.ok(await bcrypt.compare(password, hash));
  assert.ok(!(await bcrypt.compare("WrongPassword", hash)));
});

test("admin role has full permissions", () => {
  const adminUser = { role: { id: "role-1", name: "ADMIN" as const } };

  assert.equal(hasPermission(adminUser, "admin:full"), true);
  assert.equal(hasPermission(adminUser, "users:manage"), true);
  assert.equal(PERMISSIONS_BY_ROLE.ADMIN.includes("reports:view"), true);
});

test("staff role cannot access admin-only operations", () => {
  const staffUser = { role: { id: "role-3", name: "STAFF" as const } };

  assert.equal(hasPermission(staffUser, "inventory:manage"), false);
  assert.equal(hasPermission(staffUser, "dashboard:view"), true);
});
