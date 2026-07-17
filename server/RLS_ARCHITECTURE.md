# ServOS Multi-Tenant Architecture: PostgreSQL Row-Level Security (RLS)

This document explains the technical architecture implemented to achieve **strong tenant database isolation** using a shared PostgreSQL database and Row-Level Security (RLS) policies.

---

## 1. Architectural Overview

Instead of running separate databases or database schemas per company (which increases operational costs and resource usage), all client data resides in the same tables.

Isolation is enforced directly inside the PostgreSQL engine:

```
[Client Request] 
       │ (JWT with companyId/role)
       ▼
[Express Auth/Tenant Middleware]
       │ (Validate token + resolve tenant config status)
       ▼
[Tenant Context Wrapper]
       │ (Acquire connection & set LOCAL app.current_tenant_id = 'tenantId')
       ▼
[PostgreSQL Database Engine]
       │ (Execute queries through active RLS policies)
       ▼
[Isolated Datasets Returned]
```

---

## 2. Row-Level Security Policies

Every tenant-owned table in PostgreSQL (e.g. `User`, `Service`, `Worker`, `Booking`) is configured to check session parameters using Postgres' `current_setting()` helper:

### Schema Blueprint (e.g., `Service` table policy)
```sql
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_tenant_isolation ON "Service"
  USING (
    "tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '') 
    OR current_setting('app.is_super_admin', true) = 'true'
  )
  WITH CHECK (
    "tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '') 
    OR current_setting('app.is_super_admin', true) = 'true'
  );
```

*   **`USING` clause:** Controls which existing rows a database user can select/read/update/delete.
*   **`WITH CHECK` clause:** Prevents a tenant from inserting records under another tenant's `tenantId` (the database checks that the inserted ID matches the session tenant context, otherwise throwing an error).

---

## 3. Database Context Integration (Prisma)

Because Prisma Client operates as a persistent connection pool, session variables set at the root connection would leak to other concurrent request operations. 

To solve this securely, the backend initializes scoped transactional queries:

```typescript
import { prisma } from '../config/db';

export function getTenantPrismaClient(tenantId: string | null, isSuperAdmin: boolean = false) {
  return {
    run: async <T>(callback: (tx: any) => Promise<T>): Promise<T> => {
      return await prisma.$transaction(async (tx) => {
        // Set configuration parameters scoped ONLY to this transaction session
        const safeTenantId = tenantId || '';
        await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${safeTenantId}';`);
        await tx.$executeRawUnsafe(`SET LOCAL app.is_super_admin = '${isSuperAdmin ? 'true' : 'false'}';`);
        
        return await callback(tx);
      });
    }
  };
}
```

By prefixing variable declarations with `SET LOCAL`, the parameters only persist inside that specific transaction block and are instantly cleared when the transaction ends, ensuring zero connection-pool leaks.

---

## 4. Middleware & Request Auditing

The `tenantContextMiddleware` intercepts requests, resolves credentials, and attaches `req.db` to the request pipeline:

```typescript
// Register middleware on auth routes
router.use(authenticate);
router.use(tenantContextMiddleware);
```

When writing routes (e.g. fetching bookings), the controller executes queries via `req.db.run`:

```typescript
// Controller implementation
static async getTenantBookings(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const bookings = await req.db.run(async (tx) => {
      // Postgres automatically filters out other tenants' bookings here!
      return await tx.booking.findMany({});
    });
    sendResponse(res, 200, 'Bookings retrieved successfully', bookings);
  } catch (err) {
    next(err);
  }
}
```

---

## 5. Standard Operating Procedure: Adding new RLS-isolated tables

When adding a new model to `prisma/schema.prisma` (e.g., `model Invoice`):

1.  **Add `tenantId` column:** Ensure the model contains a relation to the tenant:
    ```prisma
    model Invoice {
      id       String @id @default(uuid())
      tenantId String
      tenant   Tenant @relation(fields: [tenantId], references: [id])
      ...
    }
    ```
2.  **Add SQL Migration Policy:** Add the table to the RLS setup migrations:
    ```sql
    ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;

    CREATE POLICY invoice_tenant_isolation ON "Invoice"
      USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '') OR current_setting('app.is_super_admin', true) = 'true')
      WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '') OR current_setting('app.is_super_admin', true) = 'true');

    CREATE INDEX idx_invoice_tenant ON "Invoice"("tenantId");
    ```
3.  **Run Migrations:** Deploy the SQL file to your Postgres database.
