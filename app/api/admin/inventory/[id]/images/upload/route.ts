import { createHash, createHmac, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { hasPermission } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";
import { addInventoryImage, inventoryError } from "@/lib/inventory";

export const runtime = "nodejs";

const BUCKET = "uploads";
const MAX_BYTES = 4 * 1024 * 1024;
const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function awsEncode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    "%" + character.charCodeAt(0).toString(16).toUpperCase(),
  );
}

function buildUploadUrl(key: string) {
  const endpointValue = process.env.AWS_ENDPOINT_URL_S3;
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION;
  if (!endpointValue || !accessKey || !secretKey || !region) {
    throw new Error("Vehicle photo storage is not configured on the hosting project.");
  }

  const endpoint = new URL(endpointValue);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const scope = `${dateStamp}/${region}/s3/aws4_request`;
  const canonicalUri = `/${BUCKET}/${key.split("/").map(awsEncode).join("/")}`;
  const query: Array<[string, string]> = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", `${accessKey}/${scope}`],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", "300"],
    ["X-Amz-SignedHeaders", "host"],
  ];
  const canonicalQuery = query
    .map(([name, value]) => [awsEncode(name), awsEncode(value)] as const)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}=${value}`)
    .join("&");
  const canonicalHeaders = `host:${endpoint.host.toLowerCase()}\n`;
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256(canonicalRequest),
  ].join("\n");
  const dateKey = hmac(`AWS4${secretKey}`, dateStamp);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, "s3");
  const signingKey = hmac(serviceKey, "aws4_request");
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  const uploadUrl = `${endpoint.origin}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
  const publicUrl = `${endpoint.origin}${canonicalUri}`;
  return { uploadUrl, publicUrl };
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasPermission(user, "inventory:manage")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await context.params;
  try {
    const form = await request.formData();
    const file = form.get("file");
    const altTextValue = form.get("altText");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a vehicle photo to upload." }, { status: 400 });
    }
    const extension = allowedTypes.get(file.type);
    if (!extension) {
      return NextResponse.json({ error: "Use a JPG, PNG, or WebP image." }, { status: 400 });
    }
    if (file.size < 1 || file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Each photo must be between 1 byte and 4 MB." }, { status: 413 });
    }

    const key = `vehicles/${id}/${randomUUID()}.${extension}`;
    const { uploadUrl, publicUrl } = buildUploadUrl(key);
    const upload = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: Buffer.from(await file.arrayBuffer()),
      cache: "no-store",
    });
    if (!upload.ok) {
      console.error("Vehicle photo storage returned status", upload.status);
      return NextResponse.json({ error: "Photo storage rejected the upload. Try again or contact the site administrator." }, { status: 502 });
    }

    const altText = typeof altTextValue === "string" ? altTextValue.trim().slice(0, 160) : "";
    const image = await addInventoryImage(id, {
      url: publicUrl,
      altText: altText || null,
      displayOrder: 0,
      isPrimary: false,
    }, user.id);
    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("storage is not configured")) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    const result = inventoryError(error);
    return NextResponse.json({ error: result.message }, { status: result.status });
  }
}
