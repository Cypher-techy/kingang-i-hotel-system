# King’ang’i Hotel — official website + operations desk

A mobile-first Next.js App Router application for King’ang’i Hotel’s public website and centralized two-branch operations. The project uses PostgreSQL with Drizzle ORM and keeps operational records branch-scoped.

## What is live

- Public hotel website with King’ang’i branding, responsive navigation, story, gallery, branch cards and contact enquiry form.
- Database-backed digital menu with 84 seeded branch menu records, category filters, search, availability, featured meals and configurable serving options.
- Multi-branch ordering for Egerton Main Gate and Njokerio.
- Server-side price validation, order number generation, customer privacy-aware tracking and WhatsApp handoff.
- Signed `httpOnly` staff sessions, protected API routes, owner branch selector and role/branch checks.
- Owner operations desk with live metrics, revenue pulse, popular meals, low-stock alerts, recent orders and activity.
- Order queue, kitchen display workflow, menu price/availability controls, inventory adjustments, expenses, staff directory and attendance clock-in/out.
- Audit records for order creation, order status changes, menu changes, stock adjustments and expenses.
- SEO metadata, sitemap and robots route.

The navigation also exposes the planned operational workspaces so the core data model can grow into payroll, shifts, leave, tasks, supplier, reporting and notification modules without replacing the current schema.

## Local setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. Install dependencies with `npm install`.
3. Apply the Drizzle schema:

   ```bash
   npx drizzle-kit push
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

The first request to `/api/menu` seeds both branches, categories, menu items, branch pricing, inventory and the initial owner employee profile.

### Initial owner login

- Email: `owner@kingangi.co.ke`
- Password: `Kingangi2026!` when `INITIAL_OWNER_PASSWORD` is not set.

Set `INITIAL_OWNER_PASSWORD` before the first seed in every shared or production environment. Set a long random `AUTH_SECRET` and rotate it with an intentional session invalidation plan.

Open `/staff/login` for the operations desk. The session is signed on the server and stored in an `httpOnly`, `sameSite` cookie. No credential or secret is included in client code.

## Database architecture

The Drizzle schema in `src/db/schema.ts` includes:

- `branches`, `user_profiles`, `employees`
- `menu_categories`, `menu_items`, `branch_menu_items`
- `customers`, `orders`, `order_items`, `payments`
- `inventory_items`, `branch_inventory`, `stock_movements`, `suppliers`
- `expenses`, `attendance`, `shifts`, `tasks`, `notifications`, `inquiries`, `audit_logs`

Every operational branch record includes a branch foreign key. Staff APIs verify the authenticated user and branch scope on the server; interface visibility is not used as the security boundary.

## Supabase production rollout

The current sandbox uses the provided local PostgreSQL/Drizzle runtime so it can run without external credentials. `.env.example` includes the production Supabase variables. For a Supabase deployment:

1. Point `DATABASE_URL` at the Supabase pooled connection string.
2. Enable Supabase Auth and migrate staff identities into `auth.users`.
3. Map each auth user to `user_profiles.id`, keeping role and `branch_id` in the application profile table.
4. Add Supabase SSR middleware for refreshing auth cookies and replace the local login exchange in `src/app/api/staff/login/route.ts` with `signInWithPassword`.
5. Add PostgreSQL RLS policies using the authenticated user’s profile role and branch assignment. Keep the API authorization checks as a second server-side boundary.
6. Create a private Storage bucket for employee and content images. Use signed URLs for restricted documents and public transformed URLs only for approved gallery/menu media.
7. Set `SUPABASE_SERVICE_ROLE_KEY` only in server-side deployment secrets; never expose it through `NEXT_PUBLIC_*` variables.

## API surface

- `GET /api/menu` — branches, current menu, categories, prices and availability.
- `POST /api/orders` — validates branch availability and server-side prices before creating an order.
- `GET /api/orders?orderNumber=...&phone=...` — private order lookup requiring both reference and phone.
- `POST /api/inquiries` — stores a branch-aware customer enquiry.
- `POST /api/staff/login`, `POST /api/staff/logout`, `GET /api/staff/session`.
- `GET /api/staff/dashboard?branchId=...` — consolidated or branch-scoped live statistics.
- `GET/PATCH /api/staff/orders` — queue and status transitions.
- `GET/PATCH /api/staff/menu` — authorized branch menu controls.
- `GET/PATCH /api/staff/inventory` — stock view and auditable adjustments.
- `GET/POST /api/staff/expenses` — branch-scoped expense recording.
- `GET /api/staff/employees`, `GET/POST /api/staff/attendance`.

## Validation

Run the same checks used by the deployment platform:

```bash
npx next typegen
npm exec tsc -- --noEmit --pretty false
npm run build
```

Then use the platform-managed `build_and_start` preview and verify `/api/health`.

## Content and contact placeholders

The branch addresses, phones, map URLs, opening hours and manager names are intentionally marked as configurable placeholders until the hotel confirms them. Update `src/lib/seed.ts` for the first seed, then edit branch records through the future content management surface. Menu prices and availability are editable from the staff desk and should be confirmed by the hotel before public launch.

Photography currently uses external Pexels references as a visual placeholder. Replace with owned hotel photography and Supabase Storage URLs before production publication.
