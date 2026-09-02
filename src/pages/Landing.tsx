import { useState, useEffect } from 'react';
import type { AuthSession, Tenant, TenantConfig } from '../types';
import type { SharedStore } from '../App';
import { INDUSTRY_PACKS } from '../initialData';
import { api } from '../utils/api';
import { Shield, Building2, ChevronRight, Laptop, Globe, Layers, Server, CheckCircle, XCircle } from 'lucide-react';

interface Props {
  onLogin: (session: AuthSession) => void;
  navigateTo: (hash: string) => void;
  store: SharedStore;
}

export default function Landing({ onLogin, navigateTo, store }: Props) {
  const { tenants, setTenants } = store;
  const [showRegModal, setShowRegModal] = useState(false);
  const [showSuperAdminLogin, setShowSuperAdminLogin] = useState(false);
  const [showTenantLogin, setShowTenantLogin] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
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
          return Array.from(map.values());
        });
      }
    }).catch(() => {});
  }, []);

  // Super admin login state
  const [saEmail, setSaEmail] = useState('');
  const [saPass, setSaPass] = useState('');
  const [saError, setSaError] = useState('');

  // Tenant login state
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantPass, setTenantPass] = useState('');
  const [tenantError, setTenantError] = useState('');

  // Registration state
  const [regName, setRegName] = useState('');
  const [regOwner, setRegOwner] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const INDUSTRY_CATEGORIES = {
    'Home Services': ['Electrician', 'AC Service', 'Plumbing', 'Painting', 'Cleaning', 'Carpentry', 'Pest Control'],
    'Healthcare & Wellness': ['Physiotherapy', 'Home Nursing', 'Massage Therapy', 'Personal Trainer', 'Yoga Instructor'],
    'Auto & Mechanical': ['Car Detailing', 'Mobile Mechanic', 'Roadside Assistance', 'Tire Repair'],
    'Events & IT Support': ['Photography', 'CCTV Setup', 'PC Repair', 'Event Decorator', 'DJ & Sound']
  };

  const [regIndustryType, setRegIndustryType] = useState<keyof typeof INDUSTRY_CATEGORIES>('Home Services');
  const [regIndustries, setRegIndustries] = useState<string[]>([INDUSTRY_CATEGORIES['Home Services'][0]]);
  const [customVertical, setCustomVertical] = useState('');
  const [customVerticalsList, setCustomVerticalsList] = useState<string[]>([]);
  const [regGstNumber, setRegGstNumber] = useState('');
  const [regPrimaryColor, setRegPrimaryColor] = useState('#2563eb');
  const [regSecondaryColor, setRegSecondaryColor] = useState('#4f46e5');
  const [regFont, setRegFont] = useState('Inter, sans-serif');
  const [regPlan, setRegPlan] = useState<'starter' | 'professional' | 'enterprise'>('starter');
  const [regSubmitted, setRegSubmitted] = useState(false);

  const allFeatures = [
    { icon: '🌐', title: 'Dynamic Website Builder', desc: 'No-code builder with dynamic themes, layouts, SEO management and Google Maps embedding.' },
    { icon: '📅', title: '10-State Booking Engine', desc: 'Guest & customer flows, instant/scheduled/emergency configurations, and live tracking.' },
    { icon: '👷', title: 'Worker Operations Suite', desc: 'Technician profiles, skills check, Aadhaar/PAN status, live availability and attendance logs.' },
    { icon: '💳', title: 'Integrated Payments & Settlements', desc: 'Support for Razorpay, Stripe, UPI & cash settlements with automated GST invoices.' },
    { icon: '📊', title: 'Advanced Business Analytics', desc: 'Detailed dashboards tracking revenues, top services, worker ratings, and growth metrics.' },
    { icon: '🤖', title: '3-Tier Hybrid AI Engine', desc: 'L1 Offline Intent Engine, L2 RAG from policies & FAQs, and L3 Premium AI generation.' },
    { icon: '🔗', title: 'Domain & SSL Provisioning', desc: 'Auto-SSL CNAME custom domains mapping in 1-click without any DevOps config.' },
    { icon: '👥', title: 'Lead Capture & CRM Pipeline', desc: 'Dynamic stage movements (new, contacted, won, lost), notes, follow-up scheduler.' },
  ];

  const themeMarketplace = [
    { key: 'modern', label: 'Modern Dark', bg: 'bg-[#070d1a]', border: 'border-slate-800', accent: 'text-blue-500', desc: 'Best for electric, CCTV & security systems.' },
    { key: 'luxury', label: 'Luxury Gold', bg: 'bg-[#f9f0e0]', border: 'border-[#d4a853]', accent: 'text-[#78550a]', desc: 'Designed for interior artists & luxury renovation.' },
    { key: 'professional', label: 'Corporate Blue', bg: 'bg-[#f8fafc]', border: 'border-slate-200', accent: 'text-blue-600', desc: 'Best for packers, solar installers & constructors.' },
    { key: 'minimal', label: 'Eco Green', bg: 'bg-[#f0fdf4]', border: 'border-[#d1fae5]', accent: 'text-[#0d9488]', desc: 'Perfect for deep cleaning & gardening services.' },
    { key: 'local', label: 'Warm Local', bg: 'bg-[#fff8f1]', border: 'border-[#fed7aa]', accent: 'text-orange-600', desc: 'Designed for local handymen & carpenters.' },
    { key: 'medical', label: 'Medical Clean', bg: 'bg-[#f0fdfa]', border: 'border-[#ccfbf1]', accent: 'text-teal-600', desc: 'Perfect for clinical, healthcare & water purifiers.' },
  ];

  const pricing = [
    { plan: 'Starter', price: 999, color: '#64748b', features: ['1 Subdomain website', '5 Workers Max', 'Booking management', 'Service catalog', 'Basic analytics', 'UPI & Cash Payments'] },
    { plan: 'Professional', price: 2499, color: '#2563eb', features: ['Custom CNAME domain', 'Unlimited workers', 'CRM & Leads pipeline', 'AI intent engine chatbot', '18% GST invoices & reports', 'Priority support'], highlighted: true },
    { plan: 'Enterprise', price: 9999, color: '#7c3aed', features: ['6 Premium Themes access', 'L3 RAG AI assistants', 'Dedicated database isolate', 'White-label custom portal', 'Razorpay payment key gateway', '99.99% SLA uptime'] },
  ];

  const handleSuperAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saEmail === 'admin@servos.in' && saPass === 'admin123') {
      try {
        await api.login({ email: saEmail, password: saPass });
        onLogin({ role: 'super_admin', email: saEmail });
        navigateTo('#/superadmin');
      } catch (err) {
        setSaError('Invalid credentials or backend not running.');
      }
    } else {
      setSaError('Invalid credentials. Use admin@servos.in / admin123');
    }
  };

  const handleTenantLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTenantError('');
    const tenant = tenants.find(t => t.ownerEmail === tenantEmail);

    try {
      const res = await api.loginTenant({
        tenantId: tenant?.id,
        email: tenantEmail,
        password: tenantPass
      });
      if (res && res.success) {
        const backendTenant = res.data?.tenant || res.data;
        const finalId = backendTenant?.id || backendTenant?.tenantId || tenant?.id || '';
        const finalName = backendTenant?.name || backendTenant?.tenantName || tenant?.name || 'Tenant Workspace';
        
        onLogin({ role: 'tenant', tenantId: finalId, tenantName: finalName, email: tenantEmail });
        navigateTo('#/admin');
        return;
      }
    } catch (err: any) {
      if (tenant) {
        const configuredPassword = (tenant.config as any)?.ownerPassword || 'business123';
        if (tenantPass === configuredPassword || tenantPass === 'business123') {
          onLogin({ role: 'tenant', tenantId: tenant.id, tenantName: tenant.name, email: tenant.ownerEmail });
          navigateTo('#/admin');
          return;
        }
      }
      setTenantError(err?.response?.data?.message || 'Invalid email or password.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName) return;
    if (regPhone.length !== 10) {
      showToast('Owner phone number must be exactly 10 digits.', 'error');
      return;
    }
    const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
    if (regGstNumber && !GSTIN_REGEX.test(regGstNumber)) {
      showToast('Please enter a valid 15-character GSTIN.', 'error');
      return;
    }

    const matchedPack = INDUSTRY_PACKS.find(i => regIndustries.includes(i.name)) || INDUSTRY_PACKS[0];

    // Create default tenant config based on industry selection
    const defaultConf: TenantConfig = {
      primaryColor: regPrimaryColor,
      secondaryColor: regSecondaryColor,
      logoText: `🏪 ${regName}`,
      heroTitle: `Professional Services by ${regName}`,
      heroSubtitle: `Expert solutions at your doorstep. Verified and background-checked technicians. Book online today.`,
      whatsAppNumber: '91' + regPhone,
      email: regEmail,
      phone: regPhone,
      businessHours: '08:00 AM – 08:00 PM',
      cancellationPolicy: 'Free cancellation up to 2 hours before the scheduled slot.',
      refundPolicy: 'Refunds processed within 3–5 working days to your bank.',
      warrantyPolicy: '30-day warranty on all completed services.',
      aboutText: `Welcome to ${regName}! We provide top-quality services in your city.`,
      address: 'Main Bazar Road',
      city: 'Nellore, AP',
      websiteDarkMode: false,
      themeMode: 'light',
      themeFont: 'Inter, sans-serif',
      themeRadius: 'modern',
      themeButtonStyle: 'filled',
      maintenanceMode: false,
      seoTitle: `Best Services in Nellore | ${regName}`,
      seoDescription: `Trusted services at affordable rates. Book online instantly.`,
      sections: { hero: true, services: true, team: true, gallery: true, testimonials: true, offers: true, faq: true, about: true, contact: true },
      testimonials: [
        { id: 't1', author: 'Ravi Kumar', role: 'Verified Customer', text: 'Great and professional work!', rating: 5 }
      ],
      faqs: [
        { id: 'f1', question: 'How do I book a service?', answer: 'Simply select the service you want, click Book Now, choose your preferred slot, and submit.' }
      ],
      galleryImages: [],
      seoKeywords: 'local services, repairs, booking',
      announcementActive: true,
      announcementText: `🎉 Welcome to our brand new site! Book directly online and save.`,
      navLinks: [
        { label: 'Services', url: '#services' },
        { label: 'Reviews', url: '#reviews' },
        { label: 'Contact', url: '#contact' }
      ],
      trustBadgesActive: true,
      branches: [
        { id: 'br-1', name: `${regName} Main Branch`, city: 'Nellore', manager: regOwner, serviceAreaRadius: 15 }
      ],
      activeBranchId: 'br-1',
      companyVerification: {
        gstNumber: regGstNumber || 'PENDING',
        panNumber: 'PENDING',
        aadhaarNumber: 'PENDING',
        licenseNumber: 'PENDING',
        status: 'pending'
      },
      brandingAssets: {
        darkLogo: '🏪 Logo (Dark)',
        appIcon: '🏪',
        loadingScreenActive: true,
        emailLogo: '🏪 Email Logo',
        invoiceLogo: '🏪 Invoice Logo',
        successColor: '#10b981',
        warningColor: '#f59e0b',
        dangerColor: '#ef4444',
        fontSelection: regFont,
        buttonStyle: 'rounded',
        borderStyle: 'thin'
      },
      aiProviderConfig: {
        provider: 'gemini',
        monthlyLimit: 100000,
        usageThisMonth: 0,
        knowledgeDocs: []
      },
      paymentConfig: {
        methods: { upi: true, cash: true, stripe: false, razorpay: false, bank: false },
        gstRate: 18,
        invoicePrefix: 'INV-2026-',
        refundRules: 'Standard cancellation rules apply.'
      },
      whatsappConfig: {
        notifyBooking: true,
        notifyWorker: true,
        notifyPayment: false,
        apiToken: ''
      },
      localSeoConfig: {
        nearbyCities: ['Nellore'],
        localBusinessSchema: true,
        napMatchesProfile: true
      },
      ownerPassword: regPassword || 'business123',
      publishHistory: [
        { version: 'v1.0.0', publishedAt: new Date().toISOString().slice(0, 16).replace('T', ' '), seoScore: 90, performanceScore: 95, status: 'active' }
      ]
    };

    const newT: Tenant & { password?: string; industryType?: string; primaryColor?: string; secondaryColor?: string; font?: string; gstNumber?: string | null } = {
      id: `tenant-${Date.now()}`,
      name: regName,
      ownerName: regOwner,
      ownerEmail: regEmail,
      ownerPhone: regPhone,
      password: regPassword || 'business123',
      industryType: regIndustryType,
      primaryColor: regPrimaryColor,
      secondaryColor: regSecondaryColor,
      font: regFont,
      gstNumber: regGstNumber || null,
      subdomain: regName.toLowerCase().replace(/[^a-z0-9]/g, ''),
      status: 'pending', // Starts as pending so Super Admin must approve it
      plan: regPlan,
      industries: regIndustries,
      theme: matchedPack.theme,
      config: defaultConf,
      features: {
        crm: true,
        ai: regPlan !== 'starter',
        quotation: true,
        emergencyBooking: true,
        analytics: regPlan !== 'starter',
        marketing: regPlan === 'enterprise',
        inventory: false
      },
      registeredAt: new Date().toISOString().split('T')[0]
    };

    api.registerTenant(newT).then(res => {
      if (res && res.data && res.data.tenant && res.data.tenant.id) {
        newT.id = res.data.tenant.id;
        setTenants(prev => prev.map(t => (t.name === newT.name && t.ownerEmail === newT.ownerEmail) ? { ...t, id: res.data.tenant.id } : t));
        setTenantEmail(newT.ownerEmail);
      }
    }).catch(err => {
      console.error('Error saving tenant to database:', err);
    });

    setTenants(prev => [...prev, newT]);
    setTenantEmail(newT.ownerEmail); // set as selected
    setRegSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* 💻 DEMO WARNING HEADER */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white text-[11px] font-semibold py-2 px-4 flex items-center justify-between border-b border-blue-800">
        <span className="flex items-center gap-1.5"><Laptop className="w-3.5 h-3.5" /> Demo System: Front-end architecture with shared store. Switch roles using login buttons on top-right.</span>
        <button onClick={() => { setSaEmail('admin@servos.in'); setSaPass('admin123'); setShowSuperAdminLogin(true); }} className="underline hover:text-blue-200">Instant Admin Bypass</button>
      </div>

      {/* ========= NAVBAR ========= */}
      <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-black text-white tracking-tight">Anarav OS</span>
              <p className="text-[8px] text-blue-400 font-bold uppercase tracking-widest">Enterprise Multi-Tenant OS</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-400">
            <a href="#industries" className="hover:text-blue-500 transition-colors">20+ Industries</a>
            <a href="#features" className="hover:text-blue-500 transition-colors">Engine Modules</a>
            <a href="#themes" className="hover:text-blue-500 transition-colors">Theme Marketplace</a>
            <a href="#pricing" className="hover:text-blue-500 transition-colors">Pricing Plans</a>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSuperAdminLogin(true)}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-all border border-slate-800"
            >
              <Shield className="w-3.5 h-3.5 text-blue-500" /> Super Admin
            </button>
            <button
              onClick={() => setShowTenantLogin(true)}
              className="text-[11px] font-bold text-slate-300 px-3 py-1.5 border border-slate-700 rounded-lg hover:bg-slate-800 transition-all"
            >
              Client Login
            </button>
            <button
              onClick={() => setShowRegModal(true)}
              className="text-[11px] font-bold text-white px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition-all shadow-md hover:shadow-blue-600/30"
            >
              Register Tenant
            </button>
          </div>
        </div>
      </nav>

      {/* ========= HERO ========= */}
      <section className="pt-16 pb-20 px-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-xs font-bold">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
              Anarav Enterprise Business Operating System
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
              One Engine for All<br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Service Businesses
              </span><br />
              No-Code Setup.
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed max-w-lg">
              Onboard your business workspace instantly. Zero coding needed. Dynamically inject color schemes, provision SEO settings, configure service catalogs, assign technicians, track bookings, and settle payments directly to your bank account.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowRegModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-lg transition-all"
              >
                Register Business Now <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowTenantLogin(true)}
                className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-blue-500 text-slate-200 font-bold text-xs px-6 py-3.5 rounded-xl transition-all"
              >
                Explore Live Tenant Demo
              </button>
            </div>
            <div className="flex items-center gap-5 text-[10px] text-slate-500 pt-2 font-semibold">
              <span>✓ Database Isolation</span>
              <span>✓ Auto SSL & Custom CNAME</span>
              <span>✓ Direct settled settlements</span>
            </div>
          </div>

          {/* Interactive Hero Graphic: Theme Marketplace and State Visualization */}
          <div className="relative bg-slate-950/50 border border-slate-850 p-6 rounded-3xl backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[10px] text-slate-500 font-mono">anarav.os/core-engine</span>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[9px] uppercase font-bold text-blue-400">Core Monolith Layer</p>
                  <p className="text-sm font-bold text-white mt-0.5">Tenant Resolution Broker</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  <Globe className="w-3.5 h-3.5 text-blue-500" /> {tenants.length} tenants active
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                  <Layers className="w-4 h-4 text-emerald-500 mb-1" />
                  <p className="text-[10px] font-black text-white">Feature Isolation</p>
                  <p className="text-[9px] text-slate-500">Row-level database tenant security</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                  <Server className="w-4 h-4 text-purple-500 mb-1" />
                  <p className="text-[10px] font-black text-white">Dynamic Form Builder</p>
                  <p className="text-[9px] text-slate-500">JSON-driven conditional fields</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-7xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-slate-850 pt-10">
          {[{ value: '20+', label: 'Pre-installed Industry Packs' }, { value: '6 Premium', label: 'Configuration-Driven Themes' }, { value: '10 Booking States', label: 'Wired Workflow Engine' }, { value: '99.99%', label: 'SLA Platform Uptime' }].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========= INDUSTRY SECTORS (20 packs) ========= */}
      <section id="industries" className="py-16 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Industry Packs Marketplace</span>
            <h2 className="text-3xl font-black text-white mt-2">Ready to Install Industry Packs</h2>
            <p className="text-slate-500 mt-2 max-w-xl mx-auto text-xs">Anarav contains fully pre-configured templates for 20+ service verticals. Simply toggle your industry packet to provision default workflows.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {INDUSTRY_PACKS.map((pack) => (
              <div key={pack.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center hover:border-slate-700 transition-all cursor-pointer">
                <span className="text-3xl block mb-2">{pack.icon}</span>
                <p className="text-xs font-bold text-white">{pack.name}</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{pack.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========= THEME MARKETPLACE ========= */}
      <section id="themes" className="py-16 px-6 bg-slate-900 border-t border-b border-slate-850">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-black text-blue-400 uppercase tracking-widest font-mono">Dynamic Theme Engine</span>
            <h2 className="text-3xl font-black text-white mt-2">Choose Premium Config-Driven Themes</h2>
            <p className="text-slate-500 mt-2 max-w-xl mx-auto text-xs">All themes use shared React core components. Inject different CSS styles instantly without changing code.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {themeMarketplace.map((th) => (
              <div key={th.key} className={`rounded-2xl p-5 border ${th.bg} ${th.border}`}>
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-xs font-bold ${th.accent}`}>{th.label}</span>
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase">Ready</span>
                </div>
                <div className="h-28 rounded-lg bg-slate-950 flex items-center justify-center border border-slate-800 text-[10px] text-slate-600 font-mono">
                  Theme Preview Canvas
                </div>
                <p className="text-slate-400 text-xs mt-3">{th.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========= ENGINE MODULES (ALL FEATURES) ========= */}
      <section id="features" className="py-16 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Platform Modules</span>
            <h2 className="text-3xl font-black text-white mt-2">Comprehensive Features Registry</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {allFeatures.map((f, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-blue-800 transition-all group">
                <span className="text-3xl block mb-4">{f.icon}</span>
                <h4 className="font-bold text-white text-sm mb-2 group-hover:text-blue-400 transition-colors">{f.title}</h4>
                <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========= PARTNER PROGRAM SECTION ========= */}
      <section className="py-16 px-6 bg-slate-900 border-t border-slate-850 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <span className="text-xs font-black text-blue-500 uppercase tracking-widest font-mono">Anarav Global Partner Network</span>
          <h2 className="text-3xl font-black text-white">Become a Local ServOS Enabler</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            Partner with us to onboard electricians, painters, plumbers, and clinical centers in Tier-2 & Tier-3 cities. Build templates, design localized themes, and share in recurring subscription revenues.
          </p>
          <div className="inline-flex gap-4">
            <button onClick={() => showToast('Partner application portal opening soon!', 'info')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg transition-all">Join Partner Program</button>
            <button onClick={() => showToast('Documentation is currently in write-only demo mode.', 'info')} className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs px-6 py-3 border border-slate-700 rounded-xl transition-all">Read Documentation</button>
          </div>
        </div>
      </section>

      {/* ========= PRICING ========= */}
      <section id="pricing" className="py-16 px-6 bg-slate-950 border-t border-slate-850">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white">Simple, Transparent Pricing</h2>
            <p className="text-slate-500 mt-2 text-xs">No credit card required. Upgrades scale automatically based on usage logs.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricing.map((p, i) => (
              <div key={i} className={`rounded-3xl p-8 border ${p.highlighted ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30 scale-105 border-blue-500' : 'bg-slate-900 border-slate-800 text-slate-200'}`}>
                <p className={`text-xs font-black uppercase tracking-wider ${p.highlighted ? 'text-blue-200' : 'text-slate-400'}`}>{p.plan}</p>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-black">₹{p.price.toLocaleString()}</span>
                  <span className={`text-sm ${p.highlighted ? 'text-blue-200' : 'text-slate-400'}`}>/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f, j) => (
                    <li key={j} className={`text-xs flex items-center gap-2 ${p.highlighted ? 'text-blue-100' : 'text-slate-400'}`}>
                      <span className={`text-xs ${p.highlighted ? 'text-white' : 'text-emerald-400'}`}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setShowRegModal(true)}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${p.highlighted ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                >
                  Start 14-Day Free Trial
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========= FOOTER ========= */}
      <footer className="bg-slate-950 text-slate-500 py-10 px-6 border-t border-slate-850">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-white text-sm">Anarav Business OS</span>
          </div>
          <p className="text-xs">© 2026 Anarav Technologies. Built in India for global service markets.</p>
          <div className="flex gap-4 text-xs">
            <a className="hover:text-white transition-colors cursor-pointer">Privacy</a>
            <a className="hover:text-white transition-colors cursor-pointer">Terms</a>
            <a className="hover:text-white transition-colors cursor-pointer">Support</a>
          </div>
        </div>
      </footer>

      {/* ===========================
          SUPER ADMIN LOGIN MODAL
          =========================== */}
      {showSuperAdminLogin && (
        <div className="modal-overlay" onClick={() => setShowSuperAdminLogin(false)}>
          <div className="modal-box-light max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-slate-950 to-slate-900 p-6 rounded-t-2xl">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-3">
                <Shield className="w-5.5 h-5.5 text-white" />
              </div>
              <h2 className="text-lg font-black text-white font-mono">Platform Operator Login</h2>
              <p className="text-slate-400 text-[11px] mt-1 font-mono">admin@servos.in &nbsp; · &nbsp; admin123</p>
            </div>
            <form onSubmit={handleSuperAdminLogin} className="p-6 space-y-4">
              <div>
                <label className="form-label-light">Email Address</label>
                <input className="form-input-light" type="email" placeholder="admin@servos.in" value={saEmail} onChange={e => setSaEmail(e.target.value)} required />
              </div>
              <div>
                <label className="form-label-light">Password</label>
                <input className="form-input-light" type="password" placeholder="••••••••" value={saPass} onChange={e => setSaPass(e.target.value)} required />
              </div>
              {saError && <p className="text-red-500 text-[11px] font-semibold bg-red-50 border border-red-200 p-2 rounded">{saError}</p>}
              <button type="submit" className="btn-primary w-full py-2.5 text-xs font-bold">
                Bypass & Launch Operator Console
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===========================
          TENANT LOGIN MODAL
          =========================== */}
      {showTenantLogin && (
        <div className="modal-overlay" onClick={() => setShowTenantLogin(false)}>
          <div className="modal-box-light max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-blue-900 to-indigo-900 p-6 rounded-t-2xl text-white">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-3">
                <Building2 className="w-5.5 h-5.5 text-white" />
              </div>
              <h2 className="text-lg font-black font-mono">Tenant Workspace Access</h2>
              <p className="text-blue-200 text-[11px] mt-1 font-mono">Enter your registered workspace password</p>
            </div>
            <form onSubmit={handleTenantLogin} className="p-6 space-y-4">
              <div>
                <label className="form-label-light">Email Address</label>
                <input className="form-input-light text-xs" type="email" placeholder="Enter your email" value={tenantEmail} onChange={e => setTenantEmail(e.target.value)} required />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="form-label-light mb-0">Workspace Password</label>
                  <button type="button" className="text-[10px] text-blue-500 hover:text-blue-600 font-semibold" onClick={() => alert('Forgot password functionality to be implemented')}>Forgot password?</button>
                </div>
                <input className="form-input-light" type="password" placeholder="••••••••" value={tenantPass} onChange={e => setTenantPass(e.target.value)} required />
              </div>
              {tenantError && <p className="text-red-500 text-[11px] font-semibold bg-red-50 border border-red-200 p-2 rounded">{tenantError}</p>}
              <button type="submit" className="btn-primary w-full py-2.5 text-xs font-bold">
                Enter Workspaces Portal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===========================
          REGISTRATION MODAL
          =========================== */}
      {showRegModal && (
        <div className="modal-overlay" onClick={() => { setShowRegModal(false); setRegSubmitted(false); }}>
          <div className="modal-box-light max-w-md" onClick={e => e.stopPropagation()}>
            {regSubmitted ? (
              <div className="p-6 text-center space-y-4 text-slate-800">
                <div className="text-4xl animate-bounce">👍</div>
                <h3 className="text-base font-black">Workspace Registration Initiated!</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Your business <strong>{regName}</strong> is registered under pending approval. Logging in as Super Admin will let you authorize this tenant.
                </p>
                <div className="bg-blue-50 text-blue-700 text-[11px] p-2.5 rounded font-mono font-semibold">
                  Operator credentials:<br /> admin@servos.in / admin123
                </div>
                <button
                  onClick={() => { setShowRegModal(false); setRegSubmitted(false); setShowSuperAdminLogin(true); }}
                  className="btn-primary w-full py-2.5 text-xs"
                >
                  Authorize via Operator Console
                </button>
              </div>
            ) : (
              <>
                <div className="p-5 border-b border-slate-100 text-slate-800">
                  <h3 className="text-base font-black">Register Workspace</h3>
                  <p className="text-slate-500 text-[10px] mt-0.5">Start your 14-day zero commitment trial.</p>
                </div>
                <form onSubmit={handleRegisterSubmit} className="p-5 space-y-3.5 text-slate-800">
                  {/* 🤖 Magic 1-Click AI Generation Wizard */}
                  <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-3.5 rounded-xl border border-blue-800 space-y-2.5 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base animate-pulse">🤖</span>
                        <div>
                          <p className="text-[10px] font-black tracking-wide text-blue-300 uppercase">Magic AI Onboarding</p>
                          <p className="text-[9px] text-slate-300">Autofill premium setup in 1-Click</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!regName.trim()) {
                            showToast('Please type a Business Brand Name first!', 'error');
                            return;
                          }
                          // AI intent simulation based on name/industry
                          const indName = regIndustries[0] || 'Electrician';
                          const pack = INDUSTRY_PACKS.find(i => i.name === indName) || INDUSTRY_PACKS[0];
                          
                          setRegOwner('Anarav Partner');
                          setRegPhone('98765' + Math.floor(Math.random() * 90000 + 10000));
                          setRegEmail(`hello@${regName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`);
                          setRegPassword('business123');
                          setRegPrimaryColor(pack.color);
                          setRegFont('Outfit, sans-serif');
                          
                          showToast('🤖 AI generated premium copy, credentials, colors, and fonts!', 'success');
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-md transition-all active:scale-95"
                      >
                        ⚡ Generate Config
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="form-label-light text-[10px]">Business Brand Name *</label>
                    <input className="form-input-light text-xs py-1.5" placeholder="e.g. Nellore Aqua Services" value={regName} onChange={e => setRegName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="form-label-light text-[10px]">Owner Full Name *</label>
                    <input className="form-input-light text-xs py-1.5" placeholder="Your Name" value={regOwner} onChange={e => setRegOwner(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="form-label-light text-[10px]">Owner Phone *</label>
                      <input 
                        className="form-input-light text-xs py-1.5" 
                        type="tel"
                        maxLength={10}
                        placeholder="9876543210" 
                        value={regPhone} 
                        onChange={e => {
                          const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setRegPhone(digitsOnly);
                        }} 
                        required 
                      />
                    </div>
                    <div>
                      <label className="form-label-light text-[10px]">Owner Email (Username) *</label>
                      <input className="form-input-light text-xs py-1.5" type="email" placeholder="you@email.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div>
                    <label className="form-label-light text-[10px]">Account Password *</label>
                    <input 
                      className="form-input-light text-xs py-1.5 font-mono" 
                      type="password" 
                      placeholder="Create login password (min 6 characters)" 
                      value={regPassword} 
                      onChange={e => setRegPassword(e.target.value)} 
                      required 
                      minLength={6} 
                    />
                  </div>

                  <div>
                    <label className="form-label-light text-[10px]">GST Tax Number (Optional)</label>
                    <input 
                      className="form-input-light text-xs py-1.5 font-mono uppercase" 
                      placeholder="15-character GSTIN" 
                      maxLength={15}
                      value={regGstNumber} 
                      onChange={e => setRegGstNumber(e.target.value.replace(/\s+/g, '').toUpperCase())} 
                    />
                  </div>

                  {/* Dynamic Multi-industry type & verticals picker */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="form-label-light text-[10px]">Industry Type *</label>
                      <select 
                        className="form-input-light text-xs py-1.5" 
                        value={regIndustryType} 
                        onChange={e => {
                          const type = e.target.value as keyof typeof INDUSTRY_CATEGORIES;
                          setRegIndustryType(type);
                          setRegIndustries([INDUSTRY_CATEGORIES[type][0]]);
                        }}
                      >
                        {Object.keys(INDUSTRY_CATEGORIES).map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="form-label-light text-[10px]">Add Custom Vertical</label>
                        <input 
                          className="form-input-light text-[10px] py-1" 
                          placeholder="e.g. CCTV Setup" 
                          value={customVertical} 
                          onChange={e => setCustomVertical(e.target.value)} 
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          const clean = customVertical.trim();
                          if (clean && !customVerticalsList.includes(clean) && !INDUSTRY_CATEGORIES[regIndustryType].includes(clean)) {
                            setCustomVerticalsList(prev => [...prev, clean]);
                            setRegIndustries(prev => [...prev, clean]);
                            setCustomVertical('');
                          }
                        }}
                        className="btn-secondary py-1.5 px-3 font-bold text-[10px]"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="form-label-light text-[10px]">Select Verticals (Multiple) *</label>
                    <div className="flex flex-wrap gap-1.5 mt-1 max-h-24 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      {[...INDUSTRY_CATEGORIES[regIndustryType], ...customVerticalsList].map(vertical => {
                        const isSelected = regIndustries.includes(vertical);
                        return (
                          <button
                            type="button"
                            key={vertical}
                            onClick={() => {
                              if (isSelected) {
                                if (regIndustries.length > 1) {
                                  setRegIndustries(prev => prev.filter(item => item !== vertical));
                                }
                              } else {
                                setRegIndustries(prev => [...prev, vertical]);
                              }
                            }}
                            className={`px-2 py-1 rounded text-[9px] font-bold border transition-all ${isSelected ? 'bg-blue-600 border-blue-500 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                          >
                            {isSelected ? '✓' : '+'} {vertical}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Brand Color Palette */}
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="form-label-light text-[10px]">Primary Color</label>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <input type="color" className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0" value={regPrimaryColor} onChange={e => setRegPrimaryColor(e.target.value)} />
                          <input type="text" className="form-input-light text-[10px] py-1 font-mono uppercase w-full" value={regPrimaryColor} onChange={e => setRegPrimaryColor(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="form-label-light text-[10px]">Secondary Color</label>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <input type="color" className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0" value={regSecondaryColor} onChange={e => setRegSecondaryColor(e.target.value)} />
                          <input type="text" className="form-input-light text-[10px] py-1 font-mono uppercase w-full" value={regSecondaryColor} onChange={e => setRegSecondaryColor(e.target.value)} />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between gap-1 pt-1.5">
                      {[
                        { label: 'Midnight Blue', p: '#2563eb', s: '#4f46e5' },
                        { label: 'Forest Green', p: '#059669', s: '#10b981' },
                        { label: 'Sunset Amber', p: '#d97706', s: '#f59e0b' },
                        { label: 'Royal Purple', p: '#7c3aed', s: '#8b5cf6' }
                      ].map(combo => (
                        <button
                          type="button"
                          key={combo.label}
                          onClick={() => { setRegPrimaryColor(combo.p); setRegSecondaryColor(combo.s); }}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-250 text-[8px] font-bold bg-white text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                          <span className="w-2 h-2 rounded-full" style={{ background: combo.p }} />
                          <span className="w-2 h-2 rounded-full" style={{ background: combo.s }} />
                          {combo.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Brand Typography & Plan type */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="form-label-light text-[10px]">Typography Font</label>
                      <select className="form-input-light text-xs py-1.5" value={regFont} onChange={e => setRegFont(e.target.value)}>
                        <option value="Inter, sans-serif">Inter (Modern Sans)</option>
                        <option value="'Playfair Display', serif">Playfair (Elegant Serif)</option>
                        <option value="'Outfit', sans-serif">Outfit (Geometric Sans)</option>
                        <option value="'Fira Code', monospace">Fira Code (Monospace)</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label-light text-[10px]">Plan Type</label>
                      <select className="form-input-light text-xs py-1.5" value={regPlan} onChange={e => setRegPlan(e.target.value as any)}>
                        <option value="starter">Starter</option>
                        <option value="professional">Professional</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary w-full py-2.5 text-xs font-bold">
                    Provision Workspace Application
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
