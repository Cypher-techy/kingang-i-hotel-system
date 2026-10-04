import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, branchInventory, inventoryItems, stockMovements } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeedData } from "@/lib/seed";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await ensureSeedData();
  const requestedBranch = new URL(request.url).searchParams.get("branchId");
  const branchId = user.role === "owner" || user.role === "administrator" ? requestedBranch : user.branchId;
  const rows = await db.select({ id: branchInventory.id, branchId: branchInventory.branchId, inventoryItemId: inventoryItems.id, name: inventoryItems.name, unit: inventoryItems.unit, category: inventoryItems.category, quantity: branchInventory.quantity, reorderLevel: inventoryItems.reorderLevel, unitCost: branchInventory.unitCost }).from(branchInventory).innerJoin(inventoryItems, eq(branchInventory.inventoryItemId, inventoryItems.id)).where(branchId ? eq(branchInventory.branchId, branchId) : undefined).orderBy(inventoryItems.name);
  return Response.json({ inventory: rows });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "administrator", "manager", "storekeeper"].includes(user.role)) return Response.json({ error: "Insufficient permission." }, { status: 403 });
  const body = await request.json() as { id?: string; adjustment?: number; reason?: string };
  if (!body.id || !Number.isInteger(body.adjustment) || !body.adjustment) return Response.json({ error: "Choose a stock adjustment." }, { status: 400 });
  const [current] = await db.select().from(branchInventory).where(eq(branchInventory.id, body.id)).limit(1);
  if (!current || (user.role !== "owner" && user.role !== "administrator" && user.branchId !== current.branchId)) return Response.json({ error: "You cannot adjust this stock record." }, { status: 403 });
  const nextQuantity = Math.max(0, current.quantity + body.adjustment);
  const [updated] = await db.update(branchInventory).set({ quantity: nextQuantity, updatedAt: new Date() }).where(eq(branchInventory.id, current.id)).returning();
  await db.insert(stockMovements).values({ branchId: current.branchId, inventoryItemId: current.inventoryItemId, movementType: body.adjustment > 0 ? "adjustment_in" : "adjustment_out", quantity: Math.abs(body.adjustment), reason: body.reason?.slice(0, 240) || "Manual stock adjustment", recordedBy: user.id });
  await db.insert(auditLogs).values({ userProfileId: user.id, branchId: current.branchId, action: "stock_adjusted", entityType: "branch_inventory", entityId: current.id, metadata: { adjustment: body.adjustment, nextQuantity } });
  return Response.json({ item: updated });
}
