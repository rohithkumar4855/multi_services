import { useState, useEffect, type ReactElement } from 'react';
import type { AuthSession, Tenant, Service, Worker, Booking, Lead, Coupon, Quotation, Campaign, SupportTicket } from './types';
import {
  INITIAL_TENANTS, INITIAL_SERVICES, INITIAL_WORKERS,
  INITIAL_BOOKINGS, INITIAL_LEADS, INITIAL_COUPONS, INITIAL_QUOTATIONS, INITIAL_CAMPAIGNS, INITIAL_TICKETS
} from './initialData';
import Landing from './pages/Landing';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import TenantAdmin from './pages/TenantAdmin';
import CustomerSite from './pages/CustomerSite';
import { api } from './utils/api';

// ── Route constants ─────────────────────────────────────────
const ROUTE_LANDING    = '#/';
const ROUTE_SUPERADMIN = '#/superadmin';
const ROUTE_ADMIN      = '#/admin';
const ROUTE_SITE       = '#/site';

// ── Shared state prop types ─────────────────────────────────
export interface SharedStore {
  tenants: Tenant[];
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  workers: Worker[];
  setWorkers: React.Dispatch<React.SetStateAction<Worker[]>>;
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  coupons: Coupon[];
  setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>>;
  quotations: Quotation[];
  setQuotations: React.Dispatch<React.SetStateAction<Quotation[]>>;
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  tickets: SupportTicket[];
  setTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
}

// ── App root ────────────────────────────────────────────────
export default function App() {
  // ── Router ──
  const [route, setRoute] = useState<string>(window.location.hash || ROUTE_LANDING);

  // ── Auth session (persisted in sessionStorage) ──
  const [session, setSession] = useState<AuthSession>(() => {
    try {
      const saved = sessionStorage.getItem('anarav_session');
      return saved ? JSON.parse(saved) : { role: null };
    } catch { return { role: null }; }
  });

  // ── GLOBAL SHARED STATE ──────────────────────────────────
  // This is the single source of truth for ALL pages.
  // TenantAdmin writes here → CustomerSite reads here = theme propagates.
  const [tenants,    setTenants]    = useState<Tenant[]>(() => {
    try {
      const cached = sessionStorage.getItem('anarav_cached_tenants');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map(INITIAL_TENANTS.map(t => [t.id, t]));
          for (const t of parsed) map.set(t.id, t);
          return Array.from(map.values());
        }
      }
    } catch {}
    return INITIAL_TENANTS;
  });
  const [services,   setServices]   = useState<Service[]>(INITIAL_SERVICES);
  const [workers,    setWorkers]    = useState<Worker[]>(INITIAL_WORKERS);
  const [bookings,   setBookings]   = useState<Booking[]>(INITIAL_BOOKINGS);
  const [leads,      setLeads]      = useState<Lead[]>(INITIAL_LEADS);
  const [coupons,    setCoupons]    = useState<Coupon[]>(INITIAL_COUPONS);
  const [quotations, setQuotations] = useState<Quotation[]>(INITIAL_QUOTATIONS);
  const [campaigns,  setCampaigns]  = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [tickets,    setTickets]    = useState<SupportTicket[]>(INITIAL_TICKETS);

  const store: SharedStore = {
    tenants, setTenants,
    services, setServices,
    workers, setWorkers,
    bookings, setBookings,
    leads, setLeads,
    coupons, setCoupons,
    quotations, setQuotations,
    campaigns, setCampaigns,
    tickets, setTickets,
  };

  // ── Sync database data on startup / refresh ──
  useEffect(() => {
    // 1. Sync tenants from database
    api.getTenants().then(res => {
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setTenants(prev => {
          const map = new Map(prev.map(t => [t.id, t]));
          for (const dbT of res.data) {
            const cfg = (dbT.config || {}) as any;
            map.set(dbT.id, {
              id: dbT.id,
              name: dbT.name,
              ownerName: cfg.ownerName || dbT.users?.[0]?.name || dbT.name,
              ownerEmail: cfg.ownerEmail || dbT.users?.[0]?.email || '',
              ownerPhone: cfg.ownerPhone || cfg.phone || '',
              subdomain: dbT.subdomain,
              status: cfg.status || 'active',
              plan: dbT.plan || 'starter',
              industries: cfg.industries || ['Electrician'],
              theme: cfg.theme || 'modern',
              config: cfg,
              features: cfg.features || { crm: true, ai: false, quotation: true, emergencyBooking: true, analytics: false, marketing: false, inventory: false },
              registeredAt: dbT.createdAt ? new Date(dbT.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            });
          }
          const merged = Array.from(map.values());
          try {
            sessionStorage.setItem('anarav_cached_tenants', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    }).catch(() => {});

    // 2. Sync leads from database
    api.getLeads().then(res => {
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setLeads(prev => {
          const map = new Map(prev.map(l => [l.id, l]));
          for (const dbL of res.data) {
            map.set(dbL.id, {
              id: dbL.id,
              tenantId: dbL.tenantId,
              name: dbL.name,
              phone: dbL.phone,
              email: dbL.email || '',
              serviceInterest: dbL.serviceInterest || '',
              notes: dbL.notes || '',
              status: dbL.status || 'new',
              createdAt: dbL.createdAt || new Date().toISOString()
            });
          }
          return Array.from(map.values());
        });
      }
    }).catch(() => {});
  }, []);

  // ── Hash routing ──
  useEffect(() => {
    const onHash = () => { setRoute(window.location.hash || ROUTE_LANDING); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigateTo = (hash: string) => {
    window.location.hash = hash;
    setRoute(hash);
    window.scrollTo(0, 0);
  };

  // ── Auth helpers ──
  const handleLogin = (s: AuthSession) => {
    setSession(s);
    sessionStorage.setItem('anarav_session', JSON.stringify(s));
  };

  const handleLogout = () => {
    setSession({ role: null });
    sessionStorage.removeItem('anarav_session');
  };

  // ── Route guards ──
  const requireSuperAdmin = (el: ReactElement): ReactElement | null => {
    if (session.role !== 'super_admin') { navigateTo(ROUTE_LANDING); return null; }
    return el;
  };

  const requireTenant = (el: ReactElement): ReactElement | null => {
    if (session.role !== 'tenant') { navigateTo(ROUTE_LANDING); return null; }
    return el;
  };

  // ── Render ──
  const norm = route.split('?')[0];

  switch (norm) {
    case ROUTE_SUPERADMIN:
      return requireSuperAdmin(
        <SuperAdminDashboard session={session} store={store} onLogout={handleLogout} navigateTo={navigateTo} />
      ) ?? <Landing onLogin={handleLogin} navigateTo={navigateTo} store={store} />;

    case ROUTE_ADMIN:
      return requireTenant(
        <TenantAdmin session={session} store={store} onLogout={handleLogout} navigateTo={navigateTo} />
      ) ?? <Landing onLogin={handleLogin} navigateTo={navigateTo} store={store} />;

    case ROUTE_SITE:
      return <CustomerSite session={session} store={store} navigateTo={navigateTo} />;

    default:
      return <Landing onLogin={handleLogin} navigateTo={navigateTo} store={store} />;
  }
}
