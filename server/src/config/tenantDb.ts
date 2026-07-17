import { prisma } from './db';

/**
 * Returns a scoped Prisma Client instance wrapped inside a PostgreSQL transaction.
 * Sets session configuration variables (app.current_tenant_id & app.is_super_admin)
 * at the transaction boundary before executing any operations.
 */
export function getTenantPrismaClient(tenantId: string | null, isSuperAdmin: boolean = false) {
  return {
    run: async <T>(callback: (tx: any) => Promise<T>): Promise<T> => {
      return await prisma.$transaction(async (tx) => {
        // Set PostgreSQL session parameters
        const safeTenantId = tenantId || '';
        await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${safeTenantId}';`);
        await tx.$executeRawUnsafe(`SET LOCAL app.is_super_admin = '${isSuperAdmin ? 'true' : 'false'}';`);
        
        return await callback(tx);
      });
    }
  };
}
