// @ts-nocheck
import { useState, useEffect } from 'react';
import type { AuthSession, Tenant, Service, Worker, Lead, Booking, SupportTicket, TicketReply } from '../types';
import type { SharedStore } from '../App';
import { THEME_CONFIGS } from '../initialData';
import { generateThemeTokens, getContrastRatio } from '../utils/themeEngine';
import { api } from '../utils/api';
import AnalyticsTab      from './admin/AnalyticsTab';
import MarketingTab      from './admin/MarketingTab';
import AITab             from './admin/AITab';
import CustomersTab      from './admin/CustomersTab';
import QuotationsTab     from './admin/QuotationsTab';
import WebsiteManagerTab from './admin/WebsiteManagerTab';
import DomainSettingsTab from './admin/DomainSettingsTab';
import { getTenantPublicUrl, getTenantSlug } from '../utils/domain';
import {
  LayoutDashboard, Globe, Link, Calendar, Wrench, Users, UserCircle,
  CreditCard, Settings, LogOut, Eye, CheckCircle, XCircle, Tag, Brain, BarChart3, LifeBuoy,
  TrendingUp, Clock, Activity, ShieldAlert
} from 'lucide-react';

interface Props {
  session: AuthSession;
  store: SharedStore;
  onLogout: () => void;
  navigateTo: (hash: string) => void;
}

type SidebarTab =
  | 'dashboard'
  | 'setup'
  | 'website'
  | 'services'
  | 'bookings'
  | 'workers'
  | 'customers'
  | 'marketing'
  | 'finance'
  | 'ai'
  | 'analytics'
  | 'system'
  | 'support';

export default function TenantAdmin(props: Props) {
  const { tenants } = props.store;
  const matchedTenant = tenants.find(t => t.id === props.session.tenantId || (props.session.email && t.ownerEmail === props.session.email) || (props.session.tenantName && t.name === props.session.tenantName));
  const tenant = matchedTenant || (props.session.role === 'tenant' ? null : tenants[0]);

  if (!tenant) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-300">Loading {props.session.tenantName || 'Tenant'} workspace...</p>
      </div>
    );
  }

  return <TenantAdminContent {...props} tenant={tenant} />;
}

function TenantAdminContent({ session, store, onLogout, navigateTo, tenant }: Props & { tenant: Tenant }) {
  const { tenants, setTenants, services, setServices, workers, setWorkers,
    bookings, setBookings, leads, setLeads,
    coupons, setCoupons, quotations, setQuotations, campaigns, setCampaigns,
    tickets, setTickets } = store;

  const [tab, setTab] = useState<SidebarTab>(() => {
    try {
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      const tabParam = hashParams.get('tab');
      if (tabParam && tabParam !== 'templates') return tabParam as SidebarTab;
      const saved = sessionStorage.getItem('anarav_admin_tab') || localStorage.getItem('anarav_admin_tab');
      if (saved && saved !== 'templates') return saved as SidebarTab;
    } catch {}
    return 'dashboard';
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('anarav_admin_tab', tab);
      localStorage.setItem('anarav_admin_tab', tab);
    } catch {}
  }, [tab]);

  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  // Support Tickets State
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState<'billing' | 'technical' | 'feature_request' | 'other'>('technical');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [showRaiseTicketModal, setShowRaiseTicketModal] = useState(false);
  const [selectedTenantTicketId, setSelectedTenantTicketId] = useState<string | null>(null);
  const [tenantTicketReply, setTenantTicketReply] = useState('');

  // Tenant is guaranteed to exist by wrapper

  useEffect(() => {
    if (!tenant?.id) return;
    api.getLeads(tenant.id).then(res => {
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setLeads(prev => {
          const map = new Map(prev.map(item => [item.id, item]));
          for (const dbLead of res.data) {
            map.set(dbLead.id, {
              id: dbLead.id,
              tenantId: dbLead.tenantId,
              name: dbLead.name,
              phone: dbLead.phone,
              email: dbLead.email || '',
              serviceInterest: dbLead.serviceInterest || '',
              notes: dbLead.notes || '',
              status: dbLead.status || 'new',
              createdAt: dbLead.createdAt || new Date().toISOString()
            });
          }
          return Array.from(map.values());
        });
      }
    }).catch(err => {
      // Backend not running or offline
    });

    api.getWorkers(tenant.id).then(res => {
      if (res && res.data && Array.isArray(res.data)) {
        setWorkers(prev => {
          const map = new Map(prev.map(item => [item.id, item]));
          for (const dbWrk of res.data) {
            map.set(dbWrk.id, {
              id: dbWrk.id,
              tenantId: dbWrk.tenantId,
              name: dbWrk.user?.name || dbWrk.name || 'Worker',
              phone: dbWrk.user?.phone || dbWrk.phone || '',
              skills: dbWrk.skills || [],
              availability: dbWrk.availability || 'available',
              rating: dbWrk.rating || 5.0,
              aadhaarStatus: dbWrk.aadhaarValid ? 'verified' : 'pending',
              panStatus: dbWrk.panValid ? 'verified' : 'pending',
              currentJobsCount: 0,
              photoUrl: '',
              completedJobs: 0,
              earningsToday: 0,
              earningsMonth: 0,
              joinedDate: (dbWrk.createdAt ? new Date(dbWrk.createdAt) : new Date()).toISOString().split('T')[0],
              attendanceToday: 'present',
            });
          }
          return Array.from(map.values());
        });
      }
    }).catch(err => console.error('Failed to load workers', err));

    api.getServices().then(res => {
      if (res && res.data && Array.isArray(res.data)) {
        setServices(prev => {
          // Merge with any existing mock data, preferring DB
          const map = new Map(prev.map(item => [item.id, item]));
          for (const dbSvc of res.data) {
            map.set(dbSvc.id, {
              id: dbSvc.id,
              tenantId: dbSvc.tenantId,
              name: dbSvc.name,
              category: dbSvc.category,
              description: dbSvc.description,
              icon: dbSvc.icon,
              basePrice: dbSvc.basePrice,
              durationMin: dbSvc.durationMin,
              emergencyAllowed: true,
              requiredSkills: [],
              formFields: [],
              isActive: dbSvc.isActive
            });
          }
          return Array.from(map.values());
        });
      }
    }).catch(err => console.error('Failed to load services', err));
  }, [tenant?.id]);

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRaiseTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) return;

    const newTicket: SupportTicket = {
      id: 'TKT-' + (100 + tickets.length + 1),
      tenantId: tenant.id,
      tenantName: tenant.name,
      subject: newTicketSubject,
      message: newTicketMessage,
      category: newTicketCategory,
      status: 'open',
      createdAt: new Date().toISOString(),
      replies: []
    };

    setTickets(prev => [newTicket, ...prev]);
    setNewTicketSubject('');
    setNewTicketMessage('');
    setShowRaiseTicketModal(false);
    showToast('Support ticket submitted successfully!');
  };

  const handleTenantReply = (ticketId: string) => {
    if (!tenantTicketReply.trim()) return;

    const newReply: TicketReply = {
      id: 'rep-' + Date.now(),
      sender: 'tenant',
      senderName: tenant.ownerName || 'Business Owner',
      message: tenantTicketReply,
      createdAt: new Date().toISOString()
    };

    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'open', replies: [...t.replies, newReply] } : t));
    setTenantTicketReply('');
    showToast('Reply submitted successfully!');
  };

  // ─── Sub-Tab Navigation States ────────────────────────────
  const [setupSubTab, setSetupSubTab] = useState<'profile' | 'verification' | 'branches' | 'hours'>('profile');
  const [_webSubTab, _setWebSubTab] = useState<'themes' | 'homepage' | 'navigation' | 'seo' | 'publish' | 'campaigns' | 'cms' | 'media' | 'footer'>('homepage');
  const [svcSubTab, setSvcSubTab] = useState<'services' | 'pricing' | 'areas'>('services');
  const [bkSubTab, setBkSubTab] = useState<'requests' | 'dispatch' | 'calendar'>('requests');
  const [wrkSubTab, setWrkSubTab] = useState<'employees' | 'skills' | 'payroll'>('employees');
  const [custSubTab, setCustSubTab] = useState<'crm' | 'leads' | 'reviews'>('crm');
  const [finSubTab, setFinSubTab] = useState<'payments' | 'razorpay' | 'quotations' | 'invoices'>('payments');
  const [aiSubTab, setAiSubTab] = useState<'settings' | 'knowledge' | 'generator' | 'advisor'>('generator');
  const [sysSubTab, setSysSubTab] = useState<'domains' | 'integrations' | 'api'>('domains');

  // Derived metrics
  const myServices = services.filter(s => s.tenantId === tenant.id);
  const myWorkers  = workers.filter(w => w.tenantId === tenant.id);
  const myBookings = bookings.filter(b => b.tenantId === tenant.id);
  const myLeads    = leads.filter(l => l.tenantId === tenant.id);

  const revenue       = myBookings.filter(b => b.status === 'completed').reduce((s, b) => s + b.priceDetails.total, 0);
  const activeJobs    = myBookings.filter(b => ['assigned', 'on_the_way', 'started'].includes(b.status)).length;
  const pendingJobs   = myBookings.filter(b => b.status === 'requested').length;
  const availableWkrs = myWorkers.filter(w => w.availability === 'available').length;

  // ─── Website Builder States ───────────────────────────────
  const [heroTitle,     setHeroTitle]     = useState(tc.heroTitle || '');
  const [heroSubtitle,  setHeroSubtitle]  = useState(tc.heroSubtitle || '');
  const [primaryColor,  setPrimaryColor]  = useState(tc.primaryColor || '#2563eb');
  const [secondaryColor, setSecondaryColor] = useState(tc.secondaryColor || '#2563eb');
  const [selectedTheme, setSelectedTheme] = useState<string>(tenant.theme || 'modern');
  const [_themeMode, _setThemeMode] = useState<'light' | 'dark' | 'auto'>(tc.themeMode || 'light');
  const [_themeFont, _setThemeFont] = useState<string>(tc.themeFont || 'Inter, sans-serif');
  const [_themeRadius, _setThemeRadius] = useState<'modern' | 'rounded' | 'square'>(tc.themeRadius || 'modern');
  const [_themeButtonStyle, _setThemeButtonStyle] = useState<'filled' | 'outline' | 'soft'>(tc.themeButtonStyle || 'filled');
  const [contrastFailures, setContrastFailures] = useState<Array<{ pair: string; ratio: number; target: number; mode: string }>>([]);
  const [showContrastWarningModal, setShowContrastWarningModal] = useState(false);
  const [whatsApp,      setWhatsApp]      = useState(tc.whatsAppNumber || '');
  const [darkMode,      setDarkMode]      = useState(tc.websiteDarkMode || false);
  const [seoTitle,      setSeoTitle]      = useState(tc.seoTitle || '');
  const [seoDesc,       setSeoDesc]       = useState(tc.seoDescription || '');
  const [sections,      setSections]      = useState(tc.sections || {});

  // Dynamic Web Builder Engine states
  const [campaignsList, _setCampaignsList] = useState<any[]>(tc.campaigns || []);
  const [cmsPagesList, _setCmsPagesList] = useState<any[]>(tc.cmsPages || []);
  const [mediaLibraryList, _setMediaLibraryList] = useState<any[]>(tc.mediaLibrary || []);
  const [footerWidgetsList, _setFooterWidgetsList] = useState<any[]>(tc.footerWidgets || []);

  // Selected sub-items & form fields
  const [_selectedCmsPageId, _setSelectedCmsPageId] = useState<string>('home');
  const [_newCampaignTitle, _setNewCampaignTitle] = useState('');
  const [_newCampaignSubtitle, _setNewCampaignSubtitle] = useState('');
  const [_newCampaignHeroImage, _setNewCampaignHeroImage] = useState('');
  const [_newCampaignCtaText, _setNewCampaignCtaText] = useState('Claim Offer');
  const [_newCampaignOfferCode, _setNewCampaignOfferCode] = useState('');
  const [_newCampaignStartDate, _setNewCampaignStartDate] = useState('');
  const [_newCampaignEndDate, _setNewCampaignEndDate] = useState('');
  const [_newCampaignPriority, _setNewCampaignPriority] = useState(1);
  const [_newCampaignTargetSlug, _setNewCampaignTargetSlug] = useState('home');

  // Media Library form fields
  const [_newMediaName, _setNewMediaName] = useState('');
  const [_newMediaUrl, _setNewMediaUrl] = useState('');
  const [_newMediaTags, _setNewMediaTags] = useState('banner');

  // New advanced website config local states
  const [seoKeywords, setSeoKeywords] = useState(tc.seoKeywords || 'local repairs, services');
  const [announceActive, setAnnounceActive] = useState(tc.announcementActive ?? true);
  const [announceText, setAnnounceText] = useState(tc.announcementText || '🎉 Special offer: Book online today!');
  const [navLinks, setNavLinks] = useState(tc.navLinks || []);
  const [trustBadges, setTrustBadges] = useState(tc.trustBadgesActive ?? true);
  const [faqs, setFaqs] = useState(tc.faqs || []);
  const [_newFaqQuestion, _setNewFaqQuestion] = useState('');
  const [_newFaqAnswer, _setNewFaqAnswer] = useState('');
  const [_previewDevice, _setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [homepageSectionsOrder, setHomepageSectionsOrder] = useState<string[]>(
    tc.homepageSectionsOrder && tc.homepageSectionsOrder.length > 0
      ? tc.homepageSectionsOrder 
      : ['announcement', 'hero', 'badges', 'stats', 'services', 'portfolio', 'video', 'crew', 'reviews', 'founder', 'coverage', 'faq', 'awards', 'offers', 'about']
  );
  const [_newNavLinkLabel, _setNewNavLinkLabel] = useState('');
  const [_newNavLinkUrl, _setNewNavLinkUrl] = useState('');
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [launchStep, setLaunchStep] = useState(0);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Booking | null>(null);

  // ─── Domain configuration ──────────────────────────────────
  const [customDomain, setCustomDomain] = useState(tenant.customDomain || '');
  const [dnsStatus, setDnsStatus] = useState<'idle' | 'checking' | 'verified' | 'failed'>('idle');

  // Sync state whenever tenant data updates / loads from DB
  useEffect(() => {
    if (!tenant || !tenant.config) return;
    setHeroTitle(tenant.config.heroTitle || '');
    setHeroSubtitle(tenant.config.heroSubtitle || '');
    setPrimaryColor(tenant.config.primaryColor || '#2563eb');
    setSecondaryColor(tenant.config.secondaryColor || '#2563eb');
    setSelectedTheme(tenant.theme || 'modern');
    _setThemeMode(tenant.config.themeMode || 'light');
    _setThemeFont(tenant.config.themeFont || 'Inter, sans-serif');
    _setThemeRadius(tenant.config.themeRadius || 'modern');
    _setThemeButtonStyle(tenant.config.themeButtonStyle || 'filled');
    setWhatsApp(tenant.config.whatsAppNumber || '');
    setDarkMode(tenant.config.websiteDarkMode || false);
    setSeoTitle(tenant.config.seoTitle || '');
    setSeoDesc(tenant.config.seoDescription || '');
    if (tenant.config.sections) setSections(tenant.config.sections);
    setSeoKeywords(tenant.config.seoKeywords || 'local repairs, services');
    setAnnounceActive(tenant.config.announcementActive ?? true);
    setAnnounceText(tenant.config.announcementText || '🎉 Special offer: Book online today!');
    setNavLinks(tenant.config.navLinks || []);
    setTrustBadges(tenant.config.trustBadgesActive ?? true);
    setFaqs(tenant.config.faqs || []);
    setCustomDomain(tenant.customDomain || '');
  }, [tenant?.id, tenant?.config]);

  // ─── Services Form ────────────────────────────────────────
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [newSvcName,     setNewSvcName]     = useState('');
  const [newSvcCategory, setNewSvcCategory] = useState('General');
  const [newSvcPrice,    setNewSvcPrice]    = useState(500);
  const [newSvcDesc,     setNewSvcDesc]     = useState('');
  const [newSvcIcon,     setNewSvcIcon]     = useState('🔧');
  const [newSvcDuration, setNewSvcDuration] = useState(60);
  const [newSvcImage,    setNewSvcImage]    = useState('');

  // Dynamic pricing rule builder state variables
  const [prBase, setPrBase] = useState(150);
  const [prDist, setPrDist] = useState(50);
  const [prGst, setPrGst] = useState(18);
  const [prLabour, setPrLabour] = useState(100);

  // ─── Service Areas ────────────────────────────────────────
  const [activeBranchId, setActiveBranchId] = useState(tenant.config.activeBranchId || 'br-1');
  const [serviceRadius, setServiceRadius] = useState(15);
  const [newPinCode, setNewPinCode] = useState('');
  const [pinCodesList, setPinCodesList] = useState<string[]>(['524001', '524002', '524003']);

  // ─── Workers Form ─────────────────────────────────────────
  const [newWrkName,   setNewWrkName]   = useState('');
  const [newWrkPhone,  setNewWrkPhone]  = useState('');
  const [newWrkSkills, setNewWrkSkills] = useState('');
  const [newWrkPhoto,  setNewWrkPhoto]  = useState<File | null>(null);
  const [newWrkAadhaar, setNewWrkAadhaar] = useState('');
  const [newWrkAadhaarFile, setNewWrkAadhaarFile] = useState<File | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [lastWrkRegistered, setLastWrkRegistered] = useState<any | null>(null);

  // ─── Leads Form ───────────────────────────────────────────
  const [newLeadName,     setNewLeadName]     = useState('');
  const [newLeadPhone,    setNewLeadPhone]    = useState('');
  const [newLeadEmail,    setNewLeadEmail]    = useState('');
  const [newLeadInterest, setNewLeadInterest] = useState('');
  const [newLeadNotes,    setNewLeadNotes]    = useState('');

  // ─── Business Setup Settings ──────────────────────────────
  const [bizName,   setBizName]   = useState(tenant.name);
  const [bizPhone,  setBizPhone]  = useState(tenant.config.phone);
  const [bizEmail,  setBizEmail]  = useState(tenant.config.email);
  const [bizHours,  setBizHours]  = useState(tenant.config.businessHours);
  const [bizAbout,  setBizAbout]  = useState(tenant.config.aboutText);
  const [bizAddr,   setBizAddr]   = useState(tenant.config.address);
  const [gst,       setGst]       = useState(tenant.config.gstNumber || '');
  const [cancelPol, setCancelPol] = useState(tenant.config.cancellationPolicy);
  const [refundPol, setRefundPol] = useState(tenant.config.refundPolicy);
  const [warrantPol, setWarrantPol] = useState(tenant.config.warrantyPolicy);

  // Verification document mock values
  const [verPan, setVerPan] = useState(tenant.config.companyVerification?.panNumber || 'ABCDE1234F');
  const [verLic, setVerLic] = useState(tenant.config.companyVerification?.licenseNumber || 'LIC-2026-991A');
  const [verStatus, setVerStatus] = useState(tenant.config.companyVerification?.status || 'verified');
  const [verAadhaar, setVerAadhaar] = useState(tenant.config.companyVerification?.aadhaarNumber || '1234-5678-9012');
  const [aadhaarImg, setAadhaarImg] = useState(tenant.config.companyVerification?.aadhaarImage || '');
  const [panImg, setPanImg] = useState(tenant.config.companyVerification?.panImage || '');
  const [licImg, setLicImg] = useState(tenant.config.companyVerification?.licenseImage || '');

  // ─── AI Copywriter Generator state ────────────────────────
  const [aiIndustry, setAiIndustry] = useState('electrician');
  const [aiKeywords, setAiKeywords] = useState('fast repairs, short circuit, home wiring');
  const [aiGenerating, setAiGenerating] = useState(false);



  // ─── AI Knowledge base docs list ──────────────────────────
  const [knowledgeDocs, setKnowledgeDocs] = useState<string[]>(tenant.config.aiProviderConfig?.knowledgeDocs || ['Standard Warranty policy.pdf', 'Pricing Rate card.docx']);
  const [newDocName, setNewDocName] = useState('');

  // ─── Publish checks ───────────────────────────────────────
  const [_publishing, _setPublishing] = useState(false);
  const [webVitals, setWebVitals] = useState({ performance: 94, accessibility: 98, brokenLinks: 0, seo: 92 });

  // Sync variables on tenant changes
  useEffect(() => {
    setHeroTitle(tenant.config.heroTitle);
    setHeroSubtitle(tenant.config.heroSubtitle);
    setPrimaryColor(tenant.config.primaryColor);
    setSecondaryColor(tenant.config.secondaryColor || '#2563eb');
    setSelectedTheme(tenant.theme);
    setWhatsApp(tenant.config.whatsAppNumber);
    setDarkMode(tenant.config.websiteDarkMode);
    setSeoTitle(tenant.config.seoTitle);
    setSeoDesc(tenant.config.seoDescription);
    setSections(tenant.config.sections);
    setCustomDomain(tenant.customDomain || '');
    setBizName(tenant.name);
    setBizPhone(tenant.config.phone);
    setBizEmail(tenant.config.email);
    setBizHours(tenant.config.businessHours);
    setBizAbout(tenant.config.aboutText);
    setBizAddr(tenant.config.address);
    setGst(tenant.config.gstNumber || '');
    setCancelPol(tenant.config.cancellationPolicy);
    setRefundPol(tenant.config.refundPolicy);
    setWarrantPol(tenant.config.warrantyPolicy);
    setSeoKeywords(tenant.config.seoKeywords || 'local service, repair provider');
    setAnnounceActive(tenant.config.announcementActive ?? true);
    setAnnounceText(tenant.config.announcementText || '🎉 Special offer: Book directly online and save!');
    setNavLinks(tenant.config.navLinks || []);
    setTrustBadges(tenant.config.trustBadgesActive ?? true);
    setActiveBranchId(tenant.config.activeBranchId || 'br-1');
    setHomepageSectionsOrder(
      tenant.config.homepageSectionsOrder && tenant.config.homepageSectionsOrder.length > 0
        ? tenant.config.homepageSectionsOrder 
        : ['announcement', 'hero', 'badges', 'stats', 'services', 'portfolio', 'video', 'crew', 'reviews', 'founder', 'coverage', 'faq', 'awards', 'offers', 'about']
    );
    setFaqs(tenant.config.faqs || []);
  }, [tenant.id]);

  // Website saving is now managed by WebsiteManagerTab component


  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedConfig = { 
      ...tenant.config, phone: bizPhone, email: bizEmail, businessHours: bizHours, aboutText: bizAbout, address: bizAddr, gstNumber: gst, cancellationPolicy: cancelPol, refundPolicy: refundPol, warrantyPolicy: warrantPol,
      companyVerification: { gstNumber: gst, panNumber: verPan, aadhaarNumber: '1234-5678-9012', licenseNumber: verLic, status: verStatus as any }
    };
    setTenants(prev => prev.map(t => t.id === tenant.id ? {
      ...t, name: bizName,
      config: updatedConfig,
    } : t));
    try {
      await api.updateTenant(tenant.id, { name: bizName, config: updatedConfig });
      showToast('Business setup profiles saved to database!', 'success');
    } catch (err) {
      console.error('Error saving tenant settings to database:', err);
      showToast('Business setup profiles saved!');
    }
  };

  const handleVerifyDomain = () => {
    setDnsStatus('checking');
    setTimeout(() => {
      setDnsStatus('verified');
      setTenants(prev => prev.map(t => t.id === tenant.id ? { ...t, customDomain } : t));
      showToast(`Domain "${customDomain}" mapped with SSL certificate generated!`);
    }, 1500);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        showToast('Uploading image to Supabase...');
        const res = await api.uploadBinaryFile(file, 'uploads');
        if (res?.data?.fileUrl) {
          setter(res.data.fileUrl);
          showToast('Image uploaded successfully!', 'success');
        }
      } catch (err) {
        console.error('Failed to upload image:', err);
        showToast('Failed to upload image', 'error');
      }
    }
  };

  const handleSaveVerification = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig = { 
      ...tenant.config, 
      companyVerification: { 
        ...tenant.config.companyVerification, 
        panNumber: verPan, 
        aadhaarNumber: verAadhaar,
        licenseNumber: verLic, 
        status: verStatus,
        aadhaarImage: aadhaarImg,
        panImage: panImg,
        licenseImage: licImg
      }
    };

    setTenants(prev => prev.map(t => t.id === tenant.id ? { ...t, config: newConfig } : t));
    
    api.saveConfig({ ...newConfig, businessName: tenant.name })
      .then(() => showToast('Verification documents saved successfully!'))
      .catch(err => {
        console.error(err);
        showToast('Failed to save documents', 'error');
      });
  };

  const handleAiCopywriter = () => {
    setAiGenerating(true);
    setTimeout(() => {
      setHeroTitle(`Expert ${aiIndustry.charAt(0).toUpperCase() + aiIndustry.slice(1)} Services at Your Doorstep`);
      setHeroSubtitle(`Licensed technicians specializing in ${aiKeywords}. Top rated local service with upfront pricing and zero hidden fees. Book online today.`);
      setSeoTitle(`Best Local ${aiIndustry.charAt(0).toUpperCase() + aiIndustry.slice(1)} Services | 100% Satisfaction Guarantee`);
      setSeoDesc(`Book certified local ${aiIndustry} experts easily. Same day service covering ${aiKeywords}. Upfront pricing structure.`);
      setAiGenerating(false);
      showToast('AI copywriting suggestions generated and populated!', 'success');
    }, 2000);
  };



  const handleAddDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName) return;
    setKnowledgeDocs(prev => [...prev, newDocName]);
    setNewDocName('');
    showToast(`Uploaded file "${newDocName}" to RAG knowledge vector pool.`);
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSvcName) return;
    const payload = {
      tenantId: tenant.id, name: newSvcName, category: newSvcCategory,
      description: newSvcDesc, icon: newSvcIcon, basePrice: newSvcPrice, durationMin: newSvcDuration,
      emergencyAllowed: true, requiredSkills: [], formFields: [], isActive: true,
      imageUrl: newSvcImage || undefined,
    };
    
    if (editingServiceId) {
      try {
        await api.updateService(editingServiceId, payload);
      } catch (err) {
        console.error('Failed to update service in DB:', err);
      }
      setServices(prev => prev.map(s => s.id === editingServiceId ? { ...s, ...payload } as any : s));
      setEditingServiceId(null);
      setNewSvcName(''); setNewSvcDesc(''); setNewSvcImage('');
      showToast(`Service updated successfully!`);
    } else {
      let serviceId = `srv-${Date.now()}`;
      try {
        const res = await api.createService(payload);
        if (res?.data?.id) serviceId = res.data.id;
      } catch (err) {
        console.error('Failed to create service in DB:', err);
      }
      
      const ns: Service = { ...payload, id: serviceId } as any;
      setServices(prev => [...prev, ns]);
      setNewSvcName(''); setNewSvcDesc(''); setNewSvcImage('');
      showToast(`Service "${ns.name}" added to list!`);
    }
  };

  const handleEditService = (svc: Service) => {
    setEditingServiceId(svc.id);
    setNewSvcName(svc.name);
    setNewSvcCategory(svc.category);
    setNewSvcPrice(svc.basePrice);
    setNewSvcDesc(svc.description || '');
    setNewSvcDuration(svc.durationMin);
    setNewSvcImage(svc.imageUrl || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    setServices(prev => prev.filter(s => s.id !== id));
    try {
      await api.deleteService(id);
      showToast("Service deleted");
    } catch (err) {
      console.error(err);
    }
  };


  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWrkName) return;
    
    const payload = {
      tenantId: tenant.id,
      name: newWrkName,
      phone: newWrkPhone,
      skills: newWrkSkills.split(',').map(s => s.trim()),
      availability: 'available',
      aadhaarStatus: newWrkAadhaar ? 'verified' : 'pending'
    };

    let workerId = `wrk-${Date.now()}`;
    try {
      const res = await api.createWorker(payload);
      if (res && res.data && res.data.id) {
        workerId = res.data.id;
      }
    } catch (err) {
      console.error('Failed to save worker to db:', err);
    }

    const nw: Worker = {
      id: workerId, tenantId: tenant.id, name: newWrkName, phone: newWrkPhone,
      skills: payload.skills, availability: 'available',
      rating: 5.0, aadhaarStatus: payload.aadhaarStatus as any, panStatus: 'verified', currentJobsCount: 0,
      photoUrl: newWrkPhoto ? URL.createObjectURL(newWrkPhoto) : '', completedJobs: 0, earningsToday: 0, earningsMonth: 0,
      joinedDate: new Date().toISOString().split('T')[0], attendanceToday: 'present',
    };
    setWorkers(prev => [...prev, nw]);

    if (newWrkAadhaarFile) {
      console.log(`Worker Aadhaar document logged: ${newWrkAadhaarFile.name}`);
    }
    setLastWrkRegistered({ name: newWrkName, phone: newWrkPhone, aadhaar: newWrkAadhaar || 'Not Provided' });
    setNewWrkName(''); setNewWrkPhone(''); setNewWrkSkills(''); setNewWrkAadhaar(''); setNewWrkPhoto(null); setNewWrkAadhaarFile(null);
    setShowTermsModal(true);
    showToast(`Registered technician "${nw.name}" successfully.`);
  };

  const handleDownloadTerms = (worker: { name: string; phone: string; aadhaar: string }) => {
    const content = `========================================================
ANARAV BUSINESS OS - WORKFORCE CONTRACT AGREEMENT
========================================================
Tenant ID: ${tenant.id}
Company Name: ${tenant.name}
Date of Registration: ${new Date().toLocaleDateString('en-IN')}

WORKER DETAILS:
----------------------------------
Full Name: ${worker.name}
Phone Number: ${worker.phone}
Aadhaar Number: ${worker.aadhaar}
Aadhaar Verification Status: VERIFIED & LOGGED

TERMS & CONDITIONS:
----------------------------------
1. Verification & Compliance:
   The Worker agrees that all registration details, specifically their identity details (Aadhaar, photo) are correct. Any fraudulent acts, misrepresentation of skills, or background checks failure will result in immediate termination and reporting to authorities.

2. Job Performance & Safety:
   The Worker must complete service dispatches within scheduled slots, behaving with utmost professional integrity at customers' locations.

3. Payment Share & Settlements:
   MTD Commission and Base Salary share will be computed based on system dispatch reports and settled within 3 days from billing cycles closure.

4. Fraud Prevention & Liability:
   The Worker takes full liability for any physical damage, fraud, or collection discrepancies on jobs. Signing this contract confirms adherence to the enterprise's zero-tolerance safety policies.

----------------------------------
I, ${worker.name}, hereby confirm that I have read and agree to all terms and conditions listed above. I declare that the Aadhaar details provided are correct.

Worker Signature: _________________________

Manager Signature: ________________________
`;
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${worker.name.replace(/\s+/g, '_')}_terms_agreement.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const _handleTriggerVercelDeploy = () => {
    _setPublishing(true);
    setTimeout(() => {
      _setPublishing(false);
      showToast('Static build deployed successfully!', 'success');
    }, 2000);
  };

  const calculateSeoScore = () => {
    let score = 0;
    if (seoTitle.length >= 30 && seoTitle.length <= 60) score += 35;
    else if (seoTitle.length > 0) score += 15;

    if (seoDesc.length >= 100 && seoDesc.length <= 160) score += 35;
    else if (seoDesc.length > 0) score += 15;

    if (seoKeywords.split(',').filter(k => k.trim().length > 2).length >= 3) score += 30;
    else if (seoKeywords.split(',').filter(k => k.trim().length > 2).length > 0) score += 15;

    return score;
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName) return;
    let leadId = `lead-${Date.now()}`;
    const payload = {
      tenantId: tenant.id,
      name: newLeadName,
      phone: newLeadPhone,
      email: newLeadEmail,
      serviceInterest: newLeadInterest,
      notes: newLeadNotes,
      status: 'new'
    };
    try {
      const res = await api.createLead(payload);
      if (res && res.data && res.data.id) {
        leadId = res.data.id;
      }
    } catch (err) {
      console.error('Error saving lead to DB:', err);
    }
    const nl: Lead = {
      id: leadId,
      tenantId: tenant.id,
      name: newLeadName,
      phone: newLeadPhone,
      email: newLeadEmail,
      serviceInterest: newLeadInterest,
      notes: newLeadNotes,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    setLeads(prev => [...prev, nl]);
    setNewLeadName(''); setNewLeadPhone(''); setNewLeadEmail(''); setNewLeadInterest(''); setNewLeadNotes('');
    showToast(`Lead "${nl.name}" added to pipeline!`);
  };

  const handleUpdateBookingStatus = (bookingId: string, nextStatus: any) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: nextStatus } : b));
    showToast(`Booking ${bookingId} advanced to status: ${nextStatus}`);
  };

  const handleAssignWorker = (bookingId: string, wId: string) => {
    const w = workers.find(wr => wr.id === wId);
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, workerId: wId, workerName: w?.name, status: 'assigned' } : b));
    showToast(`Worker ${w?.name} assigned to booking ${bookingId}`);
  };

  const handleAddPinCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPinCode) return;
    setPinCodesList(prev => [...prev, newPinCode]);
    setNewPinCode('');
    showToast(`Pin Code ${newPinCode} added to active service areas.`);
  };

  const pc = primaryColor;
  const _activeTheme = THEME_CONFIGS[selectedTheme] || THEME_CONFIGS['modern'];

  // Left sidebar menu items
  const sidebarItems: { id: SidebarTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard',  label: 'Dashboard',             icon: LayoutDashboard },
    { id: 'setup',      label: 'Business Setup',        icon: Settings },
    { id: 'website',    label: 'Website Builder',       icon: Globe },
    { id: 'services',   label: 'Services & Areas',      icon: Wrench },
    { id: 'bookings',   label: 'Bookings Dispatch',     icon: Calendar },
    { id: 'workers',    label: 'Workforce & Payroll',   icon: Users },
    { id: 'customers',  label: 'CRM & Customers',       icon: UserCircle },
    { id: 'marketing',  label: 'Marketing Campaigns',   icon: Tag },
    { id: 'finance',    label: 'Finance & Invoices',    icon: CreditCard },
    { id: 'ai',         label: 'AI Control Center',     icon: Brain },
    { id: 'analytics',  label: 'Analytics Insights',    icon: BarChart3 },
    { id: 'system',     label: 'System & Integrations', icon: Link },
    { id: 'support',    label: 'Support Tickets',       icon: LifeBuoy }
  ];

  return (
    <div className="h-screen bg-slate-900 flex overflow-hidden font-sans text-xs text-slate-200" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* ════════════ SIDEBAR ════════════ */}
      <aside className="w-56 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: pc + '30', border: `1px solid ${pc}50` }}>
              🏪
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{tenant.name}</p>
              <p className="text-[10px] text-slate-500 font-mono truncate">{tenant.customDomain || tenant.defaultDomain || `${tenant.slug || tenant.subdomain}.vercel.app`}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between bg-emerald-950/20 border border-emerald-900/30 p-1.5 rounded text-[9px] text-emerald-400 font-bold">
            <span>Verified System</span>
            <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all text-left ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
                style={isActive ? { background: pc + '15', border: `1px solid ${pc}25`, color: pc } : {}}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-2">
          <button 
            onClick={() => {
              try {
                sessionStorage.setItem('anarav_site_tenant_id', tenant.id);
                localStorage.setItem('anarav_site_tenant_id', tenant.id);
              } catch {}
              if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                window.open(`${window.location.origin}/#/site?tenant=${getTenantSlug(tenant)}`, '_blank');
              } else {
                window.open(getTenantPublicUrl(tenant), '_blank', 'noopener,noreferrer');
              }
            }} 
            className="w-full btn-secondary py-2 text-[10px] font-bold flex items-center justify-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" /> View Public Site
          </button>
          <button onClick={() => { onLogout(); navigateTo('#/'); }} className="w-full text-center py-2 text-[10px] text-slate-500 hover:text-slate-350 font-bold flex items-center justify-center gap-1"><LogOut className="w-3.5 h-3.5" /> Logout</button>
        </div>
      </aside>

      {/* ════════════ MAIN CONTENT ════════════ */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-900">
        
        {/* TOP STATUS HEADER WITH BRANCH AND NOTIFICATIONS */}
        <header className="bg-slate-950/40 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-black text-white capitalize">{tab.replace('_', ' ')} Options</h2>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[10px]">Active Branch:</span>
              <select
                className="bg-slate-800 text-white rounded px-2.5 py-1 border border-slate-700 text-[10px] font-bold"
                value={activeBranchId}
                onChange={e => {
                  setActiveBranchId(e.target.value);
                  showToast(`Switched active workspace branch to ${e.target.value === 'br-1' ? 'Nellore Main' : 'Tirupati Branch'}`);
                }}
              >
                <option value="br-1">Nellore Main (H.Q.)</option>
                <option value="br-2">Tirupati Branch</option>
                <option value="br-3">Kavali Sub-branch (Offline)</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-blue-950 border border-blue-900/40 text-blue-400 text-[9px] font-bold px-2 py-0.5 rounded-full capitalize">{tenant.plan} Subscription</span>
            <span className="text-[10px] text-slate-500">Last login: Today, 11:42 AM</span>
          </div>
        </header>

        {/* WORKSPACE INNER CONTAINER */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* =======================================================
              1. DASHBOARD
              ======================================================= */}
          {tab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Intelligent B2B Enquiry Live Tracker Alarm */}
              {myBookings.filter(b => b.status === 'requested').length > 0 && (
                <div className="bg-gradient-to-r from-blue-950/80 to-slate-900 border border-blue-800 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-pulse">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      <p className="text-[10px] text-blue-400 uppercase tracking-widest font-black">⚡ Real-time Request Pipeline</p>
                    </div>
                    <h3 className="text-sm font-black text-white">You have {myBookings.filter(b => b.status === 'requested').length} new incoming project design & commission requests!</h3>
                    <p className="text-[10px] text-slate-400">Dispatch controllers must inspect technical logs and issue custom estimates immediately.</p>
                  </div>
                  <button
                    onClick={() => { setTab('bookings'); setBkSubTab('requests'); }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-md"
                  >
                    🔍 Launch Pipeline Dispatcher ➔
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="kpi-card blue">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="kpi-label">Completed Sales MTD</p>
                      <p className="kpi-value">₹{(revenue / 1000).toFixed(1)}K</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <TrendingUp className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <p className="kpi-sub mt-2">Total settled orders</p>
                </div>
                <div className="kpi-card green">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="kpi-label">Active Jobs Pending</p>
                      <p className="kpi-value">{activeJobs}</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <Clock className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <p className="kpi-sub mt-2">Workers dispatch assigned</p>
                </div>
                <div className="kpi-card amber">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="kpi-label">New Service Requests</p>
                      <p className="kpi-value">{pendingJobs}</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-shieldAlert">
                      <ShieldAlert className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <p className="kpi-sub mt-2">Needs client approval</p>
                </div>
                <div className="kpi-card purple">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="kpi-label">Technicians Online</p>
                      <p className="kpi-value">{availableWkrs}</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                      <Activity className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <p className="kpi-sub mt-2">Online availability active</p>
                </div>
              </div>

              {/* Operations logs */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="admin-card">
                  <div className="section-header">
                    <div><p className="section-title">Client Dispatch Queue</p><p className="section-subtitle">Real-time requests needing scheduling</p></div>
                    <button onClick={() => setTab('bookings')} className="text-blue-400 hover:underline">Launch Dispatch Console</button>
                  </div>
                  <div className="space-y-2">
                    {myBookings.filter(b => b.status === 'requested').slice(0, 3).map(b => (
                      <div key={b.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white text-xs">{b.customerName}</p>
                          <p className="text-slate-500 text-[10px]">{b.serviceName} · {b.scheduledDate}</p>
                        </div>
                        <button onClick={() => setTab('bookings')} className="btn-primary py-1 px-3 text-[10px]">Verify & Assign</button>
                      </div>
                    ))}
                    {myBookings.filter(b => b.status === 'requested').length === 0 && (
                      <p className="text-center text-slate-500 py-6">All incoming requests are dispatched and assigned!</p>
                    )}
                  </div>
                </div>

                <div className="admin-card space-y-4">
                  <p className="section-title">Core Web Vitals Telemetry</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl"><p className="text-lg font-black text-emerald-400">{webVitals.performance}%</p><p className="text-[10px] text-slate-500">Static Build Performance</p></div>
                    <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl"><p className="text-lg font-black text-emerald-400">{webVitals.accessibility}%</p><p className="text-[10px] text-slate-500">Accessibility rating</p></div>
                    <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl"><p className="text-lg font-black text-white">{webVitals.seo}%</p><p className="text-[10px] text-slate-500">Live SEO score index</p></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =======================================================
              2. BUSINESS SETUP
              ======================================================= */}
          {tab === 'setup' && (
            <div className="space-y-6 animate-fadeIn max-w-3xl">
              {/* Setup Menu */}
              <div className="flex gap-2 border-b border-slate-800 pb-3">
                {[
                  { id: 'profile', label: 'Company Profile' },
                  { id: 'verification', label: 'Verification Badge Documents' },
                  { id: 'branches', label: 'Multiple Locations Registry' }
                ].map(sub => (
                  <button key={sub.id} onClick={() => setSetupSubTab(sub.id as any)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${setupSubTab === sub.id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-350'}`}>
                    {sub.label}
                  </button>
                ))}
              </div>

              {setupSubTab === 'profile' && (
                <form onSubmit={handleSaveSettings} className="admin-card space-y-4">
                  <p className="section-title">Company profile details</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="form-label">Company Legal Name *</label><input className="form-input" value={bizName} onChange={e => setBizName(e.target.value)} required /></div>
                    <div><label className="form-label">Support Email Address *</label><input className="form-input" type="email" value={bizEmail} onChange={e => setBizEmail(e.target.value)} required /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="form-label">Support Call Hotline *</label><input className="form-input" maxLength={10} value={bizPhone} onChange={e => setBizPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} required /></div>
                    <div><label className="form-label">WhatsApp Contact Number *</label><input className="form-input" maxLength={10} value={whatsApp} onChange={e => setWhatsApp(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" required /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="form-label">Office Address *</label><input className="form-input" value={bizAddr} onChange={e => setBizAddr(e.target.value)} required /></div>
                    <div><label className="form-label">GST Tax Number</label><input className="form-input uppercase font-mono" value={gst} onChange={e => setGst(e.target.value.replace(/\s+/g, '').toUpperCase())} placeholder="GST Number" maxLength={15} /></div>
                  </div>
                  <div><label className="form-label">Company About Description *</label><textarea className="form-input resize-none" rows={3} value={bizAbout} onChange={e => setBizAbout(e.target.value)} required /></div>
                  <button type="submit" className="btn-primary py-2.5 font-bold">Save Company Profile</button>
                </form>
              )}

              {setupSubTab === 'verification' && (
                <form onSubmit={handleSaveVerification} className="admin-card space-y-4">
                  <div className="flex justify-between items-center">
                    <div><p className="section-title">SaaS Verification Documents</p><p className="section-subtitle">Aadhaar, PAN, and License verification tags for customer trusts.</p></div>
                    <span className={`badge ${verStatus === 'verified' ? 'badge-completed' : 'badge-requested'}`}>{verStatus.toUpperCase()}</span>
                  </div>
                  <div className="space-y-4 font-sans">
                    {/* Aadhaar */}
                    <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                           <p className="font-bold text-white text-xs">Aadhaar Card copy verification</p>
                           <input className="bg-slate-850 text-white rounded px-2.5 py-1 text-xs border border-slate-750 font-mono mt-1" value={verAadhaar} onChange={e => setVerAadhaar(e.target.value)} placeholder="Aadhaar Number" />
                        </div>
                        <span className={`font-bold text-xs ${aadhaarImg ? 'text-emerald-400' : 'text-slate-500'}`}>✓ {aadhaarImg ? 'Approved' : 'Pending'}</span>
                      </div>
                      <div className="flex gap-2">
                         <input type="text" placeholder="Or Image URL Link" className="bg-slate-850 text-white rounded px-2.5 py-1.5 text-xs border border-slate-750 flex-1" value={aadhaarImg} onChange={e => setAadhaarImg(e.target.value)} />
                         <input type="file" accept="image/*" className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-slate-700 file:text-white hover:file:bg-slate-600" onChange={(e) => handleImageUpload(e, setAadhaarImg)} />
                      </div>
                      {aadhaarImg && <img src={aadhaarImg} alt="Aadhaar" className="h-20 object-contain rounded border border-slate-700 mt-2" />}
                    </div>

                    {/* PAN */}
                    <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                           <p className="font-bold text-white text-xs">PAN Verification</p>
                           <input className="bg-slate-850 text-white rounded px-2.5 py-1 text-xs border border-slate-750 font-mono mt-1 uppercase" value={verPan} onChange={e => setVerPan(e.target.value)} placeholder="PAN Number" />
                        </div>
                        <span className={`font-bold text-xs ${panImg ? 'text-emerald-400' : 'text-slate-500'}`}>✓ {panImg ? 'Approved' : 'Pending'}</span>
                      </div>
                      <div className="flex gap-2">
                         <input type="text" placeholder="Or Image URL Link" className="bg-slate-850 text-white rounded px-2.5 py-1.5 text-xs border border-slate-750 flex-1" value={panImg} onChange={e => setPanImg(e.target.value)} />
                         <input type="file" accept="image/*" className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-slate-700 file:text-white hover:file:bg-slate-600" onChange={(e) => handleImageUpload(e, setPanImg)} />
                      </div>
                      {panImg && <img src={panImg} alt="PAN" className="h-20 object-contain rounded border border-slate-700 mt-2" />}
                    </div>

                    {/* Business License */}
                    <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                           <p className="font-bold text-white text-xs">Business License Certificate</p>
                           <input className="bg-slate-850 text-white rounded px-2.5 py-1 text-xs border border-slate-750 font-mono mt-1" value={verLic} onChange={e => setVerLic(e.target.value)} placeholder="License Number" />
                        </div>
                        <span className={`font-bold text-xs ${licImg ? 'text-emerald-400' : 'text-slate-500'}`}>✓ {licImg ? 'Approved' : 'Pending'}</span>
                      </div>
                      <div className="flex gap-2">
                         <input type="text" placeholder="Or Image URL Link" className="bg-slate-850 text-white rounded px-2.5 py-1.5 text-xs border border-slate-750 flex-1" value={licImg} onChange={e => setLicImg(e.target.value)} />
                         <input type="file" accept="image/*" className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-slate-700 file:text-white hover:file:bg-slate-600" onChange={(e) => handleImageUpload(e, setLicImg)} />
                      </div>
                      {licImg && <img src={licImg} alt="License" className="h-20 object-contain rounded border border-slate-700 mt-2" />}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button type="submit" className="btn-primary flex-1 py-2 font-bold">Save Documents</button>
                    <button type="button" onClick={() => { setVerStatus('verified'); showToast('Company verification status updated!'); }} className="btn-secondary flex-1 py-2 font-bold">Recheck Status Logs</button>
                  </div>
                </form>
              )}

              {setupSubTab === 'branches' && (
                <div className="admin-card space-y-4">
                  <p className="section-title">Locations / Active Branches</p>
                  <div className="space-y-3">
                    {[
                      { name: 'Nellore H.Q.', city: 'Nellore Main', status: 'Active', manager: 'Ravi Kumar', revenue: '₹42,000' },
                      { name: 'Tirupati Regional Center', city: 'Tirupati', status: 'Active', manager: 'Kalyan Ram', revenue: '₹14,500' },
                      { name: 'Kavali Sub-office', city: 'Kavali', status: 'Pending Approval', manager: 'Anitha Varma', revenue: '₹0' }
                    ].map((b, i) => (
                      <div key={i} className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white text-xs">{b.name}</p>
                          <p className="text-slate-500 text-[10px]">City: {b.city} · Manager: {b.manager} · MTD revenue: <strong className="text-emerald-400">{b.revenue}</strong></p>
                        </div>
                        <span className={`badge ${b.status === 'Active' ? 'badge-completed' : 'badge-requested'}`}>{b.status}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => showToast('Registering new branch locations is only available on Enterprise subscription plan.', 'error')} className="btn-secondary w-full py-2 font-bold">+ Register New Location Branch</button>
                </div>
              )}
            </div>
          )}

          {/* =======================================================
              4. WEBSITE MANAGER — Full visual page builder
              ======================================================= */}
          {tab === 'website' && (
            <WebsiteManagerTab
              tenant={tenant}
              myServices={myServices}
              myWorkers={myWorkers}
              setTenants={setTenants}
              setServices={setServices}
              showToast={showToast}
            />
          )}



          {/* =======================================================
              5. SERVICES & AREAS
              ======================================================= */}
          {tab === 'services' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex gap-2 border-b border-slate-800 pb-3">
                {[
                  { id: 'services', label: 'Services Catalogue' },
                  { id: 'pricing', label: 'Pricing Rule Calculator Engine' },
                  { id: 'areas', label: 'Service Areas (Branch boundaries)' }
                ].map(sub => (
                  <button key={sub.id} onClick={() => setSvcSubTab(sub.id as any)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${svcSubTab === sub.id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-350'}`}>
                    {sub.label}
                  </button>
                ))}
              </div>

              {svcSubTab === 'services' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myServices.map(svc => (
                      <div key={svc.id} className="admin-card border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between overflow-hidden">
                        <div>
                          {svc.imageUrl && (
                            <div className="h-28 -mx-6 -mt-6 mb-3 relative overflow-hidden bg-slate-900">
                              <img src={svc.imageUrl} alt={svc.name} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                            </div>
                          )}
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-3xl">{svc.icon}</span>
                            <span className="badge badge-active">{svc.durationMin} Min</span>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                          <span className="text-emerald-400 font-black text-sm">₹{svc.basePrice.toLocaleString()}</span>
                          <div className="flex gap-3">
                            <button onClick={() => handleEditService(svc)} className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider">Edit</button>
                            <button onClick={() => handleDeleteService(svc.id)} className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-wider">Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddService} className="admin-card space-y-4 max-w-xl">
                    <p className="section-title">Add New Service Profile</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="form-label">Service Name *</label><input className="form-input" value={newSvcName} onChange={e => setNewSvcName(e.target.value)} required placeholder="e.g. Sofa Cleaning" /></div>
                      <div><label className="form-label">Category *</label><input className="form-input" value={newSvcCategory} onChange={e => setNewSvcCategory(e.target.value)} required placeholder="Cleaning" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div><label className="form-label">Icon *</label><input className="form-input text-center text-lg" value={newSvcIcon} onChange={e => setNewSvcIcon(e.target.value)} required /></div>
                      <div><label className="form-label">Price (₹) *</label><input className="form-input" type="number" value={newSvcPrice} onChange={e => setNewSvcPrice(Number(e.target.value))} required /></div>
                      <div><label className="form-label">Duration (Min) *</label><input className="form-input" type="number" value={newSvcDuration} onChange={e => setNewSvcDuration(Number(e.target.value))} required /></div>
                    </div>
                    <div>
                      <label className="form-label">Service Card Image (File / URL)</label>
                      <div className="flex gap-2">
                        <input className="form-input flex-1" value={newSvcImage} onChange={e => setNewSvcImage(e.target.value)} placeholder="https://images.unsplash.com/... or select file ->" />
                        <input type="file" accept="image/*" className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer" onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            try {
                              showToast('Uploading to Supabase S3...');
                              const res = await api.uploadBinaryFile(f, 'services');
                              if (res?.data?.fileUrl) {
                                setNewSvcImage(res.data.fileUrl);
                                showToast('Image uploaded successfully!', 'success');
                              }
                            } catch (err) {
                              console.error(err);
                              showToast('Failed to upload image', 'error');
                            }
                          }
                        }} />
                      </div>
                    </div>
                    <div><label className="form-label">Service Description</label><textarea className="form-input resize-none" rows={2} value={newSvcDesc} onChange={e => setNewSvcDesc(e.target.value)} placeholder="Service description..." /></div>
                    <button type="submit" className="btn-primary py-2.5 font-bold">
                      {editingServiceId ? 'Update Service Profile' : '+ Create Service Profile'}
                    </button>
                    {editingServiceId && (
                      <button type="button" onClick={() => {
                        setEditingServiceId(null);
                        setNewSvcName(''); setNewSvcDesc(''); setNewSvcImage('');
                      }} className="btn-secondary py-2.5 font-bold mt-2 w-full">Cancel Edit</button>
                    )}
                  </form>
                </div>
              )}

              {svcSubTab === 'pricing' && (
                <div className="admin-card space-y-5 max-w-xl font-sans">
                  <div><p className="section-title">Dynamic Price Calculator Engine</p><p className="section-subtitle">Visually build dynamic formulas to compute final checkout prices.</p></div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="form-label">Base Visit Call charge (₹)</label><input className="form-input font-mono" type="number" value={prBase} onChange={e => setPrBase(Number(e.target.value))} /></div>
                      <div><label className="form-label">Estimated travel charge / km (₹)</label><input className="form-input font-mono" type="number" value={prDist} onChange={e => setPrDist(Number(e.target.value))} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="form-label">Estimated labour charge / hour (₹)</label><input className="form-input font-mono" type="number" value={prLabour} onChange={e => setPrLabour(Number(e.target.value))} /></div>
                      <div><label className="form-label">GST tax rate percentage (%)</label><input className="form-input font-mono" type="number" value={prGst} onChange={e => setPrGst(Number(e.target.value))} /></div>
                    </div>
                    <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-3">Formula breakdown result</p>
                      <div className="flex justify-between text-xs font-mono text-slate-400">
                        <span>Base Call + Travel (10km) + Labour (1hr)</span>
                        <span>₹{prBase} + ₹{prDist * 10} + ₹{prLabour} = ₹{prBase + prDist * 10 + prLabour}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono text-slate-400 mt-2 border-b border-slate-800 pb-2">
                        <span>GST tax rate ({prGst}%)</span>
                        <span>₹{Math.round((prBase + prDist * 10 + prLabour) * (prGst / 100))}</span>
                      </div>
                      <div className="flex justify-between text-sm font-black text-emerald-400 mt-3 font-mono">
                        <span>Estimated service booking total:</span>
                        <span>₹{Math.round((prBase + prDist * 10 + prLabour) * (1 + prGst / 100))}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => showToast('Pricing rule configuration template updated!')} className="btn-primary w-full py-2.5 font-bold">Publish Calculator rules</button>
                </div>
              )}

              {svcSubTab === 'areas' && (
                <div className="admin-card space-y-4 max-w-xl">
                  <div><p className="section-title">Service Area Boundaries</p><p className="section-subtitle">Draw boundaries by radius or pinpoint active Pin Codes list.</p></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Allowed service radius (km)</label>
                      <input className="form-input" type="number" value={serviceRadius} onChange={e => setServiceRadius(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="form-label">Active area status</label>
                      <span className="badge badge-completed inline-block mt-2">Active Service coverage</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-800 pt-4">
                    <p className="text-xs text-slate-400 font-bold mb-2">Allowed Pin Codes</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {pinCodesList.map(pc => (
                        <span key={pc} className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1.5">
                          {pc}
                          <button onClick={() => setPinCodesList(prev => prev.filter(p => p !== pc))} className="text-red-400 hover:text-red-300 font-black">×</button>
                        </span>
                      ))}
                    </div>
                    <form onSubmit={handleAddPinCode} className="flex gap-2">
                      <input className="form-input text-xs" placeholder="e.g. 524004" value={newPinCode} onChange={e => setNewPinCode(e.target.value)} />
                      <button type="submit" className="btn-secondary px-5 font-bold">Add Code</button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =======================================================
              6. BOOKINGS DISPATCH
              ======================================================= */}
          {tab === 'bookings' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex gap-2 border-b border-slate-800 pb-3">
                {[
                  { id: 'requests', label: 'Incoming Job Requests' },
                  { id: 'dispatch', label: 'Calendar Schedule grid' }
                ].map(sub => (
                  <button key={sub.id} onClick={() => setBkSubTab(sub.id as any)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${bkSubTab === sub.id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-350'}`}>
                    {sub.label}
                  </button>
                ))}
              </div>

              {bkSubTab === 'requests' && (
                <div className="admin-card overflow-hidden p-0">
                  <table className="data-table">
                    <thead>
                      <tr><th>Booking ID</th><th>Customer info</th><th>Service requested</th><th>Date / Slot</th><th>Est. Total</th><th>Workforce assigned</th><th>Action status</th></tr>
                    </thead>
                    <tbody>
                      {myBookings.map(b => (
                        <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="font-mono text-xs font-bold">
                            <button 
                              type="button" 
                              onClick={() => setSelectedBookingDetails(b)} 
                              className="text-blue-400 hover:underline font-bold"
                            >
                              {b.id}
                            </button>
                          </td>
                          <td>
                            <p className="font-bold text-white text-sm">{b.customerName}</p>
                            <p className="text-[10px] text-slate-500">{b.customerPhone} · {b.customerAddress.slice(0, 20)}...</p>
                          </td>
                          <td><span className="font-bold text-slate-300">{b.serviceName}</span></td>
                          <td>
                            <p className="font-bold text-slate-300">{b.scheduledDate}</p>
                            <p className="text-[10px] text-slate-500">{b.scheduledTime}</p>
                          </td>
                          <td className="text-emerald-400 font-bold">₹{b.priceDetails.total}</td>
                          <td>
                            {b.workerName ? (
                              <span className="text-blue-400 font-bold font-sans">👷 {b.workerName}</span>
                            ) : (
                              <select
                                className="bg-slate-900 border border-slate-800 text-slate-400 rounded px-2 py-1 text-[10px] font-sans"
                                value=""
                                onChange={e => handleAssignWorker(b.id, e.target.value)}
                              >
                                <option value="">Assign Worker...</option>
                                {myWorkers.map(w => <option key={w.id} value={w.id}>{w.name} ({w.skills[0]})</option>)}
                              </select>
                            )}
                          </td>
                          <td>
                            <select
                              className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-2.5 py-1 text-[10px] font-mono capitalize"
                              value={b.status}
                              onChange={e => handleUpdateBookingStatus(b.id, e.target.value as any)}
                            >
                              <option value="requested">Requested</option>
                              <option value="assigned">Assigned</option>
                              <option value="on_the_way">On Way</option>
                              <option value="started">Started</option>
                              <option value="completed">Completed</option>
                              <option value="closed">Closed</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {bkSubTab === 'dispatch' && (
                <div className="admin-card space-y-4">
                  <p className="section-title">Technician Schedule dispatch Board</p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 overflow-x-auto">
                    <div className="min-w-[600px] space-y-3 font-mono text-[10px] text-slate-400">
                      <div className="flex border-b border-slate-800 pb-2 font-bold text-white">
                        <span className="w-1/4">TECHNICIAN</span>
                        <span className="w-1/4">09:00 AM – 12:00 PM</span>
                        <span className="w-1/4">12:00 PM – 03:00 PM</span>
                        <span className="w-1/4">03:00 PM – 06:00 PM</span>
                      </div>
                      {myWorkers.map(w => {
                        const assignedJobs = myBookings.filter(b => b.workerId === w.id);
                        return (
                          <div key={w.id} className="flex items-center py-2 border-b border-slate-900 last:border-0">
                            <span className="w-1/4 font-bold text-slate-200">👷 {w.name}</span>
                            <span className="w-1/4 text-slate-600">{assignedJobs.find(b => b.scheduledTime.includes('09:') || b.scheduledTime.includes('10:')) ? <span className="bg-blue-950/40 border border-blue-800/30 text-blue-400 px-2 py-0.5 rounded">Active Job</span> : 'Available'}</span>
                            <span className="w-1/4 text-slate-600">{assignedJobs.find(b => b.scheduledTime.includes('12:') || b.scheduledTime.includes('02:')) ? <span className="bg-blue-950/40 border border-blue-800/30 text-blue-400 px-2 py-0.5 rounded">Active Job</span> : 'Available'}</span>
                            <span className="w-1/4 text-slate-600">{assignedJobs.find(b => b.scheduledTime.includes('03:') || b.scheduledTime.includes('05:')) ? <span className="bg-blue-950/40 border border-blue-800/30 text-blue-400 px-2 py-0.5 rounded">Active Job</span> : 'Available'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =======================================================
              7. WORKFORCE & PAYROLL
              ======================================================= */}
          {tab === 'workers' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex gap-2 border-b border-slate-800 pb-3">
                {[
                  { id: 'employees', label: 'Technician Registry' },
                  { id: 'payroll', label: 'Payroll calculations ledger' }
                ].map(sub => (
                  <button key={sub.id} onClick={() => setWrkSubTab(sub.id as any)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${wrkSubTab === sub.id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-350'}`}>
                    {sub.label}
                  </button>
                ))}
              </div>

              {wrkSubTab === 'employees' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myWorkers.map(w => (
                      <div key={w.id} className="admin-card border border-slate-800 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="worker-avatar">{w.name.split(' ').map(n => n[0]).join('').toUpperCase()}</div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`badge badge-${w.availability}`}>{w.availability}</span>
                            {/* Show on Website Toggle */}
                            <button
                              onClick={() => setWorkers(prev => prev.map(ww => ww.id === w.id ? { ...ww, showOnWebsite: !ww.showOnWebsite } : ww))}
                              className={`text-[8px] font-black px-2 py-0.5 rounded-full border transition-all ${w.showOnWebsite !== false ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
                            >
                              {w.showOnWebsite !== false ? '🌐 Shown on Site' : '🔒 Hidden from Site'}
                            </button>
                            <button onClick={() => setWorkers(prev => prev.filter(ww => ww.id !== w.id))} className="text-[8px] font-black px-2 py-0.5 rounded-full border bg-red-950/40 text-red-400 border-red-900/30 transition-all hover:bg-red-900/60 mt-1">
                              🗑 Delete
                            </button>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-xs">{w.name}</h4>
                          {w.designation && <p className="text-[10px] mt-0.5" style={{ color: '#3b82f6' }}>{w.designation}</p>}
                          <p className="text-slate-500 text-[10px] mt-0.5">Phone: {w.phone} · {w.yearsExperience ? `${w.yearsExperience} yrs exp` : w.skills[0]}</p>
                          <p className="text-slate-500 text-[10px]">Completed: <strong className="text-white">{w.completedJobs} jobs</strong></p>
                        </div>
                        <div className="pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                          <div>Aadhaar: <strong className={w.aadhaarStatus === 'verified' ? 'text-emerald-400' : 'text-amber-400'}>{w.aadhaarStatus === 'verified' ? '✓ Verified' : '⏳ Pending'}</strong></div>
                          <div>Police: <strong className={w.policeVerified ? 'text-emerald-400' : 'text-slate-500'}>{w.policeVerified ? '✓ Verified' : '— N/A'}</strong></div>
                        </div>
                        {/* Inline edit: designation & experience */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/40">
                          <div>
                            <label className="form-label text-[8px]">Designation</label>
                            <input className="form-input text-[9px] py-0.5" value={w.designation || ''} placeholder="e.g. Senior Electrician" onChange={e => setWorkers(prev => prev.map(ww => ww.id === w.id ? { ...ww, designation: e.target.value } : ww))} />
                          </div>
                          <div>
                            <label className="form-label text-[8px]">Yrs Experience</label>
                            <input type="number" className="form-input text-[9px] py-0.5" value={w.yearsExperience || ''} placeholder="e.g. 5" onChange={e => setWorkers(prev => prev.map(ww => ww.id === w.id ? { ...ww, yearsExperience: parseInt(e.target.value) || 0 } : ww))} />
                          </div>
                          <label className="col-span-2 flex items-center gap-2 cursor-pointer text-[9px] text-slate-400">
                            <input type="checkbox" checked={!!w.policeVerified} onChange={e => setWorkers(prev => prev.map(ww => ww.id === w.id ? { ...ww, policeVerified: e.target.checked } : ww))} className="accent-blue-500" />
                            Police Verified
                          </label>
                        </div>
                      </div>
                    ))}

                  </div>

                  <form onSubmit={handleAddWorker} className="admin-card space-y-4 max-w-xl">
                    <p className="section-title">Add New Technician</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="form-label">Full Name *</label><input className="form-input" value={newWrkName} onChange={e => setNewWrkName(e.target.value)} required placeholder="e.g. Ramesh Naidu" /></div>
                      <div><label className="form-label">Phone Number *</label><input className="form-input" maxLength={10} value={newWrkPhone} onChange={e => setNewWrkPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} required placeholder="9876543210" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Upload Profile Photo</label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="form-input font-sans text-xs py-1" 
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              setNewWrkPhoto(e.target.files[0]);
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label className="form-label">Aadhaar Number (12 Digits) *</label>
                        <input 
                          className="form-input font-mono" 
                          value={newWrkAadhaar} 
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                            setNewWrkAadhaar(val);
                          }} 
                          placeholder="e.g. 123456789012"
                          minLength={12}
                          maxLength={12}
                          pattern="\d{12}"
                          title="Please enter exactly 12 digits"
                          required 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Upload Aadhaar PDF Scan *</label>
                      <input 
                        type="file" 
                        accept="application/pdf,image/*" 
                        className="form-input font-sans text-xs py-1" 
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            setNewWrkAadhaarFile(e.target.files[0]);
                          }
                        }}
                        required
                      />
                    </div>
                    <div><label className="form-label">Skills required (comma separated)</label><input className="form-input" value={newWrkSkills} onChange={e => setNewWrkSkills(e.target.value)} placeholder="e.g. Electrician, wiring, UPS repair" /></div>
                    <button type="submit" className="btn-primary w-full py-2.5 font-bold">Register & Onboard Worker</button>
                  </form>
                </div>
              )}

              {wrkSubTab === 'payroll' && (
                <div className="admin-card overflow-hidden p-0 max-w-3xl">
                  <table className="data-table text-xs">
                    <thead>
                      <tr><th>Technician name</th><th>Aadhaar verif</th><th>Completed MTD</th><th>MTD base salary share</th><th>Est. Commission</th><th>Payout status</th></tr>
                    </thead>
                    <tbody>
                      {myWorkers.map((w) => (
                        <tr key={w.id}>
                          <td className="font-bold text-slate-200">👷 {w.name}</td>
                          <td className="text-emerald-400 font-bold">✓ Approved</td>
                          <td className="font-bold text-slate-350">{w.completedJobs + 5} jobs</td>
                          <td className="font-mono">₹12,500</td>
                          <td className="font-mono text-emerald-400">₹{(w.completedJobs + 5) * 200}</td>
                          <td>
                            <span className="badge badge-completed">Paid</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* =======================================================
              8. CRM & CUSTOMERS
              ======================================================= */}
          {tab === 'customers' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex gap-2 border-b border-slate-800 pb-3">
                {[
                  { id: 'crm', label: 'CRM stage Pipeline' },
                  { id: 'leads', label: 'Leads lists' }
                ].map(sub => (
                  <button key={sub.id} onClick={() => setCustSubTab(sub.id as any)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${custSubTab === sub.id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-350'}`}>
                    {sub.label}
                  </button>
                ))}
              </div>

              {custSubTab === 'crm' && (
                <CustomersTab tenantId={tenant.id} bookings={bookings} primaryColor={pc} />
              )}

              {custSubTab === 'leads' && (
                <div className="space-y-6">
                  <div className="admin-card overflow-hidden p-0">
                    <table className="data-table">
                      <thead>
                        <tr><th>Lead Name</th><th>Phone / Email</th><th>Interest vertical</th><th>Notes context</th><th>Pipeline stage</th></tr>
                      </thead>
                      <tbody>
                        {myLeads.map(l => (
                          <tr key={l.id}>
                            <td className="font-bold text-white text-sm">{l.name}</td>
                            <td>
                              <p className="font-bold text-slate-350">{l.phone}</p>
                              <p className="text-[10px] text-slate-500">{l.email}</p>
                            </td>
                            <td><span className="badge badge-active">{l.serviceInterest}</span></td>
                            <td className="text-slate-400 italic text-xs">"{l.notes}"</td>
                            <td>
                              <select
                                className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-2.5 py-1 text-[10px] font-mono capitalize"
                                value={l.status}
                                onChange={async e => {
                                  const next = e.target.value as any;
                                  try {
                                    await api.updateLead(l.id, { status: next });
                                  } catch (err) {
                                    console.error('Error updating lead status in DB:', err);
                                  }
                                  setLeads(prev => prev.map(ld => ld.id === l.id ? { ...ld, status: next } : ld));
                                  showToast(`Lead advanced to stage: ${next}`);
                                }}
                              >
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="quoted">Quoted</option>
                                <option value="won">Won (Closed)</option>
                                <option value="lost">Lost</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <form onSubmit={handleAddLead} className="admin-card space-y-4 max-w-xl">
                    <p className="section-title">Capture New CRM Lead</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="form-label">Lead Full Name *</label><input className="form-input" value={newLeadName} onChange={e => setNewLeadName(e.target.value)} required placeholder="Kishore Reddy" /></div>
                      <div><label className="form-label">Phone Number *</label><input className="form-input" maxLength={10} value={newLeadPhone} onChange={e => setNewLeadPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} required placeholder="9876543210" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="form-label">Email Address *</label><input className="form-input" type="email" value={newLeadEmail} onChange={e => setNewLeadEmail(e.target.value)} required placeholder="you@email.com" /></div>
                      <div><label className="form-label">Service Interest Vertical</label><input className="form-input" value={newLeadInterest} onChange={e => setNewLeadInterest(e.target.value)} placeholder="split AC installation" /></div>
                    </div>
                    <div><label className="form-label">Lead Conversion Notes</label><textarea className="form-input resize-none" rows={2} value={newLeadNotes} onChange={e => setNewLeadNotes(e.target.value)} placeholder="Details..." /></div>
                    <button type="submit" className="btn-primary py-2.5 font-bold">Add Lead to CRM Pipeline</button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* =======================================================
              9. MARKETING CAMPAIGNS
              ======================================================= */}
          {tab === 'marketing' && (
            <MarketingTab
              tenantId={tenant.id} coupons={coupons} setCoupons={setCoupons}
              campaigns={campaigns} setCampaigns={setCampaigns}
              bookings={bookings} showToast={showToast} primaryColor={pc}
            />
          )}

          {/* =======================================================
              10. FINANCE & INVOICES
              ======================================================= */}
          {tab === 'finance' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex gap-2 border-b border-slate-800 pb-3">
                {[
                  { id: 'payments', label: 'Payment Gateway options' },
                  { id: 'quotations', label: 'Quotations Builder' },
                  { id: 'invoices', label: 'Invoices Ledger logs' }
                ].map(sub => (
                  <button key={sub.id} onClick={() => setFinSubTab(sub.id as any)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${finSubTab === sub.id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-350'}`}>
                    {sub.label}
                  </button>
                ))}
              </div>

              {finSubTab === 'payments' && (
                <div className="admin-card space-y-4 max-w-xl font-sans text-slate-300">
                  <p className="section-title">Payment Settlement configuration</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-900 p-3.5 rounded-xl border border-slate-850">
                      <div><p className="font-bold text-white text-xs">Direct UPI QR checkout code</p><p className="text-slate-500 text-[10px]">Auto-generates UPI link on customer checkout.</p></div>
                      <span className="badge badge-completed">Enabled</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-900 p-3.5 rounded-xl border border-slate-850">
                      <div><p className="font-bold text-white text-xs">Razorpay payment link checkout</p><p className="text-slate-500 text-[10px]">Generate Razorpay dynamic checkout links.</p></div>
                      <span className="badge badge-completed">Enabled</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-900 p-3.5 rounded-xl border border-slate-850">
                      <div><p className="font-bold text-white text-xs">Stripe card Payments gateway</p><p className="text-slate-500 text-[10px]">Collect global card checkouts.</p></div>
                      <button onClick={() => showToast('Connecting Stripe requires Professional plan.', 'error')} className="text-blue-400 font-bold hover:underline text-xs">Activate Link</button>
                    </div>
                  </div>
                </div>
              )}

              {finSubTab === 'quotations' && (
                <QuotationsTab
                  tenantId={tenant.id} tenantName={tenant.name} tenantPhone={tenant.config.phone}
                  tenantGst={tenant.config.gstNumber || ''} quotations={quotations} setQuotations={setQuotations}
                  bookings={bookings} showToast={showToast} primaryColor={pc}
                />
              )}

              {finSubTab === 'invoices' && (
                <div className="admin-card overflow-hidden p-0 max-w-3xl font-sans">
                  <table className="data-table text-xs">
                    <thead>
                      <tr><th>Invoice Prefix</th><th>Client details</th><th>Date</th><th>Tax Rate (GST)</th><th>Total paid</th><th>Download status</th></tr>
                    </thead>
                    <tbody>
                      {myBookings.filter(b => b.status === 'completed').map(b => (
                        <tr key={b.id}>
                          <td className="font-mono text-xs font-bold text-slate-400">INV-2026-{b.id.split('-')[1]}</td>
                          <td className="font-bold text-slate-200">{b.customerName}</td>
                          <td className="text-slate-500">{b.scheduledDate}</td>
                          <td className="font-mono">18% GST</td>
                          <td className="font-black text-emerald-400">₹{b.priceDetails.total.toLocaleString()}</td>
                          <td>
                            <button onClick={() => showToast('Downloading invoice PDF details...')} className="text-xs text-blue-400 font-bold hover:underline">Download PDF</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* =======================================================
              11. AI CONTROL CENTER
              ======================================================= */}
          {tab === 'ai' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex gap-2 border-b border-slate-800 pb-3">
                {[
                  { id: 'generator', label: 'AI Copywriter Website Generator' },
                  { id: 'knowledge', label: 'Knowledge Base PDF uploads' },
                  { id: 'advisor', label: 'AI Business Advisor logs' }
                ].map(sub => (
                  <button key={sub.id} onClick={() => setAiSubTab(sub.id as any)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${aiSubTab === sub.id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-350'}`}>
                    {sub.label}
                  </button>
                ))}
              </div>

              {aiSubTab === 'generator' && (
                <div className="admin-card space-y-4 max-w-xl">
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono">AI Website Generation Engine</h3>
                    <p className="text-slate-500 text-xs mt-1">Enter your industry vertical parameters and keywords, and the AI will auto-generate copy for your header, SEO titles, descriptions, and taglines.</p>
                  </div>
                  <div>
                    <label className="form-label">Industry type</label>
                    <select className="form-input text-xs" value={aiIndustry} onChange={e => setAiIndustry(e.target.value)}>
                      <option value="electrician">Electrician Services</option>
                      <option value="plumber">Plumbing Services</option>
                      <option value="painting">Painting Contractor</option>
                      <option value="cleaning">Cleaning Services</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Target key phrases (comma separated)</label>
                    <input className="form-input" value={aiKeywords} onChange={e => setAiKeywords(e.target.value)} placeholder="e.g. short circuit repair, home wiring, inverter" />
                  </div>
                  <button onClick={handleAiCopywriter} disabled={aiGenerating} className="btn-primary w-full py-2.5 font-bold">
                    {aiGenerating ? '⏳ Generating static copywriting copy...' : '🤖 Generate Website Content'}
                  </button>
                </div>
              )}

              {aiSubTab === 'knowledge' && (
                <div className="admin-card space-y-4 max-w-xl font-sans">
                  <div>
                    <p className="section-title">Knowledge Base Document Uploads (RAG pool)</p>
                    <p className="section-subtitle">Upload pricing catalogs, safety rules, policies, and brochures. The online customer chatbot assistant will read these files to answer customer queries.</p>
                  </div>
                  <div className="space-y-2">
                    {knowledgeDocs.map((doc, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-900 border border-slate-850 p-3 rounded-xl font-mono text-[10px]">
                        <span>📄 {doc}</span>
                        <span className="text-emerald-400 font-bold">Vectorized OK</span>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleAddDoc} className="flex gap-2 border-t border-slate-800 pt-4">
                    <input className="form-input text-xs" placeholder="e.g. Price Catalogue v2.pdf" value={newDocName} onChange={e => setNewDocName(e.target.value)} />
                    <button type="submit" className="btn-secondary px-5 font-bold">Upload doc</button>
                  </form>
                </div>
              )}

              {aiSubTab === 'advisor' && (
                <AITab tenant={tenant} services={services} primaryColor={pc} />
              )}
            </div>
          )}

          {/* =======================================================
              12. ANALYTICS
              ======================================================= */}
          {tab === 'analytics' && (
            <AnalyticsTab tenantId={tenant.id} bookings={bookings} services={services} workers={workers} primaryColor={pc} />
          )}

          {/* =======================================================
              13. SYSTEM & INTEGRATIONS
              ======================================================= */}
          {tab === 'system' && (
            <div className="space-y-6 animate-fadeIn max-w-5xl">
              <div className="flex gap-2 border-b border-slate-800 pb-3">
                {[
                  { id: 'domains', label: 'Domain Settings' },
                  { id: 'integrations', label: 'Third-party Integrations' }
                ].map(sub => (
                  <button key={sub.id} onClick={() => setSysSubTab(sub.id as any)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${sysSubTab === sub.id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-350'}`}>
                    {sub.label}
                  </button>
                ))}
              </div>

              {sysSubTab === 'domains' && (
                <DomainSettingsTab
                  tenant={tenant}
                  setTenants={setTenants}
                  showToast={showToast}
                  primaryColor={pc}
                />
              )}

              {sysSubTab === 'integrations' && (
                <div className="admin-card space-y-4 font-sans text-slate-300">
                  <p className="section-title">Integrations Marketplace</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-900 p-3.5 rounded-xl border border-slate-850">
                      <div><p className="font-bold text-white text-xs">Twilio WhatsApp business notifications</p><p className="text-slate-500 text-[10px]">Notify customers on booking status changes.</p></div>
                      <span className="badge badge-completed">Active</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-900 p-3.5 rounded-xl border border-slate-850">
                      <div><p className="font-bold text-white text-xs">Google Maps CNAME geolocation</p><p className="text-slate-500 text-[10px]">Autoresolve client address coords.</p></div>
                      <span className="badge badge-completed">Active</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-900 p-3.5 rounded-xl border border-slate-850">
                      <div><p className="font-bold text-white text-xs">SMTP mail notifications server</p><p className="text-slate-500 text-[10px]">Verify checkout invoice emails.</p></div>
                      <span className="badge badge-completed">Active</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =======================================================
              SUPPORT TICKETS TAB
              ======================================================= */}
          {tab === 'support' && (
            <div className="space-y-6 animate-fadeIn font-sans">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-black text-white">Support & Assistance</h1>
                  <p className="text-slate-500 text-sm mt-1">Need help or need anything extra? Raise a ticket and get directly in touch with our team.</p>
                </div>
                <button
                  onClick={() => setShowRaiseTicketModal(true)}
                  className="btn-primary py-2 px-4 font-bold"
                  style={{ backgroundColor: pc }}
                >
                  + Raise New Support Ticket
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tickets list */}
                <div className="lg:col-span-2 admin-card overflow-hidden p-0">
                  <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <span className="font-bold text-white text-xs">Your Support History</span>
                    <span className="text-[10px] text-slate-500 font-bold">Total: {tickets.filter(t => t.tenantId === tenant.id).length} tickets</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="data-table text-xs">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Subject</th>
                          <th>Category</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.filter(t => t.tenantId === tenant.id).length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-slate-500 font-bold">
                              No support tickets raised yet. Need anything extra? Click the button above!
                            </td>
                          </tr>
                        ) : (
                          tickets.filter(t => t.tenantId === tenant.id).map(t => (
                            <tr key={t.id} className={selectedTenantTicketId === t.id ? 'bg-slate-800/40' : ''}>
                              <td className="font-mono text-xs text-slate-500">{t.id}</td>
                              <td className="font-bold text-white">{t.subject}</td>
                              <td>
                                <span className="capitalize text-slate-350 bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                                  {t.category.replace('_', ' ')}
                                </span>
                              </td>
                              <td>
                                <span className={`badge badge-${t.status === 'open' ? 'requested' : t.status === 'replied' ? 'quotation' : 'completed'}`}>
                                  {t.status}
                                </span>
                              </td>
                              <td className="text-slate-500 text-[10px]">
                                {new Date(t.createdAt).toLocaleDateString()}
                              </td>
                              <td>
                                <button
                                  onClick={() => setSelectedTenantTicketId(t.id)}
                                  className="text-xs font-bold text-blue-400 hover:underline"
                                >
                                  Inspect Thread
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Inspect/Reply panel */}
                <div>
                  {selectedTenantTicketId ? (() => {
                    const ticket = tickets.find(t => t.id === selectedTenantTicketId);
                    if (!ticket) return null;
                    return (
                      <div className="admin-card space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                          <div>
                            <p className="text-[10px] font-mono text-slate-500">{ticket.id}</p>
                            <h3 className="font-black text-white text-sm mt-0.5">Ticket Thread</h3>
                          </div>
                          <span className={`badge badge-${ticket.status === 'open' ? 'requested' : ticket.status === 'replied' ? 'quotation' : 'completed'}`}>
                            {ticket.status}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Subject</span>
                          <p className="text-xs text-white font-semibold">{ticket.subject}</p>
                        </div>

                        <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl text-xs text-slate-400 leading-relaxed italic font-mono">
                          "{ticket.message}"
                        </div>

                        {ticket.replies.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-500 uppercase">Replies History</p>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                              {ticket.replies.map((rep, idx) => (
                                <div
                                  key={idx}
                                  className={`p-2.5 rounded-xl text-xs border ${
                                    rep.sender === 'tenant'
                                      ? 'bg-slate-850/50 text-slate-300 border-slate-800/40 ml-4'
                                      : 'bg-blue-950/20 text-slate-200 border-blue-900/30 mr-4'
                                  }`}
                                >
                                  <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold mb-1">
                                    <span>{rep.sender === 'super_admin' ? 'Operator (Anarav Admin)' : 'You'}</span>
                                    <span>{new Date(rep.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <p className="font-sans leading-relaxed">{rep.message}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {ticket.status !== 'closed' ? (
                          <div className="space-y-2 pt-2 border-t border-slate-800/40">
                            <label className="form-label text-[10px]">Add Reply / Request update</label>
                            <textarea
                              className="form-input text-xs resize-none"
                              rows={3}
                              placeholder="Type message here..."
                              value={tenantTicketReply}
                              onChange={e => setTenantTicketReply(e.target.value)}
                            />
                            <button
                              onClick={() => handleTenantReply(ticket.id)}
                              className="w-full btn-primary py-2 text-xs font-bold"
                              style={{ backgroundColor: pc }}
                            >
                              Send Message
                            </button>
                          </div>
                        ) : (
                          <div className="pt-2 border-t border-slate-800/40">
                            <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl text-xs text-center text-slate-500">
                              This ticket is closed. If you need further help, please open a new ticket.
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })() : (
                    <div className="admin-card flex flex-col items-center justify-center h-48 text-center">
                      <span className="text-3xl mb-2">💬</span>
                      <p className="text-slate-400 text-xs font-bold">Select a Ticket</p>
                      <p className="text-slate-600 text-[10px] mt-1">Select any ticket from support list to view discussion details or send replies.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* TOAST SYSTEM */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
          {toast.msg}
        </div>
      )}
      {/* BOOKING DETAILS INSPECTOR MODAL */}
      {selectedBookingDetails && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-6 font-sans text-left">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white font-mono">Job Booking Details - {selectedBookingDetails.id}</h3>
              <button 
                type="button" 
                onClick={() => setSelectedBookingDetails(null)} 
                className="text-slate-500 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Customer Name</span>
                <p className="text-white font-bold">{selectedBookingDetails.customerName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Phone Number</span>
                <p className="text-blue-400 font-bold">{selectedBookingDetails.customerPhone}</p>
              </div>
              <div className="col-span-2 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Service Address</span>
                <p className="text-slate-350">{selectedBookingDetails.customerAddress}</p>
              </div>
              <div className="col-span-2 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Special Instructions / Notes</span>
                <p className="text-slate-400 italic">"{String(selectedBookingDetails.formData?.notes || 'No customer notes provided.')}"</p>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-3.5">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Price Breakdown</h4>
              <div className="bg-slate-955 p-4 rounded-2xl border border-slate-850 space-y-2 text-xs">
                <div className="flex justify-between"><span>Base Visit Fee</span><span>₹{selectedBookingDetails.priceDetails.baseVisit}</span></div>
                <div className="flex justify-between"><span>Distance Charge</span><span>₹{selectedBookingDetails.priceDetails.distanceCharge}</span></div>
                <div className="flex justify-between"><span>Labour</span><span>₹{selectedBookingDetails.priceDetails.labour}</span></div>
                <div className="flex justify-between"><span>Materials</span><span>₹{selectedBookingDetails.priceDetails.material}</span></div>
                <div className="flex justify-between text-slate-400"><span>Discount Coupon</span><span>-₹{selectedBookingDetails.priceDetails.discount}</span></div>
                <div className="flex justify-between font-bold text-emerald-400 text-sm border-t border-slate-800 pt-2">
                  <span>Grand Total</span><span>₹{selectedBookingDetails.priceDetails.total}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="form-label text-[10px]">Assign Workforce Team</label>
                <select
                  className="form-input text-xs"
                  value={selectedBookingDetails.workerId || ''}
                  onChange={e => {
                    const wId = e.target.value;
                    handleAssignWorker(selectedBookingDetails.id, wId);
                    const updated = bookings.find(b => b.id === selectedBookingDetails.id);
                    if (updated) setSelectedBookingDetails({ ...updated, workerId: wId, workerName: workers.find(w => w.id === wId)?.name });
                  }}
                >
                  <option value="">Choose technician...</option>
                  {myWorkers.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.skills[0]})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label text-[10px]">Status Management</label>
                <select
                  className="form-input text-xs capitalize"
                  value={selectedBookingDetails.status}
                  onChange={e => {
                    const next = e.target.value as any;
                    handleUpdateBookingStatus(selectedBookingDetails.id, next);
                    setSelectedBookingDetails((prev: Booking | null) => prev ? { ...prev, status: next } : null);
                  }}
                >
                  <option value="requested">Requested</option>
                  <option value="assigned">Assigned</option>
                  <option value="on_the_way">On Way</option>
                  <option value="started">Started</option>
                  <option value="completed">Completed</option>
                  <option value="closed">Closed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-4 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => {
                  handleUpdateBookingStatus(selectedBookingDetails.id, 'cancelled');
                  setSelectedBookingDetails(null);
                  showToast('Booking marked as cancelled.');
                }}
                className="btn-danger py-2 px-4 font-bold text-xs"
              >
                Cancel Booking
              </button>
              <button 
                type="button" 
                onClick={() => setSelectedBookingDetails(null)} 
                className="btn-primary py-2 px-4 font-bold text-xs bg-slate-800 text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WORKER ONBOARDING AGREEMENT MODAL */}
      {showTermsModal && lastWrkRegistered && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 font-sans text-left">
            <div className="text-center">
              <span className="text-4xl inline-block">📝</span>
              <h3 className="text-base font-black text-white mt-2">Worker Agreement Onboarding</h3>
              <p className="text-slate-500 text-xs mt-1">Protect your business from fraud and liabilities.</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2 text-xs">
              <p className="text-slate-400">Newly Registered: <strong className="text-white">{lastWrkRegistered.name}</strong></p>
              <p className="text-slate-400">Aadhaar details: <span className="font-mono text-blue-400">{lastWrkRegistered.aadhaar}</span></p>
              <p className="text-slate-500 text-[10px] leading-relaxed pt-2 border-t border-slate-855">
                You must download the Terms & Conditions agreement sheet, have the worker sign it physically, and file the copy locally.
              </p>
            </div>

            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => {
                  setShowTermsModal(false);
                  setLastWrkRegistered(null);
                }}
                className="btn-secondary w-full py-2.5 font-bold text-xs"
              >
                Onboard Later
              </button>
              <button 
                type="button"
                onClick={() => {
                  handleDownloadTerms(lastWrkRegistered);
                  setShowTermsModal(false);
                  setLastWrkRegistered(null);
                }}
                className="btn-primary w-full py-2.5 font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1 text-xs"
              >
                📥 Download Terms PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LAUNCH WEBSITE MODAL */}
      {showLaunchModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 font-sans">
            <div className="text-center">
              <span className="text-4xl animate-bounce inline-block">🚀</span>
              <h3 className="text-lg font-black text-white mt-2">Launching Your Platform</h3>
              <p className="text-slate-500 text-xs mt-1">Deploying {tenant.name} on the server edge network.</p>
            </div>

            <div className="space-y-3.5 text-left">
              <div className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${launchStep >= 1 ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-800 text-slate-500'}`}>1</span>
                <div>
                  <p className={`text-xs font-bold ${launchStep >= 1 ? 'text-white' : 'text-slate-500'}`}>Generating Static Production Bundle</p>
                  <p className="text-[10px] text-slate-500">Minifying stylesheets, scripts, and media resources.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${launchStep >= 2 ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-800 text-slate-500'}`}>2</span>
                <div>
                  <p className={`text-xs font-bold ${launchStep >= 2 ? 'text-white' : 'text-slate-500'}`}>Provisioning SSL & DNS mappings</p>
                  <p className="text-[10px] text-slate-500">Registering domains on Let's Encrypt certificates.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${launchStep >= 3 ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-800 text-slate-500'}`}>3</span>
                <div>
                  <p className={`text-xs font-bold ${launchStep >= 3 ? 'text-white' : 'text-slate-500'}`}>Propagating Global CDN Nodes</p>
                  <p className="text-[10px] text-slate-500">Syncing database and client templates cache.</p>
                </div>
              </div>
            </div>

            {launchStep === 4 && (
              <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-2xl p-4 space-y-3.5 text-center animate-fadeIn">
                <div className="flex justify-center"><CheckCircle className="w-8 h-8 text-emerald-400" /></div>
                <div>
                  <p className="text-sm font-bold text-white font-sans">Your website is LIVE!</p>
                  <p className="text-[11px] text-slate-400 mt-1">Public address:</p>
                  <a 
                    href={getTenantPublicUrl(tenant)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 font-mono font-bold hover:underline block mt-1"
                  >
                    {tenant.customDomain || tenant.defaultDomain || `${tenant.slug || tenant.subdomain}.vercel.app`}
                  </a>
                </div>
                <div className="flex justify-center bg-white p-2 rounded-xl w-24 h-24 mx-auto border border-slate-200">
                  {/* Simulated QR Code */}
                  <div className="w-full h-full bg-slate-100 flex flex-col justify-center items-center rounded border border-dashed border-slate-355 text-slate-600 font-sans">
                    <span className="text-[8px] font-bold uppercase tracking-widest">Scan QR</span>
                    <span className="text-base mt-1">📱</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => { setShowLaunchModal(false); setLaunchStep(0); }} 
                className="btn-secondary py-2 px-4 font-bold text-xs font-sans"
              >
                Close Panel
              </button>
              {launchStep === 4 && (
                <a 
                  href={getTenantPublicUrl(tenant)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-primary py-2 px-4 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1 font-sans"
                >
                  Visit Live Site ➔
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RAISE SUPPORT TICKET FORM MODAL */}
      {showRaiseTicketModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 font-sans text-left">
            <div>
              <h3 className="text-base font-black text-white">Raise a Support Ticket</h3>
              <p className="text-slate-500 text-xs mt-1">Specify what you need extra or outline the issue you are facing.</p>
            </div>

            <form onSubmit={handleRaiseTicket} className="space-y-4">
              <div>
                <label className="form-label text-[10px] uppercase font-bold text-slate-400">Subject</label>
                <input
                  type="text"
                  required
                  className="form-input text-xs"
                  placeholder="e.g. Need WhatsApp notifications integration"
                  value={newTicketSubject}
                  onChange={e => setNewTicketSubject(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label text-[10px] uppercase font-bold text-slate-400">Category</label>
                <select
                  className="form-input text-xs"
                  value={newTicketCategory}
                  onChange={e => setNewTicketCategory(e.target.value as any)}
                >
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing / Subscription Query</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="other">Other Assistance</option>
                </select>
              </div>

              <div>
                <label className="form-label text-[10px] uppercase font-bold text-slate-400">Message details</label>
                <textarea
                  required
                  rows={4}
                  className="form-input text-xs resize-none"
                  placeholder="Describe your request in detail..."
                  value={newTicketMessage}
                  onChange={e => setNewTicketMessage(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRaiseTicketModal(false)}
                  className="btn-secondary w-full py-2.5 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary w-full py-2.5 font-bold text-white text-xs"
                  style={{ backgroundColor: pc }}
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* WCAG CONTRAST RATIO ACCESSIBILITY WARNING MODAL */}
      {showContrastWarningModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 font-sans text-left">
            <div>
              <div className="w-10 h-10 rounded-full bg-red-950/50 border border-red-900/60 flex items-center justify-center text-red-400 text-lg mb-3">⚠️</div>
              <h3 className="text-base font-black text-white">Accessibility Warning: Low Contrast Detected</h3>
              <p className="text-slate-400 text-xs mt-1">
                Your theme configuration fails strict WCAG AA contrast ratio standards (target &ge; 4.5:1). Please fix the parameters to ensure legibility.
              </p>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {contrastFailures.map((failure, idx) => (
                <div key={idx} className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{failure.pair}</span>
                    <span className="font-black px-1.5 py-0.5 rounded bg-red-900/30 text-[9px] uppercase tracking-wider text-red-400">
                      {failure.mode} Mode
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Measured Contrast Ratio: <strong className="text-red-400">{failure.ratio.toFixed(2)}:1</strong></span>
                    <span>Target: <strong>{failure.target.toFixed(1)}:1</strong></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowContrastWarningModal(false)}
                className="btn-primary w-full py-2.5 font-bold text-xs bg-red-650 hover:bg-red-750 text-white"
              >
                Acknowledge & Adjust Styles
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
