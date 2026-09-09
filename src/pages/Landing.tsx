import { useState, useEffect } from 'react';
import type { AuthSession, Tenant, TenantConfig } from '../types';
import type { SharedStore } from '../App';
import { INDUSTRY_PACKS } from '../initialData';
import { api } from '../utils/api';
import {
  Shield, Laptop, CheckCircle, XCircle, Eye, EyeOff, Check, Users, Calendar,
  Package, Palette, Workflow, ShieldCheck, LayoutDashboard, FileText, Settings, Sparkles,
  ArrowRight, BarChart3, CreditCard, Bot, Globe, Target, HardHat, Clock, AlertCircle, Loader2
} from 'lucide-react';
import { toast } from '../context/ToastContext';

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
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'professional' | 'enterprise'>('professional');
  const [expandedFaq, setExpandedFaq] = useState<Record<number, boolean>>({ 0: true });
  const [selectedThemeKey, setSelectedThemeKey] = useState<string>('luxury');

  const [activeNav, setActiveNav] = useState<string>('');

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setActiveNav(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['industries', 'features', 'themes', 'pricing', 'resources'];
      const scrollPosition = window.scrollY + 160;
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveNav(id);
            break;
          }
        }
      }
    };

    const initialHash = window.location.hash.replace('#', '').replace('/', '');
    if (initialHash && ['industries', 'features', 'themes', 'pricing', 'resources'].includes(initialHash)) {
      setActiveNav(initialHash);
      setTimeout(() => {
        const el = document.getElementById(initialHash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    }).catch(() => { });
  }, []);

  // Super admin login state
  const [saEmail, setSaEmail] = useState('');
  const [saPass, setSaPass] = useState('');
  const [showSaPass, setShowSaPass] = useState(false);
  const [saError, setSaError] = useState('');

  // Tenant login state
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantPass, setTenantPass] = useState('');
  const [showTenantPass, setShowTenantPass] = useState(false);
  const [tenantError, setTenantError] = useState('');

  // Registration state
  const [regName, setRegName] = useState('');
  const [regOwner, setRegOwner] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [regIndustries, setRegIndustries] = useState<string[]>(['Electrician']);
  const [regIndustryType] = useState<string>('Home Services');
  const [regGstNumber] = useState('');
  const [regPrimaryColor] = useState('#2563eb');
  const [regSecondaryColor] = useState('#4f46e5');
  const [regFont] = useState('Inter, sans-serif');
  const [regPlan, setRegPlan] = useState<'starter' | 'professional' | 'enterprise'>('starter');
  const [regSubmitted, setRegSubmitted] = useState(false);

  // Real Secure Email OTP States
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(300);
  const [otpError, setOtpError] = useState('');

  // Countdown timer for OTP expiry & resend cooldown
  useEffect(() => {
    let timer: any;
    if (emailOtpSent && !isEmailVerified) {
      timer = setInterval(() => {
        setOtpExpirySeconds(prev => (prev > 0 ? prev - 1 : 0));
        setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [emailOtpSent, isEmailVerified]);

  const handleSendEmailOtp = async () => {
    if (!regEmail || !regEmail.includes('@')) {
      toast.error({ title: 'Invalid Email', message: 'Please enter a valid email address first.' });
      return;
    }
    setIsSendingOtp(true);
    setOtpError('');
    try {
      const res = await api.sendOtp(regEmail, regName || 'ServOS Workspace');
      setEmailOtpSent(true);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpExpirySeconds(300);
      setResendCooldown(60);
      toast.info({
        title: 'Verification Code Dispatched',
        message: res.message || `A 6-digit code has been sent to ${regEmail}.`
      });
      setTimeout(() => {
        const firstInput = document.getElementById('reg-otp-0');
        firstInput?.focus();
      }, 100);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to send verification code. Please try again.';
      setOtpError(msg);
      toast.error({ title: 'Failed to Send Code', message: msg });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyInlineOtp = async () => {
    const code = otpDigits.join('').trim();
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setOtpError('Please enter all 6 digits of your verification code.');
      toast.error({ title: 'Incomplete Code', message: 'Please enter all 6 digits of the verification code.' });
      return;
    }
    setIsVerifyingOtp(true);
    setOtpError('');
    try {
      const res = await api.verifyOtp(regEmail, code);
      if (res.verified || res.success) {
        setIsEmailVerified(true);
        setEmailOtpSent(false);
        toast.success({
          title: 'Email Verified',
          message: `✓ ${regEmail} has been verified successfully.`
        });
      } else {
        const msg = res.message || 'Invalid verification code.';
        setOtpError(msg);
        toast.error({ title: 'Verification Failed', message: msg });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid verification code.';
      setOtpError(msg);
      toast.error({ title: 'Verification Failed', message: msg });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleVerifyDirectCode = async (code: string) => {
    if (code.length !== 6) return;
    setIsVerifyingOtp(true);
    setOtpError('');
    try {
      const res = await api.verifyOtp(regEmail, code);
      if (res.verified || res.success) {
        setIsEmailVerified(true);
        setEmailOtpSent(false);
        toast.success({
          title: 'Email Verified',
          message: `✓ ${regEmail} verified successfully.`
        });
      } else {
        const msg = res.message || 'Invalid verification code.';
        setOtpError(msg);
        toast.error({ title: 'Verification Failed', message: msg });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid verification code.';
      setOtpError(msg);
      toast.error({ title: 'Verification Failed', message: msg });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleOtpDigitChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    setOtpError('');

    // If digit entered, jump to next box
    if (digit && index < 5) {
      const nextInput = document.getElementById(`reg-otp-${index + 1}`);
      nextInput?.focus();
    }

    // Auto verify if all 6 digits are filled
    if (digit && index === 5 && newDigits.every(d => d !== '')) {
      setTimeout(() => {
        handleVerifyDirectCode(newDigits.join(''));
      }, 50);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`reg-otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);
    const focusIndex = Math.min(pasted.length, 5);
    document.getElementById(`reg-otp-${focusIndex}`)?.focus();
    if (pasted.length === 6) {
      handleVerifyDirectCode(pasted);
    }
  };

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
      toast.error({ title: 'Invalid Phone Number', message: 'Owner phone number must be exactly 10 digits.' });
      return;
    }
    if (!regEmail || !regEmail.includes('@')) {
      toast.error({ title: 'Invalid Email', message: 'Please enter a valid email address.' });
      return;
    }

    // Require email OTP verification before creating workspace
    if (!isEmailVerified) {
      if (!emailOtpSent) {
        handleSendEmailOtp();
      }
      toast.warning({
        title: 'Verify Email Required',
        message: `Please confirm the 6-digit OTP sent to ${regEmail} above to verify your email first.`
      });
      return;
    }

    const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
    if (regGstNumber && !GSTIN_REGEX.test(regGstNumber)) {
      toast.error({ title: 'Invalid GSTIN', message: 'Please enter a valid 15-character GSTIN.' });
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
    setTenantEmail(newT.ownerEmail);
    setTenantPass(regPassword || 'business123');

    // Close registration and open Sign In page directly!
    setShowRegModal(false);
    setShowTenantLogin(true);

    toast.success({
      title: 'Workspace Created Successfully',
      message: `Your business "${regName}" has been registered with verified email ${regEmail}. Sign in to enter your dashboard!`
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* 💻 DEMO WARNING HEADER */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white text-[11px] font-semibold py-2 px-4 flex items-center justify-between border-b border-blue-800">
        <span className="flex items-center gap-1.5"><Laptop className="w-3.5 h-3.5" /> Demo System: Front-end architecture with shared store. Switch roles using login buttons on top-right.</span>
        <button onClick={() => { setSaEmail('admin@servos.in'); setSaPass('admin123'); setShowSuperAdminLogin(true); }} className="underline hover:text-blue-200">Instant Admin Bypass</button>
      </div>

      {/* ========= NAVBAR ========= */}
      <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <svg className="w-7 h-7 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3C10.3431 3 9 4.34315 9 6C9 7.02795 9.51688 7.93512 10.3045 8.47597L6.87413 14.4175C6.01256 13.8475 4.84365 13.9187 4.05882 14.6545C3.00392 15.6436 2.95679 17.2995 3.9459 18.3544C4.93501 19.4093 6.59092 19.4564 7.64582 18.4673C8.38166 17.6825 8.45283 16.5136 7.88285 15.652L11.3132 9.71044C11.5362 9.76943 11.7645 9.8 12 9.8C12.2355 9.8 12.4638 9.76943 12.6868 9.71044L16.1171 15.652C15.5472 16.5136 15.6183 17.6825 16.3542 18.4673C17.4091 19.4564 19.065 19.4093 20.0541 18.3544C21.0432 17.2995 20.9961 15.6436 19.9412 14.6545C19.1564 13.9187 17.9874 13.8475 17.1259 14.4175L13.6955 8.47597C14.4831 7.93512 15 7.02795 15 6C15 4.34315 13.6569 3 12 3Z" fill="#3B82F6" />
              <circle cx="12" cy="6" r="1.5" fill="#60A5FA" />
              <circle cx="5.8" cy="16.5" r="1.5" fill="#60A5FA" />
              <circle cx="18.2" cy="16.5" r="1.5" fill="#60A5FA" />
            </svg>
            <span className="text-lg font-bold text-white tracking-tight">AnaravOS</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-300">
            <button
              onClick={(e) => scrollToSection(e, 'industries')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeNav === 'industries' ? 'text-blue-400 bg-blue-500/15 font-bold shadow-sm' : 'hover:text-white hover:bg-slate-900/60'}`}
            >
              Industries
            </button>
            <button
              onClick={(e) => scrollToSection(e, 'features')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeNav === 'features' ? 'text-blue-400 bg-blue-500/15 font-bold shadow-sm' : 'hover:text-white hover:bg-slate-900/60'}`}
            >
              Engine Modules
            </button>
            <button
              onClick={(e) => scrollToSection(e, 'themes')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeNav === 'themes' ? 'text-blue-400 bg-blue-500/15 font-bold shadow-sm' : 'hover:text-white hover:bg-slate-900/60'}`}
            >
              Themes
            </button>
            <button
              onClick={(e) => scrollToSection(e, 'pricing')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeNav === 'pricing' ? 'text-blue-400 bg-blue-500/15 font-bold shadow-sm' : 'hover:text-white hover:bg-slate-900/60'}`}
            >
              Pricing
            </button>
            <button
              onClick={(e) => scrollToSection(e, 'resources')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeNav === 'resources' ? 'text-blue-400 bg-blue-500/15 font-bold shadow-sm' : 'hover:text-white hover:bg-slate-900/60'}`}
            >
              Resources
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTenantLogin(true)}
              className="text-xs font-semibold text-blue-400 bg-blue-950/40 hover:bg-blue-900/40 border border-blue-500/30 hover:border-blue-400/50 px-4 py-1.5 rounded-lg transition-all"
            >
              Sign In
            </button>
            <button
              onClick={() => setShowRegModal(true)}
              className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded-lg shadow-md shadow-blue-600/30 transition-all"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* ========= HERO ========= */}
      <section className="pt-16 pb-20 px-6 bg-gradient-to-b from-slate-950 via-[#070e24] to-slate-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 text-blue-400 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase">
              Powering Modern Service Businesses
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black text-white leading-[1.14] tracking-tight">
              One Engine for Every<br />
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                Service Business.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-lg font-normal">
              Launch a complete digital business platform with booking, customer management, payments, analytics, and operations — without building everything from scratch.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <button
                onClick={() => setShowRegModal(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all"
              >
                Start Building Free
              </button>
              <button
                onClick={() => setShowTenantLogin(true)}
                className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-500 font-semibold text-sm px-6 py-3.5 rounded-xl flex items-center gap-2.5 transition-all"
              >
                <span>Explore Live Demo</span>
                <svg className="w-3.5 h-3.5 text-slate-300 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 pt-2 font-medium">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-400 stroke-[3]" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-400 stroke-[3]" /> Setup in minutes</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-400 stroke-[3]" /> Built for growing businesses</span>
            </div>
          </div>

          {/* Interactive Hero Graphic: 3D Floating Dashboard Mockup */}
          <div className="relative pt-10 sm:pt-0">
            {/* Cosmic Ambient Atmospheric Glows & Orbital Rings */}
            <div className="absolute -top-24 -right-24 w-[520px] h-[520px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/3 -left-16 w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />

            {/* Rotating Outer Dashed Orbital Ring */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] rounded-full border border-blue-500/15 border-dashed animate-spin-slow pointer-events-none hidden md:block" />

            {/* Pulsing Inner Glowing Halo Ring */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full border border-blue-400/25 animate-pulse-ring pointer-events-none hidden md:block shadow-[0_0_80px_rgba(59,130,246,0.18)]" />

            {/* Glowing Celestial Space Dots */}
            <div className="absolute top-12 right-16 w-2 h-2 bg-blue-400 rounded-full blur-[0.5px] animate-ping pointer-events-none" />
            <div className="absolute bottom-16 right-10 w-1.5 h-1.5 bg-cyan-300 rounded-full blur-[0.5px] animate-pulse pointer-events-none" />
            <div className="absolute top-1/2 -left-8 w-2 h-2 bg-indigo-400 rounded-full blur-[0.5px] animate-pulse pointer-events-none" />

            {/* 3D Perspective Floating Wrapper */}
            <div className="relative animate-hero-3d transition-transform duration-500 hover:scale-[1.02] cursor-default">

              {/* Floating 3D Badge 1 (Top Left - New Bookings) */}
              <div className="animate-badge-1 absolute -top-8 -left-8 z-30 bg-[#081026]/95 border border-purple-500/30 hover:border-purple-400/60 px-4 py-2.5 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.7)] backdrop-blur-xl flex items-center gap-3 hidden sm:flex transition-all">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-inner shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white leading-none">12 New Bookings</p>
                  <p className="text-[9px] text-emerald-400 font-semibold mt-1 flex items-center gap-0.5">
                    <span>▲</span> +15.4% this week
                  </p>
                </div>
              </div>

              {/* Floating 3D Badge 2 (Top Right - New Customers with Avatars) */}
              <div className="animate-badge-2 absolute -top-8 -right-8 z-30 bg-[#081026]/95 border border-blue-500/30 hover:border-cyan-400/60 p-3 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.7)] backdrop-blur-xl hidden sm:block transition-all space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white leading-none">New Customers</p>
                    <p className="text-[8.5px] text-emerald-400 font-semibold mt-0.5">+34 this week</p>
                  </div>
                </div>
                <div className="flex -space-x-1.5 pt-0.5">
                  <div className="w-5.5 h-5.5 rounded-full bg-amber-500 border border-slate-900 text-[8px] font-black flex items-center justify-center text-slate-950">AM</div>
                  <div className="w-5.5 h-5.5 rounded-full bg-indigo-500 border border-slate-900 text-[8px] font-black flex items-center justify-center text-white">RS</div>
                  <div className="w-5.5 h-5.5 rounded-full bg-pink-500 border border-slate-900 text-[8px] font-black flex items-center justify-center text-white">NV</div>
                  <div className="w-5.5 h-5.5 rounded-full bg-blue-500 border border-slate-900 text-[8px] font-black flex items-center justify-center text-white">+12</div>
                </div>
              </div>

              {/* Floating 3D Badge 3 (Bottom Left - Payment Received) */}
              <div className="animate-badge-3 absolute -bottom-7 -left-8 z-30 bg-[#081026]/95 border border-emerald-500/30 hover:border-emerald-400/60 px-4 py-3 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.75)] backdrop-blur-xl flex items-center gap-3.5 hidden sm:flex transition-all">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9.5px] text-slate-400 font-medium leading-none">Payment Received</p>
                  <p className="text-sm font-black text-white mt-1">₹12,500</p>
                  <p className="text-[8.5px] text-slate-500 mt-0.5">From Rahul Verma</p>
                </div>
              </div>

              {/* Main Tablet Mockup Window */}
              <div className="relative bg-[#070d20]/95 border border-slate-700/80 rounded-[32px] p-5 sm:p-6 shadow-[0_30px_70px_rgba(0,0,0,0.9)] backdrop-blur-2xl flex gap-4 overflow-hidden">
                {/* Left Mini Sidebar */}
                <div className="w-9 flex flex-col items-center py-2 border-r border-slate-800/80 pr-2.5 gap-5 shrink-0">
                  <div className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-black text-xs shadow-md shadow-blue-600/30">
                    <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none">
                      <path d="M12 3C10.3431 3 9 4.34315 9 6C9 7.02795 9.51688 7.93512 10.3045 8.47597L6.87413 14.4175C6.01256 13.8475 4.84365 13.9187 4.05882 14.6545C3.00392 15.6436 2.95679 17.2995 3.9459 18.3544C4.93501 19.4093 6.59092 19.4564 7.64582 18.4673C8.38166 17.6825 8.45283 16.5136 7.88285 15.652L11.3132 9.71044C11.5362 9.76943 11.7645 9.8 12 9.8C12.2355 9.8 12.4638 9.76943 12.6868 9.71044L16.1171 15.652C15.5472 16.5136 15.6183 17.6825 16.3542 18.4673C17.4091 19.4564 19.065 19.4093 20.0541 18.3544C21.0432 17.2995 20.9961 15.6436 19.9412 14.6545C19.1564 13.9187 17.9874 13.8475 17.1259 14.4175L13.6955 8.47597C14.4831 7.93512 15 7.02795 15 6C15 4.34315 13.6569 3 12 3Z" fill="#3B82F6" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-4 text-slate-500">
                    <div className="p-1 rounded-lg bg-blue-500/15 text-blue-400">
                      <LayoutDashboard className="w-4 h-4" />
                    </div>
                    <Users className="w-4 h-4 hover:text-slate-300 transition-colors" />
                    <Calendar className="w-4 h-4 hover:text-slate-300 transition-colors" />
                    <FileText className="w-4 h-4 hover:text-slate-300 transition-colors" />
                    <Sparkles className="w-4 h-4 hover:text-slate-300 transition-colors" />
                    <Settings className="w-4 h-4 hover:text-slate-300 transition-colors mt-4" />
                  </div>
                </div>

                {/* Main App Content Area */}
                <div className="flex-1 min-w-0 space-y-3.5">
                  {/* Header */}
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      Good morning, Alex <span className="text-amber-400">👋</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-normal">Here's your business overview.</p>
                  </div>

                  {/* 3 Metric Cards */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2.5">
                      <p className="text-[9px] text-slate-400 font-medium">Total Bookings</p>
                      <p className="text-sm sm:text-base font-black text-white mt-0.5">12,429</p>
                      <p className="text-[8.5px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5">
                        <span>▲</span> +18.4% from last month
                      </p>
                    </div>
                    <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2.5">
                      <p className="text-[9px] text-slate-400 font-medium">Total Revenue</p>
                      <p className="text-sm sm:text-base font-black text-white mt-0.5">₹2,45,760</p>
                      <p className="text-[8.5px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5">
                        <span>▲</span> +34.8% from last month
                      </p>
                    </div>
                    <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2.5">
                      <p className="text-[9px] text-slate-400 font-medium">Total Customers</p>
                      <p className="text-sm sm:text-base font-black text-white mt-0.5">8,426</p>
                      <p className="text-[8.5px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5">
                        <span>▲</span> +16.8% from last month
                      </p>
                    </div>
                  </div>

                  {/* Chart & Appointments 2-column Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                    {/* Revenue Overview Chart */}
                    <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2.5 flex flex-col justify-between relative overflow-hidden">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-white flex items-center gap-1">Revenue Overview <span className="text-slate-500 text-[8px]">&gt;</span></span>
                      </div>

                      {/* Line Chart with Y-Axis & Floating Tooltip */}
                      <div className="h-24 w-full relative my-1 flex items-center">
                        {/* Y-axis Labels */}
                        <div className="flex flex-col justify-between h-full text-[6.5px] text-slate-500 font-mono pr-1.5 py-0.5">
                          <span>400</span>
                          <span>300</span>
                          <span>200</span>
                          <span>100</span>
                        </div>

                        {/* Chart Area */}
                        <div className="relative flex-1 h-full flex items-end">
                          {/* Floating Tooltip Callout */}
                          <div className="absolute top-1 right-8 z-10 bg-[#0a142e] border border-cyan-400/60 rounded-md px-1.5 py-0.5 shadow-lg shadow-cyan-500/20 text-center animate-bounce-subtle">
                            <p className="text-[7.5px] font-black text-white">₹45,680</p>
                            <p className="text-[6px] text-emerald-400 font-bold">▲ 12.3%</p>
                          </div>

                          <svg className="w-full h-full overflow-visible" viewBox="0 0 180 80" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="heroChartGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            <path
                              d="M 0 60 Q 25 65 50 48 T 90 52 T 130 22 T 180 12 L 180 80 L 0 80 Z"
                              fill="url(#heroChartGrad)"
                            />
                            <path
                              d="M 0 60 Q 25 65 50 48 T 90 52 T 130 22 T 180 12"
                              fill="none"
                              stroke="#38bdf8"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                            {/* Interactive Data Point Nodes */}
                            <circle cx="50" cy="48" r="2.5" fill="#38bdf8" stroke="#070d20" strokeWidth="1" />
                            <circle cx="90" cy="52" r="2.5" fill="#38bdf8" stroke="#070d20" strokeWidth="1" />
                            <circle cx="130" cy="22" r="3.5" fill="#ffffff" stroke="#38bdf8" strokeWidth="2" />
                            <circle cx="180" cy="12" r="3.5" fill="#ffffff" stroke="#38bdf8" strokeWidth="2" />
                          </svg>
                        </div>
                      </div>

                      <div className="flex justify-between text-[7.5px] text-slate-500 font-mono pt-1 border-t border-slate-800/60 pl-5">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun</span>
                      </div>
                    </div>

                    {/* Upcoming Appointments */}
                    <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2.5 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-white mb-1.5">Upcoming Appointments</span>
                      <div className="space-y-1">
                        {[
                          { time: '10:00 AM', name: 'Pradeep', service: 'AC Service', color: 'bg-indigo-500' },
                          { time: '11:30 AM', name: 'Barigala', service: 'Salon Service', color: 'bg-pink-500' },
                          { time: '01:00 PM', name: 'Rahul Verma', service: 'Pest Control', color: 'bg-amber-500' },
                          { time: '02:30 PM', name: 'Anita Singh', service: 'Home Cleaning', color: 'bg-emerald-500' }
                        ].map((app, i) => (
                          <div key={i} className="flex items-center justify-between text-[8.5px] bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800/60 hover:border-slate-700 transition-colors">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 font-mono text-[7.5px]">{app.time}</span>
                              <div className={`w-3.5 h-3.5 rounded-full ${app.color} text-white text-[7px] font-bold flex items-center justify-center`}>
                                {app.name[0]}
                              </div>
                              <span className="text-slate-200 font-semibold truncate max-w-[65px]">{app.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400 text-[7.5px] truncate max-w-[55px]">{app.service}</span>
                              <span className="text-slate-600 text-[7px]">&gt;</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-center pt-1 border-t border-slate-800/60 mt-1">
                        <span className="text-[8.5px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer">View all appointments &gt;</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========= STATS TRANSITION BAR (CENTERED BETWEEN SECTIONS) ========= */}
      <section className="bg-transparent">
        <div className="max-w-7xl mx-auto bg-[#070d1d]/95 border border-slate-800/90 rounded-2xl py-6 px-6 sm:px-10  backdrop-blur-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 items-center justify-items-center">
            <div className=" flex items-center gap-3.5 w-full justify-center sm:justify-start">
              <div className=" w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-white tracking-tight">20+</p>
                <p className="text-xs text-slate-400 font-medium">Industry-Ready Packs</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 w-full justify-center sm:justify-start">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shadow-inner shrink-0">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-white tracking-tight">6</p>
                <p className="text-xs text-slate-400 font-medium">Premium Themes</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 w-full justify-center sm:justify-start">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
                <Workflow className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-white tracking-tight">10+</p>
                <p className="text-xs text-slate-400 font-medium">Booking States</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 w-full justify-center sm:justify-start">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shadow-inner shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-white tracking-tight">99.99%</p>
                <p className="text-xs text-slate-400 font-medium">Platform Uptime</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========= SECTION 4: POPULAR INDUSTRY PACKS ========= */}
      <section id="industries" className="py-20 px-6 bg-slate-950 border-t border-slate-950 scroll-mt-20">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
              Popular Industry Packs
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Ready-to-Install Industry Packs</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Launch faster with purpose-built workflows for the services your customers already understand.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[
              {
                name: 'Beauty & Wellness',
                icon: (
                  <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
                    <defs>
                      <linearGradient id="g_beauty" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#e879f9" />
                        <stop offset="1" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                    <path d="M18 6C15 11 11 15 11 20C11 24 14 27 18 27C22 27 25 24 25 20C25 15 21 11 18 6Z" fill="url(#g_beauty)" fillOpacity="0.85" />
                    <path d="M18 10C17 14 14 18 10 20C7 21 5 20 6 18C8 14 13 11 18 10Z" fill="#f472b6" fillOpacity="0.8" />
                    <path d="M18 10C19 14 22 18 26 20C29 21 31 20 30 18C28 14 23 11 18 10Z" fill="#c084fc" fillOpacity="0.8" />
                    <circle cx="18" cy="18" r="2.5" fill="#ffffff" />
                  </svg>
                )
              },
              {
                name: 'Fitness',
                icon: (
                  <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
                    <defs>
                      <linearGradient id="g_fit" x1="0" y1="0" x2="36" y2="0" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#60a5fa" />
                        <stop offset="1" stopColor="#38bdf8" />
                      </linearGradient>
                    </defs>
                    <rect x="5" y="11" width="4" height="14" rx="2" fill="url(#g_fit)" />
                    <rect x="10" y="14" width="3" height="8" rx="1.5" fill="#93c5fd" />
                    <rect x="13" y="16.5" width="10" height="3" rx="1.5" fill="#ffffff" />
                    <rect x="23" y="14" width="3" height="8" rx="1.5" fill="#93c5fd" />
                    <rect x="27" y="11" width="4" height="14" rx="2" fill="url(#g_fit)" />
                  </svg>
                )
              },
              {
                name: 'AC Service',
                icon: (
                  <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
                    <defs>
                      <linearGradient id="g_ac" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#38bdf8" />
                        <stop offset="1" stopColor="#0284c7" />
                      </linearGradient>
                    </defs>
                    <path d="M18 4V32M4 18H32M8 8L28 28M28 8L8 28" stroke="url(#g_ac)" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="18" cy="18" r="4" fill="#0ea5e9" />
                    <circle cx="18" cy="18" r="1.5" fill="#ffffff" />
                    <circle cx="18" cy="6" r="1.5" fill="#7dd3fc" />
                    <circle cx="18" cy="30" r="1.5" fill="#7dd3fc" />
                    <circle cx="6" cy="18" r="1.5" fill="#7dd3fc" />
                    <circle cx="30" cy="18" r="1.5" fill="#7dd3fc" />
                  </svg>
                )
              },
              {
                name: 'Barber',
                icon: (
                  <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
                    <defs>
                      <linearGradient id="g_barber" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#fb7185" />
                        <stop offset="1" stopColor="#e11d48" />
                      </linearGradient>
                    </defs>
                    <circle cx="12" cy="24" r="4" stroke="url(#g_barber)" strokeWidth="2.5" />
                    <circle cx="24" cy="24" r="4" stroke="url(#g_barber)" strokeWidth="2.5" />
                    <path d="M15 21L26 8M21 21L10 8" stroke="url(#g_barber)" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="18" cy="17" r="1.5" fill="#fda4af" />
                  </svg>
                )
              },
              {
                name: 'Cleaning',
                icon: (
                  <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
                    <defs>
                      <linearGradient id="g_clean" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#34d399" />
                        <stop offset="1" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                    <path d="M26 6L14 18" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M14 18L10 28C10 28 14 30 18 26L18 22L14 18Z" fill="url(#g_clean)" />
                    <path d="M8 30L20 25" stroke="#a7f3d0" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="28" cy="10" r="2" fill="#38bdf8" />
                    <circle cx="24" cy="4" r="1" fill="#7dd3fc" />
                  </svg>
                )
              },
              {
                name: 'Pest Control',
                icon: (
                  <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
                    <defs>
                      <linearGradient id="g_pest" x1="0" y1="0" x2="0" y2="36" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#4ade80" />
                        <stop offset="1" stopColor="#16a34a" />
                      </linearGradient>
                    </defs>
                    <ellipse cx="18" cy="20" rx="6" ry="8" fill="url(#g_pest)" />
                    <circle cx="18" cy="10" r="4" fill="#22c55e" />
                    <path d="M15 7L11 4M21 7L25 4M12 16L6 14M24 16L30 14M12 21L5 22M24 21L31 22M13 26L7 30M23 26L29 30" stroke="#86efac" strokeWidth="2" strokeLinecap="round" />
                    <line x1="18" y1="12" x2="18" y2="28" stroke="#15803d" strokeWidth="1.5" />
                  </svg>
                )
              },
              {
                name: 'Car Wash',
                icon: (
                  <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
                    <defs>
                      <linearGradient id="g_car" x1="0" y1="0" x2="36" y2="0" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#38bdf8" />
                        <stop offset="1" stopColor="#1d4ed8" />
                      </linearGradient>
                    </defs>
                    <path d="M6 22L9 14H27L30 22H6Z" fill="url(#g_car)" />
                    <rect x="4" y="21" width="28" height="6" rx="3" fill="#2563eb" />
                    <circle cx="10" cy="27" r="3" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.5" />
                    <circle cx="26" cy="27" r="3" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.5" />
                    <circle cx="18" cy="7" r="1.5" fill="#38bdf8" />
                    <circle cx="12" cy="10" r="1" fill="#7dd3fc" />
                    <circle cx="24" cy="9" r="1" fill="#7dd3fc" />
                  </svg>
                )
              },
              {
                name: 'Appliance Repair',
                icon: (
                  <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
                    <defs>
                      <linearGradient id="g_appliance" x1="0" y1="0" x2="0" y2="36" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#818cf8" />
                        <stop offset="1" stopColor="#4338ca" />
                      </linearGradient>
                    </defs>
                    <rect x="7" y="6" width="10" height="24" rx="2" fill="url(#g_appliance)" stroke="#6366f1" strokeWidth="1.5" />
                    <line x1="7" y1="14" x2="17" y2="14" stroke="#4338ca" strokeWidth="1.5" />
                    <circle cx="15" cy="10" r="1" fill="#ffffff" />
                    <circle cx="15" cy="18" r="1" fill="#ffffff" />
                    <rect x="19" y="10" width="10" height="20" rx="2" fill="#3b82f6" stroke="#60a5fa" strokeWidth="1.5" />
                    <circle cx="24" cy="20" r="3" stroke="#ffffff" strokeWidth="1.5" />
                  </svg>
                )
              },
              {
                name: 'AC Repair',
                icon: (
                  <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
                    <defs>
                      <linearGradient id="g_acrep" x1="0" y1="0" x2="36" y2="0" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#22d3ee" />
                        <stop offset="1" stopColor="#0891b2" />
                      </linearGradient>
                    </defs>
                    <rect x="5" y="9" width="26" height="12" rx="2.5" fill="url(#g_acrep)" stroke="#67e8f9" strokeWidth="1.5" />
                    <line x1="8" y1="18" x2="28" y2="18" stroke="#164e63" strokeWidth="1.5" />
                    <path d="M10 24C12 28 14 28 16 30M16 24C18 28 20 28 22 30M22 24C24 28 26 28 28 30" stroke="#a5f3fc" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="27" cy="13" r="1.5" fill="#ffffff" />
                  </svg>
                )
              },
              {
                name: 'Salon',
                icon: (
                  <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
                    <defs>
                      <linearGradient id="g_salon" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#f472b6" />
                        <stop offset="1" stopColor="#db2777" />
                      </linearGradient>
                    </defs>
                    <circle cx="18" cy="18" r="8" stroke="url(#g_salon)" strokeWidth="2" fill="#831843" fillOpacity="0.5" />
                    <path d="M14 16C15 13 18 12 21 14C23 15 23 18 20 20C17 21 15 24 16 26" stroke="#fbcfe8" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="25" cy="10" r="1.5" fill="#f472b6" />
                    <circle cx="10" cy="11" r="2" fill="#fbcfe8" />
                  </svg>
                )
              },
              {
                name: 'CCTV',
                icon: (
                  <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
                    <defs>
                      <linearGradient id="g_cctv" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#60a5fa" />
                        <stop offset="1" stopColor="#1d4ed8" />
                      </linearGradient>
                    </defs>
                    <path d="M7 10L25 15L23 23L5 18Z" fill="url(#g_cctv)" stroke="#93c5fd" strokeWidth="1.5" />
                    <circle cx="22" cy="19" r="2.5" fill="#ef4444" />
                    <path d="M12 20L10 27H18" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )
              },
              {
                name: 'Solar',
                icon: (
                  <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
                    <defs>
                      <linearGradient id="g_solar" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#fbbf24" />
                        <stop offset="1" stopColor="#d97706" />
                      </linearGradient>
                    </defs>
                    <circle cx="18" cy="12" r="5" fill="url(#g_solar)" />
                    <path d="M18 4V6M18 18V20M10 12H12M24 12H26M12 6L14 8M22 16L24 18M12 18L14 16M22 8L24 6" stroke="#fcd34d" strokeWidth="2" strokeLinecap="round" />
                    <path d="M7 23L11 31H25L29 23H7Z" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" />
                    <line x1="18" y1="23" x2="18" y2="31" stroke="#93c5fd" strokeWidth="1.5" />
                    <line x1="9" y1="27" x2="27" y2="27" stroke="#93c5fd" strokeWidth="1.5" />
                  </svg>
                )
              },
              {
                name: 'Interior Design',
                icon: (
                  <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
                    <defs>
                      <linearGradient id="g_interior" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#fb923c" />
                        <stop offset="1" stopColor="#c2410c" />
                      </linearGradient>
                    </defs>
                    <path d="M13 8L9 16H27L23 8H13Z" fill="url(#g_interior)" />
                    <line x1="18" y1="4" x2="18" y2="8" stroke="#fdba74" strokeWidth="2" />
                    <path d="M12 28C12 24 15 22 18 22C21 22 24 24 24 28H12Z" fill="#7c2d12" stroke="#ea580c" strokeWidth="1.5" />
                    <line x1="18" y1="16" x2="18" y2="20" stroke="#fef08a" strokeWidth="2" strokeDasharray="1 2" />
                  </svg>
                )
              },
              {
                name: 'Packers & Movers',
                icon: (
                  <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
                    <defs>
                      <linearGradient id="g_pack" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#f59e0b" />
                        <stop offset="1" stopColor="#b45309" />
                      </linearGradient>
                    </defs>
                    <path d="M18 5L30 11V23L18 29L6 23V11L18 5Z" fill="url(#g_pack)" stroke="#fbbf24" strokeWidth="1.5" />
                    <path d="M18 5V29M6 11L18 17L30 11" stroke="#78350f" strokeWidth="1.5" />
                    <rect x="14" y="14" width="8" height="6" rx="1" fill="#fef3c7" fillOpacity="0.8" />
                  </svg>
                )
              },
              {
                name: 'Home Services',
                icon: (
                  <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
                    <defs>
                      <linearGradient id="g_home" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#38bdf8" />
                        <stop offset="1" stopColor="#0284c7" />
                      </linearGradient>
                    </defs>
                    <path d="M6 16L18 6L30 16" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 14V28H27V14" fill="url(#g_home)" fillOpacity="0.4" stroke="#0284c7" strokeWidth="1.5" />
                    <rect x="15" y="20" width="6" height="8" rx="1" fill="#ffffff" />
                  </svg>
                )
              },
              {
                name: 'Gardening',
                icon: (
                  <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
                    <defs>
                      <linearGradient id="g_gardening" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#84cc16" />
                        <stop offset="1" stopColor="#4d7c0f" />
                      </linearGradient>
                    </defs>
                    <path d="M18 30V14M18 14C18 8 11 6 8 8C5 10 7 17 18 14ZM18 18C18 12 25 10 28 12C31 14 29 21 18 18Z" fill="url(#g_gardening)" stroke="#bef264" strokeWidth="1.5" strokeLinejoin="round" />
                    <circle cx="18" cy="30" r="2" fill="#a16207" />
                  </svg>
                )
              },
              {
                name: 'Mobile Repair',
                icon: (
                  <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
                    <defs>
                      <linearGradient id="g_mob" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#818cf8" />
                        <stop offset="1" stopColor="#4f46e5" />
                      </linearGradient>
                    </defs>
                    <rect x="10" y="5" width="16" height="26" rx="3" fill="url(#g_mob)" stroke="#a5b4fc" strokeWidth="1.5" />
                    <rect x="12" y="8" width="12" height="18" rx="1" fill="#1e1b4b" />
                    <circle cx="18" cy="28.5" r="1.2" fill="#ffffff" />
                    <path d="M15 16L19 20M19 16L15 20" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )
              },
              {
                name: 'Construction',
                icon: (
                  <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
                    <defs>
                      <linearGradient id="g_const" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#f59e0b" />
                        <stop offset="1" stopColor="#d97706" />
                      </linearGradient>
                    </defs>
                    <path d="M8 29V9L28 9M8 17H22M8 24H16" stroke="url(#g_const)" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="28" y1="9" x2="28" y2="17" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="2 2" />
                    <rect x="25" y="17" width="6" height="6" rx="1" fill="#ea580c" />
                  </svg>
                )
              },
              {
                name: 'Event Decoration',
                icon: (
                  <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
                    <defs>
                      <linearGradient id="g_event" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#f43f5e" />
                        <stop offset="1" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                    <circle cx="14" cy="13" r="5" fill="#ec4899" fillOpacity="0.8" />
                    <circle cx="22" cy="13" r="5" fill="#a855f7" fillOpacity="0.8" />
                    <path d="M14 18C14 23 18 25 18 29M22 18C22 23 18 25 18 29" stroke="#fda4af" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="18" cy="8" r="1.5" fill="#fde047" />
                    <circle cx="10" cy="22" r="1" fill="#fde047" />
                    <circle cx="26" cy="22" r="1" fill="#fde047" />
                  </svg>
                )
              },
              {
                name: 'Local Services',
                icon: (
                  <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
                    <defs>
                      <linearGradient id="g_local" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#38bdf8" />
                        <stop offset="1" stopColor="#d97706" />
                      </linearGradient>
                    </defs>
                    <path d="M6 14L10 8H26L30 14H6Z" fill="#38bdf8" />
                    <path d="M6 14H30V27H6V14Z" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.5" />
                    <rect x="14" y="19" width="8" height="8" fill="#f59e0b" />
                    <circle cx="18" cy="8" r="2" fill="#fbbf24" />
                  </svg>
                )
              }
            ].map((pack, i) => (
              <div
                key={i}
                onClick={() => {
                  setRegIndustries([pack.name]);
                  setShowRegModal(true);
                }}
                className="bg-[#070c18] border border-slate-800/90 hover:border-blue-500/60 p-5 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer group hover:-translate-y-1 transition-all shadow-md hover:shadow-blue-500/10"
              >
                <div className="h-12 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  {pack.icon}
                </div>
                <p className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition-colors tracking-tight">
                  {pack.name}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => setShowRegModal(true)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white px-5 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 transition-all shadow-sm"
            >
              <span>View All Industries</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ========= SECTION 5: COMPREHENSIVE FEATURES REGISTRY ========= */}
      <section id="features" className="py-20 px-6 bg-slate-900/60 border-t border-slate-900 scroll-mt-20">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
              Platform Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Comprehensive Features Registry</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: <Globe className="w-5 h-5 text-blue-400" />, title: 'Dynamic Website Builder', desc: 'Build stunning websites without coding.', color: 'bg-blue-500/15 border-blue-500/30' },
              { icon: <Calendar className="w-5 h-5 text-emerald-400" />, title: '24/7 Online Booking Engine', desc: 'Accept bookings anytime, anywhere.', color: 'bg-emerald-500/15 border-emerald-500/30' },
              { icon: <HardHat className="w-5 h-5 text-indigo-400" />, title: 'Worker Operations Suite', desc: 'Manage teams, jobs, schedules & roles.', color: 'bg-indigo-500/15 border-indigo-500/30' },
              { icon: <CreditCard className="w-5 h-5 text-purple-400" />, title: 'Integrated Payments', desc: 'Accept payments & settle payouts seamlessly.', color: 'bg-purple-500/15 border-purple-500/30' },
              { icon: <BarChart3 className="w-5 h-5 text-cyan-400" />, title: 'Advanced Business Analytics', desc: 'Real-time insights to grow your business.', color: 'bg-cyan-500/15 border-cyan-500/30' },
              { icon: <Bot className="w-5 h-5 text-rose-400" />, title: 'AI-Powered Assistance', desc: 'AI tools to help you work smarter & faster.', color: 'bg-rose-500/15 border-rose-500/30' },
              { icon: <ShieldCheck className="w-5 h-5 text-amber-400" />, title: 'Domain & SSL Provisioning', desc: 'Get your domain & SSL in one click.', color: 'bg-amber-500/15 border-amber-500/30' },
              { icon: <Target className="w-5 h-5 text-orange-400" />, title: 'Lead Capture & CRM', desc: 'Capture leads and convert them into customers.', color: 'bg-orange-500/15 border-orange-500/30' }
            ].map((feat, i) => (
              <div key={i} className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-5 hover:border-blue-500/50 transition-all group">
                <div className={`w-10 h-10 rounded-xl ${feat.color} border flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform`}>
                  {feat.icon}
                </div>
                <h4 className="text-sm font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{feat.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========= SECTION 6: CHOOSE PREMIUM CONFIG-DRIVEN THEMES ========= */}
      <section id="themes" className="py-20 px-6 bg-slate-950 border-t border-slate-900 relative overflow-hidden scroll-mt-20">
        {/* Subtle background ambient glows */}
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-12 relative z-10">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 text-blue-400 px-4 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              POPULAR THEMES
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Choose Premium Config-Driven Themes</h2>
            <p className="text-xs sm:text-sm text-slate-400">Beautiful, responsive themes designed to convert.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                key: 'modern',
                name: 'Modern Dark',
                tag: 'Tech & Security',
                bgClass: 'bg-[#070c18]',
                borderClass: 'border-blue-900/40',
                activeGlow: 'border-blue-500/90 ring-1 ring-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.2)]',
                renderMockup: () => (
                  <div className="w-full h-44 rounded-xl bg-[#030712] border border-slate-800/90 p-2.5 flex flex-col justify-between overflow-hidden relative shadow-inner group-hover:border-blue-500/40 transition-colors">
                    {/* Mockup Topbar */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-md bg-blue-500 flex items-center justify-center text-[6px] font-black text-white">⚡</div>
                        <span className="text-[9px] font-bold text-slate-200">ApexTech</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[7.5px] text-slate-400">Services</span>
                        <span className="text-[7.5px] text-slate-400">Docs</span>
                        <div className="w-10 h-3 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-[7px] text-blue-300 font-semibold">Login</div>
                      </div>
                    </div>

                    {/* Mockup Body Grid */}
                    <div className="grid grid-cols-5 gap-2 my-auto items-center">
                      <div className="col-span-3 space-y-1.5">
                        <div className="inline-block px-1.5 py-0.5 rounded bg-blue-500/15 text-[6.5px] text-blue-400 font-bold uppercase">Cloud Ops Engine</div>
                        <p className="text-[10px] font-black text-white leading-tight">Next-Gen IT &amp; Security</p>
                        <div className="grid grid-cols-3 gap-1 pt-0.5">
                          <div className="bg-slate-900/90 border border-slate-800 rounded p-1 text-center">
                            <p className="text-[8px] font-bold text-blue-400">99.9%</p>
                            <p className="text-[5.5px] text-slate-400">Uptime</p>
                          </div>
                          <div className="bg-slate-900/90 border border-slate-800 rounded p-1 text-center">
                            <p className="text-[8px] font-bold text-cyan-400">42ms</p>
                            <p className="text-[5.5px] text-slate-400">Speed</p>
                          </div>
                          <div className="bg-slate-900/90 border border-slate-800 rounded p-1 text-center">
                            <p className="text-[8px] font-bold text-emerald-400">2.4k</p>
                            <p className="text-[5.5px] text-slate-400">Nodes</p>
                          </div>
                        </div>
                        <div className="w-16 h-4 bg-blue-600 rounded-md flex items-center justify-center text-[7.5px] text-white font-bold shadow-md shadow-blue-600/30">
                          Deploy Now
                        </div>
                      </div>

                      {/* Right Visual Graphic */}
                      <div className="col-span-2 h-24 rounded-lg bg-gradient-to-br from-blue-950/60 to-slate-900 border border-blue-900/50 p-1.5 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-blue-500/20 rounded-full blur-md pointer-events-none" />
                        <div className="flex items-center justify-between">
                          <span className="text-[6.5px] font-bold text-blue-400">Cluster 01</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full w-4/5 bg-blue-500 rounded-full" />
                          </div>
                          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full w-3/5 bg-cyan-400 rounded-full" />
                          </div>
                        </div>
                        <div className="bg-blue-950/80 border border-blue-800/60 rounded px-1 py-0.5 text-[6px] text-blue-200 text-center font-mono">
                          STATUS: HEALTHY
                        </div>
                      </div>
                    </div>
                  </div>
                )
              },
              {
                key: 'luxury',
                name: 'Luxury Gold',
                tag: 'Spas & Interiors',
                bgClass: 'bg-[#15110a]',
                borderClass: 'border-amber-600/40',
                activeGlow: 'border-amber-500 ring-1 ring-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.22)]',
                renderMockup: () => (
                  <div className="w-full h-44 rounded-xl bg-gradient-to-b from-[#221a0f] to-[#120d07] border border-amber-500/40 p-2.5 flex flex-col justify-between overflow-hidden relative shadow-inner group-hover:border-amber-400 transition-colors">
                    {/* Mockup Topbar */}
                    <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 flex items-center justify-center text-[6px] font-serif text-slate-950 font-bold">A</div>
                        <span className="text-[9px] font-serif tracking-widest text-amber-200 font-bold">AURA SPA</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[7.5px] text-amber-200/70">Suites</span>
                        <span className="text-[7.5px] text-amber-200/70">Rituals</span>
                        <div className="w-12 h-3 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-[7px] text-amber-300 font-serif">Book VIP</div>
                      </div>
                    </div>

                    {/* Mockup Body Grid */}
                    <div className="grid grid-cols-5 gap-2 my-auto items-center">
                      <div className="col-span-3 space-y-1.5">
                        <div className="inline-block px-1.5 py-0.5 rounded bg-amber-400/15 text-[6.5px] text-amber-300 font-serif tracking-wide uppercase">Private Sanctuary</div>
                        <p className="text-[10px] font-serif font-bold text-amber-100 leading-tight">Serenity &amp; Luxury Aesthetics</p>
                        <div className="space-y-1 pt-0.5">
                          <div className="flex items-center gap-1 text-[6.5px] text-amber-200/80">
                            <span className="text-amber-400">✦</span> 5-Star Certified Therapists
                          </div>
                          <div className="flex items-center gap-1 text-[6.5px] text-amber-200/80">
                            <span className="text-amber-400">✦</span> Private Hydrotherapy Suites
                          </div>
                        </div>
                        <div className="w-20 h-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-md flex items-center justify-center text-[7.5px] text-slate-950 font-serif font-bold shadow-md shadow-amber-500/20">
                          Reserve Ritual
                        </div>
                      </div>

                      {/* Right Visual Graphic */}
                      <div className="col-span-2 h-24 rounded-lg bg-gradient-to-br from-amber-900/40 via-[#261d11] to-[#171007] border border-amber-500/30 p-1.5 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute -right-3 -top-3 w-14 h-14 bg-amber-400/15 rounded-full blur-md pointer-events-none" />
                        <div className="flex items-center justify-between">
                          <span className="text-[6.5px] font-serif text-amber-300">Imperial Room</span>
                          <span className="text-[6.5px] text-amber-400 font-bold">5.0 ★</span>
                        </div>
                        {/* Elegant Spa Architecture SVG Graphic */}
                        <div className="flex items-center justify-center py-1">
                          <svg className="w-10 h-10 text-amber-400/70" viewBox="0 0 40 40" fill="none">
                            <path d="M20 6C14 14 10 20 10 26C10 32 14 36 20 36C26 36 30 32 30 26C30 20 26 14 20 6Z" stroke="currentColor" strokeWidth="1.2" />
                            <path d="M20 12C16 18 14 22 14 26C14 30 16 33 20 33C24 33 26 30 26 26C26 22 24 18 20 12Z" fill="currentColor" fillOpacity="0.2" />
                            <circle cx="20" cy="24" r="3" fill="#fbbf24" />
                          </svg>
                        </div>
                        <div className="bg-amber-950/80 border border-amber-700/50 rounded px-1 py-0.5 text-[6px] text-amber-300 text-center font-serif">
                          From ₹4,500/hr
                        </div>
                      </div>
                    </div>
                  </div>
                )
              },
              {
                key: 'professional',
                name: 'Corporate Blue',
                tag: 'Enterprises',
                bgClass: 'bg-[#070f20]',
                borderClass: 'border-blue-800/40',
                activeGlow: 'border-blue-500 ring-1 ring-blue-500/40 shadow-[0_0_30px_rgba(37,99,235,0.2)]',
                renderMockup: () => (
                  <div className="w-full h-44 rounded-xl bg-gradient-to-b from-[#0b1938] to-[#050c1c] border border-blue-600/30 p-2.5 flex flex-col justify-between overflow-hidden relative shadow-inner group-hover:border-blue-400 transition-colors">
                    {/* Mockup Topbar */}
                    <div className="flex items-center justify-between pb-2 border-b border-blue-800/60">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded bg-blue-600 flex items-center justify-center text-[6px] font-bold text-white">B</div>
                        <span className="text-[9px] font-bold text-slate-100">BlueCorp OS</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[7.5px] text-blue-200">Solutions</span>
                        <span className="text-[7.5px] text-blue-200">Pricing</span>
                        <div className="w-12 h-3 rounded-full bg-blue-600 text-white flex items-center justify-center text-[7px] font-bold">Contact</div>
                      </div>
                    </div>

                    {/* Mockup Body Grid */}
                    <div className="grid grid-cols-5 gap-2 my-auto items-center">
                      <div className="col-span-3 space-y-1.5">
                        <div className="inline-block px-1.5 py-0.5 rounded bg-blue-500/20 text-[6.5px] text-blue-300 font-bold uppercase">Enterprise Suite</div>
                        <p className="text-[10px] font-bold text-white leading-tight">Workforce &amp; Facility Operations</p>
                        <div className="h-4 bg-slate-900/90 border border-blue-900/60 rounded px-1.5 flex items-center justify-between">
                          <span className="text-[6.5px] text-slate-400">Search 500+ modules...</span>
                          <span className="text-[6.5px] text-blue-400 font-bold">↵</span>
                        </div>
                        <div className="w-16 h-4 bg-blue-600 rounded-md flex items-center justify-center text-[7.5px] text-white font-bold shadow-md shadow-blue-600/30">
                          Start Trial
                        </div>
                      </div>

                      {/* Right Visual Graphic */}
                      <div className="col-span-2 h-24 rounded-lg bg-gradient-to-br from-blue-900/50 to-[#071328] border border-blue-700/50 p-1.5 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute -right-3 -bottom-3 w-14 h-14 bg-blue-400/20 rounded-full blur-md pointer-events-none" />
                        <div className="flex items-center justify-between">
                          <span className="text-[6.5px] font-bold text-blue-300">Live Analytics</span>
                          <span className="text-[6.5px] text-emerald-400 font-mono">+18%</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-end gap-1 h-8 px-1 justify-between">
                            <div className="w-2 bg-blue-700 h-3 rounded-t" />
                            <div className="w-2 bg-blue-600 h-5 rounded-t" />
                            <div className="w-2 bg-blue-500 h-4 rounded-t" />
                            <div className="w-2 bg-sky-400 h-7 rounded-t" />
                            <div className="w-2 bg-blue-400 h-6 rounded-t" />
                          </div>
                        </div>
                        <div className="bg-blue-950/90 border border-blue-800/80 rounded px-1 py-0.5 text-[6px] text-blue-200 text-center font-mono">
                          ISO 27001 VERIFIED
                        </div>
                      </div>
                    </div>
                  </div>
                )
              },
              {
                key: 'minimal',
                name: 'Fresh Green',
                tag: 'Eco & Cleaning',
                bgClass: 'bg-[#06140f]',
                borderClass: 'border-emerald-800/40',
                activeGlow: 'border-emerald-500 ring-1 ring-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2)]',
                renderMockup: () => (
                  <div className="w-full h-44 rounded-xl bg-gradient-to-b from-[#0b291d] to-[#04120c] border border-emerald-500/30 p-2.5 flex flex-col justify-between overflow-hidden relative shadow-inner group-hover:border-emerald-400 transition-colors">
                    {/* Mockup Topbar */}
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-700/40">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex items-center justify-center text-[6px] font-bold text-slate-950">🌱</div>
                        <span className="text-[9px] font-bold text-emerald-100">EcoClean Pro</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[7.5px] text-emerald-200/80">Services</span>
                        <span className="text-[7.5px] text-emerald-200/80">Eco Guarantee</span>
                        <div className="w-12 h-3 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[7px] font-bold">Book Now</div>
                      </div>
                    </div>

                    {/* Mockup Body Grid */}
                    <div className="grid grid-cols-5 gap-2 my-auto items-center">
                      <div className="col-span-3 space-y-1.5">
                        <div className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/20 text-[6.5px] text-emerald-300 font-bold uppercase">100% Organic</div>
                        <p className="text-[10px] font-bold text-white leading-tight">Pristine Eco Cleaning Services</p>
                        <div className="space-y-0.5 pt-0.5">
                          <p className="text-[6.5px] text-emerald-200/80">✓ Chemical-free sanitization</p>
                          <p className="text-[6.5px] text-emerald-200/80">✓ Zero carbon footprint</p>
                        </div>
                        <div className="w-18 h-4 bg-emerald-500 rounded-md flex items-center justify-center text-[7.5px] text-slate-950 font-bold shadow-md shadow-emerald-500/20">
                          Instant Quote
                        </div>
                      </div>

                      {/* Right Visual Graphic */}
                      <div className="col-span-2 h-24 rounded-lg bg-gradient-to-br from-emerald-900/50 to-[#071f16] border border-emerald-600/40 p-1.5 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute -right-3 -bottom-3 w-14 h-14 bg-emerald-400/20 rounded-full blur-md pointer-events-none" />
                        <div className="flex items-center justify-between">
                          <span className="text-[6.5px] font-bold text-emerald-300">Home Care</span>
                          <span className="text-[6.5px] text-emerald-400 font-bold">🌿 Pure</span>
                        </div>
                        {/* Botanical SVG */}
                        <div className="flex items-center justify-center py-1">
                          <svg className="w-9 h-9 text-emerald-400" viewBox="0 0 36 36" fill="none">
                            <path d="M18 30V14M18 14C18 8 11 6 8 8C5 10 7 17 18 14ZM18 18C18 12 25 10 28 12C31 14 29 21 18 18Z" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        </div>
                        <div className="bg-emerald-950/90 border border-emerald-700/60 rounded px-1 py-0.5 text-[6px] text-emerald-200 text-center font-bold">
                          ECO-CERTIFIED
                        </div>
                      </div>
                    </div>
                  </div>
                )
              },
              {
                key: 'local',
                name: 'Warm Coral',
                tag: 'Local Handymen',
                bgClass: 'bg-[#180e0a]',
                borderClass: 'border-orange-800/40',
                activeGlow: 'border-orange-500 ring-1 ring-orange-500/40 shadow-[0_0_30px_rgba(249,115,22,0.2)]',
                renderMockup: () => (
                  <div className="w-full h-44 rounded-xl bg-gradient-to-b from-[#2a140d] to-[#120704] border border-orange-500/30 p-2.5 flex flex-col justify-between overflow-hidden relative shadow-inner group-hover:border-orange-400 transition-colors">
                    {/* Mockup Topbar */}
                    <div className="flex items-center justify-between pb-2 border-b border-orange-700/40">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded bg-orange-500 flex items-center justify-center text-[6px] font-bold text-white">⚡</div>
                        <span className="text-[9px] font-bold text-orange-100">FixPro Express</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[7.5px] text-orange-200/80">Plumbing</span>
                        <span className="text-[7.5px] text-orange-200/80">Electrical</span>
                        <div className="w-12 h-3 rounded-full bg-orange-500 text-white flex items-center justify-center text-[7px] font-bold">Call Now</div>
                      </div>
                    </div>

                    {/* Mockup Body Grid */}
                    <div className="grid grid-cols-5 gap-2 my-auto items-center">
                      <div className="col-span-3 space-y-1.5">
                        <div className="inline-block px-1.5 py-0.5 rounded bg-orange-500/20 text-[6.5px] text-orange-300 font-bold uppercase">Rapid Response</div>
                        <p className="text-[10px] font-bold text-white leading-tight">Same-Day Home Repair &amp; Fixes</p>
                        <div className="space-y-0.5 pt-0.5">
                          <p className="text-[6.5px] text-orange-200/80">⚡ Technician at door in &lt;45m</p>
                          <p className="text-[6.5px] text-orange-200/80">🛡️ 30-Day Service Guarantee</p>
                        </div>
                        <div className="w-18 h-4 bg-orange-500 rounded-md flex items-center justify-center text-[7.5px] text-white font-bold shadow-md shadow-orange-500/20">
                          Book in 60s
                        </div>
                      </div>

                      {/* Right Visual Graphic */}
                      <div className="col-span-2 h-24 rounded-lg bg-gradient-to-br from-orange-950/60 to-[#1d0b06] border border-orange-600/40 p-1.5 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute -right-3 -bottom-3 w-14 h-14 bg-orange-500/20 rounded-full blur-md pointer-events-none" />
                        <div className="flex items-center justify-between">
                          <span className="text-[6.5px] font-bold text-orange-300">Neighborhood</span>
                          <span className="text-[6.5px] text-amber-400 font-bold">4.9 ★</span>
                        </div>
                        {/* Cozy Sunset Home SVG */}
                        <div className="flex items-center justify-center py-1">
                          <svg className="w-9 h-9 text-orange-400" viewBox="0 0 36 36" fill="none">
                            <path d="M6 16L18 6L30 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 14V28H27V14" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.2" />
                            <rect x="15" y="20" width="6" height="8" rx="1" fill="#fed7aa" />
                          </svg>
                        </div>
                        <div className="bg-orange-950/90 border border-orange-700/60 rounded px-1 py-0.5 text-[6px] text-orange-200 text-center font-bold">
                          1,200+ REVIEWS
                        </div>
                      </div>
                    </div>
                  </div>
                )
              },
              {
                key: 'medical',
                name: 'Medical Clean',
                tag: 'Clinical & Health',
                bgClass: 'bg-[#071317]',
                borderClass: 'border-teal-800/40',
                activeGlow: 'border-teal-500 ring-1 ring-teal-500/40 shadow-[0_0_30px_rgba(20,184,166,0.2)]',
                renderMockup: () => (
                  <div className="w-full h-44 rounded-xl bg-gradient-to-b from-[#0b242c] to-[#041114] border border-teal-500/30 p-2.5 flex flex-col justify-between overflow-hidden relative shadow-inner group-hover:border-teal-400 transition-colors">
                    {/* Mockup Topbar */}
                    <div className="flex items-center justify-between pb-2 border-b border-teal-700/40">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded bg-teal-500 flex items-center justify-center text-[7px] font-black text-slate-950">✚</div>
                        <span className="text-[9px] font-bold text-teal-100">CarePoint Health</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[7.5px] text-teal-200/80">Doctors</span>
                        <span className="text-[7.5px] text-teal-200/80">Lab Tests</span>
                        <div className="w-12 h-3 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center text-[7px] font-bold">Portal</div>
                      </div>
                    </div>

                    {/* Mockup Body Grid */}
                    <div className="grid grid-cols-5 gap-2 my-auto items-center">
                      <div className="col-span-3 space-y-1.5">
                        <div className="inline-block px-1.5 py-0.5 rounded bg-teal-500/20 text-[6.5px] text-teal-300 font-bold uppercase">Clinical Excellence</div>
                        <p className="text-[10px] font-bold text-white leading-tight">Sterile Care &amp; Lab Consultations</p>
                        <div className="space-y-0.5 pt-0.5">
                          <p className="text-[6.5px] text-teal-200/80">🏥 NABH-accredited pathology</p>
                          <p className="text-[6.5px] text-teal-200/80">🩺 Board-certified specialists</p>
                        </div>
                        <div className="w-18 h-4 bg-teal-500 rounded-md flex items-center justify-center text-[7.5px] text-slate-950 font-bold shadow-md shadow-teal-500/20">
                          Book Consult
                        </div>
                      </div>

                      {/* Right Visual Graphic */}
                      <div className="col-span-2 h-24 rounded-lg bg-gradient-to-br from-teal-950/60 to-[#081c22] border border-teal-600/40 p-1.5 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute -right-3 -bottom-3 w-14 h-14 bg-teal-400/20 rounded-full blur-md pointer-events-none" />
                        <div className="flex items-center justify-between">
                          <span className="text-[6.5px] font-bold text-teal-300">Diagnostic Hub</span>
                          <span className="text-[6.5px] text-teal-400 font-bold">● Active</span>
                        </div>
                        {/* Medical Cross SVG */}
                        <div className="flex items-center justify-center py-1">
                          <svg className="w-8 h-8 text-teal-400" viewBox="0 0 36 36" fill="none">
                            <rect x="14" y="6" width="8" height="24" rx="2" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.2" />
                            <rect x="6" y="14" width="24" height="8" rx="2" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.2" />
                            <circle cx="18" cy="18" r="3" fill="#2dd4bf" />
                          </svg>
                        </div>
                        <div className="bg-teal-950/90 border border-teal-700/60 rounded px-1 py-0.5 text-[6px] text-teal-200 text-center font-bold">
                          CLINICAL GRADE
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
            ].map(thm => {
              const isSelected = selectedThemeKey === thm.key;
              return (
                <div
                  key={thm.key}
                  onClick={() => setSelectedThemeKey(thm.key)}
                  className={`group rounded-2xl p-4 border transition-all duration-300 cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl ${thm.bgClass} ${isSelected ? thm.activeGlow : `${thm.borderClass} hover:border-slate-600`
                    }`}
                >
                  {/* Theme Header Bar */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{thm.name}</span>
                      <span className="text-[9px] text-slate-500 font-medium px-2 py-0.5 bg-slate-900/80 rounded-full border border-slate-800">
                        {thm.tag}
                      </span>
                    </div>

                    {/* Radio Checkmark Circle */}
                    <div className="transition-transform duration-200 group-hover:scale-110">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-blue-600 border border-blue-400 flex items-center justify-center text-white shadow-md shadow-blue-500/50">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-slate-700 group-hover:border-slate-500 transition-colors" />
                      )}
                    </div>
                  </div>

                  {/* Rich Mockup Visual Graphic */}
                  <div className="transform transition-transform duration-300 group-hover:scale-[1.02]">
                    {thm.renderMockup()}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center pt-4">
            <button
              onClick={() => setShowRegModal(true)}
              className="inline-flex items-center gap-2.5 text-xs font-bold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-blue-500/10 hover:scale-105 active:scale-95 group"
            >
              <span>Explore All Themes</span>
              <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* ========= SECTION 7: SIMPLE, TRANSPARENT PRICING ========= */}
      <section id="pricing" className="py-20 px-6 bg-slate-900/60 border-t border-slate-900 scroll-mt-20">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black text-white">Simple, Transparent Pricing</h2>

            {/* Monthly / Yearly Toggle */}
            <div className="inline-flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${billingCycle === 'monthly' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <span>Yearly</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {[
              {
                key: 'starter' as const,
                name: 'Starter',
                monthlyPrice: '999',
                yearlyPrice: '799',
                desc: 'Perfect for small businesses',
                features: ['1 Website', 'Basic Features', 'Booking Module', 'Email Support']
              },
              {
                key: 'professional' as const,
                name: 'Professional',
                badge: 'Most Popular',
                monthlyPrice: '2,499',
                yearlyPrice: '1,999',
                desc: 'Grow your business faster',
                features: ['5 Websites', 'All Features', 'Unlimited Bookings', 'Priority Support']
              },
              {
                key: 'enterprise' as const,
                name: 'Enterprise',
                monthlyPrice: '9,999',
                yearlyPrice: '7,999',
                desc: 'For large scale operations',
                features: ['Unlimited Websites', 'All Features', 'Dedicated Support', 'Custom Solutions']
              }
            ].map((plan) => {
              const isSelected = selectedPlan === plan.key;
              const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;

              return (
                <div
                  key={plan.key}
                  onMouseEnter={() => setSelectedPlan(plan.key)}
                  onClick={() => setSelectedPlan(plan.key)}
                  className={`rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 cursor-pointer relative ${isSelected
                      ? 'bg-gradient-to-b from-blue-900/30 via-[#070e24] to-slate-950 border-2 border-blue-500 shadow-2xl shadow-blue-500/25 md:scale-105 z-10'
                      : 'bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 md:scale-100 z-0'
                    }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3.5 py-0.5 rounded-full shadow-lg shadow-blue-600/40 uppercase tracking-wider">
                      {plan.badge}
                    </span>
                  )}
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider transition-colors ${isSelected ? 'text-blue-400' : 'text-slate-400'}`}>
                      {plan.name}
                    </p>
                    <div className="mt-4 mb-6">
                      <span className="text-3xl sm:text-4xl font-black text-white">
                        ₹{price}
                      </span>
                      <span className={`text-xs transition-colors ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}> /month</span>
                    </div>
                    <p className={`text-[11px] mb-6 font-medium transition-colors ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                      {plan.desc}
                    </p>
                    <ul className="space-y-3 mb-8 text-xs">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className={`flex items-center gap-2 transition-colors ${isSelected ? 'text-slate-200' : 'text-slate-300'}`}>
                          <Check className="w-3.5 h-3.5 text-blue-400 stroke-[2.5]" /> {feat}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRegPlan(plan.key);
                      setShowRegModal(true);
                    }}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition-all ${isSelected
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/40 hover:scale-[1.02] active:scale-[0.98]'
                        : 'bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700/80 hover:border-slate-600'
                      }`}
                  >
                    Start 14-Day Free Trial
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-slate-500 font-medium">
            No credit card required &nbsp; • &nbsp; Cancel anytime
          </p>
        </div>
      </section>



      {/* ========= SECTION 9: FREQUENTLY ASKED QUESTIONS ========= */}
      <section id="resources" className="py-20 px-6 bg-slate-900/60 border-t border-slate-900 scroll-mt-20">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
              Frequently Asked Questions
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Everything you need to know</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
            {[
              { q: 'What is AnaravOS?', a: 'AnaravOS is a comprehensive, multi-tenant operating system designed for modern service businesses. It provides complete booking pipelines, technician management, dynamic website builders, payments, and analytics in one unified platform.' },
              { q: 'Do you provide booking management?', a: 'Yes, our 10-state booking engine handles guest & customer flows, instant/scheduled/emergency bookings, slot allocations, technician assignments, and live status tracking.' },
              { q: 'How quickly can I launch?', a: 'You can launch your digital platform in under 5 minutes! Simply select your industry pack, configure your branding, and your site and booking engine are immediately live.' },
              { q: 'Can I accept online payments?', a: 'Yes, AnaravOS integrates with UPI, Razorpay, Stripe, and Cash on Delivery with automated GST invoices and direct bank settlements.' },
              { q: 'Can I customize my website?', a: 'Yes, fully! You have access to our dynamic website builder, 6 premium themes, custom colors, fonts, SEO configurations, hero banners, and section toggles.' },
              { q: 'Can multiple employees use the platform?', a: 'Yes, you can add unlimited technicians and staff with role-based access control, skill matching, attendance tracking, and payout calculations.' },
              { q: 'Can I connect my own domain?', a: 'Absolutely. You can connect any custom domain (e.g., yourbrand.com) with automated 1-click SSL provisioning and zero DevOps configuration needed.' },
              { q: 'Can I change themes later?', a: 'Yes, you can switch themes anytime with a single click without losing any of your existing content, bookings, or configuration data.' }
            ].map((faq, i) => (
              <div
                key={i}
                className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 transition-all"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(prev => ({ ...prev, [i]: !prev[i] }))}
                  className="w-full flex justify-between items-center text-left text-xs font-bold text-white hover:text-blue-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <span className="text-slate-400 text-sm ml-2 font-mono">
                    {expandedFaq[i] ? '−' : '+'}
                  </span>
                </button>
                {expandedFaq[i] && (
                  <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed pt-2 border-t border-slate-850">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========= MULTI-COLUMN FOOTER ========= */}
      <footer className="bg-slate-950 text-slate-400 py-16 px-6 border-t border-slate-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <svg className="w-6 h-6 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3C10.3431 3 9 4.34315 9 6C9 7.02795 9.51688 7.93512 10.3045 8.47597L6.87413 14.4175C6.01256 13.8475 4.84365 13.9187 4.05882 14.6545C3.00392 15.6436 2.95679 17.2995 3.9459 18.3544C4.93501 19.4093 6.59092 19.4564 7.64582 18.4673C8.38166 17.6825 8.45283 16.5136 7.88285 15.652L11.3132 9.71044C11.5362 9.76943 11.7645 9.8 12 9.8C12.2355 9.8 12.4638 9.76943 12.6868 9.71044L16.1171 15.652C15.5472 16.5136 15.6183 17.6825 16.3542 18.4673C17.4091 19.4564 19.065 19.4093 20.0541 18.3544C21.0432 17.2995 20.9961 15.6436 19.9412 14.6545C19.1564 13.9187 17.9874 13.8475 17.1259 14.4175L13.6955 8.47597C14.4831 7.93512 15 7.02795 15 6C15 4.34315 13.6569 3 12 3Z" fill="#3B82F6" />
                <circle cx="12" cy="6" r="1.5" fill="#60A5FA" />
                <circle cx="5.8" cy="16.5" r="1.5" fill="#60A5FA" />
                <circle cx="18.2" cy="16.5" r="1.5" fill="#60A5FA" />
              </svg>
              <span className="text-lg font-bold text-white tracking-tight">AnaravOS</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              The all-in-one digital engine for modern service businesses.
            </p>
            <div className="flex gap-3 text-slate-500 text-xs pt-1">
              <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:text-white cursor-pointer transition-colors">𝕏</span>
              <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:text-white cursor-pointer transition-colors">in</span>
              <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:text-white cursor-pointer transition-colors">f</span>
              <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:text-white cursor-pointer transition-colors">▶</span>
            </div>
          </div>

          <div className="md:col-span-2 space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Platform</p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#themes" className="hover:text-white transition-colors">Themes</a></li>
              <li><a href="#industries" className="hover:text-white transition-colors">Industries</a></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Resources</p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#resources" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#resources" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#resources" className="hover:text-white transition-colors">Guides</a></li>
              <li><a href="#resources" className="hover:text-white transition-colors">API Reference</a></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Company</p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a className="hover:text-white transition-colors cursor-pointer">About Us</a></li>
              <li><a className="hover:text-white transition-colors cursor-pointer">Careers</a></li>
              <li><a className="hover:text-white transition-colors cursor-pointer">Contact Us</a></li>
              <li><a className="hover:text-white transition-colors cursor-pointer">Blog</a></li>
              <li>
                <button
                  onClick={() => setShowSuperAdminLogin(true)}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs text-slate-400"
                >
                  <span>Admin Login</span>
                  <Shield className="w-3 h-3 text-blue-400" />
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Legal</p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a className="hover:text-white transition-colors cursor-pointer">Privacy Policy</a></li>
              <li><a className="hover:text-white transition-colors cursor-pointer">Terms of Service</a></li>
              <li><a className="hover:text-white transition-colors cursor-pointer">Refund Policy</a></li>
              <li><a className="hover:text-white transition-colors cursor-pointer">Security</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 AnaravOS. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSuperAdminLogin(true)}
              className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Operator Portal</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All systems operational</span>
            </div>
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
                <div className="relative">
                  <input
                    className="form-input-light pr-10"
                    type={showSaPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={saPass}
                    onChange={e => setSaPass(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSaPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 flex items-center justify-center"
                    aria-label={showSaPass ? 'Hide password' : 'Show password'}
                  >
                    {showSaPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {saError && <p className="text-red-500 text-[11px] font-semibold bg-red-50 border border-red-200 p-2 rounded">{saError}</p>}
              <button type="submit" className="btn-primary w-full py-2.5 text-xs font-bold">
                Bypass & Launch Operator Console
              </button>
              <div className="pt-2 text-center border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Are you a business owner?</span>
                <button
                  type="button"
                  onClick={() => { setShowSuperAdminLogin(false); setShowTenantLogin(true); }}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Tenant Sign In →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===========================
          WELCOME BACK (SIGN IN MODAL)
          =========================== */}
      {showTenantLogin && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-300" onClick={() => setShowTenantLogin(false)}>
          <div className="relative w-full max-w-4xl bg-[#060c1d]/95 border border-slate-800/90 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden backdrop-blur-2xl grid grid-cols-1 lg:grid-cols-12 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>

            {/* Close Button */}
            <button
              onClick={() => setShowTenantLogin(false)}
              className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-slate-900/90 border border-slate-700/80 hover:border-slate-500 flex items-center justify-center text-slate-400 hover:text-white transition-all hover:scale-105 active:scale-95"
              aria-label="Close modal"
            >
              ✕
            </button>

            {/* Left Column: Live Telemetry & Dashboard Visuals */}
            <div className="hidden lg:flex lg:col-span-5 p-7 flex-col justify-between bg-gradient-to-br from-[#091533]/90 via-[#060f24]/95 to-[#030712] border-r border-slate-800/80 relative overflow-hidden">
              {/* Background ambient glows */}
              <div className="absolute -top-10 -left-10 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-4 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[10px] font-extrabold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Anarav TELEMETRY
                </div>

                {/* Floating Widget 1: Service Operations */}
                <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3.5 shadow-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-200">Active Dispatches</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">238 Live</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" />
                  </div>
                </div>

                {/* Floating Widget 2: Interactive SVG Operations Graph */}
                <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3.5 shadow-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-200">Operations Overview</span>
                    <span className="text-[9px] text-blue-400 font-mono">+24.8%</span>
                  </div>
                  <div className="h-20 w-full flex items-end">
                    <svg className="w-full h-full" viewBox="0 0 200 80" fill="none">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d="M0 60 Q 25 35, 50 45 T 100 25 T 150 40 T 200 15 L 200 80 L 0 80 Z" fill="url(#chartGrad)" />
                      <path d="M0 60 Q 25 35, 50 45 T 100 25 T 150 40 T 200 15" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="100" cy="25" r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                      <circle cx="200" cy="15" r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>

                {/* Floating Widget 3: Radial Donut Capacity Gauge */}
                <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3.5 shadow-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-slate-200">System Capacity</p>
                    <p className="text-[9px] text-slate-400">Low latency edge routing</p>
                    <p className="text-[10px] font-mono font-bold text-cyan-400 pt-1">99.99% Uptime</p>
                  </div>
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1e293b" strokeWidth="3.5" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="3.5" strokeDasharray="78, 100" strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-[9px] font-bold text-white font-mono">78%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-3 border-t border-slate-800/80 relative z-10">
                <span>🔒 256-bit AES</span>
                <span>⚡ Multi-Tenant Cloud</span>
              </div>
            </div>

            {/* Right Column: High-End Authentication Card */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-4 bg-[#060c1c]/90">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  {/* Brand Logo & Name */}
                  <div className="flex items-center gap-2">
                    <svg className="w-6 h-6 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                      <path d="M12 3C10.3431 3 9 4.34315 9 6C9 7.02795 9.51688 7.93512 10.3045 8.47597L6.87413 14.4175C6.01256 13.8475 4.84365 13.9187 4.05882 14.6545C3.00392 15.6436 2.95679 17.2995 3.9459 18.3544C4.93501 19.4093 6.59092 19.4564 7.64582 18.4673C8.38166 17.6825 8.45283 16.5136 7.88285 15.652L11.3132 9.71044C11.5362 9.76943 11.7645 9.8 12 9.8C12.2355 9.8 12.4638 9.76943 12.6868 9.71044L16.1171 15.652C15.5472 16.5136 15.6183 17.6825 16.3542 18.4673C17.4091 19.4564 19.065 19.4093 20.0541 18.3544C21.0432 17.2995 20.9961 15.6436 19.9412 14.6545C19.1564 13.9187 17.9874 13.8475 17.1259 14.4175L13.6955 8.47597C14.4831 7.93512 15 7.02795 15 6C15 4.34315 13.6569 3 12 3Z" fill="#3B82F6" />
                      <circle cx="12" cy="6" r="1.5" fill="#60A5FA" />
                      <circle cx="5.8" cy="16.5" r="1.5" fill="#60A5FA" />
                      <circle cx="18.2" cy="16.5" r="1.5" fill="#60A5FA" />
                    </svg>
                    <span className="text-base font-black text-white tracking-tight">AnaravOS</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[9px] font-bold uppercase tracking-wider">
                    LOGIN PAGE
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Welcome back</h2>
                  <p className="text-xs text-slate-400 mt-1">Sign in to continue to your AnaravOS workspace.</p>
                </div>

                {/* Social Login Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => showToast('Google authentication initialized', 'info')}
                    className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => showToast('Apple ID authentication initialized', 'info')}
                    className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <svg className="w-4 h-4 fill-current text-slate-900" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.64 1.35-.56.65-1.06 1.71-.93 2.73 1 .08 2.03-.49 2.65-1.23" />
                    </svg>
                    <span>Continue with Apple</span>
                  </button>
                </div>

                <div className="flex items-center my-2">
                  <div className="flex-1 border-t border-slate-800" />
                  <span className="px-3 text-[9.5px] text-slate-500 uppercase font-mono font-bold tracking-wider">or continue with email</span>
                  <div className="flex-1 border-t border-slate-800" />
                </div>

                {/* Email Form */}
                <form onSubmit={handleTenantLogin} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Email address</label>
                    <input
                      className="w-full bg-[#030712] border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                      type="email"
                      autoComplete="email"
                      placeholder="Enter your email"
                      value={tenantEmail}
                      onChange={e => setTenantEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-slate-300">Password</label>
                      <button
                        type="button"
                        className="text-[10.5px] text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                        onClick={() => toast.info({ title: 'Password Reset', message: 'Please use your workspace password (default: business123).' })}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        className="w-full bg-[#030712] border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 pr-10 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                        type={showTenantPass ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={tenantPass}
                        onChange={e => setTenantPass(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowTenantPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                        aria-label={showTenantPass ? 'Hide password' : 'Show password'}
                      >
                        {showTenantPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      defaultChecked
                    />
                    <label htmlFor="rememberMe" className="text-[11px] text-slate-400 cursor-pointer select-none">
                      Remember me
                    </label>
                  </div>

                  {tenantError && (
                    <p className="text-rose-400 text-[11px] font-semibold bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
                      {tenantError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Sign In</span>
                  </button>
                </form>

                <div className="text-center text-[11px] text-slate-400 pt-1">
                  <span>Don't have an account?</span>{' '}
                  <button
                    type="button"
                    onClick={() => { setShowTenantLogin(false); setShowRegModal(true); }}
                    className="text-blue-400 hover:text-blue-300 font-bold hover:underline"
                  >
                    Create account
                  </button>
                </div>
              </div>

              {/* Bottom Security Trust Badge */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-inner">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-blue-300 leading-tight">Secure authentication</p>
                  <p className="text-[9.5px] text-slate-400 mt-0.5 leading-tight">Your data is protected with industry-standard encryption.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===========================
          SUPER ADMIN LOGIN MODAL
          =========================== */}
      {showSuperAdminLogin && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300" onClick={() => setShowSuperAdminLogin(false)}>
          <div className="relative w-full max-w-sm bg-[#060c1d]/95 border border-slate-800/90 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)] p-6 sm:p-7 space-y-4 backdrop-blur-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowSuperAdminLogin(false)}
              className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 pb-2 border-b border-slate-800/80">
              <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white font-mono tracking-tight">Platform Operator</h2>
                <p className="text-slate-400 text-[10.5px] font-mono">admin@servos.in · admin123</p>
              </div>
            </div>

            <form onSubmit={handleSuperAdminLogin} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Email Address</label>
                <input
                  className="w-full bg-[#030712] border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                  type="email"
                  placeholder="admin@servos.in"
                  value={saEmail}
                  onChange={e => setSaEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <input
                    className="w-full bg-[#030712] border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 pr-10 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                    type={showSaPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={saPass}
                    onChange={e => setSaPass(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSaPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                    aria-label={showSaPass ? 'Hide password' : 'Show password'}
                  >
                    {showSaPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {saError && <p className="text-rose-400 text-[11px] font-semibold bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl">{saError}</p>}
              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all">
                Bypass &amp; Launch Console
              </button>
              <div className="pt-2 text-center border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Business owner?</span>
                <button
                  type="button"
                  onClick={() => { setShowSuperAdminLogin(false); setShowTenantLogin(true); }}
                  className="text-blue-400 font-bold hover:underline"
                >
                  Tenant Sign In →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===========================
          CREATE ACCOUNT MODAL (REGISTRATION)
          =========================== */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300" onClick={() => { setShowRegModal(false); setRegSubmitted(false); }}>
          <div className="relative w-full max-w-md bg-[#060c1d]/95 border border-slate-800/90 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)] p-6 sm:p-7 space-y-4 backdrop-blur-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { setShowRegModal(false); setRegSubmitted(false); }}
              className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>

            <div className="text-center space-y-1 pb-1">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Create your account</h3>
              <p className="text-slate-400 text-xs">Build your business platform in minutes.</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Full Name</label>
                <input
                  className="w-full bg-[#030712] border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                  placeholder="Alex Johnson"
                  value={regOwner}
                  onChange={e => setRegOwner(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Business Name</label>
                <input
                  className="w-full bg-[#030712] border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                  placeholder="e.g. Apex Electrical & HVAC"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-300">Email</label>
                  {isEmailVerified ? (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                      ✓ Verified
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={!regEmail || isSendingOtp || (emailOtpSent && resendCooldown > 0)}
                      className="text-[11px] font-bold text-blue-400 hover:text-blue-300 hover:underline disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSendingOtp ? 'Sending...' : emailOtpSent ? (resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend') : 'Verify'}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    className={`w-full bg-[#030712] border ${isEmailVerified ? 'border-emerald-500/60 focus:border-emerald-500' : 'border-slate-800 focus:border-blue-500'} focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2 ${isEmailVerified ? 'pr-9' : ''} text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner`}
                    type="email"
                    placeholder="alex@apexservices.com"
                    value={regEmail}
                    onChange={e => {
                      setRegEmail(e.target.value);
                      if (isEmailVerified) setIsEmailVerified(false);
                      if (emailOtpSent) setEmailOtpSent(false);
                    }}
                    required
                  />
                  {isEmailVerified && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Inline Email Verification Card */}
              {emailOtpSent && !isEmailVerified && (
                <div className="bg-[#0b132b]/90 border border-blue-500/40 rounded-2xl p-4 space-y-3 animate-fadeIn text-left shadow-2xl backdrop-blur-md">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-blue-300 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Verify Your Email</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[170px]">Sent to {regEmail}</span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-snug">
                    Enter the 6-digit code sent to your email to verify your address:
                  </p>

                  {/* 6 Individual Digit Inputs */}
                  <div className="flex justify-between items-center gap-1.5 sm:gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <input
                        key={index}
                        id={`reg-otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={otpDigits[index]}
                        onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={handleOtpPaste}
                        className="w-10 h-11 text-center font-mono font-bold text-base bg-[#030712] border border-blue-500/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 rounded-xl text-white outline-none shadow-inner transition-all"
                        disabled={isVerifyingOtp}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>

                  {otpError && (
                    <div className="text-[11px] text-red-400 font-medium flex items-center gap-1.5 bg-red-950/40 border border-red-500/30 rounded-lg px-2.5 py-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                      <span>{otpError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>
                        Expires in {Math.floor(otpExpirySeconds / 60).toString().padStart(2, '0')}:{(otpExpirySeconds % 60).toString().padStart(2, '0')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={resendCooldown > 0 || isSendingOtp}
                      className="text-[11px] font-bold text-blue-400 hover:text-blue-300 hover:underline disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSendingOtp ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyInlineOtp}
                    disabled={isVerifyingOtp || otpDigits.join('').length !== 6}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Verify Code</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Phone number</label>
                <input
                  className="w-full bg-[#030712] border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <input
                    className="w-full bg-[#030712] border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2 pr-10 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                    type={showRegPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                  >
                    {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Select your industry</label>
                <select
                  className="w-full bg-[#030712] border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2 text-xs text-white outline-none transition-all shadow-inner"
                  value={regIndustries[0] || 'Electrician'}
                  onChange={e => setRegIndustries([e.target.value])}
                >
                  {INDUSTRY_PACKS.map(p => (
                    <option key={p.id} value={p.name} className="bg-slate-900 text-white">{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-start gap-2 pt-0.5">
                <input type="checkbox" id="termsAgree" className="mt-0.5 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer" defaultChecked required />
                <label htmlFor="termsAgree" className="text-[10px] text-slate-400 leading-tight select-none">
                  I agree to the <span className="text-blue-400 underline cursor-pointer">Terms of Service</span> and <span className="text-blue-400 underline cursor-pointer">Privacy Policy</span>
                </label>
              </div>

              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer">
                Create Workspace
              </button>

              <div className="text-center text-[11px] text-slate-400 pt-1">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setShowRegModal(false); setShowTenantLogin(true); }}
                  className="text-blue-400 hover:text-blue-300 font-bold hover:underline"
                >
                  Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===========================
          VERIFY YOUR EMAIL MODAL
          =========================== */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300" onClick={() => setShowVerifyModal(false)}>
          <div className="relative w-full max-w-sm bg-[#060c1d]/95 border border-slate-800/90 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)] p-6 sm:p-7 space-y-4 backdrop-blur-2xl text-center animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowVerifyModal(false)}
              className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>

            <div className="space-y-1">
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Verify your email</h3>
              <p className="text-slate-400 text-xs">
                Enter the 6-digit code sent to <strong className="text-blue-400 font-mono">{regEmail || 'your email'}</strong>
              </p>
            </div>

            <div className="space-y-5 pt-1">
              {/* 6 OTP Input Boxes */}
              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={otp[index]}
                    onChange={(e) => {
                      const val = e.target.value;
                      const nextOtp = [...otp];
                      nextOtp[index] = val;
                      setOtp(nextOtp);
                      if (val && index < 5) {
                        document.getElementById(`otp-${index + 1}`)?.focus();
                      }
                    }}
                    className="w-10 h-12 rounded-xl bg-[#030712] border border-slate-800 text-center font-bold text-lg text-white focus:border-blue-500 focus:outline-none transition-all shadow-inner"
                  />
                ))}
              </div>

              <div className="space-y-1.5">
                <p className="text-xs text-slate-400">Resend code in <span className="font-bold text-blue-400 font-mono">00:45</span></p>
                <div className="flex items-center justify-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setOtp(['4', '9', '2', '8', '1', '7']);
                      toast.info({ title: 'Code Refreshed', message: 'OTP code 492817 pre-filled for testing.' });
                    }}
                    className="text-slate-400 hover:text-white underline text-[11px]"
                  >
                    Auto-fill Demo OTP
                  </button>
                  <span className="text-slate-700">•</span>
                  <button
                    type="button"
                    onClick={() => toast.info({ title: 'New Code Dispatched', message: `Verification code sent again to ${regEmail || 'your email'}.` })}
                    className="font-bold text-blue-400 hover:underline text-[11px]"
                  >
                    Resend Code
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowVerifyModal(false);
                  toast.success({
                    title: 'Email Verified',
                    message: `Welcome to ${regName || 'your workspace'}! Email ${regEmail} is verified and active.`
                  });
                  setShowTenantLogin(true);
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                Verify &amp; Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
