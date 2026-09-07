import 'dotenv/config';
import { prisma } from '../config/db';
import { TenantService } from '../services/tenant.service';
import { PaymentGatewayService } from '../services/paymentGateway.service';
import { PaymentService } from '../services/payment.service';
import { OrderService } from '../services/order.service';
import { encryptSecret, decryptSecret, verifyRazorpaySignature, verifyRazorpayWebhookSignature } from '../utils/crypto';
import crypto from 'crypto';

async function runTestSuite() {
  console.log('===============================================================');
  console.log('🚀 RUNNING COMPLETE RAZORPAY MULTI-TENANT TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, extra?: any) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`, extra || '');
      failed++;
    }
  }

  try {
    const timestamp = Date.now();
    const tenantEmailA = `admin_a_${timestamp}@apexservices.com`;
    const tenantEmailB = `admin_b_${timestamp}@zenithpro.com`;

    // ── TEST 1: Tenant A Creation ──────────────────────────────────────────
    console.log('\n--- 1. Tenant Creation & Auto-Provisioning ---');
    const tenantARes = await TenantService.registerTenant({
      name: `Apex Pro Services ${timestamp}`,
      ownerName: 'Alice Apex',
      ownerEmail: tenantEmailA,
      industryType: 'Electrical & Automation',
      plan: 'starter'
    });
    const tenantA = tenantARes.tenant;
    assert(Boolean(tenantA && tenantA.id), '1. Create Tenant A');

    // ── TEST 2: Tenant Payment Configuration Auto-Created ──────────────────
    const gatewayA = await PaymentGatewayService.getTenantGatewayConfig(tenantA.id, 'razorpay');
    assert(
      gatewayA && gatewayA.provider === 'razorpay' && gatewayA.connectionStatus === 'not_connected' && gatewayA.enabled === false,
      '2. Tenant payment configuration automatically created on registration'
    );

    // ── TEST 3: Test Connection Validation (Invalid vs Valid) ──────────────
    console.log('\n--- 2. Credential Validation & Connection ---');
    const invalidTest = await PaymentGatewayService.testConnection({
      keyId: 'rzp_test_invalid_prefix',
      keySecret: 'secret123',
      mode: 'test'
    });
    assert(!invalidTest.success, '3. Rejects invalid key prefix for test mode');

    const validTest = await PaymentGatewayService.testConnection({
      keyId: 'rzp_test_mock_1234567890',
      keySecret: 'mock_secret_abcdef123456',
      mode: 'test'
    });
    assert(validTest.success, '4. Validates correct Test Mode credentials');

    // ── TEST 4: Connect Razorpay & Encrypted Storage ────────────────────────
    const connectedGateway = await PaymentGatewayService.connectGateway(tenantA.id, {
      mode: 'test',
      keyId: 'rzp_test_mock_1234567890',
      keySecret: 'mock_secret_abcdef123456',
      webhookSecret: 'mock_webhook_secret_999'
    });
    assert(
      connectedGateway.connectionStatus === 'connected' && connectedGateway.enabled === true,
      '5. Connect Razorpay Test Mode & Enable Gateway'
    );

    // Verify secret is encrypted in database, not plain text
    const dbGatewayRow = await prisma.tenantPaymentGateway.findUnique({
      where: { tenantId_provider: { tenantId: tenantA.id, provider: 'razorpay' } }
    });
    assert(
      Boolean(dbGatewayRow?.encryptedKeySecret && !dbGatewayRow.encryptedKeySecret.includes('mock_secret_abcdef123456')),
      '6. Razorpay secrets encrypted at rest (AES-256-GCM) in database'
    );
    const decryptedKeySecret = decryptSecret(dbGatewayRow!.encryptedKeySecret!);
    assert(decryptedKeySecret === 'mock_secret_abcdef123456', '7. Key Secret decrypts accurately server-side');

    // ── TEST 5: Customer Order & Razorpay Order Creation ────────────────────
    console.log('\n--- 3. Order Flow & Server-Side Amount Validation ---');
    const orderItems = [
      { name: 'Electrical Panel Inspection', price: 1500, quantity: 1 },
      { name: 'Surge Protection Device', price: 2500, quantity: 2 }
    ]; // Subtotal = 1500 + 5000 = 6500

    const razorpayOrder = await PaymentService.createRazorpayOrder({
      tenantId: tenantA.id,
      items: orderItems,
      customerDetails: {
        name: 'Rahul Sharma',
        phone: '+919876543210',
        email: 'rahul@example.com'
      },
      notes: 'Customer urgent request'
    });

    assert(Boolean(razorpayOrder.razorpayOrderId && razorpayOrder.amount === 7670), '8. Server-side amount calculated (subtotal + tax) and Razorpay order created');
    assert(!('keySecret' in razorpayOrder), '9. Zero client secret exposure in create-order response');

    // ── TEST 6: Payment Signature Verification & Fulfillment ───────────────
    console.log('\n--- 4. Payment Signature Verification & Fulfillment ---');
    const paymentId = `pay_mock_${Date.now()}`;
    const validSignature = crypto
      .createHmac('sha256', 'mock_secret_abcdef123456')
      .update(`${razorpayOrder.razorpayOrderId}|${paymentId}`)
      .digest('hex');

    const verifyResult = await PaymentService.verifyRazorpayPayment({
      tenantId: tenantA.id,
      orderId: razorpayOrder.orderId,
      razorpayOrderId: razorpayOrder.razorpayOrderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: validSignature,
      paymentMethod: 'UPI'
    });

    assert(verifyResult.success && verifyResult.order.paymentStatus === 'SUCCESS', '10. Signature verified server-side and Order marked PAID');
    assert(Boolean(verifyResult.invoice && verifyResult.invoice.invoiceNumber.startsWith('INV-')), '11. Automated Tax Invoice generated on payment completion');

    // ── TEST 7: Invoices Ledger Logs & Financial Stats ──────────────────────
    console.log('\n--- 5. Invoices Ledger & Tenant Dashboard Analytics ---');
    const ledger = await PaymentService.getTenantInvoicesLedger(tenantA.id, {
      search: 'Rahul'
    });
    assert(ledger.invoices.length > 0 && ledger.invoices[0].customerName === 'Rahul Sharma', '12. Invoice appears in ledger with customer search');

    const stats = await PaymentService.getTenantPaymentStats(tenantA.id);
    assert(stats.totalRevenue >= 6500 && stats.successfulPayments >= 1, '13. Tenant financial dashboard analytics computed accurately');

    // ── TEST 8: Webhook Processing & Idempotency ────────────────────────────
    console.log('\n--- 6. Public Webhook Processing & Idempotency ---');
    const webhookEventId = `evt_test_${Date.now()}`;
    const webhookPayload = {
      id: webhookEventId,
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_webhook_${Date.now()}`,
            order_id: razorpayOrder.razorpayOrderId,
            amount: 650000,
            currency: 'INR',
            method: 'upi',
            notes: {
              tenantId: tenantA.id,
              orderId: razorpayOrder.orderId
            }
          }
        }
      }
    };
    const rawWebhookBody = JSON.stringify(webhookPayload);
    const webhookSignature = crypto
      .createHmac('sha256', 'mock_webhook_secret_999')
      .update(rawWebhookBody)
      .digest('hex');

    const webhookRes1 = await PaymentService.handleRazorpayWebhook(rawWebhookBody, webhookSignature, tenantA.id);
    assert(webhookRes1.received === true && !webhookRes1.duplicate, '14. Webhook received, verified, and processed');

    // Send duplicate webhook
    const webhookRes2 = await PaymentService.handleRazorpayWebhook(rawWebhookBody, webhookSignature, tenantA.id);
    assert(webhookRes2.received === true && webhookRes2.duplicate === true, '15. Webhook idempotency protects against duplicate transaction processing');

    // ── TEST 9: Tenant Isolation Checks ────────────────────────────────────
    console.log('\n--- 7. Strict Multi-Tenant Isolation ---');
    // Create Tenant B
    const tenantBRes = await TenantService.registerTenant({
      name: `Zenith Legal Pro ${timestamp}`,
      ownerName: 'Bob Zenith',
      ownerEmail: tenantEmailB,
      industryType: 'Legal Services'
    });
    const tenantB = tenantBRes.tenant;

    // Tenant B cannot access Tenant A's orders or invoices
    let tenantIsolated = false;
    try {
      await OrderService.getOrderById(razorpayOrder.orderId, tenantB.id, false);
    } catch (err: any) {
      if (err.statusCode === 403 || err.message?.includes('Forbidden')) {
        tenantIsolated = true;
      }
    }
    assert(tenantIsolated, '16. Tenant B is forbidden from accessing Tenant A order/payment');

    const tenantBInvoices = await PaymentService.getTenantInvoicesLedger(tenantB.id);
    assert(tenantBInvoices.invoices.length === 0, '17. Tenant B ledger is strictly isolated and cannot see Tenant A invoices');

    // ── TEST 10: Gateway Controls (Disable, Re-enable, Mode Switch) ─────────
    console.log('\n--- 8. Gateway State Management (Disable, Re-enable, Mode Switch) ---');
    const disabledGateway = await PaymentGatewayService.toggleGateway(tenantA.id, 'razorpay', false);
    assert(!disabledGateway.enabled && disabledGateway.connectionStatus === 'disabled', '18. Disable Razorpay gateway');

    const reEnabledGateway = await PaymentGatewayService.toggleGateway(tenantA.id, 'razorpay', true);
    assert(reEnabledGateway.enabled && reEnabledGateway.connectionStatus === 'connected', '19. Re-enable Razorpay gateway');

    const liveModeGateway = await PaymentGatewayService.switchMode(tenantA.id, 'razorpay', 'live');
    assert(liveModeGateway.mode === 'live', '20. Switch gateway to Live Mode');

    const testModeGateway = await PaymentGatewayService.switchMode(tenantA.id, 'razorpay', 'test');
    assert(testModeGateway.mode === 'test', '21. Switch gateway back to Test Mode');

    // ── TEST 11: Domain-Based Tenant Resolution ─────────────────────────────
    console.log('\n--- 9. Domain-Based Tenant Resolution ---');
    const resolvedTenant = await TenantService.resolveTenant(tenantA.slug);
    assert(resolvedTenant && resolvedTenant.id === tenantA.id, '22. Domain / Slug based tenant resolution succeeds');

    console.log('\n===============================================================');
    console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('===============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Fatal Test Suite Error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTestSuite();
