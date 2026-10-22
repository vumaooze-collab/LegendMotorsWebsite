import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(30),
  interest: z.enum(["vehicle", "finance", "trade-in", "source", "service"]),
  message: z.string().trim().max(1500).optional().default(""),
  website: z.string().max(0).optional().default(""),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Please check the enquiry form and try again." }, { status: 400 });
  }

  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please provide a valid name, phone number and enquiry." }, { status: 400 });
  }

  // Quietly accept honeypot submissions without storing spam.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  try {
    const phone = parsed.data.phone.replace(/[\s()-]/g, "");
    const customer = await prisma.customer.upsert({
      where: { phone },
      update: { name: parsed.data.name },
      create: { name: parsed.data.name, phone },
    });

    const enquiry = await prisma.enquiry.create({
      data: {
        customerId: customer.id,
        vehicleName: parsed.data.interest,
        notes: parsed.data.message || "Customer requested a follow-up.",
        status: "NEW",
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, enquiryId: enquiry.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "We could not save your enquiry right now. Please contact the dealership directly on WhatsApp." }, { status: 503 });
  }
}
