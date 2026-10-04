import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { branches, employees } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeedData } from "@/lib/seed";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await ensureSeedData();
  const requestedBranch = new URL(request.url).searchParams.get("branchId");
  const branchId = user.role === "owner" || user.role === "administrator" ? requestedBranch : user.branchId;
  const rows = await db.select({ id: employees.id, employeeId: employees.employeeId, fullName: employees.fullName, role: employees.role, department: employees.department, phone: employees.phone, employmentStatus: employees.employmentStatus, branchId: employees.branchId, branchName: branches.shortName, dateOfEmployment: employees.dateOfEmployment }).from(employees).innerJoin(branches, eq(employees.branchId, branches.id)).where(branchId ? eq(employees.branchId, branchId) : undefined).orderBy(asc(employees.fullName));
  return Response.json({ employees: rows });
}
