import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, branchInventory, branches, customers, employees, expenses, inventoryItems, menuItems, orderItems, orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeedData } from "@/lib/seed";

export const dynamic = "force-dynamic";

const startOfDay = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const startOfMonth = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), 1);
const branchCondition = (branchId: string | null, column: any) => branchId ? eq(column, branchId) : undefined;
const withConditions = <T>(...conditions: (T | undefined)[]) => conditions.filter(Boolean) as T[];

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await ensureSeedData();
  const { searchParams } = new URL(request.url);
  const requestedBranch = searchParams.get("branchId");
  const branchId = user.role === "owner" || user.role === "administrator" ? requestedBranch || null : user.branchId;
  const scope = (column: any) => branchCondition(branchId, column);
  const now = new Date();
  const today = startOfDay(now);
  const month = startOfMonth(now);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const [branchRows, todaySales, monthSales, todayOrders, pendingOrders, completedOrders, activeEmployees, lowStock, expenseTotal, recentOrders, activity, categorySales, dailySales] = await Promise.all([
    db.select().from(branches).where(eq(branches.isActive, true)).orderBy(branches.name),
    db.select({ value: sql<number>`coalesce(sum(${orders.total}), 0)`, count: sql<number>`count(*)` }).from(orders).where(and(...withConditions(scope(orders.branchId), gte(orders.createdAt, today), lt(orders.createdAt, tomorrow), sql`${orders.status} <> 'cancelled'`))),
    db.select({ value: sql<number>`coalesce(sum(${orders.total}), 0)` }).from(orders).where(and(...withConditions(scope(orders.branchId), gte(orders.createdAt, month), eq(orders.status, "served")))),
    db.select({ value: sql<number>`count(*)` }).from(orders).where(and(...withConditions(scope(orders.branchId), gte(orders.createdAt, today), lt(orders.createdAt, tomorrow)))),
    db.select({ value: sql<number>`count(*)` }).from(orders).where(and(...withConditions(scope(orders.branchId), sql`${orders.status} in ('received', 'confirmed', 'preparing', 'ready')`))),
    db.select({ value: sql<number>`count(*)` }).from(orders).where(and(...withConditions(scope(orders.branchId), eq(orders.status, "served"), gte(orders.createdAt, month)))),
    db.select({ value: sql<number>`count(*)` }).from(employees).where(and(...withConditions(scope(employees.branchId), eq(employees.employmentStatus, "active")))), 
    db.select({ itemName: inventoryItems.name, quantity: branchInventory.quantity, unit: inventoryItems.unit, reorderLevel: inventoryItems.reorderLevel, branchName: branches.shortName }).from(branchInventory).innerJoin(inventoryItems, eq(branchInventory.inventoryItemId, inventoryItems.id)).innerJoin(branches, eq(branchInventory.branchId, branches.id)).where(and(...withConditions(scope(branchInventory.branchId), sql`${branchInventory.quantity} <= ${inventoryItems.reorderLevel}`))).orderBy(branchInventory.quantity),
    db.select({ value: sql<number>`coalesce(sum(${expenses.amount}), 0)` }).from(expenses).where(and(...withConditions(scope(expenses.branchId), gte(expenses.expenseDate, month.toISOString().slice(0, 10))))),
    db.select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status, total: orders.total, createdAt: orders.createdAt, branchName: branches.shortName, customerName: customers.fullName }).from(orders).innerJoin(branches, eq(orders.branchId, branches.id)).leftJoin(customers, eq(orders.customerId, customers.id)).where(scope(orders.branchId)).orderBy(desc(orders.createdAt)).limit(8),
    db.select({ id: auditLogs.id, action: auditLogs.action, createdAt: auditLogs.createdAt, entityType: auditLogs.entityType, branchId: auditLogs.branchId }).from(auditLogs).where(scope(auditLogs.branchId)).orderBy(desc(auditLogs.createdAt)).limit(8),
    db.select({ category: menuItems.name, quantity: sql<number>`coalesce(sum(${orderItems.quantity}), 0)` }).from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id)).where(and(...withConditions(scope(orders.branchId), gte(orders.createdAt, month)))).groupBy(menuItems.name).orderBy(desc(sql`sum(${orderItems.quantity})`)).limit(6),
    db.execute(sql`select to_char(date_trunc('day', ${orders.createdAt}), 'Dy') as day, coalesce(sum(${orders.total}), 0)::int as value from ${orders} where ${orders.createdAt} >= ${new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)} ${branchId ? sql`and ${orders.branchId} = ${branchId}` : sql``} group by date_trunc('day', ${orders.createdAt}) order by date_trunc('day', ${orders.createdAt})`),
  ]);
  return Response.json({
    user,
    branches: branchRows,
    selectedBranchId: branchId,
    metrics: { todaySales: Number(todaySales[0]?.value ?? 0), monthSales: Number(monthSales[0]?.value ?? 0), todayOrders: Number(todayOrders[0]?.value ?? 0), pendingOrders: Number(pendingOrders[0]?.value ?? 0), completedOrders: Number(completedOrders[0]?.value ?? 0), activeEmployees: Number(activeEmployees[0]?.value ?? 0), expenseTotal: Number(expenseTotal[0]?.value ?? 0) },
    lowStock,
    recentOrders,
    activity,
    categorySales,
    dailySales: dailySales.rows,
  });
}
