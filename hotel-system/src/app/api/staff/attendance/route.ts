import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { attendance, employees } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const today = () => new Date().toISOString().slice(0, 10);

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const [employee] = await db.select({ id: employees.id, branchId: employees.branchId, fullName: employees.fullName }).from(employees).where(eq(employees.userProfileId, user.id)).limit(1);
  if (!employee) return Response.json({ attendance: null });
  const [record] = await db.select().from(attendance).where(and(eq(attendance.employeeId, employee.id), eq(attendance.attendanceDate, today()))).limit(1);
  return Response.json({ employee, attendance: record ?? null });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const [employee] = await db.select().from(employees).where(eq(employees.userProfileId, user.id)).limit(1);
  if (!employee) return Response.json({ error: "No employee profile is linked to this login." }, { status: 400 });
  const body = await request.json() as { action?: "clock_in" | "clock_out" };
  const [record] = await db.select().from(attendance).where(and(eq(attendance.employeeId, employee.id), eq(attendance.attendanceDate, today()))).limit(1);
  if (body.action === "clock_out") {
    if (!record?.clockIn || record.clockOut) return Response.json({ error: "There is no open shift to clock out." }, { status: 400 });
    const [updated] = await db.update(attendance).set({ clockOut: new Date(), updatedAt: new Date() }).where(eq(attendance.id, record.id)).returning();
    return Response.json({ attendance: updated });
  }
  if (record) return Response.json({ attendance: record });
  const [created] = await db.insert(attendance).values({ employeeId: employee.id, branchId: employee.branchId, attendanceDate: today(), clockIn: new Date(), status: "present" }).returning();
  return Response.json({ attendance: created }, { status: 201 });
}
