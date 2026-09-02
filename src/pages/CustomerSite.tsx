// @ts-nocheck
import { useState, useEffect } from 'react';
import type { AuthSession, Booking, BasketItem } from '../types';
import type { SharedStore } from '../App';

import { Phone, MessageCircle, ArrowLeft, Moon, Sun, Search, ShoppingBag, MapPin, ChevronDown, LogOut, Eye, EyeOff, Lock, User, Mail, ShieldCheck } from 'lucide-react';
import CmsRenderer from './CmsRenderer';
import { generateThemeTokens } from '../utils/themeEngine';
import { api } from '../utils/api';

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
  const { tenants, services, workers, bookings, setBookings, coupons, leads, setLeads, quotations, setQuotations } = store;

  // Helper to extract tenant ID from URL or storage
  const getUrlTenantId = () => {
    try {
      const hash = window.location.hash || '';
      const queryIdx = hash.indexOf('?');
      if (queryIdx !== -1) {
        const params = new URLSearchParams(hash.substring(queryIdx));
        const tParam = params.get('tenant');
        if (tParam) return tParam;
      }
      const searchParams = new URLSearchParams(window.location.search);
      const tSearch = searchParams.get('tenant');
      if (tSearch) return tSearch;
    } catch {}
    return null;
  };

  const initialTenantId = getUrlTenantId() || session.tenantId || (() => {
    try {
      const saved = sessionStorage.getItem('anarav_site_tenant_id') || localStorage.getItem('anarav_site_tenant_id');
      if (saved) return saved;
    } catch {}
    return tenants[0]?.id || '';
  })();

  const [activeTenantId, setActiveTenantId] = useState(initialTenantId);

  useEffect(() => {
    const handleUrlTenant = () => {
      const urlTenant = getUrlTenantId();
      if (urlTenant && urlTenant !== activeTenantId) {
        setActiveTenantId(urlTenant);
      }
    };
    window.addEventListener('hashchange', handleUrlTenant);
    return () => window.removeEventListener('hashchange', handleUrlTenant);
  }, [activeTenantId]);

  useEffect(() => {
    const urlTenant = getUrlTenantId();
    if (urlTenant) {
      setActiveTenantId(urlTenant);
    } else if (session.tenantId && activeTenantId !== session.tenantId) {
      setActiveTenantId(session.tenantId);
    }
  }, [session.tenantId]);

  useEffect(() => {
    if (activeTenantId) {
      try {
        sessionStorage.setItem('anarav_site_tenant_id', activeTenantId);
        localStorage.setItem('anarav_site_tenant_id', activeTenantId);
      } catch {}
    }
  }, [activeTenantId]);

  const tenant = 
    tenants.find(t => t.id === activeTenantId) ||
    tenants.find(t => t.id === getUrlTenantId()) ||
    tenants.find(t => session.tenantId && t.id === session.tenantId) ||
    tenants.find(t => session.email && t.ownerEmail === session.email) ||
    tenants.find(t => session.tenantName && t.name === session.tenantName) ||
    tenants[0];
  if (!tenant) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-300">Loading {session.tenantName || 'Site'}...</p>
      </div>
    );
  }

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

  const directServices = services.filter(s => s.tenantId === tenant.id && s.isActive);
  const myServices = directServices.length > 0 ? directServices : services.filter(s => s.isActive).slice(0, 8);
  const myWorkers = workers.filter(w => w.tenantId === tenant.id);
  const myCoupons = coupons.filter(cp => cp.tenantId === tenant.id && cp.status === 'active');

  const [bookingService, setBookingService] = useState<null | typeof myServices[0]>(null);
  const [detailService, setDetailService] = useState<null | typeof myServices[0]>(null);
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

  const [customerSession, setCustomerSession] = useState<{ phone: string; name: string; email?: string; address?: string } | null>(() => {
    try {
      const saved = localStorage.getItem(`anarav_customer_session_${tenant.id}`) || sessionStorage.getItem(`anarav_customer_session_${tenant.id}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [showCustomerLoginModal, setShowCustomerLoginModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authIdentifier, setAuthIdentifier] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authShowPassword, setAuthShowPassword] = useState(false);
  const [authFullName, setAuthFullName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authAddress, setAuthAddress] = useState('');
  const [authRememberMe, setAuthRememberMe] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  const [customerActiveTab, setCustomerActiveTab] = useState<'bookings' | 'book_service' | 'warranties' | 'rewards' | 'support' | 'quotations'>('bookings');
  const [viewMode, setViewMode] = useState<'website' | 'dashboard'>('website');

  // Auto pre-fill customer checkout details when logged in
  useEffect(() => {
    if (customerSession && bookingService) {
      const lastB = bookings.find(b => b.customerPhone === customerSession.phone && b.tenantId === tenant.id);
      setFormData({
        name: customerSession.name,
        phone: customerSession.phone,
        address: customerSession.address || (lastB ? lastB.customerAddress : ''),
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



  const handleProcessPayment = async () => {
    if (!tempBooking) return;
    setIsProcessingPayment(true);

    try {
      // 1. Save booking directly to PostgreSQL Database
      const res = await api.createBooking({
        ...tempBooking,
        tenantId: tenant.id
      });
      const savedBooking: Booking = (res && res.data) ? {
        ...tempBooking,
        id: res.data.id || tempBooking.id,
        customerId: res.data.customerId || tempBooking.customerId
      } : tempBooking;

      setBookings(prev => [savedBooking, ...prev.filter(b => b.id !== savedBooking.id)]);
      setLastBookingId(savedBooking.id);
      showToast('🎉 Booking confirmed and saved to database!', 'success');
    } catch (err) {
      console.error('Error saving booking to DB:', err);
      // Fallback local persistence
      setBookings(prev => [tempBooking, ...prev.filter(b => b.id !== tempBooking.id)]);
      setLastBookingId(tempBooking.id);
      showToast('🎉 Booking confirmed and scheduled!', 'success');
    }

    // 2. Also register lead for notification & CRM
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
      api.createLead(newL).catch(() => {});
      setLeads(prev => [...prev, newL]);
    }

    setBasket([]);
    setBasketCoupon('');
    setIsProcessingPayment(false);
    setPaymentGatewayOpen(false);
    setBookingSubmitted(true);
  };

  const handleCustomerSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authIdentifier.trim()) {
      showToast('Please enter your mobile phone number or email address', 'error');
      return;
    }
    if (!authPassword.trim()) {
      showToast('Please enter your account password', 'error');
      return;
    }

    setAuthLoading(true);
    const identifier = authIdentifier.trim();

    try {
      // 1. Authenticate against PostgreSQL database
      const res = await api.customerLogin({
        identifier,
        password: authPassword,
        tenantId: tenant.id
      });

      if (res && res.success && res.data?.user) {
        const user = res.data.user;
        const sessionData = {
          id: user.id,
          phone: user.phone || identifier,
          name: user.name || 'Valued Customer',
          email: user.email || '',
          address: user.address || ''
        };
        setCustomerSession(sessionData);
        if (authRememberMe) {
          try {
            localStorage.setItem(`anarav_customer_session_${tenant.id}`, JSON.stringify(sessionData));
          } catch {}
        }

        // 2. Sync real customer bookings from DB
        try {
          const bookingsRes = await api.getBookings(tenant.id, user.id);
          if (bookingsRes && bookingsRes.data && Array.isArray(bookingsRes.data)) {
            const mapped = bookingsRes.data.map((dbB: any) => ({
              id: dbB.id,
              tenantId: dbB.tenantId,
              customerId: dbB.customerId,
              customerName: dbB.formData?.customerName || dbB.customer?.name || sessionData.name,
              customerPhone: dbB.formData?.customerPhone || sessionData.phone,
              customerAddress: dbB.formData?.customerAddress || sessionData.address || 'Doorstep Visit',
              serviceId: dbB.serviceId,
              serviceName: dbB.formData?.serviceName || dbB.service?.name || 'Service',
              status: (dbB.status || 'requested').toLowerCase() as any,
              scheduledDate: dbB.scheduledDate || new Date().toISOString().split('T')[0],
              scheduledTime: dbB.scheduledTime || '10:00 AM',
              isEmergency: !!dbB.formData?.isEmergency,
              formData: dbB.formData || {},
              priceDetails: {
                baseVisit: Number(dbB.priceTotal) || 350,
                distanceCharge: 50,
                labour: 100,
                material: 0,
                emergencySurcharge: 0,
                tax: Number(dbB.taxTotal) || 63,
                discount: Number(dbB.discountTotal) || 0,
                total: Number(dbB.netTotal) || 563
              },
              workerId: dbB.workerId || '',
              workerName: dbB.worker?.user?.name || undefined,
              createdAt: dbB.createdAt || new Date().toISOString()
            }));
            setBookings(prev => {
              const map = new Map(prev.map(b => [b.id, b]));
              for (const m of mapped) map.set(m.id, m);
              return Array.from(map.values());
            });
          }
        } catch {}

        showToast(`Welcome back, ${sessionData.name}!`, 'success');
        setShowCustomerLoginModal(false);
        setViewMode('dashboard');
        setCustomerActiveTab('bookings');
        setAuthLoading(false);
        return;
      }
    } catch (err: any) {
      console.warn('DB login fallback to local session check:', err);
    }

    // Fallback local matching
    const isEmail = identifier.includes('@');
    const foundBooking = bookings.find(b => 
      b.tenantId === tenant.id && 
      (b.customerPhone === identifier || (b.formData && (b.formData as any).email === identifier))
    );
    const foundLead = leads.find(l => 
      l.tenantId === tenant.id && 
      (l.phone === identifier || l.email === identifier)
    );

    const clientName = foundBooking ? foundBooking.customerName : (foundLead ? foundLead.name : (isEmail ? identifier.split('@')[0] : 'Customer'));
    const clientPhone = foundBooking ? foundBooking.customerPhone : (foundLead ? foundLead.phone : (isEmail ? '9876543210' : identifier));
    const clientEmail = isEmail ? identifier : (foundLead ? foundLead.email : '');
    const clientAddress = foundBooking ? foundBooking.customerAddress : '';

    const sessionData = {
      phone: clientPhone,
      name: clientName,
      email: clientEmail,
      address: clientAddress
    };

    setCustomerSession(sessionData);
    if (authRememberMe) {
      try {
        localStorage.setItem(`anarav_customer_session_${tenant.id}`, JSON.stringify(sessionData));
      } catch {}
    }

    setShowCustomerLoginModal(false);
    setViewMode('dashboard');
    setCustomerActiveTab('bookings');
    setAuthLoading(false);
    showToast(`Welcome, ${clientName}!`, 'success');
  };

  const handleCustomerSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authFullName.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }
    if (!authPhone.trim()) {
      showToast('Please enter your mobile phone number', 'error');
      return;
    }
    if (!authPassword.trim() || authPassword.length < 4) {
      showToast('Please create a password of at least 4 characters', 'error');
      return;
    }

    setAuthLoading(true);
    const sessionData = {
      phone: authPhone.trim(),
      name: authFullName.trim(),
      email: authEmail.trim(),
      address: authAddress.trim()
    };

    try {
      // Save customer user directly into PostgreSQL database
      const res = await api.customerRegister({
        name: sessionData.name,
        phone: sessionData.phone,
        email: sessionData.email,
        password: authPassword,
        address: sessionData.address,
        tenantId: tenant.id
      });
      if (res && res.success && res.data?.user) {
        showToast('🎉 Account registered and saved to database successfully!', 'success');
      }
    } catch (err: any) {
      console.error('Error registering customer in DB:', err);
      const newL = {
        id: `lead-${Date.now()}`,
        tenantId: tenant.id,
        name: sessionData.name,
        phone: sessionData.phone,
        email: sessionData.email,
        serviceInterest: 'Account Registered',
        notes: `Registered from website portal. Address: ${sessionData.address}`,
        status: 'new' as const,
        createdAt: new Date().toISOString()
      };
      api.createLead(newL).catch(() => {});
      setLeads(prev => [...prev, newL]);
      showToast('Account registered successfully!', 'success');
    }

    setCustomerSession(sessionData);
    if (authRememberMe) {
      try {
        localStorage.setItem(`anarav_customer_session_${tenant.id}`, JSON.stringify(sessionData));
      } catch {}
    }

    setShowCustomerLoginModal(false);
    setViewMode('dashboard');
    setCustomerActiveTab('bookings');
    setAuthLoading(false);
  };

  const handleCustomerSignOut = () => {
    setCustomerSession(null);
    try {
      localStorage.removeItem(`anarav_customer_session_${tenant.id}`);
      sessionStorage.removeItem(`anarav_customer_session_${tenant.id}`);
    } catch {}
    setViewMode('website');
  };

  const closeModal = () => {
    setBookingService(null);
    setBookingSubmitted(false);
    setFormData({ name: '', phone: '', address: '', date: '', time: '', notes: '' });
    setCouponCode('');
    setAppliedCoupon(null);
    setAgreeTerms(false);
  };

  const tc = tenant.config as any;
  const siteBgType = tc.bgType || 'solid';
  const siteBgImage = tc.bgImage || '';
  const siteBgGradient = tc.bgGradient || '';
  const siteBgPattern = tc.bgPattern || 'none';
  const siteBgOverlayOpacity = tc.bgOverlayOpacity ?? 40;
  const siteBgOverlayColor = tc.bgOverlayColor || '#000000';
  const siteBgBlur = tc.bgBlur ?? 0;

  const getSitePatternBg = (p: string) => {
    switch (p) {
      case 'dots':
        return 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)';
      case 'grid':
        return 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)';
      case 'mesh':
        return 'radial-gradient(at 100% 0%, rgba(99, 102, 241, 0.12) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(16, 185, 129, 0.12) 0px, transparent 50%)';
      case 'waves':
        return 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04) 2px, transparent 40px)';
      default:
        return undefined;
    }
  };

  const getSiteRootStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      fontFamily: 'var(--font-family)',
      color: 'var(--color-text-primary)',
      minHeight: '100vh',
      position: 'relative',
    };

    if (siteBgType === 'image' && siteBgImage) {
      return {
        ...base,
        backgroundImage: `url(${siteBgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      };
    }
    if (siteBgType === 'gradient' && siteBgGradient) {
      return {
        ...base,
        background: siteBgGradient,
        backgroundAttachment: 'fixed',
      };
    }
    if (siteBgType === 'pattern' && siteBgPattern !== 'none') {
      return {
        ...base,
        backgroundImage: getSitePatternBg(siteBgPattern),
        backgroundSize: siteBgPattern === 'dots' ? '20px 20px' : siteBgPattern === 'grid' ? '32px 32px' : 'auto',
        backgroundColor: 'var(--color-background)',
      };
    }
    return {
      ...base,
      backgroundColor: 'var(--color-background)',
    };
  };

  return (
    <div 
      className="min-h-screen transition-all pb-16 md:pb-0 relative" 
      style={getSiteRootStyles()}
    >
      {/* Background Image / Frosted Overlay */}
      {siteBgType === 'image' && siteBgImage && (
        <div 
          className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-300"
          style={{
            backgroundColor: siteBgOverlayColor,
            opacity: siteBgOverlayOpacity / 100,
            backdropFilter: siteBgBlur > 0 ? `blur(${siteBgBlur}px)` : undefined,
            WebkitBackdropFilter: siteBgBlur > 0 ? `blur(${siteBgBlur}px)` : undefined,
          }}
        />
      )}

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
          <div 
            onClick={() => {
              setActivePageSlug('home');
              setViewMode('website');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
            title="Go to Homepage"
          >
            {c.logoImage ? (
              <img
                src={c.logoImage}
                alt={c.logoText || tenant.name}
                className="h-10 w-auto max-w-[150px] object-contain rounded-lg shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black text-white shadow-sm" style={{ background: pc }}>
                {(c.logoText || tenant.name).charAt(0)}
              </div>
            )}
            <div>
              <p className="text-base font-black leading-tight" style={{ color: 'var(--color-primary)' }}>{c.logoText || tenant.name}</p>
              <p className="text-[10px] leading-tight" style={{ color: 'var(--color-text-secondary)' }}>{(c as any).navbarTagline || 'One Call. We Do It All.'}</p>
            </div>
          </div>

          {/* Dynamic Navigation Menu Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {(((c as any).navLinksList) || [
              { id: 'nav-1', name: 'Home', tab: 'hero' },
              { id: 'nav-2', name: 'Services', tab: 'services' },
              { id: 'nav-3', name: 'Offers', tab: 'offers' },
              { id: 'nav-4', name: 'Team', tab: 'team' },
              { id: 'nav-5', name: 'Gallery', tab: 'gallery' },
              { id: 'nav-6', name: 'Reviews', tab: 'reviews' },
              { id: 'nav-7', name: 'FAQs', tab: 'faqs' },
              { id: 'nav-8', name: 'Contact', tab: 'coverage' },
            ]).map((link: any) => {
              const targetTab = link.tab || 'hero';
              const targetSlug = (targetTab === 'hero' || targetTab === 'home') ? 'home' : targetTab;
              const isActive = activePageSlug === targetSlug || ((activePageSlug === 'hero' || !activePageSlug) && targetSlug === 'home');
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setActivePageSlug(targetSlug);
                    setViewMode('website');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3 py-2 text-xs font-bold transition-all relative hover:opacity-80"
                  style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
                >
                  {link.name}
                  {isActive && <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full" style={{ background: pc }} />}
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Track Booking */}
            {(c as any).showTrackButton !== false && (
              <button
                onClick={() => setShowTrackModal(true)}
                className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border transition-all hover:border-slate-600"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                <Search className="w-3.5 h-3.5" /> {(c as any).trackButtonText || 'Track Booking'}
              </button>
            )}

            {/* Basket */}
            <button
              onClick={() => setIsBasketOpen(true)}
              className="relative p-2 rounded-lg border transition-all hover:border-slate-600"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              <ShoppingBag className="w-4 h-4" />
              {basket.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full text-[8px] font-black flex items-center justify-center text-white w-4 h-4" style={{ background: pc }}>
                  {basket.reduce((t, x) => t + x.quantity, 0)}
                </span>
              )}
            </button>

            {/* Customer Sign In / Account */}
            {(c as any).showLoginButton !== false && (
              customerSession ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewMode(viewMode === 'dashboard' ? 'website' : 'dashboard')}
                    className="flex items-center gap-1.5 font-bold text-xs px-3 py-2 rounded-lg border transition-all"
                    style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', background: `${pc}15` }}
                    title="Toggle Customer Portal"
                  >
                    <span>👤</span> {viewMode === 'dashboard' ? 'Back to Site' : customerSession.name.split(' ')[0]}
                  </button>
                  <button
                    onClick={handleCustomerSignOut}
                    className="p-2 rounded-lg border text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors text-xs"
                    title="Sign Out"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode('signin');
                    setShowCustomerLoginModal(true);
                  }}
                  className="hidden sm:flex items-center gap-1.5 font-bold text-xs px-3 py-2 rounded-lg border transition-all hover:border-slate-600"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                >
                  <User className="w-3.5 h-3.5" /> {(c as any).loginButtonText || 'Sign In'}
                </button>
              )
            )}

            {/* Book Service CTA */}
            {(c as any).showBookButton !== false && (
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
                📅 {(c as any).bookButtonText || 'Book Service'}
              </button>
            )}

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
              ...(tenant.config.enableB2bEnquiry ? [{ id: 'quotations', label: '📋 Switchgear Estimates' }] : []),
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

            {customerActiveTab === 'quotations' && (
              <div className="space-y-4 font-sans">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">Switchgear Engineering Estimates</p>
                {(quotations || []).filter(q => q.customerPhone === customerSession.phone && q.tenantId === tenant.id).length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
                    No active switchgear quotations found for your phone number. Submit a quote enquiry from the homepage!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(quotations || [])
                      .filter(q => q.customerPhone === customerSession.phone && q.tenantId === tenant.id)
                      .map(q => (
                        <div key={q.id} className="p-6 rounded-2xl border transition-all space-y-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                          <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                            <div>
                              <span className="font-mono text-sm font-black text-white">{q.id}</span>
                              <span className="text-[10px] text-slate-500 ml-3">Valid: {q.validDays} days</span>
                            </div>
                            <span className="badge text-[9px] uppercase font-bold" style={{
                              color: q.status === 'accepted' ? '#22c55e' : q.status === 'rejected' ? '#ef4444' : '#38bdf8',
                              background: q.status === 'accepted' ? '#22c55e15' : q.status === 'rejected' ? '#ef444415' : '#38bdf815'
                            }}>{q.status}</span>
                          </div>

                          <div className="space-y-2 text-xs">
                            <p className="font-bold text-white">Line Items Breakdown:</p>
                            <div className="space-y-1.5 pl-2 border-l border-slate-800">
                              {q.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-slate-400">
                                  <span>{item.description} (x{item.quantity})</span>
                                  <span>₹{item.amount.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between border-t border-slate-850 pt-2 font-bold text-white">
                              <span>Grand Total (incl. GST):</span>
                              <span style={{ color: pc }}>₹{q.total.toLocaleString()}</span>
                            </div>
                          </div>

                          {q.status === 'sent' && (
                            <div className="flex gap-2 pt-2 border-t border-slate-850/60">
                              <button
                                onClick={() => {
                                  setQuotations(prev => prev.map(item => item.id === q.id ? { ...item, status: 'accepted' } : item));
                                  showToast('Quotation accepted! Our engineering dispatch controllers will schedule execution slots.', 'success');
                                }}
                                className="flex-1 py-2 rounded-lg text-xs font-bold text-center text-white"
                                style={{ background: pc }}
                              >
                                ✓ Accept Estimate
                              </button>
                              <button
                                onClick={() => {
                                  setQuotations(prev => prev.map(item => item.id === q.id ? { ...item, status: 'rejected' } : item));
                                  showToast('Quotation rejected.');
                                }}
                                className="px-4 py-2 rounded-lg text-xs font-bold border border-slate-800 text-slate-450 hover:bg-slate-900"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
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
          setDetailService={setDetailService}
        />
      )}



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

                  {/* Render Custom Service Specific FormFields (e.g. B2B breaker rating / B2C bathroom parameters) */}
                  {bookingService.formFields && bookingService.formFields.length > 0 && (
                    <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 space-y-3">
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider">🔧 Service Specifications Details</p>
                      {bookingService.formFields.map(f => (
                        <div key={f.key}>
                          <label className="form-label">{f.label} {f.required ? '*' : ''}</label>
                          {f.type === 'select' ? (
                            <select
                              className="form-input"
                              required={f.required}
                              onChange={e => {
                                setFormData(d => ({ ...d, notes: `${d.notes}\n- ${f.label}: ${e.target.value}` }));
                              }}
                            >
                              <option value="">Choose Option</option>
                              {f.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          ) : f.type === 'textarea' ? (
                            <textarea
                              className="form-input resize-none"
                              rows={2}
                              required={f.required}
                              placeholder={f.label}
                              onChange={e => {
                                setFormData(d => ({ ...d, notes: `${d.notes}\n- ${f.label}: ${e.target.value}` }));
                              }}
                            />
                          ) : (
                            <input
                              className="form-input"
                              type={f.type === 'number' ? 'number' : 'text'}
                              required={f.required}
                              placeholder={f.label}
                              onChange={e => {
                                setFormData(d => ({ ...d, notes: `${d.notes}\n- ${f.label}: ${e.target.value}` }));
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

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

      {/* ===== SERVICE DETAILS MODAL (B2B SPECIFIC & GENERAL) ===== */}
      {detailService && (
        <div className="modal-overlay z-50 animate-fadeIn" onClick={() => setDetailService(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden border border-slate-800 text-slate-200 animate-scaleIn font-sans text-left flex flex-col max-h-[85vh]">
            
            {/* Banner/Header */}
            <div className="relative h-44 bg-slate-950 flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10" />
              <div className="absolute bottom-4 left-6 z-20 flex items-center gap-3">
                <span className="text-4xl">{detailService.icon || '🛠️'}</span>
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{detailService.category}</span>
                  <h3 className="text-lg font-black text-white mt-1">{detailService.name}</h3>
                </div>
              </div>
              <button 
                onClick={() => setDetailService(null)} 
                className="absolute right-4 top-4 z-20 text-slate-400 hover:text-white font-bold text-xs p-1.5 rounded-lg border border-slate-800 bg-slate-950/40"
              >
                ✕ Close
              </button>
            </div>

            {/* Content Details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs leading-relaxed text-slate-400">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-black">Description & Scope:</p>
                <p className="mt-1 text-slate-300 font-sans">{detailService.description}</p>
              </div>

              {detailService.variants && detailService.variants.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-black">Equipment / Service Options:</p>
                  <div className="space-y-2 mt-2">
                    {detailService.variants.map((v: any) => (
                      <div key={v.id} className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1">
                        <div className="flex justify-between items-center">
                          <strong className="text-white font-bold">{v.name}</strong>
                          {tenant.config.enableB2bEnquiry ? (
                            <span className="text-[9px] font-bold text-blue-400">Enquiry Only</span>
                          ) : (
                            <strong style={{ color: pc }}>₹{v.price.toLocaleString()}</strong>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">{v.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Specifications */}
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-850 space-y-2">
                <p className="text-[9px] text-slate-450 font-black uppercase tracking-wider">🛠️ Commissioning Specifications</p>
                <ul className="space-y-1 list-disc list-inside text-slate-400">
                  <li>Standard 30-Day execution and warranty support active</li>
                  <li>Industrial site safety inspection required before commissioning</li>
                  <li>Compliance documents (GST, test reports) shared upon delivery</li>
                </ul>
              </div>
            </div>

            {/* Actions footer */}
            <div className="p-6 border-t border-slate-800 flex-shrink-0 bg-slate-950/40 flex gap-3">
              <button
                onClick={() => {
                  setBookingService(detailService);
                  setDetailService(null);
                  setBookingSubmitted(false);
                }}
                className="flex-1 py-3 rounded-xl font-bold text-white text-center text-xs shadow-lg hover:scale-[1.01] transition-transform"
                style={{ background: pc }}
              >
                {tenant.config.enableB2bEnquiry ? '📋 Request Project Quotation' : '📅 Book Service Now'}
              </button>
            </div>

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

      {/* ===== COMPREHENSIVE CUSTOMER AUTH MODAL (SIGN IN & SIGN UP) ===== */}
      {showCustomerLoginModal && (
        <div className="modal-overlay z-50 p-4" onClick={() => setShowCustomerLoginModal(false)}>
          <div 
            onClick={e => e.stopPropagation()} 
            className="bg-[#0f172a] rounded-3xl w-full max-w-md p-6 sm:p-7 border border-slate-700/80 text-white shadow-[0_25px_70px_rgba(0,0,0,0.8)] animate-scaleIn font-sans text-left space-y-5 relative"
            style={{ 
              backgroundColor: '#0f172a',
              boxShadow: `0 20px 60px rgba(0,0,0,0.8), 0 0 30px ${pc}20`,
              borderColor: 'rgba(255,255,255,0.12)'
            }}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md" style={{ color: '#fff', background: `linear-gradient(135deg, ${pc}, ${pc}cc)` }}>
                  Customer Portal
                </span>
                <h3 className="text-lg font-black text-white mt-1.5">
                  {authMode === 'signin' ? 'Sign In to Your Account' : 'Create Customer Account'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {authMode === 'signin' ? 'Manage bookings, download invoices & schedule appointments' : 'Register to track service requests, warranties & saved addresses'}
                </p>
              </div>
              <button 
                onClick={() => setShowCustomerLoginModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs transition-colors border border-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-[#0b1120] p-1 rounded-xl border border-slate-800">
              <button 
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${authMode === 'signin' ? 'text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                style={authMode === 'signin' ? { background: `linear-gradient(135deg, ${pc}, ${pc}dd)` } : {}}
              >
                <Lock className="w-3.5 h-3.5" /> Sign In
              </button>
              <button 
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${authMode === 'signup' ? 'text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                style={authMode === 'signup' ? { background: `linear-gradient(135deg, ${pc}, ${pc}dd)` } : {}}
              >
                <User className="w-3.5 h-3.5" /> Create Account
              </button>
            </div>

            {/* ═══ SIGN IN FORM ═══ */}
            {authMode === 'signin' ? (
              <form onSubmit={handleCustomerSignIn} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider mb-1.5">Mobile Number or Email</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210 or user@example.com"
                      className="w-full bg-[#1e293b] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      value={authIdentifier}
                      onChange={e => {
                        const val = e.target.value;
                        if (/^\d+$/.test(val)) {
                          setAuthIdentifier(val.slice(0, 10));
                        } else {
                          setAuthIdentifier(val);
                        }
                      }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider">Password</label>
                    <button 
                      type="button" 
                      onClick={() => showToast('Password reset link sent to registered phone/email.', 'info')}
                      className="text-[10px] font-bold hover:underline"
                      style={{ color: '#60a5fa' }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={authShowPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter account password"
                      className="w-full bg-[#1e293b] border border-slate-700 rounded-xl pl-9 pr-9 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      value={authPassword}
                      onChange={e => setAuthPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setAuthShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {authShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="authRememberCustomer"
                    checked={authRememberMe}
                    onChange={e => setAuthRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="authRememberCustomer" className="text-[11px] text-slate-300 cursor-pointer select-none">
                    Remember me on this browser
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl font-black text-white text-center text-xs shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${pc}, ${pc}dd)`, boxShadow: `0 8px 24px ${pc}40` }}
                >
                  {authLoading ? 'Signing In...' : 'Sign In to Account ➔'}
                </button>

                {/* Fast 1-Click Demo Login */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      const sessionData = {
                        phone: '9876543210',
                        name: 'Ravi Kumar',
                        email: 'ravi@example.com',
                        address: '12-3-456, MG Road, Nellore'
                      };
                      setCustomerSession(sessionData);
                      localStorage.setItem(`anarav_customer_session_${tenant.id}`, JSON.stringify(sessionData));
                      setShowCustomerLoginModal(false);
                      setViewMode('dashboard');
                      setCustomerActiveTab('bookings');
                    }}
                    className="w-full py-2.5 px-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    ⚡ 1-Click Demo Customer Login (Ravi Kumar)
                  </button>

                  <p className="text-[11px] text-slate-400 text-center">
                    New customer? <button type="button" onClick={() => setAuthMode('signup')} className="font-bold hover:underline" style={{ color: '#60a5fa' }}>Create an account</button>
                  </p>
                </div>
              </form>
            ) : (
              /* ═══ SIGN UP FORM ═══ */
              <form onSubmit={handleCustomerSignUp} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider mb-1">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Pradeep Kumar"
                      className="w-full bg-[#1e293b] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      value={authFullName}
                      onChange={e => setAuthFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider mb-1">Mobile Phone</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <Phone className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="tel"
                        placeholder="9876543210"
                        maxLength={10}
                        className="w-full bg-[#1e293b] border border-slate-700 rounded-xl pl-8 pr-2.5 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                        value={authPhone}
                        onChange={e => setAuthPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider mb-1">Email (Optional)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <Mail className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="email"
                        placeholder="user@example.com"
                        className="w-full bg-[#1e293b] border border-slate-700 rounded-xl pl-8 pr-2.5 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                        value={authEmail}
                        onChange={e => setAuthEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider mb-1">Create Password</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={authShowPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="At least 4 characters"
                      className="w-full bg-[#1e293b] border border-slate-700 rounded-xl pl-9 pr-9 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      value={authPassword}
                      onChange={e => setAuthPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setAuthShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {authShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider mb-1">Service Address / House / Flat No.</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Flat 402, Green Meadows, MG Road"
                      className="w-full bg-[#1e293b] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      value={authAddress}
                      onChange={e => setAuthAddress(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Addresses & credentials encrypted with end-to-end privacy</span>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl font-black text-white text-center text-xs shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
                  style={{ background: `linear-gradient(135deg, ${pc}, ${pc}dd)`, boxShadow: `0 8px 24px ${pc}40` }}
                >
                  {authLoading ? 'Creating Account...' : 'Create Account & Continue ➔'}
                </button>

                <p className="text-[11px] text-slate-400 text-center pt-1">
                  Already have an account? <button type="button" onClick={() => setAuthMode('signin')} className="font-bold hover:underline" style={{ color: '#60a5fa' }}>Sign in</button>
                </p>
              </form>
            )}
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

      {/* ═══════════ CUSTOMIZABLE DYNAMIC FOOTER ═══════════ */}
      {viewMode === 'website' && (
        <footer 
          className="border-t pt-12 pb-20 md:pb-12 font-sans transition-colors"
          style={{ 
            backgroundColor: localDark ? '#060b14' : '#0f172a', 
            borderColor: localDark ? '#1e293b' : '#1e293b',
            color: '#94a3b8'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10">
              
              {/* Brand Column */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  {c.logoImage ? (
                    <img 
                      src={c.logoImage} 
                      alt={c.logoText || tenant.name} 
                      className="h-8 w-auto max-w-[120px] rounded-md object-contain" 
                    />
                  ) : (
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white" 
                      style={{ background: pc }}
                    >
                      {(c.logoText || tenant.name).charAt(0)}
                    </div>
                  )}
                  <span className="font-black text-sm text-white">{c.logoText || tenant.name}</span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs">
                  {(c as any).footerAbout || `Your trusted home services partner in ${c.city || 'your city'}.`}
                </p>

                {/* Social Links — matching preview icon badges */}
                <div className="flex items-center gap-1.5 pt-1">
                  {Object.entries((c as any).footerSocials || { 'Facebook': 'f', 'Instagram': 'ig', 'YouTube': 'yt', 'WhatsApp': '💬' }).map(([name, url]) => (
                    <a
                      key={name}
                      href={String(url).startsWith('http') || String(url).startsWith('https') ? String(url) : (name === 'WhatsApp' && c.whatsAppNumber ? `https://wa.me/${c.whatsAppNumber}` : '#')}
                      target="_blank"
                      rel="noreferrer"
                      className="w-7 h-7 rounded-lg border border-slate-750 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-[10px] font-black transition-colors"
                      title={name}
                    >
                      {name === 'Facebook' ? 'f' : name === 'Instagram' ? 'ig' : name === 'YouTube' ? 'yt' : name === 'WhatsApp' ? '💬' : '🔗'}
                    </a>
                  ))}
                </div>
              </div>

              {/* Dynamic Footer Columns (Quick Links, Popular Services, Company) */}
              {(((c as any).footerColumns) || [
                { id: 'fcol-1', title: 'Quick Links', items: ['Home', 'Services', 'Offers', 'About Us', 'Contact'] },
                { id: 'fcol-2', title: 'Popular Services', items: ['Cleaning', 'Electrical', 'Plumbing', 'Painting', 'Pest Control'] },
                { id: 'fcol-3', title: 'Company', items: ['About Us', 'Our Team', 'Reviews', 'Blog', 'Careers'] },
              ]).map((col: any) => (
                <div key={col.id || col.title} className="space-y-2.5">
                  <p className="font-black text-xs text-white">{col.title}</p>
                  <ul className="space-y-1.5 text-[11px]">
                    {col.items.map((item: string, idx: number) => (
                      <li key={idx}>
                        <button
                          onClick={() => {
                            const lower = item.toLowerCase();
                            let targetSlug = 'services';
                            if (lower.includes('home')) targetSlug = 'home';
                            else if (lower.includes('offer')) targetSlug = 'offers';
                            else if (lower.includes('team')) targetSlug = 'team';
                            else if (lower.includes('review')) targetSlug = 'reviews';
                            else if (lower.includes('gallery')) targetSlug = 'gallery';
                            else if (lower.includes('faq')) targetSlug = 'faqs';
                            else if (lower.includes('contact') || lower.includes('about')) targetSlug = 'coverage';
                            
                            setActivePageSlug(targetSlug);
                            setViewMode('website');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-slate-400 hover:text-white hover:underline transition-colors text-left"
                        >
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Contact Us Column — matching preview exactly */}
              <div className="space-y-2.5">
                <p className="font-black text-xs text-white">Contact Us</p>
                <div className="space-y-1.5 text-[11px] text-slate-400">
                  <p>📍 {c.city || 'Nellore, AP'}</p>
                  {c.phone && <p>📞 <a href={`tel:${c.phone}`} className="hover:text-white transition-colors">{c.phone}</a></p>}
                  <p>✉️ {c.email || `hello@${tenant.subdomain || 'vip'}.in`}</p>
                  <p>⏰ {c.businessHours || '08:00 AM – 08:00 PM'}</p>
                </div>
              </div>
            </div>

            {/* Bottom Copyright & Powered by — matching preview */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
              <p>
                {(c as any).footerCopyright || `© ${new Date().getFullYear()} ${c.logoText || tenant.name} Services. All rights reserved.`}
              </p>

              {((c as any).showPoweredBy !== false) && (
                <div className="flex items-center gap-1">
                  <span>Powered by</span>
                  <span className="font-bold text-slate-300" style={{ color: pc }}>Anarav Business OS</span>
                </div>
              )}
            </div>
          </div>
        </footer>
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
