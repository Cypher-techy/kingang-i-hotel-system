import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const branches = pgTable(
  "branches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 24 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    shortName: varchar("short_name", { length: 80 }).notNull(),
    address: text("address"),
    phone: varchar("phone", { length: 40 }),
    whatsapp: varchar("whatsapp", { length: 40 }),
    openingHours: varchar("opening_hours", { length: 160 }).default("Daily · 7:00 AM – 10:00 PM"),
    directionsUrl: text("directions_url"),
    mapUrl: text("map_url"),
    managerName: varchar("manager_name", { length: 120 }),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("branches_code_idx").on(table.code)],
);

export const menuCategories = pgTable(
  "menu_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 80 }).notNull(),
    slug: varchar("slug", { length: 80 }).notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("menu_categories_slug_idx").on(table.slug)],
);

export const menuItems = pgTable(
  "menu_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id").references(() => menuCategories.id),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    options: jsonb("options").$type<{ label: string; price: number }[]>(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    isPopular: boolean("is_popular").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("menu_items_slug_idx").on(table.slug), index("menu_items_category_idx").on(table.categoryId)],
);

export const branchMenuItems = pgTable(
  "branch_menu_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    branchId: uuid("branch_id").notNull().references(() => branches.id),
    menuItemId: uuid("menu_item_id").notNull().references(() => menuItems.id),
    price: integer("price").notNull(),
    isAvailable: boolean("is_available").default(true).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("branch_menu_item_unique_idx").on(table.branchId, table.menuItemId)],
);

export const userProfiles = pgTable(
  "user_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 160 }).notNull(),
    passwordHash: varchar("password_hash", { length: 128 }).notNull(),
    fullName: varchar("full_name", { length: 120 }).notNull(),
    role: varchar("role", { length: 40 }).default("owner").notNull(),
    branchId: uuid("branch_id").references(() => branches.id),
    phone: varchar("phone", { length: 40 }),
    isActive: boolean("is_active").default(true).notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [uniqueIndex("user_profiles_email_idx").on(table.email), index("user_profiles_branch_idx").on(table.branchId)],
);

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    employeeId: varchar("employee_id", { length: 32 }).notNull(),
    userProfileId: uuid("user_profile_id").references(() => userProfiles.id),
    branchId: uuid("branch_id").notNull().references(() => branches.id),
    fullName: varchar("full_name", { length: 120 }).notNull(),
    role: varchar("role", { length: 50 }).notNull(),
    department: varchar("department", { length: 80 }),
    phone: varchar("phone", { length: 40 }),
    employmentStatus: varchar("employment_status", { length: 24 }).default("active").notNull(),
    dateOfEmployment: date("date_of_employment"),
    salary: numeric("salary", { precision: 12, scale: 2 }),
    ...timestamps,
  },
  (table) => [uniqueIndex("employees_employee_id_idx").on(table.employeeId), index("employees_branch_idx").on(table.branchId)],
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: varchar("full_name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 40 }).notNull(),
    email: varchar("email", { length: 160 }),
    communicationOptIn: boolean("communication_opt_in").default(false).notNull(),
    ...timestamps,
  },
  (table) => [index("customers_phone_idx").on(table.phone)],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderNumber: varchar("order_number", { length: 24 }).notNull(),
    branchId: uuid("branch_id").notNull().references(() => branches.id),
    customerId: uuid("customer_id").references(() => customers.id),
    orderType: varchar("order_type", { length: 24 }).default("collection").notNull(),
    status: varchar("status", { length: 24 }).default("received").notNull(),
    subtotal: integer("subtotal").notNull(),
    total: integer("total").notNull(),
    paymentStatus: varchar("payment_status", { length: 24 }).default("pending").notNull(),
    paymentMethod: varchar("payment_method", { length: 32 }),
    specialInstructions: text("special_instructions"),
    preferredTime: varchar("preferred_time", { length: 60 }),
    source: varchar("source", { length: 24 }).default("website").notNull(),
    createdBy: uuid("created_by").references(() => userProfiles.id),
    ...timestamps,
  },
  (table) => [uniqueIndex("orders_order_number_idx").on(table.orderNumber), index("orders_branch_created_idx").on(table.branchId, table.createdAt), index("orders_status_idx").on(table.status)],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    menuItemId: uuid("menu_item_id").references(() => menuItems.id),
    itemName: varchar("item_name", { length: 120 }).notNull(),
    optionLabel: varchar("option_label", { length: 80 }),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: integer("line_total").notNull(),
  },
  (table) => [index("order_items_order_idx").on(table.orderId)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    branchId: uuid("branch_id").notNull().references(() => branches.id),
    orderId: uuid("order_id").references(() => orders.id),
    amount: integer("amount").notNull(),
    method: varchar("method", { length: 32 }).notNull(),
    reference: varchar("reference", { length: 80 }),
    recordedBy: uuid("recorded_by").references(() => userProfiles.id),
    ...timestamps,
  },
  (table) => [index("payments_branch_created_idx").on(table.branchId, table.createdAt)],
);

export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    unit: varchar("unit", { length: 24 }).notNull(),
    category: varchar("category", { length: 60 }).notNull(),
    reorderLevel: integer("reorder_level").default(10).notNull(),
    ...timestamps,
  },
);

export const branchInventory = pgTable(
  "branch_inventory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    branchId: uuid("branch_id").notNull().references(() => branches.id),
    inventoryItemId: uuid("inventory_item_id").notNull().references(() => inventoryItems.id),
    quantity: integer("quantity").default(0).notNull(),
    unitCost: integer("unit_cost").default(0).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("branch_inventory_unique_idx").on(table.branchId, table.inventoryItemId), index("branch_inventory_branch_idx").on(table.branchId)],
);

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    branchId: uuid("branch_id").notNull().references(() => branches.id),
    inventoryItemId: uuid("inventory_item_id").notNull().references(() => inventoryItems.id),
    movementType: varchar("movement_type", { length: 24 }).notNull(),
    quantity: integer("quantity").notNull(),
    reason: text("reason"),
    recordedBy: uuid("recorded_by").references(() => userProfiles.id),
    ...timestamps,
  },
  (table) => [index("stock_movements_branch_idx").on(table.branchId, table.createdAt)],
);

export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    contactPerson: varchar("contact_person", { length: 120 }),
    phone: varchar("phone", { length: 40 }),
    email: varchar("email", { length: 160 }),
    ...timestamps,
  },
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    branchId: uuid("branch_id").notNull().references(() => branches.id),
    category: varchar("category", { length: 60 }).notNull(),
    description: text("description").notNull(),
    amount: integer("amount").notNull(),
    expenseDate: date("expense_date").notNull(),
    paymentMethod: varchar("payment_method", { length: 32 }),
    approvalStatus: varchar("approval_status", { length: 24 }).default("approved").notNull(),
    recordedBy: uuid("recorded_by").references(() => userProfiles.id),
    ...timestamps,
  },
  (table) => [index("expenses_branch_date_idx").on(table.branchId, table.expenseDate)],
);

export const attendance = pgTable(
  "attendance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    employeeId: uuid("employee_id").notNull().references(() => employees.id),
    branchId: uuid("branch_id").notNull().references(() => branches.id),
    attendanceDate: date("attendance_date").notNull(),
    clockIn: timestamp("clock_in", { withTimezone: true }),
    clockOut: timestamp("clock_out", { withTimezone: true }),
    status: varchar("status", { length: 24 }).default("present").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("attendance_employee_date_idx").on(table.employeeId, table.attendanceDate), index("attendance_branch_date_idx").on(table.branchId, table.attendanceDate)],
);

export const shifts = pgTable(
  "shifts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    branchId: uuid("branch_id").notNull().references(() => branches.id),
    employeeId: uuid("employee_id").notNull().references(() => employees.id),
    shiftDate: date("shift_date").notNull(),
    startTime: varchar("start_time", { length: 10 }).notNull(),
    endTime: varchar("end_time", { length: 10 }).notNull(),
    status: varchar("status", { length: 24 }).default("scheduled").notNull(),
    ...timestamps,
  },
  (table) => [index("shifts_branch_date_idx").on(table.branchId, table.shiftDate)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    branchId: uuid("branch_id").notNull().references(() => branches.id),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 50 }).default("operations").notNull(),
    priority: varchar("priority", { length: 20 }).default("normal").notNull(),
    status: varchar("status", { length: 24 }).default("open").notNull(),
    assignedTo: uuid("assigned_to").references(() => employees.id),
    dueDate: date("due_date"),
    ...timestamps,
  },
  (table) => [index("tasks_branch_status_idx").on(table.branchId, table.status)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userProfileId: uuid("user_profile_id").references(() => userProfiles.id),
    branchId: uuid("branch_id").references(() => branches.id),
    title: varchar("title", { length: 160 }).notNull(),
    message: text("message").notNull(),
    type: varchar("type", { length: 30 }).default("info").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    ...timestamps,
  },
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userProfileId: uuid("user_profile_id").references(() => userProfiles.id),
    branchId: uuid("branch_id").references(() => branches.id),
    action: varchar("action", { length: 80 }).notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: varchar("entity_id", { length: 80 }),
    metadata: jsonb("metadata"),
    ...timestamps,
  },
  (table) => [index("audit_logs_created_idx").on(table.createdAt)],
);

export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    branchId: uuid("branch_id").references(() => branches.id),
    fullName: varchar("full_name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 40 }),
    email: varchar("email", { length: 160 }),
    message: text("message").notNull(),
    status: varchar("status", { length: 24 }).default("new").notNull(),
    ...timestamps,
  },
);

export type Branch = typeof branches.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
