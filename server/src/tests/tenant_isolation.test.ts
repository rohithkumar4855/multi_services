import { TenantService } from '../services/tenant.service';
import { AuthService } from '../services/auth.service';
import { OrderService } from '../services/order.service';
import { PaymentService } from '../services/payment.service';
import { prisma } from '../config/db';
import { logger } from '../utils/logger';

async function runTenantIsolationTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING MULTI-TENANT ISOLATION & ACCEPTANCE TESTS');
  console.log('======================================================\n');

  let passedTests = 0;
  let totalTests = 7;

  try {
    const timestamp = Date.now();

    // ─────────────────────────────────────────────────────────────
    // TEST 1 — Automatic Tenant & Website Creation (Admin A)
    // ─────────────────────────────────────────────────────────────
    console.log('▶ [TEST 1] Admin A Registration & Automatic Tenant/Website Creation...');
    const adminA = await TenantService.registerTenant({
      name: `Apex Pro Services ${timestamp}`,
      ownerName: 'Alice Johnson',
      ownerEmail: `alice_${timestamp}@apexpro.com`,
      ownerPhone: '1112223333',
      password: 'adminPassword123',
      industryType: 'Electrical & Automation',
      primaryColor: '#0284c7',
      secondaryColor: '#0369a1',
      font: 'Inter, sans-serif'
    });

    if (!adminA.tenant || !adminA.website || !adminA.token) {
      throw new Error('Test 1 Failed: Tenant or Website or Token missing');
    }

    const pagesA = await prisma.websitePage.findMany({
      where: { tenantId: adminA.tenant.id }
    });

    if (pagesA.length < 6) {
      throw new Error(`Test 1 Failed: Expected at least 6 CMS pages, got ${pagesA.length}`);
    }

    const servicesA = await prisma.service.findMany({
      where: { tenantId: adminA.tenant.id }
    });

    const productsA = await prisma.product.findMany({
      where: { tenantId: adminA.tenant.id }
    });

    console.log(`  ✓ Tenant A created: ID=${adminA.tenant.id}, Slug=${adminA.tenant.slug}`);
    console.log(`  ✓ Auto-generated Website A: ID=${adminA.website.id}, Pages=${pagesA.length}`);
    console.log(`  ✓ Default Catalog seeded: Services=${servicesA.length}, Products=${productsA.length}`);
    passedTests++;

    // ─────────────────────────────────────────────────────────────
    // TEST 2 — Second Tenant Independent Creation & Collision Safety
    // ─────────────────────────────────────────────────────────────
    console.log('\n▶ [TEST 2] Admin B Independent Creation & Collision-Safe Slug...');
    const adminB = await TenantService.registerTenant({
      name: `Beacon Pro Services ${timestamp}`,
      ownerName: 'Bob Smith',
      ownerEmail: `bob_${timestamp}@beaconpro.com`,
      ownerPhone: '4445556666',
      password: 'adminPassword123',
      industryType: 'Plumbing & HVAC',
      primaryColor: '#16a34a',
      secondaryColor: '#15803d',
      font: 'Roboto, sans-serif'
    });

    if (adminB.tenant.id === adminA.tenant.id || adminB.tenant.slug === adminA.tenant.slug) {
      throw new Error('Test 2 Failed: Tenant B collided with Tenant A');
    }

    console.log(`  ✓ Tenant B created independently: ID=${adminB.tenant.id}, Slug=${adminB.tenant.slug}`);
    console.log(`  ✓ Distinct branding: Color=${adminB.tenant.primaryColor} (vs Tenant A ${adminA.tenant.primaryColor})`);
    passedTests++;

    // ─────────────────────────────────────────────────────────────
    // TEST 3 — User Isolation Between Tenants
    // ─────────────────────────────────────────────────────────────
    console.log('\n▶ [TEST 3] Customer Registration & User Isolation Check...');
    const customerA = await AuthService.customerRegister({
      tenantId: adminA.tenant.id,
      name: 'Customer Alice Client',
      phone: `91${timestamp.toString().slice(-8)}1`,
      email: `clientA_${timestamp}@gmail.com`,
      password: 'customerPass123',
      address: '100 Alpha St'
    });

    const customerB = await AuthService.customerRegister({
      tenantId: adminB.tenant.id,
      name: 'Customer Bob Client',
      phone: `92${timestamp.toString().slice(-8)}2`,
      email: `clientB_${timestamp}@gmail.com`,
      password: 'customerPass123',
      address: '200 Beta St'
    });

    // Query users belonging to Tenant A
    const usersInTenantA = await prisma.user.findMany({
      where: { tenantId: adminA.tenant.id }
    });

    // Query users belonging to Tenant B
    const usersInTenantB = await prisma.user.findMany({
      where: { tenantId: adminB.tenant.id }
    });

    const tenantAHasUserB = usersInTenantA.some(u => u.id === customerB.user.id);
    const tenantBHasUserA = usersInTenantB.some(u => u.id === customerA.user.id);

    if (tenantAHasUserB || tenantBHasUserA) {
      throw new Error('Test 3 Failed: User data leakage detected across tenants!');
    }

    console.log(`  ✓ Tenant A Users Count: ${usersInTenantA.length} (Customer A present, Customer B absent)`);
    console.log(`  ✓ Tenant B Users Count: ${usersInTenantB.length} (Customer B present, Customer A absent)`);
    passedTests++;

    // ─────────────────────────────────────────────────────────────
    // TEST 4 — Order Isolation
    // ─────────────────────────────────────────────────────────────
    console.log('\n▶ [TEST 4] Order Placement & Strict Order Isolation...');
    const orderA = await OrderService.createOrder({
      tenantId: adminA.tenant.id,
      userId: customerA.user.id,
      items: [
        { id: 'item-1', name: 'Electrical Check', price: 99, quantity: 1, type: 'service' }
      ],
      subtotal: 99,
      tax: 8.41,
      total: 107.41,
      customerDetails: {
        name: customerA.user.name,
        email: customerA.user.email,
        phone: customerA.user.phone
      }
    });

    const orderB = await OrderService.createOrder({
      tenantId: adminB.tenant.id,
      userId: customerB.user.id,
      items: [
        { id: 'item-2', name: 'Pipe Repair', price: 149, quantity: 1, type: 'service' }
      ],
      subtotal: 149,
      tax: 12.66,
      total: 161.66,
      customerDetails: {
        name: customerB.user.name,
        email: customerB.user.email,
        phone: customerB.user.phone
      }
    });

    const ordersForTenantA = await OrderService.getTenantOrders(adminA.tenant.id);
    const ordersForTenantB = await OrderService.getTenantOrders(adminB.tenant.id);

    const hasLeakedOrderB = ordersForTenantA.some(o => o.id === orderB.id);
    const hasLeakedOrderA = ordersForTenantB.some(o => o.id === orderA.id);

    if (hasLeakedOrderB || hasLeakedOrderA) {
      throw new Error('Test 4 Failed: Cross-tenant order leakage detected!');
    }

    console.log(`  ✓ Order A (#${orderA.orderNumber}) belongs only to Tenant A`);
    console.log(`  ✓ Order B (#${orderB.orderNumber}) belongs only to Tenant B`);
    passedTests++;

    // ─────────────────────────────────────────────────────────────
    // TEST 5 — Cross-Tenant API Security & 403 Access Denied Check
    // ─────────────────────────────────────────────────────────────
    console.log('\n▶ [TEST 5] Cross-Tenant Resource Access Security (Forbidden Check)...');
    let caughtSecurityError = false;
    try {
      // Attempting to access Tenant B's order using Tenant A's tenant context
      await OrderService.getOrderById(orderB.id, adminA.tenant.id, false);
    } catch (err: any) {
      if (err.statusCode === 403 || err.message.includes('Forbidden') || err.message.includes('another tenant')) {
        caughtSecurityError = true;
        console.log(`  ✓ Security Assertion Passed: Cross-tenant fetch blocked with status ${err.statusCode} - "${err.message}"`);
      }
    }

    if (!caughtSecurityError) {
      throw new Error('Test 5 Failed: Cross-tenant access was NOT blocked!');
    }
    passedTests++;

    // ─────────────────────────────────────────────────────────────
    // TEST 6 — Direct Parameter Tampering Defense
    // ─────────────────────────────────────────────────────────────
    console.log('\n▶ [TEST 6] Client Parameter Tampering Defense & Payment Protection...');
    // Attempt to process payment for Order B under Tenant A (tampering attack)
    let caughtTamperError = false;
    try {
      await PaymentService.processPayment({
        tenantId: adminA.tenant.id, // Mismatched tenant
        orderId: orderB.id,         // Belongs to Tenant B
        amount: 161.66
      });
    } catch (err: any) {
      if (err.statusCode === 403 || err.message.includes('Forbidden') || err.message.includes('does not belong')) {
        caughtTamperError = true;
        console.log(`  ✓ Tamper Defense Passed: Unauthorized payment spoof rejected with status ${err.statusCode}`);
      }
    }

    if (!caughtTamperError) {
      throw new Error('Test 6 Failed: Tampered payment was processed!');
    }
    passedTests++;

    // ─────────────────────────────────────────────────────────────
    // TEST 7 — Dynamic Storefront & Website Configuration Resolution
    // ─────────────────────────────────────────────────────────────
    console.log('\n▶ [TEST 7] Dynamic Website Resolution & CMS Page Isolation...');
    const resolvedSiteA = await TenantService.resolveTenant(adminA.tenant.slug);
    const resolvedSiteB = await TenantService.resolveTenant(adminB.tenant.slug);

    if (!resolvedSiteA || !resolvedSiteB) {
      throw new Error('Test 7 Failed: Could not resolve generated websites');
    }

    if (resolvedSiteA.primaryColor === resolvedSiteB.primaryColor || resolvedSiteA.id === resolvedSiteB.id) {
      throw new Error('Test 7 Failed: Website configurations collided');
    }

    console.log(`  ✓ Website A Resolved: Name="${resolvedSiteA.name}", PrimaryColor=${resolvedSiteA.primaryColor}`);
    console.log(`  ✓ Website B Resolved: Name="${resolvedSiteB.name}", PrimaryColor=${resolvedSiteB.primaryColor}`);
    passedTests++;

    console.log('\n======================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} MULTI-TENANT ISOLATION TESTS PASSED!`);
    console.log('======================================================\n');
  } catch (err: any) {
    console.error(`\n❌ TEST SUITE FAILED: ${err.message}\n`, err);
    process.exit(1);
  }
}

// Execute tests if invoked directly
runTenantIsolationTests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
