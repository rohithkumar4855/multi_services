const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sqlStatements = [
  // 1. Enum update
  `BEGIN`,
  `CREATE TYPE "PaymentStatus_new" AS ENUM ('CREATED', 'PENDING', 'AUTHORIZED', 'CAPTURED', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED')`,
  `ALTER TABLE "Order" ALTER COLUMN "paymentStatus" DROP DEFAULT`,
  `ALTER TABLE "Payment" ALTER COLUMN "status" DROP DEFAULT`,
  `ALTER TABLE "Order" ALTER COLUMN "paymentStatus" TYPE "PaymentStatus_new" USING ("paymentStatus"::text::"PaymentStatus_new")`,
  `ALTER TABLE "Payment" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new")`,
  `ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old"`,
  `ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus"`,
  `DROP TYPE "PaymentStatus_old"`,
  `ALTER TABLE "Order" ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING'`,
  `ALTER TABLE "Payment" ALTER COLUMN "status" SET DEFAULT 'PENDING'`,
  `COMMIT`,

  // 2. Drop obsolete indexes / columns
  `DROP INDEX IF EXISTS "Tenant_defaultDomain_idx"`,
  `ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "backgroundColor"`,
  `ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "description"`,
  `ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "domainStatus"`,
  `ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "domainVerified"`,
  `ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "lastDomainVerifiedAt"`,
  `ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "textColor"`,
  `ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "websiteTitle"`,

  // 3. Alter existing tables
  `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "capturedAt" TIMESTAMP(3)`,
  `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT DEFAULT 'UPI'`,
  `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "razorpayOrderId" TEXT`,
  `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "razorpayPaymentId" TEXT`,
  `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "razorpaySignature" TEXT`,
  `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "refundStatus" TEXT DEFAULT 'none'`,
  `ALTER TABLE "Payment" ALTER COLUMN "paymentGateway" SET DEFAULT 'razorpay'`,

  `ALTER TABLE "PaymentWebhook" ADD COLUMN IF NOT EXISTS "processed" BOOLEAN NOT NULL DEFAULT true`,
  `ALTER TABLE "PaymentWebhook" ADD COLUMN IF NOT EXISTS "processedAt" TIMESTAMP(3)`,
  `ALTER TABLE "PaymentWebhook" ADD COLUMN IF NOT EXISTS "webhookEventId" TEXT`,
  `ALTER TABLE "PaymentWebhook" ALTER COLUMN "gateway" SET DEFAULT 'razorpay'`,

  `ALTER TABLE "Service" ALTER COLUMN "icon" SET DEFAULT 'wrench'`,

  // 4. Create TenantPaymentGateway
  `CREATE TABLE IF NOT EXISTS "TenantPaymentGateway" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'razorpay',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "mode" TEXT NOT NULL DEFAULT 'test',
    "keyId" TEXT,
    "encryptedKeySecret" TEXT,
    "webhookSecret" TEXT,
    "connectionStatus" TEXT NOT NULL DEFAULT 'not_connected',
    "accountType" TEXT NOT NULL DEFAULT 'standard',
    "accountId" TEXT,
    "connectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TenantPaymentGateway_pkey" PRIMARY KEY ("id")
  )`,

  // 5. Create Invoice
  `CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT,
    "paymentId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT DEFAULT 'UPI',
    "gateway" TEXT NOT NULL DEFAULT 'razorpay',
    "refundStatus" TEXT DEFAULT 'none',
    "pdfUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
  )`,

  // 6. Create Refund
  `CREATE TABLE IF NOT EXISTS "Refund" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "orderId" TEXT,
    "razorpayRefundId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'processed',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
  )`,

  // 7. Indexes
  `CREATE INDEX IF NOT EXISTS "TenantPaymentGateway_tenantId_idx" ON "TenantPaymentGateway"("tenantId")`,
  `CREATE INDEX IF NOT EXISTS "TenantPaymentGateway_provider_idx" ON "TenantPaymentGateway"("provider")`,
  `CREATE INDEX IF NOT EXISTS "TenantPaymentGateway_connectionStatus_idx" ON "TenantPaymentGateway"("connectionStatus")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "TenantPaymentGateway_tenantId_provider_key" ON "TenantPaymentGateway"("tenantId", "provider")`,

  `CREATE INDEX IF NOT EXISTS "Invoice_tenantId_idx" ON "Invoice"("tenantId")`,
  `CREATE INDEX IF NOT EXISTS "Invoice_orderId_idx" ON "Invoice"("orderId")`,
  `CREATE INDEX IF NOT EXISTS "Invoice_paymentId_idx" ON "Invoice"("paymentId")`,
  `CREATE INDEX IF NOT EXISTS "Invoice_paymentStatus_idx" ON "Invoice"("paymentStatus")`,
  `CREATE INDEX IF NOT EXISTS "Invoice_createdAt_idx" ON "Invoice"("createdAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_tenantId_invoiceNumber_key" ON "Invoice"("tenantId", "invoiceNumber")`,

  `CREATE UNIQUE INDEX IF NOT EXISTS "Refund_razorpayRefundId_key" ON "Refund"("razorpayRefundId")`,
  `CREATE INDEX IF NOT EXISTS "Refund_tenantId_idx" ON "Refund"("tenantId")`,
  `CREATE INDEX IF NOT EXISTS "Refund_paymentId_idx" ON "Refund"("paymentId")`,

  `CREATE INDEX IF NOT EXISTS "Payment_razorpayOrderId_idx" ON "Payment"("razorpayOrderId")`,
  `CREATE INDEX IF NOT EXISTS "Payment_razorpayPaymentId_idx" ON "Payment"("razorpayPaymentId")`,

  `CREATE UNIQUE INDEX IF NOT EXISTS "PaymentWebhook_webhookEventId_key" ON "PaymentWebhook"("webhookEventId")`,
  `CREATE INDEX IF NOT EXISTS "PaymentWebhook_webhookEventId_idx" ON "PaymentWebhook"("webhookEventId")`,
  `CREATE INDEX IF NOT EXISTS "PaymentWebhook_event_idx" ON "PaymentWebhook"("event")`
];

const fkConstraints = [
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TenantPaymentGateway_tenantId_fkey') THEN
      ALTER TABLE "TenantPaymentGateway" ADD CONSTRAINT "TenantPaymentGateway_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$;`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invoice_tenantId_fkey') THEN
      ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$;`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invoice_orderId_fkey') THEN
      ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END $$;`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invoice_paymentId_fkey') THEN
      ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END $$;`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Refund_tenantId_fkey') THEN
      ALTER TABLE "Refund" ADD CONSTRAINT "Refund_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$;`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Refund_paymentId_fkey') THEN
      ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
  END $$;`
];

async function apply() {
  console.log('Applying migration SQL...');
  for (const sql of sqlStatements) {
    console.log('Running:', sql.slice(0, 60).replace(/\n/g, ' '));
    await prisma.$executeRawUnsafe(sql);
  }
  for (const fk of fkConstraints) {
    console.log('Adding constraint safely...');
    await prisma.$executeRawUnsafe(fk);
  }
  console.log('Successfully applied all migrations!');
}

apply()
  .catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
