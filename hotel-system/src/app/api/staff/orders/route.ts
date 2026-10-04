import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, branches, customers, orderItems, orders, userProfiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const requestedBranch = searchParams.get("branchId");
  const branchId = user.role === "owner" || user.role === "administrator" ? requestedBranch : user.branchId;
  const rows = await db.select({ id: orders.id, orderNumber: orders.orderNumber, branchId: orders.branchId, branchName: branches.shortName, customerName: customers.fullName, customerPhone: customers.phone, status: orders.status, total: orders.total, orderType: orders.orderType, paymentStatus: orders.paymentStatus, createdAt: orders.createdAt, specialInstructions: orders.specialInstructions }).from(orders).innerJoin(branches, eq(orders.branchId, branches.id)).leftJoin(customers, eq(orders.customerId, customers.id)).where(branchId ? eq(orders.branchId, branchId) : undefined).orderBy(desc(orders.createdAt)).limit(100);
  const orderIds = rows.map((row) => row.id);
  const items = orderIds.length ? await db.select({ orderId: orderItems.orderId, itemName: orderItems.itemName, optionLabel: orderItems.optionLabel, quantity: orderItems.quantity }).from(orderItems) : [];
  return Response.json({ orders: rows.map((order) => ({ ...order, items: items.filter((item) => item.orderId === order.id) })) });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { id?: string; status?: string };
  const allowed = ["received", "confirmed", "preparing", "ready", "served", "cancelled"];
  if (!body.id || !body.status || !allowed.includes(body.status)) return Response.json({ error: "Invalid order update." }, { status: 400 });
  const [existing] = await db.select({ id: orders.id, branchId: orders.branchId }).from(orders).where(eq(orders.id, body.id)).limit(1);
  if (!existing || (user.role !== "owner" && user.role !== "administrator" && user.branchId !== existing.branchId)) return Response.json({ error: "You cannot update this order." }, { status: 403 });
  const [updated] = await db.update(orders).set({ status: body.status, paymentStatus: body.status === "served" ? "paid" : undefined, updatedAt: new Date() }).where(eq(orders.id, body.id)).returning({ id: orders.id, status: orders.status });
  await db.insert(auditLogs).values({ userProfileId: user.id, branchId: existing.branchId, action: `order_${body.status}`, entityType: "order", entityId: existing.id });
  return Response.json({ order: updated });
}
