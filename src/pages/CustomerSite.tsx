// @ts-nocheck
import { useState, useEffect } from 'react';
import type { AuthSession, Booking, BasketItem } from '../types';
import type { SharedStore } from '../App';

import { Phone, MessageCircle, ArrowLeft, Moon, Sun, Search, ShoppingBag, MapPin, ChevronDown } from 'lucide-react';
import CmsRenderer from './CmsRenderer';
import { generateThemeTokens } from '../utils/themeEngine';

interface Props {
  session: AuthSession;
  store: SharedStore;
  navigateTo: (hash: string) => void;
}

interface BookingFormData {
  name: string;
  phone: string;
  address: string;
  date: string;
  time: string;
  notes: string;
}

export default function CustomerSite({ session, store, navigateTo }: Props) {
  const { tenants, services, workers, bookings, setBookings, coupons, leads, setLeads } = store;

  // Use active session tenant or first tenant for demo
  const initialTenantId = session.tenantId || tenants[0]?.id || '';
  const [activeTenantId, setActiveTenantId] = useState(initialTenantId);

  const tenant = tenants.find(t => t.id === activeTenantId) || tenants[0];
  if (!tenant) return <div className="p-8 text-center text-slate-400">No tenants configured.</div>;

  const c = tenant.config;
  const pc = c.primaryColor;
  const sc = c.secondaryColor || '#2563eb';

  const getTextColorForBg = (hexColor: string) => {
    if (!hexColor || hexColor.charAt(0) !== '#') return '#ffffff';
    let val = hexColor.substring(1);
    if (val.length === 3) {
      val = val[0] + val[0] + val[1] + val[1] + val[2] + val[2];
    }
    const rgb = parseInt(val, 16);
    if (isNaN(rgb)) return '#ffffff';
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma > 175 ? '#020617' : '#ffffff';
  };

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    alert(`${type.toUpperCase()}: ${msg}`);
  };

  const myServices = services.filter(s => s.tenantId === tenant.id && s.isActive);
  const myWorkers = workers.filter(w => w.tenantId === tenant.id);
  const myCoupons = coupons.filter(cp => cp.tenantId === tenant.id && cp.status === 'active');

  const [bookingService, setBookingService] = useState<null | typeof myServices[0]>(null);
  const [tempBooking, setTempBooking] = useState<Booking | null>(null);
  const [formData, setFormData] = useState<BookingFormData>({ name: '', phone: '', address: '', date: '', time: '', notes: '' });
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<typeof myCoupons[0] | null>(null);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [lastBookingId, setLastBookingId] = useState('');
  const [showPlatformBadgeModal, setShowPlatformBadgeModal] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [paymentGatewayOpen, setPaymentGatewayOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'upi' | 'card' | 'cod'>('upi');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [invoiceModalBooking, setInvoiceModalBooking] = useState<Booking | null>(null);

  const [customerPhone, setCustomerPhone] = useState('');
  const [customerSession, setCustomerSession] = useState<{ phone: string; name: string } | null>(null);
  const [showCustomerLoginModal, setShowCustomerLoginModal] = useState(false);
  const [customerActiveTab, setCustomerActiveTab] = useState<'bookings' | 'book_service' | 'warranties' | 'rewards' | 'support'>('bookings');
  const [viewMode, setViewMode] = useState<'website' | 'dashboard'>('website');

  // Auto pre-fill customer checkout details when logged in
  useEffect(() => {
    if (customerSession && bookingService) {
      const lastB = bookings.find(b => b.customerPhone === customerSession.phone && b.tenantId === tenant.id);
      setFormData({
        name: customerSession.name,
        phone: customerSession.phone,
        address: lastB ? lastB.customerAddress : '',
        date: '',
        time: '',
        notes: ''
      });
    }
  }, [bookingService, customerSession, bookings, tenant.id]);

  // Track Booking state
  const [trackedBooking, setTrackedBooking] = useState<Booking | null>(null);

  // Local theme dark/light toggle override and system dark mode detection
  const [systemDark, setSystemDark] = useState(false);
  const [localModeOverride, setLocalModeOverride] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(media.matches);
    const listener = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const activeMode = localModeOverride || (c.themeMode === 'auto' ? (systemDark ? 'dark' : 'light') : (c.themeMode || 'light'));
  const localDark = activeMode === 'dark';

  const tokens = generateThemeTokens(
    c.primaryColor || '#2563eb',
    activeMode,
    c.themeFont || 'Inter, sans-serif',
    c.themeRadius || 'modern',
    c.themeButtonStyle || 'filled'
  );

  useEffect(() => {
    let styleEl = document.getElementById('theme-engine-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'theme-engine-styles';
      document.head.appendChild(styleEl);
    }
    const cssString = `
      :root {
        ${Object.entries(tokens).map(([k, v]) => `${k}: ${v};`).join('\n')}
      }
      body {
        font-family: var(--font-family) !important;
        background-color: var(--color-background) !important;
        color: var(--color-text-primary) !important;
      }
      .rounded-2xl { border-radius: var(--border-radius) !important; }
      .rounded-xl { border-radius: calc(var(--border-radius) * 0.75) !important; }
      .rounded-lg { border-radius: calc(var(--border-radius) * 0.5) !important; }
      .rounded-3xl { border-radius: calc(var(--border-radius) * 1.5) !important; }
      .rounded-md { border-radius: calc(var(--border-radius) * 0.5) !important; }
      .rounded-full { border-radius: 9999px !important; }
      @media print {
        body { background: #fff !important; color: #000 !important; }
        header, footer, nav, button, .modal-overlay { display: none !important; }
        .print-invoice-container { display: block !important; position: absolute; left: 0; top: 0; width: 100%; }
      }
    `;
    styleEl.textContent = cssString;
  }, [tokens]);

  // Premium section states
  const [portfolioFilter, setPortfolioFilter] = useState<string>('All');
  const [faqSearch, setFaqSearch] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [coverageEmail, setCoverageEmail] = useState('');
  const [coverageSubmitted, setCoverageSubmitted] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({ jobsCompleted: 0, happyClients: 0, yearsInBusiness: 0, citiesServed: 0, fiveStarReviews: 0 });

  // ─── Dynamic Platform Engine States ────────────────────────────
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [activePageSlug, setActivePageSlug] = useState('home');
  const [universalSearch, setUniversalSearch] = useState('');
  const [isBasketOpen, setIsBasketOpen] = useState(false);
  const [basketCoupon, setBasketCoupon] = useState('');
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackInputCode, setTrackInputCode] = useState('');
  const [activeCampaignIndex, setActiveCampaignIndex] = useState(0);
  const [activeCampaign, setActiveCampaign] = useState<any | null>(null);

  // Campaign Manager Slider loop
  useEffect(() => {
    const list = c.campaigns || [];
    const nowStr = new Date().toISOString().split('T')[0];
    const activeList = list.filter(camp => {
      if (!camp.enabled) return false;
      if (camp.startDate && nowStr < camp.startDate) return false;
      if (camp.endDate && nowStr > camp.endDate) return false;
      return true;
    }).sort((a, b) => b.priority - a.priority);

    if (activeList.length > 0) {
      setActiveCampaign(activeList[activeCampaignIndex % activeList.length]);
    } else {
      setActiveCampaign(null);
    }
  }, [c.campaigns, activeCampaignIndex]);

  // Auto rotate slide every 6 seconds
  useEffect(() => {
    const list = (c.campaigns || []).filter(camp => camp.enabled);
    if (list.length <= 1) return;
    const interval = setInterval(() => {
      setActiveCampaignIndex(prev => prev + 1);
    }, 6000);
    return () => clearInterval(interval);
  }, [c.campaigns]);


  // Animate stats counter on scroll visibility
  useEffect(() => {
    if (!statsVisible) return;
    const target = c.stats || { jobsCompleted: 4250, happyClients: 1350, yearsInBusiness: 8, citiesServed: 3, fiveStarReviews: 940 };
    const duration = 1800;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedStats({
        jobsCompleted: Math.round(target.jobsCompleted * eased),
        happyClients: Math.round(target.happyClients * eased),
        yearsInBusiness: Math.round(target.yearsInBusiness * eased),
        citiesServed: Math.round(target.citiesServed * eased),
        fiveStarReviews: Math.round(target.fiveStarReviews * eased),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [statsVisible, c.stats]);


  const calculatePrice = (base: number) => {
    let disc = 0;
    if (appliedCoupon) {
      disc = appliedCoupon.type === 'flat' ? appliedCoupon.value : Math.round(base * appliedCoupon.value / 100);
    }
    const tax = Math.round((base - disc) * 0.18);
    const total = base - disc + tax;
    return { discount: disc, tax, total };
  };

  const handleApplyCoupon = () => {
    if (!couponCode) return;
    const found = myCoupons.find(cp => cp.code.toUpperCase() === couponCode.toUpperCase());
    if (found && bookingService && bookingService.basePrice >= found.minOrderAmount) {
      setAppliedCoupon(found);
    } else {
      setAppliedCoupon(null);
    }
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingService) return;

    const bId = 'BK-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const prices = calculatePrice(bookingService.basePrice);

    const newBooking: Booking = {
      id: bId,
      tenantId: tenant.id,
      customerId: `cust-${Date.now()}`,
      customerName: formData.name,
      customerPhone: formData.phone,
      customerAddress: formData.address,
      serviceId: bookingService.id,
      serviceName: bookingService.name,
      status: 'requested', // 10-state starting phase
      scheduledDate: formData.date,
      scheduledTime: formData.time,
      isEmergency: false,
      formData: { notes: formData.notes },
      priceDetails: {
        baseVisit: bookingService.basePrice,
        distanceCharge: 50,
        labour: 100,
        material: 0,
        emergencySurcharge: 0,
        tax: prices.tax,
        discount: prices.discount,
        total: prices.total + 150 // Including visit/distance base
      },
      workerId: selectedWorkerId || '',
      workerName: selectedWorkerId ? (myWorkers.find(w => w.id === selectedWorkerId)?.name || '') : undefined,
      createdAt: new Date().toISOString()
    };

    setTempBooking(newBooking);
    setPaymentGatewayOpen(true);
  };



  const handleProcessPayment = () => {
    if (!tempBooking) return;
    setIsProcessingPayment(true);
    setTimeout(() => {
      setBookings(prev => [...prev, tempBooking]);
      const exists = leads.some(l => l.phone === tempBooking.customerPhone && l.tenantId === tenant.id);
      if (!exists) {
        const newL = {
          id: `lead-${Date.now()}`,
          tenantId: tenant.id,
          name: tempBooking.customerName,
          phone: tempBooking.customerPhone,
          email: '',
          serviceInterest: tempBooking.serviceName,
          notes: `Auto-created from customer booking slot: ${tempBooking.scheduledDate} at ${tempBooking.scheduledTime}`,
          status: 'new' as const,
          createdAt: new Date().toISOString()
        };
        setLeads(prev => [...prev, newL]);
      }
      setLastBookingId(tempBooking.id);
      setBasket([]);
      setBasketCoupon('');
      setIsProcessingPayment(false);
      setPaymentGatewayOpen(false);
      setBookingSubmitted(true);
    }, 1500);
  };

  const handleCustomerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPhone.trim()) return;
    const phone = customerPhone.trim();
    const found = bookings.find(b => b.customerPhone === phone && b.tenantId === tenant.id);
    const clientName = found ? found.customerName : 'Ravi Kumar';
    setCustomerSession({ phone, name: clientName });
    setShowCustomerLoginModal(false);
    setViewMode('dashboard');
    setCustomerActiveTab('bookings');

    // Inject mock bookings if no real ones exist for this customer
    const existingBookings = bookings.filter(b => b.customerPhone === phone && b.tenantId === tenant.id);
    if (existingBookings.length === 0 && myServices.length > 0) {
      const svc0 = myServices[0];
      const svc1 = myServices[Math.min(1, myServices.length - 1)];
      const svc2 = myServices[Math.min(2, myServices.length - 1)];
      const mockBookings: import('../types').Booking[] = [
        {
          id: `BK-DEMO-001`,
          tenantId: tenant.id,
          customerId: `cust-${phone}`,
          customerName: clientName,
          customerPhone: phone,
          customerAddress: '12-3-456, MG Road, Nellore, AP 524001',
          serviceId: svc0.id,
          serviceName: svc0.name,
          status: 'completed',
          scheduledDate: '2026-07-10',
          scheduledTime: '10:00 AM',
          isEmergency: false,
          formData: {},
          priceDetails: { baseVisit: svc0.basePrice, distanceCharge: 0, labour: 150, material: 200, emergencySurcharge: 0, tax: Math.round(svc0.basePrice * 0.18), discount: 0, total: svc0.basePrice + 350 + Math.round(svc0.basePrice * 0.18) },
          workerName: 'Suresh Kumar',
          customerRating: 5,
          couponCode: '',
          createdAt: '2026-07-09T10:00:00Z',
        },
        {
          id: `BK-DEMO-002`,
          tenantId: tenant.id,
          customerId: `cust-${phone}`,
          customerName: clientName,
          customerPhone: phone,
          customerAddress: '12-3-456, MG Road, Nellore, AP 524001',
          serviceId: svc1.id,
          serviceName: svc1.name,
          status: 'assigned',
          scheduledDate: '2026-07-18',
          scheduledTime: '02:30 PM',
          isEmergency: false,
          formData: {},
          priceDetails: { baseVisit: svc1.basePrice, distanceCharge: 0, labour: 200, material: 0, emergencySurcharge: 0, tax: Math.round(svc1.basePrice * 0.18), discount: 50, total: svc1.basePrice + 200 + Math.round(svc1.basePrice * 0.18) - 50 },
          workerName: 'Nagaraju M',
          createdAt: '2026-07-14T09:00:00Z',
        },
        {
          id: `BK-DEMO-003`,
          tenantId: tenant.id,
          customerId: `cust-${phone}`,
          customerName: clientName,
          customerPhone: phone,
          customerAddress: '12-3-456, MG Road, Nellore, AP 524001',
          serviceId: svc2.id,
          serviceName: svc2.name,
          status: 'requested',
          scheduledDate: '2026-07-22',
          scheduledTime: '11:00 AM',
          isEmergency: false,
          formData: {},
          priceDetails: { baseVisit: svc2.basePrice, distanceCharge: 0, labour: 100, material: 50, emergencySurcharge: 0, tax: Math.round(svc2.basePrice * 0.18), discount: 0, total: svc2.basePrice + 150 + Math.round(svc2.basePrice * 0.18) },
          createdAt: '2026-07-16T08:00:00Z',
        },
      ];
      setBookings(prev => [...prev, ...mockBookings]);
    }
  };

  const closeModal = () => {
    setBookingService(null);
    setBookingSubmitted(false);
    setFormData({ name: '', phone: '', address: '', date: '', time: '', notes: '' });
    setCouponCode('');
    setAppliedCoupon(null);
    setAgreeTerms(false);
  };



  return (
    <div 
      className="min-h-screen transition-all pb-16 md:pb-0" 
      style={{ 
        fontFamily: 'var(--font-family)',
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-text-primary)'
      }}
    >

      {/* ===== DEMO SWITCHER ===== */}
      <div className="bg-slate-955 border-b border-slate-850 text-slate-350 text-xs py-2 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span>Demo Engine: Branded customer portal for <strong className="text-white">{tenant.name}</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <span>Switch Client:</span>
          <select
            className="bg-slate-900 text-white rounded px-2 py-1 text-xs border border-slate-800 font-sans"
            value={activeTenantId}
            onChange={e => {
              setActiveTenantId(e.target.value);
            }}
          >
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name} ({t.subdomain})</option>)}
          </select>
          <button
            onClick={() => setLocalModeOverride(activeMode === 'dark' ? 'light' : 'dark')}
            className="p-1 rounded hover:bg-slate-800 transition-colors"
          >
            {activeMode === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          {session.tenantId && (
            <button
              onClick={() => navigateTo('#/admin')}
              className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors font-sans"
            >
              <ArrowLeft className="w-3 h-3" /> Back to Console
            </button>
          )}
        </div>
      </div>

      {/* Utility Top Bar Removed */}

      {/* ===== ANNOUNCEMENT BAR ===== */}
      {(() => {
        if (!tenant.config.announcementActive) return null;
        if (tenant.config.announcementExpiry) {
          const nowStr = new Date().toISOString().split('T')[0];
          if (nowStr > tenant.config.announcementExpiry) return null;
        }
        // Use sessionStorage directly or fall back safely
        const isClosed = sessionStorage.getItem(`announcement_closed_${tenant.id}`);
        if (isClosed === 'true') return null;

        return (
          <div id="announcement-banner-wrapper" className="relative py-2.5 px-10 text-center text-xs font-bold transition-all font-sans flex items-center justify-center animate-fadeIn" style={{ background: pc, color: getTextColorForBg(pc) }}>
            <span>{tenant.config.announcementText}</span>
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem(`announcement_closed_${tenant.id}`, 'true');
                const el = document.getElementById('announcement-banner-wrapper');
                if (el) el.style.display = 'none'; // Safe display style override
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-80 p-1 font-bold text-sm"
              title="Close Announcement"
            >
              ✕
            </button>
          </div>
        );
      })()}

      {/* ===== HEADER ===== */}
      <header 
        className="sticky top-0 z-30 border-b transition-all backdrop-blur-md" 
        style={{ 
          borderColor: 'var(--color-border)', 
          backgroundColor: 'var(--color-navbar)',
          color: 'var(--color-text-primary)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black text-white" style={{ background: pc }}>
              {(c.logoText || tenant.name).charAt(0)}
            </div>
            <div>
              <p className="text-base font-black leading-tight" style={{ color: 'var(--color-primary)' }}>{c.logoText || tenant.name}</p>
              <p className="text-[10px] leading-tight" style={{ color: 'var(--color-text-secondary)' }}>One Call. We Do It All.</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {(c.cmsPages || [
              { id: 'home', title: 'Home', slug: 'home' },
              { id: 'services', title: 'Services', slug: 'services' },
              { id: 'offers', title: 'Offers', slug: 'offers' },
              { id: 'about', title: 'About Us', slug: 'about' },
              { id: 'reviews', title: 'Reviews', slug: 'reviews' },
              { id: 'contact', title: 'Contact Us', slug: 'contact' },
            ]).map((page: any) => {
              const isActive = activePageSlug === page.slug;
              return (
                <button
                  key={page.id}
                  onClick={() => {
                    setActivePageSlug(page.slug);
                    setViewMode('website');
                    setTimeout(() => {
                      const el = document.getElementById(page.slug === 'home' ? 'hero' : page.slug);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                      else if (page.slug === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 50);
                  }}
                  className="px-3 py-2 text-xs font-bold transition-all relative"
                  style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
                >
                  {page.title}
                  {isActive && <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full" style={{ background: pc }} />}
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Track Booking */}
            <button
              onClick={() => setShowTrackModal(true)}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border transition-all"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              <Search className="w-3.5 h-3.5" /> Track Booking
            </button>

            {/* Basket */}
            <button
              onClick={() => setIsBasketOpen(true)}
              className="relative p-2 rounded-lg border transition-all"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              <ShoppingBag className="w-4 h-4" />
              {basket.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full text-[8px] font-black flex items-center justify-center text-white w-4 h-4" style={{ background: pc }}>
                  {basket.reduce((t, x) => t + x.quantity, 0)}
                </span>
              )}
            </button>

            {/* Sign In */}
            {customerSession ? (
              <button
                onClick={() => setViewMode(viewMode === 'dashboard' ? 'website' : 'dashboard')}
                className="flex items-center gap-1.5 font-bold text-xs px-3 py-2 rounded-lg border transition-all"
                style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
              >
                👤 {viewMode === 'dashboard' ? 'Exit' : customerSession.name.split(' ')[0]}
              </button>
            ) : (
              <button
                onClick={() => setShowCustomerLoginModal(true)}
                className="hidden sm:flex items-center gap-1.5 font-bold text-xs px-3 py-2 rounded-lg border transition-all"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                👤 Sign In
              </button>
            )}

            {/* Book Service CTA */}
            <button
              onClick={() => {
                setActivePageSlug('services');
                setTimeout(() => {
                  const el = document.getElementById('services');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="flex items-center gap-2 font-black text-xs px-4 py-2.5 rounded-xl shadow-md hover:scale-[1.03] transition-all"
              style={{ background: pc, color: getTextColorForBg(pc), borderRadius: 'var(--border-radius)' }}
            >
              📅 Book Service
            </button>

            {/* Dark Mode toggle */}
            <button
              onClick={() => setLocalModeOverride(activeMode === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg border transition-all"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              {activeMode === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {viewMode === 'dashboard' && customerSession ? (
        <main className="max-w-6xl mx-auto px-6 py-10 space-y-8 animate-fadeIn text-left font-sans">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-6 border-slate-800 gap-4">
            <div>
              <h2 className="text-3xl font-black" style={{ color: 'var(--color-text-primary)' }}>Welcome Back, {customerSession.name}!</h2>
              <p className="text-xs text-slate-500 mt-1 font-sans">Customer Workspace Portal · {customerSession.phone}</p>
            </div>
            <div className="flex gap-2 font-sans">
              <button
                onClick={() => setViewMode('website')}
                className="px-4 py-2 rounded-xl text-xs font-bold border transition-colors"
                style={{ borderColor: sc, color: sc }}
              >
                🌐 Browse Public Website
              </button>
              <button
                onClick={() => { setCustomerSession(null); setViewMode('website'); }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-950/40 border border-red-900/60 text-red-400 hover:bg-red-900/20"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Dashboard Tabs Header */}
          <div className="flex flex-wrap gap-2 border-b pb-4 border-slate-850 font-sans">
            {[
              { id: 'bookings', label: '📅 My Bookings' },
              { id: 'book_service', label: '🔧 Book New Service' },
              { id: 'warranties', label: '🛡️ Warranties & Claims' },
              { id: 'rewards', label: '🎁 Loyalty Rewards' },
              { id: 'support', label: '🔧 Help Desk' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCustomerActiveTab(tab.id as any)}
                className="text-xs font-bold px-4 py-2 rounded-xl transition-all border"
                style={customerActiveTab === tab.id
                  ? { background: pc, borderColor: pc, color: getTextColorForBg(pc) }
                  : {
                      background: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-secondary)'
                    }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="py-2">
            {customerActiveTab === 'bookings' && (
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">Your Booking History</p>
                {bookings.filter(b => b.customerPhone === customerSession.phone && b.tenantId === tenant.id).length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm font-sans">
                    No active bookings found for your account. Go to the "Book New Service" tab to place one!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                    {bookings
                      .filter(b => b.customerPhone === customerSession.phone && b.tenantId === tenant.id)
                      .map(b => (
                        <div key={b.id} className="p-6 rounded-2xl border transition-all space-y-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                          <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                            <div>
                              <span className="font-mono text-sm font-black" style={{ color: 'var(--color-text-primary)' }}>{b.id}</span>
                              <span className="text-[10px] text-slate-500 ml-3">{b.scheduledDate} · {b.scheduledTime}</span>
                            </div>
                            <span className="badge badge-active text-[9px] uppercase font-bold">Status: {b.status.replace('_', ' ')}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 font-sans">
                            <div>Service: <strong style={{ color: 'var(--color-text-primary)' }}>{b.serviceName}</strong></div>
                            <div>Total Charged: <strong style={{ color: 'var(--color-text-primary)' }}>₹{b.priceDetails.total.toLocaleString()}</strong></div>
                            <div className="col-span-2">Address: <span className="text-slate-355">{b.customerAddress}</span></div>
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-slate-850/60 font-sans">
                            {['completed', 'invoiced', 'closed'].includes(b.status) ? (
                              <button
                                onClick={() => setCustomerActiveTab('warranties')}
                                className="flex-1 py-2 rounded-lg text-xs font-bold text-center border transition-all"
                                style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', background: 'transparent', borderRadius: 'var(--border-radius)' }}
                              >
                                🛡️ View Warranty
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  const found = bookings.find(x => x.id === b.id);
                                  if (found) setTrackedBooking(found);
                                }}
                                className="flex-1 py-2 rounded-lg text-xs font-bold text-center border transition-all"
                                style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', background: 'transparent', borderRadius: 'var(--border-radius)' }}
                              >
                                🔎 Live Operations Tracker
                              </button>
                            )}
                            
                            <button
                              onClick={() => setInvoiceModalBooking(b)}
                              className="px-4 py-2 rounded-lg text-xs font-bold border transition-all"
                              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'transparent', borderRadius: 'var(--border-radius)' }}
                            >
                              📄 Invoice
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {customerActiveTab === 'book_service' && (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">Deploy Instant Brand Bookings</p>
                  <p className="text-xs text-slate-500 mt-1 font-sans">Select a service category from below. Your account profile details will auto-prefill instantly!</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                  {myServices.map(svc => (
                    <div key={svc.id} className="p-6 rounded-2xl border transition-all flex flex-col justify-between" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--border-radius)' }}>
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-4xl">{svc.icon}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full font-mono border" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', background: 'transparent' }}>{svc.durationMin} mins</span>
                        </div>
                        <h3 className="text-base font-black" style={{ color: 'var(--color-text-primary)' }}>{svc.name}</h3>
                        <p className="text-xs mt-2 line-clamp-2 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{svc.description}</p>
                      </div>

                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-850">
                        <div>
                          <span className="text-[9px] text-slate-550 uppercase">Starts from</span>
                          <p className="text-lg font-black" style={{ color: pc }}>₹{svc.basePrice.toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => { setBookingService(svc); setBookingSubmitted(false); }}
                          className="px-4 py-2 rounded-xl text-xs font-bold shadow-md animate-scaleIn"
                          style={{ background: pc, color: getTextColorForBg(pc) }}
                        >
                          Book Instantly
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {customerActiveTab === 'warranties' && (
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">Active Warranty Certificates</p>
                {bookings.filter(b => b.customerPhone === customerSession.phone && b.tenantId === tenant.id).length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm font-sans">
                    No completed bookings found to verify warranty status.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                    {bookings
                      .filter(b => b.customerPhone === customerSession.phone && b.tenantId === tenant.id)
                      .map(b => (
                        <div key={b.id} className="p-6 rounded-2xl border transition-all space-y-3" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--border-radius)' }}>
                          <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                            <span className="font-mono text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>Warranty: {b.id}-W</span>
                            <span className="text-[10px] font-bold text-emerald-400">🛡️ Active (28 Days Left)</span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">Scope: 30-Day satisfaction guarantee covering parts and labor execution faults on <strong style={{ color: 'var(--color-text-primary)' }}>{b.serviceName}</strong>.</p>
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => alert('Warranty Claim Registered!\nOur dispatch executive will call you shortly.')}
                              className="flex-1 py-1.5 rounded-lg bg-red-950/40 border border-red-900/60 text-[10px] font-bold text-center text-red-400 hover:bg-red-900/20 transition-colors"
                              style={{ borderRadius: 'var(--border-radius)' }}
                            >
                              ⚠️ Raise Free Claim
                            </button>
                            <button
                              onClick={() => alert(`Warranty certificate download started for ${b.id}`)}
                              className="px-3 py-1.5 rounded-lg border text-[10px] font-bold text-slate-350"
                              style={{ borderColor: 'var(--color-border)', background: 'transparent', borderRadius: 'var(--border-radius)' }}
                            >
                              ⬇️ Download PDF
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {customerActiveTab === 'rewards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                <div className="p-6 rounded-2xl border space-y-3" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--border-radius)' }}>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Loyalty Coins balance</p>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                    <span className="text-3xl font-black" style={{ color: 'var(--color-text-primary)' }}>🪙 150 Coins</span>
                    <span className="text-xs text-emerald-400 font-bold">₹150 Credit Value</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">Earn 10 coins for every ₹100 spent on bookings. Coins can be redeemed instantly against your next booking invoices.</p>
                </div>

                <div className="p-6 rounded-2xl border space-y-4 text-center animate-scaleIn font-sans" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--border-radius)' }}>
                  <span className="text-3xl">🎁</span>
                  <h4 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>Invite Friends, Earn Credits</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">Share your referral link. When they book, you earn ₹100 rewards credit and they receive ₹100 discount.</p>
                  <div className="flex gap-2">
                    <input className="form-input text-center font-mono select-all text-xs flex-1" readOnly value={`https://${tenant.subdomain}.servos.in/ref?code=REF-${customerSession.phone.slice(-4)}`} />
                    <button
                      onClick={() => { navigator.clipboard.writeText(`https://${tenant.subdomain}.servos.in/ref?code=REF-${customerSession.phone.slice(-4)}`); alert('Referral link copied to clipboard!'); }}
                      className="px-4 py-1.5 rounded-lg font-bold text-xs"
                      style={{ background: 'var(--color-button)', color: 'var(--color-button-text)', borderRadius: 'var(--border-radius)' }}
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            )}

            {customerActiveTab === 'support' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
                <div className="p-6 rounded-2xl border space-y-4 text-center font-sans" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--border-radius)' }}>
                  <span className="text-3xl">🔧</span>
                  <h4 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>Need Immediate Assistance?</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">Reach our support controllers or chat on WhatsApp. We resolve all customer complaints within 2 hours.</p>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <a href={`tel:${c.phone}`} className="flex items-center justify-center gap-1.5 border text-xs font-bold py-2" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', borderRadius: 'var(--border-radius)' }}>
                      📞 Call Support
                    </a>
                    <a href={`https://wa.me/${c.whatsAppNumber}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 border text-xs font-bold py-2" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', borderRadius: 'var(--border-radius)' }}>
                      💬 WhatsApp
                    </a>
                  </div>
                </div>

                <form
                  onSubmit={(e) => { e.preventDefault(); alert('Complaint Raised Successfully!\nOur support specialist will review your ticket and contact you shortly.'); e.currentTarget.reset(); }}
                  className="p-6 rounded-2xl border space-y-3 font-sans"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--border-radius)' }}
                >
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Raise Service Complaint</p>
                  <div>
                    <label className="form-label text-[9px]">Select Booking ID</label>
                    <select className="form-input text-xs" required>
                      <option value="">Choose booking</option>
                      {bookings.filter(b => b.customerPhone === customerSession.phone && b.tenantId === tenant.id).map(b => (
                        <option key={b.id} value={b.id}>{b.id} - {b.serviceName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label text-[9px]">Complaint Details</label>
                    <textarea className="form-input text-xs resize-none" rows={3} placeholder="Please detail the issue..." required />
                  </div>
                  <button type="submit" className="w-full py-2 bg-red-955/50 hover:bg-red-900/30 text-red-400 border border-red-900/60 font-bold text-xs" style={{ borderRadius: 'var(--border-radius)' }}>
                    Submit Complaint Ticket
                  </button>
                </form>
              </div>
            )}
          </div>
        </main>
      ) : (
        <CmsRenderer
          tenant={tenant}
          activePageSlug={activePageSlug}
          activeCampaign={activeCampaign}
          pc={pc}
          sc={sc}
          localDark={localDark}
          getTextColorForBg={getTextColorForBg}
          myWorkers={myWorkers}
          myServices={myServices}
          universalSearch={universalSearch}
          setUniversalSearch={setUniversalSearch}
          basket={basket}
          setBasket={setBasket}
          setIsBasketOpen={setIsBasketOpen}
          portfolioFilter={portfolioFilter}
          setPortfolioFilter={setPortfolioFilter}
          openFaqId={openFaqId}
          setOpenFaqId={setOpenFaqId}
          faqSearch={faqSearch}
          setFaqSearch={setFaqSearch}
          statsVisible={statsVisible}
          setStatsVisible={setStatsVisible}
          animatedStats={animatedStats}
          coverageSubmitted={coverageSubmitted}
          setCoverageSubmitted={setCoverageSubmitted}
          coverageEmail={coverageEmail}
          setCoverageEmail={setCoverageEmail}
          setActivePageSlug={setActivePageSlug}
          setViewMode={setViewMode}
          setBookingService={setBookingService}
        />
      )}

      {/* ===== FOOTER ===== */}
      <footer className="pt-12 pb-6 px-4 sm:px-6 border-t text-xs font-sans" style={{ backgroundColor: localDark ? '#0f172a' : '#1e293b', borderColor: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
        <div className="max-w-7xl mx-auto">
          {/* 5-Column Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10 text-left">

            {/* Col 1: Brand */}
            <div className="col-span-2 md:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-black text-white" style={{ background: pc }}>
                  {(c.logoText || tenant.name).charAt(0)}
                </div>
                <div>
                  <p className="font-black text-sm text-white">{c.logoText || tenant.name}</p>
                  <p className="text-[10px] text-slate-500">One Call. We Do It All.</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">Your one-stop solution for all home services in {c.city?.split(',')[0] || 'Nellore'}.</p>
              <div className="flex gap-2">
                {c.socialFacebook && (
                  <a href={c.socialFacebook} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-700 hover:border-blue-500 hover:text-blue-400 transition-all text-slate-400 text-xs font-black">
                    f
                  </a>
                )}
                {c.socialInstagram && (
                  <a href={c.socialInstagram} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-700 hover:border-pink-500 hover:text-pink-400 transition-all text-slate-400 text-xs font-black">
                    ig
                  </a>
                )}
                {c.whatsAppNumber && (
                  <a href={`https://wa.me/${c.whatsAppNumber}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-700 hover:border-green-500 hover:text-green-400 transition-all text-slate-400 text-base">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                )}
                <button className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-700 hover:border-red-500 hover:text-red-400 transition-all text-slate-400 text-xs font-black">
                  yt
                </button>
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div className="space-y-3">
              <h4 className="font-black text-sm text-white">Quick Links</h4>
              <ul className="space-y-2">
                {[
                  { label: 'Home', slug: 'home' },
                  { label: 'Services', slug: 'services' },
                  { label: 'Offers', slug: 'offers' },
                  { label: 'About Us', slug: 'about' },
                  { label: 'Contact', slug: 'contact' },
                ].map(link => (
                  <li key={link.slug}>
                    <button onClick={() => { setActivePageSlug(link.slug); setViewMode('website'); }} className="hover:text-white transition-colors text-slate-400">
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Popular Services */}
            <div className="space-y-3">
              <h4 className="font-black text-sm text-white">Popular Services</h4>
              <ul className="space-y-2">
                {myServices.slice(0, 5).map((svc: any) => (
                  <li key={svc.id}>
                    <button onClick={() => { setActivePageSlug('services'); setViewMode('website'); }} className="hover:text-white transition-colors text-slate-400 truncate block max-w-full text-left">
                      {svc.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: Company */}
            <div className="space-y-3">
              <h4 className="font-black text-sm text-white">Company</h4>
              <ul className="space-y-2 text-slate-400">
                {['About Us', 'Our Team', 'Reviews', 'Blog', 'Careers'].map(item => (
                  <li key={item}><button className="hover:text-white transition-colors">{item}</button></li>
                ))}
              </ul>
            </div>

            {/* Col 5: Contact */}
            <div className="space-y-3">
              <h4 className="font-black text-sm text-white">Contact Us</h4>
              <div className="space-y-2 text-slate-400">
                {c.address && <p>📍 {c.address}</p>}
                {c.phone && <p><a href={`tel:${c.phone}`} className="hover:text-white transition-colors">📞 {c.phone}</a></p>}
                {c.email && <p><a href={`mailto:${c.email}`} className="hover:text-white transition-colors">✉️ {c.email}</a></p>}
                {c.businessHours && <p>⏰ {c.businessHours}</p>}
              </div>

              {/* Support links */}
              <div className="pt-2 space-y-1.5">
                {['Track Booking', 'Help Center', 'Cancellation Policy', 'Privacy Policy', 'Terms & Conditions'].map(item => (
                  <div key={item}><button className="text-slate-500 hover:text-white transition-colors text-[10px]">{item}</button></div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-slate-500">© {new Date().getFullYear()} {c.logoText || tenant.name} Services. All rights reserved.</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPlatformBadgeModal(true)}
                className="inline-flex items-center gap-1.5 border px-2.5 py-1 rounded-lg text-[9px] font-bold transition-colors text-slate-500 border-slate-700 hover:border-slate-500"
              >
                🛡️ Verified by <strong>Anarav OS</strong>
              </button>
              <p className="text-slate-500">Powered by <a href="#/" className="font-bold hover:underline" style={{ color: pc }}>Anarav Business OS</a></p>
            </div>
          </div>
        </div>
      </footer>

      {/* ===== BOOKING MODAL ===== */}
      {bookingService && (
        <div className="modal-overlay" onClick={closeModal}>
          <div onClick={e => e.stopPropagation()} className="bg-slate-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-800 text-slate-200 animate-scaleIn font-sans">
            {bookingSubmitted ? (
              <div className="p-8 text-center space-y-4">
                <div className="text-5xl animate-bounce">🎉</div>
                <h3 className="text-lg font-black text-white">Booking Placed!</h3>
                <p className="text-slate-400 text-xs">Your booking ID is <strong className="text-white font-mono text-sm">{lastBookingId}</strong>.</p>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-left space-y-2">
                  <div className="flex justify-between"><span>Service:</span><strong className="text-white">{bookingService.name}</strong></div>
                  <div className="flex justify-between"><span>Scheduled:</span><strong className="text-white">{formData.date} · {formData.time}</strong></div>
                  <div className="flex justify-between border-t border-slate-800 pt-2 font-bold"><span>Total (incl. tax):</span><strong style={{ color: pc }}>₹{(calculatePrice(bookingService.basePrice).total + 150).toLocaleString()}</strong></div>
                </div>
                <button onClick={closeModal} className="w-full py-2.5 rounded-xl text-xs font-bold" style={{ background: pc, color: getTextColorForBg(pc) }}>
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="p-5 border-b border-slate-800 flex items-center gap-3">
                  <span className="text-3xl">{bookingService.icon}</span>
                  <div>
                    <h3 className="font-black text-white text-base">{bookingService.name}</h3>
                    <p className="text-xs font-bold" style={{ color: pc }}>{tenant.config.enableB2bEnquiry ? 'Request Commercial Quotation' : `Starting ₹${bookingService.basePrice.toLocaleString()}`}</p>
                  </div>
                </div>
                <div className="px-5 pt-3">
                  <div className="bg-blue-955/30 border border-blue-900/60 p-2.5 rounded-xl text-blue-400 font-bold text-[10px] text-center font-sans">
                    {tenant.config.enableB2bEnquiry 
                      ? '💼 Industrial Enquiry — Submit project requirements for offline engineering estimate' 
                      : '⚡ Instant Guest Checkout — No registration or login required to book!'}
                  </div>
                </div>

                <form onSubmit={handleBookingSubmit} className="p-5 space-y-4 text-xs">
                  <div>
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" placeholder="e.g. Ravi Kumar" value={formData.name} onChange={e => setFormData(d => ({ ...d, name: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label">Phone Number *</label>
                    <input className="form-input" placeholder="9876543210" value={formData.phone} onChange={e => setFormData(d => ({ ...d, phone: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label">Service Address *</label>
                    <textarea className="form-input resize-none" rows={2} placeholder="Full address..." value={formData.address} onChange={e => setFormData(d => ({ ...d, address: e.target.value }))} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Preferred Date *</label>
                      <input className="form-input" type="date" value={formData.date} onChange={e => setFormData(d => ({ ...d, date: e.target.value }))} required min={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div>
                      <label className="form-label">Preferred Time *</label>
                      <select className="form-input" value={formData.time} onChange={e => setFormData(d => ({ ...d, time: e.target.value }))} required>
                        <option value="">Select slot</option>
                        {['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Dynamic Technician Selection Feature Flagged */}
                  {tenant.config.allowTechnicianSelection && (
                    <div>
                      <label className="form-label">Select Preferred Technician (Optional)</label>
                      <select 
                        className="form-input" 
                        value={selectedWorkerId} 
                        onChange={e => setSelectedWorkerId(e.target.value)}
                      >
                        <option value="">Any Available Specialist</option>
                        {myWorkers.filter(w => w.availability === 'available').map(w => (
                          <option key={w.id} value={w.id}>
                            ⭐ {w.name} (Rating: {w.rating}/5)
                          </option>
                        ))}
                      </select>
                      <p className="text-[9px] text-slate-500 mt-1">Choosing a specific specialist may impact scheduling windows.</p>
                    </div>
                  )}

                  {/* Promo Coupon application */}
                  <div>
                    <label className="form-label">Promo Coupon Code</label>
                    <div className="flex gap-2">
                      <input className="form-input uppercase flex-1" placeholder="SAVE10" value={couponCode} onChange={e => setCouponCode(e.target.value)} />
                      <button type="button" onClick={handleApplyCoupon} className="px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg font-bold">Apply</button>
                    </div>
                    {appliedCoupon && (
                      <p className="text-[10px] text-emerald-400 mt-1 font-semibold">✓ Coupon applied: {appliedCoupon.type === 'flat' ? `₹${appliedCoupon.value}` : `${appliedCoupon.value}%`} discount.</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Additional Notes</label>
                    <textarea className="form-input resize-none" rows={1} placeholder="Specific instructions..." value={formData.notes} onChange={e => setFormData(d => ({ ...d, notes: e.target.value }))} />
                  </div>

                  {tenant.config.enableB2bEnquiry ? (
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-center space-y-1">
                      <p className="text-xs font-bold text-white">📋 Estimate Request Registered</p>
                      <p className="text-[10px] text-slate-500">Pricing will be determined offline by our estimating engineers following switchgear specifications review.</p>
                    </div>
                  ) : (
                    <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl space-y-1.5 text-left">
                      <div className="flex justify-between text-slate-400"><span>Base Price</span><span>₹{bookingService.basePrice}</span></div>
                      <div className="flex justify-between text-slate-400"><span>Visit & Travel Surcharge</span><span>₹150</span></div>
                      {appliedCoupon && (
                        <div className="flex justify-between text-emerald-405"><span>Discount</span><span>-₹{calculatePrice(bookingService.basePrice).discount}</span></div>
                      )}
                      <div className="flex justify-between text-slate-400"><span>GST (18%)</span><span>₹{calculatePrice(bookingService.basePrice).tax}</span></div>
                      <div className="flex justify-between font-bold text-white border-t border-slate-800 pt-1.5 text-sm">
                        <span>Grand Total:</span>
                        <span style={{ color: pc }}>₹{(calculatePrice(bookingService.basePrice).total + 150).toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Terms Checkbox */}
                  <div className="flex items-start gap-2 mt-2 font-sans text-[10px] text-slate-400 text-left">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreeTerms}
                      onChange={e => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-0"
                      required
                    />
                    <label htmlFor="terms" className="leading-relaxed select-none">
                      I agree to the <span className="underline cursor-pointer text-slate-300 font-bold" onClick={() => alert(`Terms & Conditions:\n\n- Cancellation Policy: ${c.cancellationPolicy || 'Cancel up to 2 hours before schedule.'}\n- Service Warranty: ${c.warrantyPolicy || '30 days warranty coverage.'}`)}>Terms of Service & Warranty Policies</span>. *
                    </label>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-2.5 rounded-xl font-bold shadow-md text-sm mt-3 disabled:opacity-50 disabled:cursor-not-allowed" 
                    style={{ background: pc, color: getTextColorForBg(pc) }}
                    disabled={!agreeTerms}
                  >
                    {tenant.config.enableB2bEnquiry ? 'Submit Commercial Enquiry ➔' : 'Place Booking Request ➔'}
                  </button>
                  <button type="button" onClick={closeModal} className="w-full text-center text-slate-500 hover:text-slate-400 font-bold">Cancel</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== PLATFORM TRUST BADGE MODAL ===== */}
      {showPlatformBadgeModal && (
        <div className="modal-overlay z-50" onClick={() => setShowPlatformBadgeModal(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-slate-900 rounded-3xl w-full max-w-md p-6 border border-slate-800 text-slate-200 animate-scaleIn font-sans text-left space-y-5">
            <div className="text-center pb-2 border-b border-slate-800">
              <span className="text-4xl">🛡️</span>
              <h3 className="text-base font-black text-white mt-2">Anarav Verification Network</h3>
              <p className="text-[10px] text-slate-500 mt-1">Independent Workspace Trust & Safety Audit</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-slate-950/45 p-3 rounded-xl border border-slate-850">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Business Identity</p>
                  <p className="text-xs text-white mt-0.5">{c.logoText || tenant.name}</p>
                </div>
                <span className="badge badge-active text-[8px] font-mono">VERIFIED</span>
              </div>

              <div className="flex justify-between items-center bg-slate-950/45 p-3 rounded-xl border border-slate-850">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Workforce Vetting</p>
                  <p className="text-xs text-white mt-0.5">Biometric Aadhaar check active</p>
                </div>
                <span className="badge badge-active text-[8px] font-mono">100% VETTED</span>
              </div>

              <div className="flex justify-between items-center bg-slate-950/45 p-3 rounded-xl border border-slate-850">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Security & Data</p>
                  <p className="text-xs text-white mt-0.5">SSL Encryption & PCI Pathways</p>
                </div>
                <span className="badge badge-active text-[8px] font-mono">SECURED</span>
              </div>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-850 space-y-3 text-center">
              <p className="text-xs text-slate-350 font-bold">Want a secure booking system like this?</p>
              <p className="text-[10px] text-slate-500 leading-relaxed">Build your own home services multi-tenant control center and deploy a branded customer portal instantly.</p>
              <a
                href="#/"
                onClick={() => setShowPlatformBadgeModal(false)}
                className="block w-full py-2 rounded-xl font-bold text-white text-center text-xs"
                style={{ background: pc }}
              >
                Register Workspace Free ➔
              </a>
            </div>

            <button
              onClick={() => setShowPlatformBadgeModal(false)}
              className="w-full text-center text-slate-500 hover:text-slate-400 font-bold text-xs"
            >
              Close Window
            </button>
          </div>
        </div>
      )}

      {/* ===== BOOKING BASKET DRAWER ===== */}
      {isBasketOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-fadeIn" onClick={() => setIsBasketOpen(false)} />
          
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-slate-200 flex flex-col shadow-2xl animate-slideOver">
              {/* Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛒</span>
                  <div>
                    <h3 className="text-sm font-black text-white">Booking Basket</h3>
                    <p className="text-[10px] text-slate-500">Book multiple services in one visit</p>
                  </div>
                </div>
                <button onClick={() => setIsBasketOpen(false)} className="text-slate-400 hover:text-white font-bold text-xs p-1.5 rounded-lg border border-slate-800 bg-slate-950/30">Close</button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-left">
                {basket.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <span className="text-4xl block">🧺</span>
                    <p className="text-xs text-slate-500 font-bold">Your Booking Basket is empty.</p>
                    <button
                      onClick={() => { setIsBasketOpen(false); setActivePageSlug('services'); }}
                      className="px-4 py-1.5 rounded-xl text-[10px] font-bold text-white"
                      style={{ background: pc }}
                    >
                      Browse Services
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Added Services & Variants:</p>
                      {basket.map(item => (
                        <div key={item.variantId} className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-white truncate">{item.serviceName}</p>
                            <p className="text-[9px] text-blue-450 font-bold mt-0.5">{item.variantName}</p>
                            <p className="text-[10px] text-emerald-450 font-black mt-1">₹{item.price} each</p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {/* Quantity Selector */}
                            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.quantity > 1) {
                                    setBasket(prev => prev.map(i => i.variantId === item.variantId ? { ...i, quantity: i.quantity - 1 } : i));
                                  } else {
                                    setBasket(prev => prev.filter(i => i.variantId !== item.variantId));
                                  }
                                }}
                                className="w-5 h-5 flex items-center justify-center font-bold hover:bg-slate-800 rounded text-slate-400"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-xs font-black text-white">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setBasket(prev => prev.map(i => i.variantId === item.variantId ? { ...i, quantity: i.quantity + 1 } : i));
                                }}
                                className="w-5 h-5 flex items-center justify-center font-bold hover:bg-slate-800 rounded text-slate-400"
                              >
                                +
                              </button>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => {
                                setBasket(prev => prev.filter(i => i.variantId !== item.variantId));
                              }}
                              className="text-rose-400 font-bold text-[10px] hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Scheduler Panel */}
                    <div className="border-t border-slate-800 pt-4 space-y-3">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Schedule Details:</p>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="form-label text-[9px] text-slate-400">Select Date *</label>
                          <input
                            type="date"
                            className="form-input text-xs text-white"
                            value={formData.date}
                            onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <label className="form-label text-[9px] text-slate-400">Select Time Slot *</label>
                          <select
                            className="form-input text-xs text-white"
                            value={formData.time}
                            onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                            required
                          >
                            <option value="10:00 AM">10:00 AM (Morning)</option>
                            <option value="12:00 PM">12:00 PM (Midday)</option>
                            <option value="02:30 PM">02:30 PM (Afternoon)</option>
                            <option value="05:00 PM">05:00 PM (Evening)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="form-label text-[9px] text-slate-400">Delivery Address *</label>
                        <textarea
                          rows={2}
                          className="form-input text-xs text-white resize-none"
                          placeholder="House No, Road / Area name, City, Pincode"
                          value={formData.address}
                          onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                          required
                        />
                      </div>

                      {/* Promo Coupon Code */}
                      <div>
                        <label className="form-label text-[9px] text-slate-400">Promo Discount Coupon</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            className="form-input text-xs font-mono uppercase"
                            placeholder="e.g. DIWALI20"
                            id="basket-coupon-input"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById('basket-coupon-input') as HTMLInputElement;
                              if (!input) return;
                              const code = input.value.trim().toUpperCase();
                              const coupon = myCoupons.find(cp => cp.code === code);
                              if (coupon) {
                                setBasketCoupon(code);
                                showToast(`Coupon ${code} applied successfully!`, 'success');
                              } else {
                                showToast('Invalid promo coupon code.', 'error');
                              }
                            }}
                            className="btn-secondary px-3 py-1.5 font-bold text-xs"
                          >
                            Apply
                          </button>
                        </div>
                        {basketCoupon && (
                          <div className="flex items-center justify-between text-[10px] text-emerald-450 font-bold mt-1">
                            <span>Promo active: {basketCoupon}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setBasketCoupon('');
                                const input = document.getElementById('basket-coupon-input') as HTMLInputElement;
                                if (input) input.value = '';
                                showToast('Coupon removed.');
                              }}
                              className="text-red-400 underline"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Summary and Proceed (Sticky Footer of drawer) */}
              {basket.length > 0 && (() => {
                const subtotal = basket.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                
                // Calculate discount if coupon applied
                let discount = 0;
                if (basketCoupon) {
                  const coupon = myCoupons.find(cp => cp.code === basketCoupon);
                  if (coupon) {
                    if (coupon.type === 'flat') {
                      discount = coupon.value;
                    } else {
                      discount = Math.round((subtotal * coupon.value) / 100);
                    }
                  }
                }

                const gstAmount = Math.round((subtotal - discount) * 0.18);
                const grandTotal = subtotal - discount + gstAmount;

                return (
                  <div className="p-6 border-t border-slate-800 bg-slate-950/60 space-y-4">
                    <div className="space-y-1.5 text-xs text-left">
                      <div className="flex justify-between text-slate-400">
                        <span>Items Subtotal:</span>
                        <span>₹{subtotal.toLocaleString()}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-emerald-400">
                          <span>Promo Discount:</span>
                          <span>-₹{discount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-400">
                        <span>GST (18% tax):</span>
                        <span>₹{gstAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-800 pt-2 font-black text-sm text-white">
                        <span>Grand Total:</span>
                        <span style={{ color: pc }}>₹{grandTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!formData.date || !formData.address.trim()) {
                          showToast('Please specify booking date and delivery address.', 'error');
                          return;
                        }

                        // Concatenate items for backwards compatibility
                        const serviceIds = basket.map(i => i.serviceId).join(',');
                        const serviceNames = basket.map(i => `${i.serviceName} (${i.variantName}) x${i.quantity}`).join(' + ');

                        // Generate booking draft
                        const draftBooking: Booking = {
                          id: 'BK-' + Date.now().toString().slice(-6),
                          tenantId: tenant.id,
                          customerId: customerSession ? customerSession.phone : 'cust-anon',
                          customerName: customerSession ? customerSession.name : 'Ravi Kumar',
                          customerPhone: customerSession ? customerSession.phone : '9876543210',
                          customerAddress: formData.address,
                          serviceId: serviceIds,
                          serviceName: serviceNames,
                          status: 'requested',
                          scheduledDate: formData.date,
                          scheduledTime: formData.time,
                          isEmergency: false,
                          formData: {},
                          priceDetails: {
                            baseVisit: subtotal,
                            distanceCharge: 0,
                            labour: 0,
                            material: 0,
                            emergencySurcharge: 0,
                            tax: gstAmount,
                            discount: discount,
                            total: grandTotal
                          },
                          workerId: '',
                          workerName: '',
                          createdAt: new Date().toISOString()
                        };

                        // open checkout payment modal
                        setTempBooking(draftBooking);
                        setPaymentGatewayOpen(true);
                        setIsBasketOpen(false); // close basket
                      }}
                      className="w-full py-3 rounded-xl font-bold text-white text-center text-xs shadow-lg hover:scale-[1.01] transition-transform"
                      style={{ background: pc }}
                    >
                      Proceed to Secure Checkout ➔
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ===== MOCK PAYMENT GATEWAY MODAL ===== */}
      {paymentGatewayOpen && tempBooking && (
        <div className="modal-overlay z-50" onClick={() => setPaymentGatewayOpen(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-slate-900 rounded-3xl w-full max-w-md p-6 border border-slate-800 text-slate-200 animate-scaleIn font-sans text-left space-y-4">
            <div className="text-center pb-2 border-b border-slate-800">
              <span className="text-4xl">💳</span>
              <h3 className="text-base font-black text-white mt-2">Secure Payment Gateway</h3>
              <p className="text-[10px] text-slate-500 mt-1">Anarav Pay Checkout Portal</p>
            </div>

            <div className="bg-slate-950 border border-slate-855 p-4 rounded-2xl text-xs space-y-2">
              <div className="flex justify-between"><span>Merchant:</span><strong className="text-white">{c.logoText || tenant.name}</strong></div>
              <div className="flex justify-between"><span>Service:</span><strong className="text-white">{tempBooking.serviceName}</strong></div>
              <div className="flex justify-between border-t border-slate-850 pt-2 font-bold text-sm text-white">
                <span>Grand Total:</span>
                <span style={{ color: pc }}>₹{tempBooking.priceDetails.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Select Demo Payment Method</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'upi', label: '📱 UPI / QR', desc: 'GPay, PhonePe' },
                  { id: 'card', label: '💳 Card', desc: 'Visa, Master' },
                  { id: 'cod', label: '💵 Cash', desc: 'Pay post-work' }
                ].map(method => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(method.id as any)}
                    className={`p-3 rounded-xl border text-center transition-all ${selectedPaymentMethod === method.id ? 'border-blue-500 bg-blue-950/20' : 'border-slate-800 bg-slate-950/40'}`}
                  >
                    <p className="text-[10px] font-bold text-white">{method.label}</p>
                    <p className="text-[8px] text-slate-505 mt-0.5">{method.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {isProcessingPayment ? (
              <div className="p-4 text-center space-y-2 bg-slate-950/50 border border-slate-850 rounded-2xl">
                <div className="w-6 h-6 border-2 border-t-transparent border-blue-500 rounded-full animate-spin mx-auto" />
                <p className="text-[10px] text-slate-400 font-bold animate-pulse">Securing transaction via PCI DSS pathways...</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleProcessPayment}
                className="w-full py-2.5 rounded-xl font-bold text-white text-center text-xs"
                style={{ background: pc }}
              >
                Complete Payment (Demo Mode) ➔
              </button>
            )}

            <button
              onClick={() => setPaymentGatewayOpen(false)}
              className="w-full text-center text-slate-500 hover:text-slate-400 font-bold text-xs"
              disabled={isProcessingPayment}
            >
              Cancel Payment
            </button>
          </div>
        </div>
      )}

      {/* ===== CUSTOMER SIGN IN MODAL ===== */}
      {showCustomerLoginModal && (
        <div className="modal-overlay z-50" onClick={() => setShowCustomerLoginModal(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-slate-900 rounded-3xl w-full max-w-sm p-6 border border-slate-800 text-slate-200 animate-scaleIn font-sans text-left space-y-4">
            <div className="text-center pb-2 border-b border-slate-800">
              <span className="text-4xl">👤</span>
              <h3 className="text-base font-black text-white mt-2">Customer Portal Sign In</h3>
              <p className="text-[10px] text-slate-500 mt-1">Access booking history, invoices, & warranties</p>
            </div>

            <form onSubmit={handleCustomerLogin} className="space-y-4 text-xs">
              <div>
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  className="form-input"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  required
                />
                <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">
                  💡 Demo Hint: Enter any phone number matching past bookings to load history, or sign in as a new user.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold text-white text-center text-xs"
                style={{ background: pc }}
              >
                Sign In & Open Dashboard
              </button>
            </form>

            <button
              onClick={() => setShowCustomerLoginModal(false)}
              className="w-full text-center text-slate-550 hover:text-slate-400 font-bold text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ===== TRACK BOOKING CODE INPUT MODAL ===== */}
      {showTrackModal && (
        <div className="modal-overlay z-50" onClick={() => setShowTrackModal(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-slate-900 rounded-3xl w-full max-w-sm p-6 border border-slate-800 text-slate-200 animate-scaleIn font-sans text-left space-y-4">
            <div className="text-center pb-2 border-b border-slate-800">
              <span className="text-4xl">🔎</span>
              <h3 className="text-base font-black text-white mt-2">Track Booking</h3>
              <p className="text-[10px] text-slate-500 mt-1">Enter your Booking ID to view live progress status</p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="form-label">Booking ID / Code</label>
                <input
                  type="text"
                  placeholder="e.g. BK-123456"
                  className="form-input uppercase font-mono"
                  value={trackInputCode}
                  onChange={e => setTrackInputCode(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const code = trackInputCode.trim().toUpperCase();
                  const found = bookings.find(b => b.id.toUpperCase() === code && b.tenantId === tenant.id);
                  if (found) {
                    setTrackedBooking(found);
                    setShowTrackModal(false);
                    setTrackInputCode('');
                  } else {
                    showToast('Booking ID not found. Please verify the code.', 'error');
                  }
                }}
                className="w-full py-2.5 rounded-xl font-bold text-white text-center text-xs"
                style={{ background: pc }}
              >
                Track Live Operations
              </button>
            </div>

            <button
              onClick={() => setShowTrackModal(false)}
              className="w-full text-center text-slate-500 hover:text-slate-400 font-bold text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ===== LIVE OPERATIONS TRACKER MODAL ===== */}
      {trackedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
          <div className="absolute inset-0 bg-slate-955/60 backdrop-blur-sm transition-opacity" onClick={() => setTrackedBooking(null)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-200 shadow-2xl animate-scaleIn text-left space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-450 border border-emerald-500/20">🔎 Live Operations Tracker</span>
                <h3 className="text-base font-black text-white mt-2">{trackedBooking.serviceName}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Booking ID: {trackedBooking.id} · Scheduled at {trackedBooking.scheduledTime}</p>
              </div>
              <button onClick={() => setTrackedBooking(null)} className="text-slate-400 hover:text-white font-bold text-xs p-1.5 rounded-lg border border-slate-800 bg-slate-950/30">Close</button>
            </div>

            {/* Stages Timeline Progress */}
            <div className="space-y-4 font-sans text-xs">
              {[
                { stage: 'requested', label: 'Booking Requested', desc: 'Matched with local operator' },
                { stage: 'approved', label: 'Approved & Scheduled', desc: 'Date and slot locked' },
                { stage: 'assigned', label: 'Technician Dispatched', desc: `Assigned to ${trackedBooking.workerName || 'Staff'}` },
                { stage: 'started', label: 'Work Started', desc: 'Technician has started work at site' },
                { stage: 'completed', label: 'Job Completed', desc: 'Verification and satisfaction checklist approved' }
              ].map((step, idx, arr) => {
                const stagesMap = ['requested', 'approved', 'assigned', 'started', 'completed'];
                const currentStatusIndex = stagesMap.indexOf(trackedBooking.status);
                const stepIndex = stagesMap.indexOf(step.stage);
                const isPassed = stepIndex <= currentStatusIndex && currentStatusIndex !== -1;
                const isCurrent = step.stage === trackedBooking.status;

                return (
                  <div key={step.stage} className="flex gap-4 relative">
                    {/* Line Connector */}
                    {idx < arr.length - 1 && (
                      <div className={`absolute left-2.5 top-5 bottom-[-16px] w-0.5 ${isPassed && stepIndex < currentStatusIndex ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                    )}

                    {/* Circle Checkmark */}
                    <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center font-bold text-[9px] border z-10 ${
                      isCurrent ? 'bg-blue-600 border-blue-500 text-white animate-pulse' :
                      isPassed ? 'bg-emerald-500/15 border-emerald-550 text-emerald-450' : 'bg-slate-950 border-slate-800 text-slate-655'
                    }`}>
                      {isPassed && step.stage !== trackedBooking.status ? '✓' : idx + 1}
                    </div>

                    <div>
                      <p className={`font-bold ${isCurrent ? 'text-blue-400' : isPassed ? 'text-slate-100' : 'text-slate-500'}`}>{step.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Support footer */}
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800 text-[10px] text-slate-400 flex items-center gap-3">
              <span className="text-xl">📞</span>
              <div>
                <p className="font-bold text-white">Need emergency change?</p>
                <p className="mt-0.5">Contact operations support desk directly at {c.phone}.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== PRINTABLE INVOICE MODAL ===== */}
      {invoiceModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto font-sans print-invoice-container">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity print:hidden" onClick={() => setInvoiceModalBooking(null)} />
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-8 text-slate-200 shadow-2xl animate-scaleIn text-left space-y-6 print:border-0 print:bg-white print:text-black print:p-0">
            
            {/* Header info */}
            <div className="flex justify-between items-start border-b pb-4 border-slate-800 print:border-black">
              <div>
                <h3 className="text-lg font-black text-white print:text-black flex items-center gap-2">
                  <span>📄</span> {c.logoText || tenant.name} Invoice
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">Gst Registration: {c.gstNumber || '37AAAAA0000A1Z5'}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{c.address || 'Nellore, AP'}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono font-bold bg-slate-800 px-2.5 py-1 rounded-lg print:border print:border-black print:bg-transparent">INVOICE: #{invoiceModalBooking.id}</span>
                <p className="text-[10px] text-slate-505 mt-2">Date: {invoiceModalBooking.scheduledDate}</p>
              </div>
            </div>

            {/* Billing details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-black">Billed To:</p>
                <p className="font-bold text-white print:text-black mt-1">{invoiceModalBooking.customerName}</p>
                <p className="text-slate-400 mt-0.5">{invoiceModalBooking.customerPhone}</p>
                <p className="text-slate-400 mt-0.5 truncate max-w-xs">{invoiceModalBooking.customerAddress}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-550 uppercase font-black">Payment Details:</p>
                <p className="font-bold text-white print:text-black mt-1">Status: Paid ✓</p>
                <p className="text-slate-400 mt-0.5">Method: Online UPI/Card Gateway</p>
              </div>
            </div>

            {/* Line items Table */}
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="border-b border-slate-800 text-slate-405 print:border-black print:text-black">
                  <th className="py-2">Item Description</th>
                  <th className="py-2 text-right">Base Price</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-850/60 print:border-black">
                  <td className="py-3">
                    <p className="font-bold text-white print:text-black">{invoiceModalBooking.serviceName}</p>
                    <p className="text-[10px] text-slate-550">Professional service execution on scheduled slot</p>
                  </td>
                  <td className="py-3 text-right">₹{invoiceModalBooking.priceDetails.baseVisit}</td>
                </tr>
                <tr className="text-slate-400">
                  <td className="py-1.5 pt-3">Visit, Travel & Tool Surcharges</td>
                  <td className="py-1.5 pt-3 text-right">₹150</td>
                </tr>
                {invoiceModalBooking.priceDetails.discount > 0 && (
                  <tr className="text-emerald-450">
                    <td className="py-1.5">Promo Discount ({invoiceModalBooking.couponCode || 'PROMO'})</td>
                    <td className="py-1.5 text-right">-₹{invoiceModalBooking.priceDetails.discount}</td>
                  </tr>
                )}
                <tr className="text-slate-400">
                  <td className="py-1.5">GST Tax (18% standard IGST)</td>
                  <td className="py-1.5 text-right">₹{invoiceModalBooking.priceDetails.tax}</td>
                </tr>
                <tr className="border-t border-slate-800 font-black text-sm text-white print:border-black print:text-black">
                  <td className="py-3">Grand Total (Net amount charged)</td>
                  <td className="py-3 text-right" style={{ color: pc }}>₹{invoiceModalBooking.priceDetails.total}</td>
                </tr>
              </tbody>
            </table>

            {/* Print action CTAs */}
            <div className="flex gap-2 pt-2 print:hidden">
              <button 
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white text-center shadow-lg"
                style={{ background: pc }}
              >
                🖨️ Print Receipt
              </button>
              <button 
                onClick={() => setInvoiceModalBooking(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-xs border text-slate-350"
                style={{ borderColor: 'var(--color-border)', background: 'transparent' }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}


      {/* Sticky Mobile Action Center */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md border-t px-2 py-2 flex items-center justify-around gap-1 font-sans"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <a href={`tel:${c.phone}`} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
          <Phone className="w-5 h-5" />
          <span className="text-[9px]">Call</span>
        </a>
        {c.whatsAppNumber && (
          <a href={`https://wa.me/${c.whatsAppNumber}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-bold text-green-500">
            <MessageCircle className="w-5 h-5" />
            <span className="text-[9px]">WhatsApp</span>
          </a>
        )}
        <button
          onClick={() => { setActivePageSlug('services'); setTimeout(() => { const el = document.getElementById('services'); if(el) el.scrollIntoView({ behavior: 'smooth' }); }, 50); }}
          className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl font-black text-xs text-white shadow-lg"
          style={{ background: pc, borderRadius: 'var(--border-radius)' }}
        >
          <span className="text-base">📅</span>
          <span className="text-[9px]">Book Now</span>
        </button>
        <button
          onClick={() => setIsBasketOpen(true)}
          className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[9px]">Cart</span>
          {basket.length > 0 && (
            <span className="absolute top-0 right-2 w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center text-white" style={{ background: pc }}>
              {basket.reduce((t, x) => t + x.quantity, 0)}
            </span>
          )}
        </button>
        <button
          onClick={() => setShowCustomerLoginModal(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <span className="text-lg">👤</span>
          <span className="text-[9px]">Account</span>
        </button>
      </div>

      {/* WhatsApp Floating Button (Desktop) */}
      {c.whatsAppNumber && (
        <a
          href={`https://wa.me/${c.whatsAppNumber}`}
          target="_blank"
          rel="noreferrer"
          className="hidden md:flex fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full items-center justify-center shadow-2xl hover:scale-110 transition-all"
          style={{ background: '#25d366' }}
          title="Chat on WhatsApp"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </a>
      )}

    </div>
  );
}
