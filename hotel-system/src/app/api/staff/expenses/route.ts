import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, branches, expenses } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const requestedBranch = new URL(request.url).searchParams.get("branchId");
  const branchId = user.role === "owner" || user.role === "administrator" ? requestedBranch : user.branchId;
  const rows = await db.select({ id: expenses.id, branchId: expenses.branchId, branchName: branches.shortName, category: expenses.category, description: expenses.description, amount: expenses.amount, expenseDate: expenses.expenseDate, approvalStatus: expenses.approvalStatus }).from(expenses).innerJoin(branches, eq(expenses.branchId, branches.id)).where(branchId ? eq(expenses.branchId, branchId) : undefined).orderBy(desc(expenses.expenseDate)).limit(100);
  return Response.json({ expenses: rows });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "administrator", "accountant", "manager"].includes(user.role)) return Response.json({ error: "Insufficient permission." }, { status: 403 });
  const body = await request.json() as { branchId?: string; category?: string; description?: string; amount?: number; expenseDate?: string; paymentMethod?: string };
  const branchId = user.role === "owner" || user.role === "administrator" ? body.branchId : user.branchId;
  if (!branchId || !body.category?.trim() || !body.description?.trim() || !body.amount || body.amount <= 0) return Response.json({ error: "Branch, category, description and a valid amount are required." }, { status: 400 });
  const [expense] = await db.insert(expenses).values({ branchId, category: body.category.trim().slice(0, 60), description: body.description.trim().slice(0, 240), amount: Math.round(body.amount), expenseDate: body.expenseDate || new Date().toISOString().slice(0, 10), paymentMethod: body.paymentMethod?.slice(0, 32) || "cash", recordedBy: user.id }).returning();
  await db.insert(auditLogs).values({ userProfileId: user.id, branchId, action: "expense_recorded", entityType: "expense", entityId: expense.id, metadata: { amount: expense.amount } });
  return Response.json({ expense }, { status: 201 });
}
