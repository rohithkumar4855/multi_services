-- Enable Row-Level Security (RLS) on tenant-owned tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Worker" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;

-- Helper to fetch current tenant context
-- Settings parameter: 'app.current_tenant_id'
-- Bypass checks parameter: 'app.is_super_admin'

-- 1. Policies for "User"
CREATE POLICY user_tenant_isolation ON "User"
  USING (
    "tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '') 
    OR current_setting('app.is_super_admin', true) = 'true'
    OR "role" = 'SUPER_ADMIN'
  )
  WITH CHECK (
    "tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '') 
    OR current_setting('app.is_super_admin', true) = 'true'
    OR "role" = 'SUPER_ADMIN'
  );

-- 2. Policies for "Service"
CREATE POLICY service_tenant_isolation ON "Service"
  USING (
    "tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '') 
    OR current_setting('app.is_super_admin', true) = 'true'
  )
  WITH CHECK (
    "tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '') 
    OR current_setting('app.is_super_admin', true) = 'true'
  );

-- 3. Policies for "Worker"
CREATE POLICY worker_tenant_isolation ON "Worker"
  USING (
    "tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '') 
    OR current_setting('app.is_super_admin', true) = 'true'
  )
  WITH CHECK (
    "tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '') 
    OR current_setting('app.is_super_admin', true) = 'true'
  );

-- 4. Policies for "Booking"
CREATE POLICY booking_tenant_isolation ON "Booking"
  USING (
    "tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '') 
    OR current_setting('app.is_super_admin', true) = 'true'
  )
  WITH CHECK (
    "tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '') 
    OR current_setting('app.is_super_admin', true) = 'true'
  );

-- Ensure index optimization exists for tenantId lookups
CREATE INDEX IF NOT EXISTS idx_user_tenant ON "User"("tenantId");
CREATE INDEX IF NOT EXISTS idx_service_tenant ON "Service"("tenantId");
CREATE INDEX IF NOT EXISTS idx_worker_tenant ON "Worker"("tenantId");
CREATE INDEX IF NOT EXISTS idx_booking_tenant ON "Booking"("tenantId");
