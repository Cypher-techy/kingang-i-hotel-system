import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, branchMenuItems, menuItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "administrator", "manager"].includes(user.role)) return Response.json({ error: "Insufficient permission." }, { status: 403 });
  const body = await request.json() as { branchMenuId?: string; price?: number; isAvailable?: boolean };
  if (!body.branchMenuId) return Response.json({ error: "Menu record is required." }, { status: 400 });
  const [existing] = await db.select({ id: branchMenuItems.id, branchId: branchMenuItems.branchId, itemId: branchMenuItems.menuItemId }).from(branchMenuItems).where(eq(branchMenuItems.id, body.branchMenuId)).limit(1);
  if (!existing || (user.role !== "owner" && user.role !== "administrator" && user.branchId !== existing.branchId)) return Response.json({ error: "You cannot change this branch menu." }, { status: 403 });
  const updates: { price?: number; isAvailable?: boolean; updatedAt: Date } = { updatedAt: new Date() };
  if (typeof body.price === "number" && Number.isFinite(body.price) && body.price >= 0 && body.price < 100000) updates.price = Math.round(body.price);
  if (typeof body.isAvailable === "boolean") updates.isAvailable = body.isAvailable;
  const [updated] = await db.update(branchMenuItems).set(updates).where(eq(branchMenuItems.id, existing.id)).returning();
  await db.insert(auditLogs).values({ userProfileId: user.id, branchId: existing.branchId, action: "menu_updated", entityType: "branch_menu_item", entityId: existing.id, metadata: updates });
  return Response.json({ item: updated });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const items = await db.select({ id: branchMenuItems.id, branchId: branchMenuItems.branchId, itemId: menuItems.id, name: menuItems.name, price: branchMenuItems.price, isAvailable: branchMenuItems.isAvailable }).from(branchMenuItems).innerJoin(menuItems, eq(branchMenuItems.menuItemId, menuItems.id)).where(user.role === "owner" || user.role === "administrator" ? undefined : eq(branchMenuItems.branchId, user.branchId ?? ""));
  return Response.json({ items });
}
