import { normalizeDomain, isValidDomainFormat, getTenantPublicUrl, getTenantVercelDomain } from '../utils/domain';
import { VercelDomainService } from '../services/vercel-domain.service';

function assertEqual(actual: any, expected: any, label: string) {
  if (actual === expected) {
    console.log(`✅ [PASS] ${label}`);
  } else {
    console.error(`❌ [FAIL] ${label} - Expected: "${expected}", Actual: "${actual}"`);
    throw new Error(`Assertion failed: ${label}`);
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log('🧪 RUNNING MULTI-TENANT DOMAIN TESTS');
  console.log('========================================\n');

  // 1. Domain Normalization Tests
  console.log('--- 1. Domain Normalization ---');
  assertEqual(normalizeDomain('https://www.PRServices.com/'), 'www.prservices.com', 'Strip https and trailing slash + lowercase');
  assertEqual(normalizeDomain('http://www.prservices.com:3000/some/path'), 'www.prservices.com', 'Strip http, port and path');
  assertEqual(normalizeDomain('  www.mybusiness.com  '), 'www.mybusiness.com', 'Trim whitespace');
  assertEqual(normalizeDomain('prservices.vercel.app'), 'prservices.vercel.app', 'Handle vercel subdomain');

  // 2. Domain Format Validation
  console.log('\n--- 2. Domain Format Validation ---');
  assertEqual(isValidDomainFormat('www.prservices.com'), true, 'Valid domain format');
  assertEqual(isValidDomainFormat('mybiz.org'), true, 'Valid apex domain');
  assertEqual(isValidDomainFormat('invalid domain with spaces'), false, 'Invalid domain spaces');
  assertEqual(isValidDomainFormat(''), false, 'Empty domain');

  // 3. Centralized URL Builder Priority Tests (Requirement #23)
  console.log('\n--- 3. Centralized URL Builder Priority & Acceptance Tests ---');

  // Tenant A: Verified Custom Domain
  const tenantA = {
    id: 'tenant_1',
    name: 'PR Services',
    slug: 'prservices',
    defaultDomain: 'prservices.vercel.app',
    customDomain: 'www.prservices.com',
    domainVerified: true,
    domainStatus: 'active'
  };
  assertEqual(getTenantPublicUrl(tenantA), 'https://www.prservices.com', 'Tenant A (PR Services): Verified Custom Domain -> https://www.prservices.com');

  // Tenant B: Verified Custom Domain ABC Services
  const tenantB = {
    id: 'tenant_2',
    name: 'ABC Services',
    slug: 'abcservices',
    defaultDomain: 'abcservices.vercel.app',
    customDomain: 'www.abcservices.com',
    domainVerified: true,
    domainStatus: 'active'
  };
  assertEqual(getTenantPublicUrl(tenantB), 'https://www.abcservices.com', 'Tenant B (ABC Services): Verified Custom Domain -> https://www.abcservices.com');

  // Tenant C: No custom domain, has default/slug domain
  const tenantC = {
    id: 'tenant_3',
    name: 'ABC Services',
    slug: 'abcservices',
    defaultDomain: 'abcservices.vercel.app',
    customDomain: null,
    domainVerified: false,
    domainStatus: 'active'
  };
  assertEqual(getTenantPublicUrl(tenantC), 'https://abcservices.vercel.app', 'Tenant C (No custom domain): Fallback to Vercel -> https://abcservices.vercel.app');

  // Tenant D: No custom domain, no slug/default domain
  const tenantD = {
    id: 'tenant_4',
    name: 'New Business',
    slug: '',
    defaultDomain: null,
    customDomain: null,
    domainVerified: false,
    domainStatus: 'active'
  };
  assertEqual(getTenantPublicUrl(tenantD), 'https://vercel.com/', 'Tenant D (No domain configured): Platform Fallback -> https://vercel.com/');

  // 4. DNS Instructions Generation
  console.log('\n--- 4. DNS Configuration Instructions ---');
  const subdomainDns = VercelDomainService.getDnsInstructions('www.prservices.com');
  assertEqual(subdomainDns[0].type, 'CNAME', 'Subdomain DNS type is CNAME');
  assertEqual(subdomainDns[0].name, 'www', 'Subdomain host is www');
  assertEqual(subdomainDns[0].value, 'cname.vercel-dns.com', 'Subdomain target is cname.vercel-dns.com');

  const apexDns = VercelDomainService.getDnsInstructions('prservices.com');
  assertEqual(apexDns[0].type, 'A', 'Apex DNS type is A');
  assertEqual(apexDns[0].value, '76.76.21.21', 'Apex IP target is 76.76.21.21');

  console.log('\n🎉 ALL DOMAIN TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
