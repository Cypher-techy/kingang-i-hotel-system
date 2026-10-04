import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { branchMenuItems, branches, menuCategories, menuItems } from "@/db/schema";
import { ensureSeedData } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeedData();
    const branchRows = await db.select().from(branches).where(eq(branches.isActive, true)).orderBy(asc(branches.name));
    const menuRows = await db.select({
      branchId: branchMenuItems.branchId,
      price: branchMenuItems.price,
      isAvailable: branchMenuItems.isAvailable,
      itemId: menuItems.id,
      name: menuItems.name,
      slug: menuItems.slug,
      description: menuItems.description,
      imageUrl: menuItems.imageUrl,
      options: menuItems.options,
      isFeatured: menuItems.isFeatured,
      isPopular: menuItems.isPopular,
      categoryId: menuCategories.id,
      categoryName: menuCategories.name,
      categorySlug: menuCategories.slug,
      categoryOrder: menuCategories.sortOrder,
    }).from(branchMenuItems)
      .innerJoin(menuItems, eq(branchMenuItems.menuItemId, menuItems.id))
      .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
      .where(eq(menuItems.isActive, true))
      .orderBy(asc(menuCategories.sortOrder), asc(menuItems.name));

    return Response.json({
      branches: branchRows,
      menu: menuRows.map((item) => ({ ...item, options: item.options ?? [] })),
    });
  } catch (error) {
    console.error("menu_read_failed", error);
    return Response.json({ error: "Unable to load the menu right now." }, { status: 500 });
  }
}
