/**
 * Centralized Domain Normalization & URL Builder Utility (Frontend)
 */
import type { Tenant } from '../types';

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
  const domainRegex = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})*\.[a-z]{2,}$/i;
  return domainRegex.test(normalized);
}

/**
 * Dynamically resolves the correct public URL for a tenant.
 *
 * Priority:
 * 1. Verified Custom Domain (https://www.prservices.com)
 * 2. Active deployment host URL (https://your-app.vercel.app/#/site?tenant=slug)
 * 3. Fallback from tenant slug / subdomain
 * 4. Platform fallback (https://vercel.com/)
 */
export function getTenantPublicUrl(tenant: Partial<Tenant> | null | undefined): string {
  if (!tenant) return 'https://vercel.com/';

  // 1. Verified & Active Custom Domain
  const customDomain = normalizeDomain(tenant.customDomain);
  const isVerified = tenant.domainVerified === true || tenant.domainStatus === 'active';
  if (customDomain && isVerified) {
    return `https://${customDomain}`;
  }

  const slug = getTenantSlug(tenant);

  // 2. Active application hosting URL (works seamlessly on Vercel, custom platform domains, and localhost)
  if (typeof window !== 'undefined' && window.location.origin) {
    return `${window.location.origin}/#/site?tenant=${slug}`;
  }

  // 3. Fallback from tenant slug / subdomain
  if (slug) {
    return `https://${slug}.vercel.app`;
  }

  // 4. Platform Fallback
  return 'https://vercel.com/';
}

/**
 * Generates the tenant's default active domain or path.
 * e.g. "your-app.vercel.app/#/site?tenant=prservices" or custom domain
 */
export function getTenantVercelDomain(tenant: Partial<Tenant> | null | undefined): string {
  if (!tenant) return '';
  if (tenant.customDomain && (tenant.domainVerified === true || tenant.domainStatus === 'active')) {
    return normalizeDomain(tenant.customDomain);
  }
  const slug = getTenantSlug(tenant);
  if (typeof window !== 'undefined' && window.location.host) {
    return `${window.location.host}/#/site?tenant=${slug}`;
  }
  if (tenant.defaultDomain) return normalizeDomain(tenant.defaultDomain);
  return slug ? `${slug}.vercel.app` : '';
}

/**
 * Returns a human-friendly, clean slug for a tenant.
 * Avoids raw internal IDs like 'tenant-1788329795460'.
 * e.g. "prservices"
 */
export function getTenantSlug(tenant: Partial<Tenant> | null | undefined): string {
  if (!tenant) return 'prservices';
  if (tenant.slug && tenant.slug.trim()) return tenant.slug.trim().toLowerCase();
  if (tenant.subdomain && !tenant.subdomain.startsWith('tenant-') && !/^\d+$/.test(tenant.subdomain)) {
    return tenant.subdomain.trim().toLowerCase();
  }
  if (tenant.name && tenant.name.trim()) {
    const clean = tenant.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean) return clean;
  }
  if (tenant.customDomain) {
    const clean = normalizeDomain(tenant.customDomain).split('.')[0];
    if (clean && clean !== 'www') return clean;
  }
  return (tenant.subdomain || tenant.id || 'prservices').replace(/^tenant-/, '');
}
