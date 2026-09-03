/**
 * Centralized Domain Normalization & URL Builder Utility (Backend)
 */

/**
 * Normalizes any domain/hostname string.
 * Strips http/https protocols, paths, query strings, ports, trailing slashes, and whitespace.
 * Converts to lowercase.
 *
 * Example: "https://www.PRServices.com/" -> "www.prservices.com"
 */
export function normalizeDomain(input: string | null | undefined): string {
  if (!input) return '';

  let domain = input.trim().toLowerCase();

  // Strip protocol
  domain = domain.replace(/^https?:\/\//i, '');

  // Strip pathname / query params / hash
  domain = domain.split('/')[0];
  domain = domain.split('?')[0];
  domain = domain.split('#')[0];

  // Strip port if present
  domain = domain.split(':')[0];

  // Strip trailing or leading dots/slashes
  domain = domain.replace(/^\.+|\.+$/g, '');

  return domain.trim();
}

/**
 * Validates domain format (e.g. www.example.com, sub.domain.co, mydomain.com).
 */
export function isValidDomainFormat(domain: string): boolean {
  if (!domain) return false;
  const normalized = normalizeDomain(domain);
  // Domain regex: allows labels with alphanumeric and hyphens, separated by dots, with a valid TLD or multi-part
  const domainRegex = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})*\.[a-z]{2,}$/i;
  return domainRegex.test(normalized);
}

/**
 * Dynamically resolves the correct public URL for a tenant.
 *
 * Priority:
 * 1. Verified Custom Domain (https://www.prservices.com)
 * 2. Tenant Default Vercel Domain (https://prservices.vercel.app)
 * 3. Platform fallback (https://vercel.com/)
 *
 * NEVER returns localhost.
 */
export function getTenantPublicUrl(tenant: any): string {
  if (!tenant) return 'https://vercel.com/';

  // 1. Verified & Active Custom Domain
  const customDomain = normalizeDomain(tenant.customDomain);
  const isVerified = tenant.domainVerified === true || tenant.domainStatus === 'active';
  if (customDomain && isVerified) {
    return `https://${customDomain}`;
  }

  // 2. Tenant Default Vercel Domain
  const defaultDomain = normalizeDomain(tenant.defaultDomain);
  if (defaultDomain) {
    return `https://${defaultDomain}`;
  }

  // 3. Fallback from tenant slug / subdomain
  const slug = (tenant.slug || tenant.subdomain || '').trim().toLowerCase();
  if (slug) {
    return `https://${slug}.vercel.app`;
  }

  // 4. Platform Fallback
  return 'https://vercel.com/';
}

/**
 * Generates the tenant's default Vercel domain.
 * e.g. "prservices.vercel.app"
 */
export function getTenantVercelDomain(tenant: any): string {
  if (!tenant) return '';
  if (tenant.defaultDomain) return normalizeDomain(tenant.defaultDomain);
  const slug = (tenant.slug || tenant.subdomain || '').trim().toLowerCase();
  return slug ? `${slug}.vercel.app` : '';
}
