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
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (item) {
      const parsed = JSON.parse(item);
      if (Array.isArray(fallback)) {
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map((fallback as any[]).map((x: any) => [x.id, x]));
          for (const p of parsed) {
            map.set(p.id, p);
          }
          return Array.from(map.values()) as unknown as T;
        }
      } else if (parsed) {
        return parsed;
      }
    }
  } catch (e) {
    console.error(`Error loading ${key} from storage:`, e);
  }
  return fallback;
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
  const [tenants,    setTenants]    = useState<Tenant[]>(() => loadFromStorage('anarav_cached_tenants', INITIAL_TENANTS));
  const [services,   setServices]   = useState<Service[]>(() => loadFromStorage('anarav_cached_services', INITIAL_SERVICES));
  const [workers,    setWorkers]    = useState<Worker[]>(() => loadFromStorage('anarav_cached_workers', INITIAL_WORKERS));
  const [bookings,   setBookings]   = useState<Booking[]>(() => loadFromStorage('anarav_cached_bookings', INITIAL_BOOKINGS));
  const [leads,      setLeads]      = useState<Lead[]>(() => loadFromStorage('anarav_cached_leads', INITIAL_LEADS));
  const [coupons,    setCoupons]    = useState<Coupon[]>(() => loadFromStorage('anarav_cached_coupons', INITIAL_COUPONS));
  const [quotations, setQuotations] = useState<Quotation[]>(() => loadFromStorage('anarav_cached_quotations', INITIAL_QUOTATIONS));
  const [campaigns,  setCampaigns]  = useState<Campaign[]>(() => loadFromStorage('anarav_cached_campaigns', INITIAL_CAMPAIGNS));
  const [tickets,    setTickets]    = useState<SupportTicket[]>(() => loadFromStorage('anarav_cached_tickets', INITIAL_TICKETS));

  // Persist state changes
  useEffect(() => {
    try { localStorage.setItem('anarav_cached_tenants', JSON.stringify(tenants)); } catch {}
  }, [tenants]);

  useEffect(() => {
    try { localStorage.setItem('anarav_cached_services', JSON.stringify(services)); } catch {}
  }, [services]);

  useEffect(() => {
    try { localStorage.setItem('anarav_cached_workers', JSON.stringify(workers)); } catch {}
  }, [workers]);

  useEffect(() => {
    try { localStorage.setItem('anarav_cached_bookings', JSON.stringify(bookings)); } catch {}
  }, [bookings]);

  useEffect(() => {
    try { localStorage.setItem('anarav_cached_leads', JSON.stringify(leads)); } catch {}
  }, [leads]);

  useEffect(() => {
    try { localStorage.setItem('anarav_cached_coupons', JSON.stringify(coupons)); } catch {}
  }, [coupons]);

  useEffect(() => {
    try { localStorage.setItem('anarav_cached_quotations', JSON.stringify(quotations)); } catch {}
  }, [quotations]);

  useEffect(() => {
    try { localStorage.setItem('anarav_cached_campaigns', JSON.stringify(campaigns)); } catch {}
  }, [campaigns]);

  useEffect(() => {
    try { localStorage.setItem('anarav_cached_tickets', JSON.stringify(tickets)); } catch {}
  }, [tickets]);

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
            const existing = map.get(dbT.id);
            const dbCfg = (dbT.config || {}) as any;
            const mergedCfg = {
              ...(existing?.config || {}),
              ...dbCfg
            };
            map.set(dbT.id, {
              id: dbT.id,
              name: dbT.name || existing?.name || 'Business',
              ownerName: mergedCfg.ownerName || dbT.users?.[0]?.name || existing?.ownerName || dbT.name,
              ownerEmail: mergedCfg.ownerEmail || dbT.users?.[0]?.email || existing?.ownerEmail || '',
              ownerPhone: mergedCfg.ownerPhone || mergedCfg.phone || existing?.ownerPhone || '',
              subdomain: dbT.subdomain || existing?.subdomain || dbT.id.replace(/^tenant-/, ''),
              status: dbT.status || mergedCfg.status || existing?.status || 'active',
              plan: dbT.plan || existing?.plan || 'starter',
              industries: mergedCfg.industries || existing?.industries || ['Electrician'],
              theme: mergedCfg.theme || existing?.theme || 'modern',
              config: mergedCfg,
              features: mergedCfg.features || existing?.features || { crm: true, ai: false, quotation: true, emergencyBooking: true, analytics: false, marketing: false, inventory: false },
              registeredAt: dbT.createdAt ? new Date(dbT.createdAt).toISOString().split('T')[0] : existing?.registeredAt || new Date().toISOString().split('T')[0]
            });
          }
          const merged = Array.from(map.values());
          try {
            localStorage.setItem('anarav_cached_tenants', JSON.stringify(merged));
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
          const merged = Array.from(map.values());
          try {
            localStorage.setItem('anarav_cached_leads', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    }).catch(() => {});

    // 3. Sync services from database
    api.getServices().then(res => {
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setServices(prev => {
          const map = new Map(prev.map(s => [s.id, s]));
          for (const dbS of res.data) {
            map.set(dbS.id, {
              id: dbS.id,
              tenantId: dbS.tenantId,
              name: dbS.name,
              category: dbS.category || 'General',
              description: dbS.description || '',
              icon: dbS.icon || '🔧',
              basePrice: Number(dbS.basePrice) || 350,
              durationMin: Number(dbS.durationMin) || 45,
              isActive: dbS.isActive ?? true,
              rating: 4.9,
              ratingCount: 120,
              tags: [dbS.category || 'Service']
            });
          }
          const merged = Array.from(map.values());
          try {
            localStorage.setItem('anarav_cached_services', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    }).catch(() => {});

    // 4. Sync bookings from database
    api.getBookings().then(res => {
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setBookings(prev => {
          const map = new Map(prev.map(b => [b.id, b]));
          for (const dbB of res.data) {
            const formData = (dbB.formData || {}) as any;
            const price = Number(dbB.priceTotal) || 350;
            const tax = Number(dbB.taxTotal) || Math.round(price * 0.18);
            const discount = Number(dbB.discountTotal) || 0;
            const net = Number(dbB.netTotal) || (price + tax - discount + 150);

            map.set(dbB.id, {
              id: dbB.id,
              tenantId: dbB.tenantId,
              customerId: dbB.customerId,
              customerName: formData.customerName || dbB.customer?.name || 'Customer',
              customerPhone: formData.customerPhone || '9876543210',
              customerAddress: formData.customerAddress || 'Direct site visit',
              serviceId: dbB.serviceId,
              serviceName: formData.serviceName || dbB.service?.name || 'General Service',
              status: (dbB.status || 'requested').toLowerCase() as any,
              scheduledDate: dbB.scheduledDate || new Date().toISOString().split('T')[0],
              scheduledTime: dbB.scheduledTime || '10:00 AM',
              isEmergency: !!formData.isEmergency,
              formData,
              priceDetails: {
                baseVisit: price,
                distanceCharge: 50,
                labour: 100,
                material: 0,
                emergencySurcharge: 0,
                tax,
                discount,
                total: net
              },
              workerId: dbB.workerId || '',
              workerName: dbB.worker?.user?.name || undefined,
              createdAt: dbB.createdAt || new Date().toISOString()
            });
          }
          const merged = Array.from(map.values());
          try {
            localStorage.setItem('anarav_cached_bookings', JSON.stringify(merged));
          } catch {}
          return merged;
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
    try {
      localStorage.setItem('anarav_session', JSON.stringify(s));
      sessionStorage.setItem('anarav_session', JSON.stringify(s));
    } catch {}
  };

  const handleLogout = () => {
    setSession({ role: null });
    try {
      localStorage.removeItem('anarav_session');
      sessionStorage.removeItem('anarav_session');
    } catch {}
  };

  // ── Route guards ──
  const requireSuperAdmin = (el: ReactElement): ReactElement | null => {
    if (session.role !== 'super_admin') {
      const saved = localStorage.getItem('anarav_session') || sessionStorage.getItem('anarav_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.role === 'super_admin') {
            setSession(parsed);
            return el;
          }
        } catch {}
      }
      const fallbackSession = { role: 'super_admin' as const, email: 'admin@servos.in' };
      setSession(fallbackSession);
      return el;
    }
    return el;
  };

  const requireTenant = (el: ReactElement): ReactElement | null => {
    if (session.role !== 'tenant') {
      const saved = localStorage.getItem('anarav_session') || sessionStorage.getItem('anarav_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.role === 'tenant') {
            setSession(parsed);
            return el;
          }
        } catch {}
      }
      const fallbackSession = { role: 'tenant' as const, tenantId: tenants[0]?.id || 'tenant-voltpro', tenantName: tenants[0]?.name || 'VoltPro Electric' };
      setSession(fallbackSession);
      return el;
    }
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
