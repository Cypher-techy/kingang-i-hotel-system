import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { branchMenuItems, branches, customers, menuItems, notifications, orderItems, orders, auditLogs } from "@/db/schema";
import { ensureSeedData } from "@/lib/seed";

export const dynamic = "force-dynamic";

type IncomingItem = { menuItemId: string; quantity: number; optionLabel?: string; optionPrice?: number };

const cleanText = (value: unknown, max = 240) => typeof value === "string" ? value.trim().slice(0, max) : "";

export async function POST(request: Request) {
  try {
    await ensureSeedData();
    const body = await request.json() as {
      branchId?: string;
      customer?: { fullName?: string; phone?: string; email?: string };
      orderType?: string;
      specialInstructions?: string;
      preferredTime?: string;
      items?: IncomingItem[];
    };
    const branchId = cleanText(body.branchId, 64);
    const fullName = cleanText(body.customer?.fullName, 120);
    const phone = cleanText(body.customer?.phone, 40);
    const items = Array.isArray(body.items) ? body.items.filter((item) => item && typeof item.menuItemId === "string" && Number(item.quantity) > 0).slice(0, 30) : [];
    if (!branchId || !fullName || phone.length < 7 || !items.length) return Response.json({ error: "Please choose a branch, add a meal and enter your name and phone number." }, { status: 400 });

    const branch = (await db.select().from(branches).where(and(eq(branches.id, branchId), eq(branches.isActive, true))).limit(1))[0];
    if (!branch) return Response.json({ error: "That branch is not currently available." }, { status: 400 });

    const itemIds = [...new Set(items.map((item) => item.menuItemId))];
    const priceRows = await db.select({
      itemId: menuItems.id,
      itemName: menuItems.name,
      options: menuItems.options,
      price: branchMenuItems.price,
      isAvailable: branchMenuItems.isAvailable,
    }).from(branchMenuItems)
      .innerJoin(menuItems, eq(branchMenuItems.menuItemId, menuItems.id))
      .where(and(eq(branchMenuItems.branchId, branchId), inArray(menuItems.id, itemIds)));
    const priceMap = new Map(priceRows.map((item) => [item.itemId, item]));
    const verifiedItems = items.map((item) => {
      const row = priceMap.get(item.menuItemId);
      if (!row || !row.isAvailable) return null;
      const option = row.options?.find((candidate) => candidate.label === cleanText(item.optionLabel, 80));
      const unitPrice = option?.price ?? row.price;
      const quantity = Math.min(Math.max(Math.floor(Number(item.quantity)), 1), 20);
      return { ...item, itemName: row.itemName, unitPrice, quantity, optionLabel: option?.label ?? null, lineTotal: unitPrice * quantity };
    }).filter((item): item is NonNullable<typeof item> => Boolean(item));
    if (verifiedItems.length !== items.length) return Response.json({ error: "One or more selected meals are no longer available. Please refresh the menu." }, { status: 409 });

    const subtotal = verifiedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const orderNumber = `KH-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const result = await db.transaction(async (tx) => {
      const [customer] = await tx.insert(customers).values({ fullName, phone, email: cleanText(body.customer?.email, 160) || null }).returning();
      const [order] = await tx.insert(orders).values({
        orderNumber,
        branchId,
        customerId: customer.id,
        orderType: body.orderType === "delivery" ? "delivery" : "collection",
        status: "received",
        subtotal,
        total: subtotal,
        specialInstructions: cleanText(body.specialInstructions, 500) || null,
        preferredTime: cleanText(body.preferredTime, 60) || null,
        source: "website",
      }).returning();
      await tx.insert(orderItems).values(verifiedItems.map((item) => ({ orderId: order.id, menuItemId: item.menuItemId, itemName: item.itemName, optionLabel: item.optionLabel, unitPrice: item.unitPrice, quantity: item.quantity, lineTotal: item.lineTotal })));
      await tx.insert(notifications).values({ branchId, title: `New order ${orderNumber}`, message: `${fullName} placed a ${orderTypeLabel(body.orderType)} order for ${verifiedItems.length} meal${verifiedItems.length === 1 ? "" : "s"}.`, type: "order" });
      await tx.insert(auditLogs).values({ branchId, action: "order_created", entityType: "order", entityId: order.id, metadata: { source: "website", total: subtotal } });
      return order;
    });

    return Response.json({ order: { orderNumber: result.orderNumber, status: result.status, total: result.total, branchName: branch.name, whatsapp: branch.whatsapp } }, { status: 201 });
  } catch (error) {
    console.error("order_create_failed", error);
    return Response.json({ error: "We could not place that order. Please try again or contact the branch." }, { status: 500 });
  }
}

const orderTypeLabel = (value?: string) => value === "delivery" ? "delivery" : "collection";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderNumber = cleanText(searchParams.get("orderNumber"), 30);
  const phone = cleanText(searchParams.get("phone"), 40);
  if (!orderNumber || phone.length < 7) return Response.json({ error: "Enter your order reference and phone number." }, { status: 400 });
  try {
    const [row] = await db.select({ order: orders, branchName: branches.name, customerPhone: customers.phone }).from(orders).innerJoin(branches, eq(orders.branchId, branches.id)).innerJoin(customers, eq(orders.customerId, customers.id)).where(and(eq(orders.orderNumber, orderNumber), eq(customers.phone, phone))).limit(1);
    if (!row) return Response.json({ error: "No order found with those details." }, { status: 404 });
    const lineItems = await db.select({ itemName: orderItems.itemName, optionLabel: orderItems.optionLabel, quantity: orderItems.quantity, unitPrice: orderItems.unitPrice, lineTotal: orderItems.lineTotal }).from(orderItems).where(eq(orderItems.orderId, row.order.id));
    return Response.json({ order: { orderNumber: row.order.orderNumber, status: row.order.status, total: row.order.total, branchName: row.branchName, createdAt: row.order.createdAt, items: lineItems } });
  } catch {
    return Response.json({ error: "Unable to find that order right now." }, { status: 500 });
  }
}
