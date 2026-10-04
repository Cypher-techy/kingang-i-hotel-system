import { and, eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "@/db";
import {
  branchInventory,
  branchMenuItems,
  branches,
  employees,
  inventoryItems,
  menuCategories,
  menuItems,
  userProfiles,
} from "@/db/schema";

export const branchSeed = [
  {
    code: "EGERTON",
    name: "Egerton Main Gate Branch",
    shortName: "Egerton Main Gate",
    address: "Main Gate, Egerton University · Njoro, Kenya",
    phone: "+254 700 000 000",
    whatsapp: "+254 700 000 000",
    managerName: "Branch manager to be assigned",
    imageUrl: "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1200&h=850",
    directionsUrl: "https://maps.google.com/?q=Egerton+University+Main+Gate",
  },
  {
    code: "NJOKERIO",
    name: "Njokerio Branch",
    shortName: "Njokerio",
    address: "Njokerio Centre · Njoro, Kenya",
    phone: "+254 700 000 001",
    whatsapp: "+254 700 000 001",
    managerName: "Branch manager to be assigned",
    imageUrl: "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1200&h=850",
    directionsUrl: "https://maps.google.com/?q=Njokerio+Njoro+Kenya",
  },
] as const;

const categorySeed = [
  { name: "Rice & Pilau", slug: "rice-pilau", description: "A generous plate of Kenyan comfort food.", sortOrder: 1 },
  { name: "Ugali Dishes", slug: "ugali-dishes", description: "The classics, served hot and fresh.", sortOrder: 2 },
  { name: "Githeri & Mukimo", slug: "githeri-mukimo", description: "Hearty traditional favourites.", sortOrder: 3 },
  { name: "Extras & Sides", slug: "extras-sides", description: "Make your plate your own.", sortOrder: 4 },
  { name: "Snacks", slug: "snacks", description: "Quick bites, Kenyan style.", sortOrder: 5 },
  { name: "Drinks", slug: "drinks", description: "A warm or refreshing finish.", sortOrder: 6 },
] as const;

const foodImage = "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=900&h=700";
const pilauImage = "https://images.pexels.com/photos/5410401/pexels-photo-5410401.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=900&h=700";
const ugaliImage = "https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=900&h=700";
const drinkImage = "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=900&h=700";
const snackImage = "https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=900&h=700";

const menuSeed = [
  { name: "Rice Beef", slug: "rice-beef", category: "rice-pilau", price: 140, description: "Steamed rice with tender beef and a savoury house sauce.", imageUrl: foodImage, isPopular: true, options: undefined },
  { name: "Rice Kuku", slug: "rice-kuku", category: "rice-pilau", price: 100, description: "Fluffy rice with our warmly spiced chicken stew.", imageUrl: foodImage, isPopular: true, options: [{ label: "Quarter kuku", price: 100 }, { label: "Half kuku", price: 140 }] },
  { name: "Rice Mayai", slug: "rice-mayai", category: "rice-pilau", price: 100, description: "Rice served with a fresh two-egg omelette.", imageUrl: foodImage, options: undefined },
  { name: "Rice Matumbo", slug: "rice-matumbo", category: "rice-pilau", price: 90, description: "Slow-cooked tripe in a rich tomato gravy.", imageUrl: foodImage, options: undefined },
  { name: "Pilau Special", slug: "pilau-special", category: "rice-pilau", price: 100, description: "Fragrant pilau rice with the King’ang’i touch.", imageUrl: pilauImage, isFeatured: true, isPopular: true, options: undefined },
  { name: "Pilau Plain", slug: "pilau-plain", category: "rice-pilau", price: 80, description: "Aromatic, slow-simmered pilau rice.", imageUrl: pilauImage, options: undefined },
  { name: "Rice Special", slug: "rice-special", category: "rice-pilau", price: 80, description: "A colourful plate of rice and seasonal vegetables.", imageUrl: foodImage, options: undefined },
  { name: "Rice Karanga", slug: "rice-karanga", category: "rice-pilau", price: 80, description: "Rice with a comforting groundnut stew.", imageUrl: foodImage, options: undefined },
  { name: "Rice Kamande", slug: "rice-kamande", category: "rice-pilau", price: 80, description: "Rice with slow-cooked lentils.", imageUrl: foodImage, options: undefined },
  { name: "Rice Minji", slug: "rice-minji", category: "rice-pilau", price: 80, description: "Rice with tender garden peas.", imageUrl: foodImage, options: undefined },
  { name: "Rice Cabbage", slug: "rice-cabbage", category: "rice-pilau", price: 60, description: "Simple, fresh and satisfying.", imageUrl: foodImage, options: undefined },
  { name: "Rice Plain", slug: "rice-plain", category: "rice-pilau", price: 40, description: "Perfectly steamed plain rice.", imageUrl: foodImage, options: undefined },
  { name: "Chips Kuku", slug: "chips-kuku", category: "rice-pilau", price: 200, description: "Golden chips with a generous chicken serving.", imageUrl: foodImage, isFeatured: true, options: undefined },
  { name: "Ugali Kuku", slug: "ugali-kuku", category: "ugali-dishes", price: 90, description: "Soft ugali with chicken stew and greens.", imageUrl: ugaliImage, isPopular: true, options: [{ label: "Quarter kuku", price: 90 }, { label: "Half kuku", price: 130 }] },
  { name: "Ugali Kuku Managu", slug: "ugali-kuku-managu", category: "ugali-dishes", price: 110, description: "Ugali, chicken and earthy managu greens.", imageUrl: ugaliImage, options: [{ label: "Quarter kuku", price: 110 }, { label: "Half kuku", price: 150 }] },
  { name: "Ugali Beef", slug: "ugali-beef", category: "ugali-dishes", price: 130, description: "Ugali with tender beef stew.", imageUrl: ugaliImage, isPopular: true, options: undefined },
  { name: "Ugali Mayai", slug: "ugali-mayai", category: "ugali-dishes", price: 90, description: "Ugali with a fresh egg omelette.", imageUrl: ugaliImage, options: undefined },
  { name: "Ugali Matumbo", slug: "ugali-matumbo", category: "ugali-dishes", price: 80, description: "Ugali with slow-cooked matumbo.", imageUrl: ugaliImage, options: undefined },
  { name: "Ugali Omena", slug: "ugali-omena", category: "ugali-dishes", price: 80, description: "Ugali with a homestyle omena stew.", imageUrl: ugaliImage, options: undefined },
  { name: "Ugali Managu", slug: "ugali-managu", category: "ugali-dishes", price: 70, description: "Ugali with traditional managu greens.", imageUrl: ugaliImage, options: undefined },
  { name: "Ugali Mix", slug: "ugali-mix", category: "ugali-dishes", price: 60, description: "Ugali with a mix of seasonal vegetables.", imageUrl: ugaliImage, options: undefined },
  { name: "Ugali Mboga", slug: "ugali-mboga", category: "ugali-dishes", price: 50, description: "Ugali with fresh greens.", imageUrl: ugaliImage, options: undefined },
  { name: "Ugali Fish", slug: "ugali-fish", category: "ugali-dishes", price: 150, description: "Ugali with a satisfying fish stew.", imageUrl: ugaliImage, options: undefined },
  { name: "Mukimo Special", slug: "mukimo-special", category: "githeri-mukimo", price: 90, description: "A colourful mashed mix of potatoes, greens and maize.", imageUrl: foodImage, options: undefined },
  { name: "Githeri Special", slug: "githeri-special", category: "githeri-mukimo", price: 80, description: "Beans and maize with seasonal additions.", imageUrl: foodImage, options: undefined },
  { name: "Mukimo", slug: "mukimo", category: "githeri-mukimo", price: 70, description: "Traditional, comforting and filling.", imageUrl: foodImage, options: undefined },
  { name: "Githeri", slug: "githeri", category: "githeri-mukimo", price: 60, description: "The Kenyan classic.", imageUrl: foodImage, options: undefined },
  { name: "Kamande", slug: "kamande", category: "extras-sides", price: 40, description: "A hearty lentil side.", imageUrl: foodImage, options: undefined },
  { name: "Minji", slug: "minji", category: "extras-sides", price: 40, description: "Tender garden peas.", imageUrl: foodImage, options: undefined },
  { name: "Karanga", slug: "karanga", category: "extras-sides", price: 40, description: "Rich groundnut stew.", imageUrl: foodImage, options: undefined },
  { name: "Green Beans", slug: "green-beans", category: "extras-sides", price: 30, description: "Freshly cooked green beans.", imageUrl: foodImage, options: undefined },
  { name: "Chapati / Chapo", slug: "chapati", category: "extras-sides", price: 20, description: "Soft, layered chapati.", imageUrl: foodImage, options: undefined },
  { name: "Ndengu", slug: "ndengu", category: "extras-sides", price: 20, description: "Green grams in a light gravy.", imageUrl: foodImage, options: undefined },
  { name: "Special", slug: "special-side", category: "extras-sides", price: 40, description: "Ask the team about today’s special side.", imageUrl: foodImage, options: undefined },
  { name: "Rolex", slug: "rolex", category: "snacks", price: 80, description: "Chapati rolled with eggs and fresh vegetables.", imageUrl: snackImage, isPopular: true, options: undefined },
  { name: "Fried Eggs (2)", slug: "fried-eggs", category: "snacks", price: 60, description: "Two eggs, fried your way.", imageUrl: snackImage, options: undefined },
  { name: "Ndazi", slug: "ndazi", category: "snacks", price: 10, description: "A warm, lightly sweet Kenyan bite.", imageUrl: snackImage, options: undefined },
  { name: "White Coffee", slug: "white-coffee", category: "drinks", price: 50, description: "A warm, milky cup.", imageUrl: drinkImage, options: undefined },
  { name: "Soda", slug: "soda", category: "drinks", price: 20, description: "A chilled soft drink.", imageUrl: drinkImage, options: [{ label: "300ml", price: 20 }, { label: "500ml", price: 40 }] },
  { name: "Black Coffee", slug: "black-coffee", category: "drinks", price: 30, description: "Bold Kenyan coffee.", imageUrl: drinkImage, options: undefined },
  { name: "Chai", slug: "chai", category: "drinks", price: 20, description: "Freshly brewed Kenyan tea.", imageUrl: drinkImage, options: undefined },
  { name: "Bone Soup", slug: "bone-soup", category: "drinks", price: 10, description: "A warm and comforting broth.", imageUrl: drinkImage, options: undefined },
] as const;

const inventorySeed = [
  { name: "Rice", unit: "kg", category: "Food", reorderLevel: 20, quantity: 85, unitCost: 160 },
  { name: "Cooking oil", unit: "litres", category: "Food", reorderLevel: 15, quantity: 12, unitCost: 240 },
  { name: "Chicken", unit: "pieces", category: "Food", reorderLevel: 12, quantity: 18, unitCost: 420 },
  { name: "Soda", unit: "crates", category: "Drinks", reorderLevel: 5, quantity: 4, unitCost: 1600 },
  { name: "Charcoal", unit: "bags", category: "Operations", reorderLevel: 4, quantity: 7, unitCost: 900 },
] as const;

const hashPassword = (password: string) => createHash("sha256").update(password).digest("hex");

export async function ensureSeedData() {
  const existingBranches = await db.select().from(branches);
  const resolvedBranches = existingBranches.length
    ? existingBranches
    : await db.insert(branches).values(branchSeed.map((branch) => ({ ...branch }))).returning();

  const existingCategories = await db.select().from(menuCategories);
  const resolvedCategories = existingCategories.length
    ? existingCategories
    : await db.insert(menuCategories).values(categorySeed.map((category) => ({ ...category }))).returning();
  const categoryMap = new Map(resolvedCategories.map((category) => [category.slug, category.id]));

  const existingItems = await db.select().from(menuItems);
  const itemMap = new Map(existingItems.map((item) => [item.slug, item]));
  for (const item of menuSeed) {
    if (!itemMap.has(item.slug)) {
      const [created] = await db.insert(menuItems).values({
        name: item.name,
        slug: item.slug,
        categoryId: categoryMap.get(item.category),
        description: item.description,
        imageUrl: item.imageUrl,
        options: item.options ? [...item.options] : undefined,
        isFeatured: "isFeatured" in item ? item.isFeatured : false,
        isPopular: "isPopular" in item ? item.isPopular : false,
      }).returning();
      itemMap.set(item.slug, created);
    }
  }

  const currentBranchMenu = await db.select().from(branchMenuItems);
  const currentPairs = new Set(currentBranchMenu.map((item) => `${item.branchId}:${item.menuItemId}`));
  const menuRows = [...itemMap.values()].flatMap((item) => resolvedBranches.map((branch) => ({
    branchId: branch.id,
    menuItemId: item.id,
    price: item.options && item.options.length ? Math.min(...item.options.map((option) => option.price)) : menuSeed.find((seed) => seed.slug === item.slug)?.price ?? 0,
    isAvailable: true,
  }))).filter((row) => !currentPairs.has(`${row.branchId}:${row.menuItemId}`));
  if (menuRows.length) await db.insert(branchMenuItems).values(menuRows);

  if (!(await db.select().from(userProfiles)).length) {
    const [owner] = await db.insert(userProfiles).values({
      email: "owner@kingangi.co.ke",
      passwordHash: hashPassword(process.env.INITIAL_OWNER_PASSWORD ?? "Kingangi2026!"),
      fullName: "King’ang’i Owner",
      role: "owner",
      phone: "+254 700 000 000",
    }).returning();
    await db.insert(employees).values({
      employeeId: "KH-0001",
      userProfileId: owner.id,
      branchId: resolvedBranches[0].id,
      fullName: owner.fullName,
      role: "owner",
      department: "Management",
      phone: owner.phone,
      dateOfEmployment: new Date().toISOString().slice(0, 10),
    });
  }

  const existingInventory = await db.select().from(inventoryItems);
  const inventoryMap = new Map(existingInventory.map((item) => [item.name, item]));
  for (const item of inventorySeed) {
    let inventoryItem = inventoryMap.get(item.name);
    if (!inventoryItem) {
      [inventoryItem] = await db.insert(inventoryItems).values({ name: item.name, unit: item.unit, category: item.category, reorderLevel: item.reorderLevel }).returning();
      inventoryMap.set(item.name, inventoryItem);
    }
    for (const branch of resolvedBranches) {
      const [existingStock] = await db.select().from(branchInventory).where(and(eq(branchInventory.branchId, branch.id), eq(branchInventory.inventoryItemId, inventoryItem.id))).limit(1);
      if (!existingStock) await db.insert(branchInventory).values({ branchId: branch.id, inventoryItemId: inventoryItem.id, quantity: item.quantity, unitCost: item.unitCost });
    }
  }

  return { branches: resolvedBranches, categories: resolvedCategories, items: [...itemMap.values()] };
}

export const publicMenuSeed = menuSeed;
