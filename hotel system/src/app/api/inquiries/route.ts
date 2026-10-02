import { db } from "@/db";
import { inquiries } from "@/db/schema";
import { ensureSeedData } from "@/lib/seed";

export async function POST(request: Request) {
  try {
    await ensureSeedData();
    const body = await request.json() as { branchId?: string; fullName?: string; phone?: string; email?: string; message?: string };
    if (!body.fullName?.trim() || !body.message?.trim()) return Response.json({ error: "Please include your name and message." }, { status: 400 });
    await db.insert(inquiries).values({ branchId: body.branchId || null, fullName: body.fullName.trim().slice(0, 120), phone: body.phone?.trim().slice(0, 40) || null, email: body.email?.trim().slice(0, 160) || null, message: body.message.trim().slice(0, 1000) });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "We could not send your message." }, { status: 500 });
  }
}
