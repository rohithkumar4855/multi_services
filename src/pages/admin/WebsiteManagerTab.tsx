import React, { useState, useEffect, useRef } from 'react';
import type { Tenant, Service, Worker } from '../../types';
import { getContrastRatio } from '../../utils/themeEngine';
import { api } from '../../utils/api';
import { 
  Upload, Trash2, Sparkles, Check, 
  Copy, ChevronDown, ChevronUp, ShoppingBag,
  Maximize2, Minimize2, ExternalLink, Plus
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────── */
interface Props {
  tenant: Tenant;
  myServices: Service[];
  myWorkers: Worker[];
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
  setServices?: React.Dispatch<React.SetStateAction<Service[]>>;
  showToast: (msg: string, type?: string) => void;
}

type EditorTab =
  | 'appearance' | 'navbar' | 'hero' | 'sections' | 'services'
  | 'gallery' | 'team' | 'offers' | 'reviews'
  | 'faqs' | 'coverage' | 'footer' | 'publish';

/* ─── Constants ──────────────────────────────────────────── */
const EDITOR_TABS: { id: EditorTab; icon: string; label: string }[] = [
  { id: 'appearance', icon: '🎨', label: 'Appearance' },
  { id: 'navbar',     icon: '🧭', label: 'Navbar' },
  { id: 'hero',       icon: '🏠', label: 'Hero' },
  { id: 'sections',   icon: '📋', label: 'Sections' },
  { id: 'services',   icon: '🛠️', label: 'Services' },
  { id: 'gallery',    icon: '🖼️', label: 'Gallery' },
  { id: 'team',       icon: '👥', label: 'Team' },
  { id: 'offers',     icon: '🎟️', label: 'Offers' },
  { id: 'reviews',    icon: '⭐', label: 'Reviews' },
  { id: 'faqs',       icon: '❓', label: 'FAQs' },
  { id: 'coverage',   icon: '📍', label: 'Coverage' },
  { id: 'footer',     icon: '🦶', label: 'Footer' },
  { id: 'publish',    icon: '🚀', label: 'Publish' },
];

const ALL_SECTIONS = [
  { id: 'comp-hero',          type: 'hero',         label: 'Hero Section',          icon: '🏠', defaultEnabled: true },
  { id: 'comp-stats',         type: 'stats',        label: 'Statistics Bar',        icon: '📊', defaultEnabled: true },
  { id: 'comp-services-grid', type: 'services',     label: 'Our Services Grid',     icon: '🛠️', defaultEnabled: true },
  { id: 'comp-how-it-works',  type: 'how_it_works', label: 'How It Works',          icon: '📋', defaultEnabled: true },
  { id: 'comp-offers-row',    type: 'offers_row',   label: 'Offers & Why Us Row',   icon: '🎟️', defaultEnabled: true },
  { id: 'comp-team',          type: 'team',         label: 'Meet Our Team',         icon: '👥', defaultEnabled: true },
  { id: 'comp-gallery',       type: 'gallery',      label: 'Photo & Video Gallery', icon: '🖼️', defaultEnabled: true },
  { id: 'comp-testimonials',  type: 'testimonials', label: 'Customer Reviews',      icon: '⭐', defaultEnabled: true },
  { id: 'comp-trust-bar',     type: 'trust_bar',    label: 'Trust Assurance Bar',   icon: '🔒', defaultEnabled: true },
  { id: 'comp-founder',       type: 'founder',      label: 'About / Our Story',     icon: '👤', defaultEnabled: false },
  { id: 'comp-awards',        type: 'awards',       label: 'Awards & Certifications', icon: '🏆', defaultEnabled: false },
  { id: 'comp-faq',           type: 'faq',          label: 'FAQ Accordion',         icon: '❓', defaultEnabled: true },
  { id: 'comp-map',           type: 'map',          label: 'Contact & Coverage',    icon: '📍', defaultEnabled: true },
];

const GOOGLE_FONTS = [
  'Inter, sans-serif', 'Outfit, sans-serif', 'Poppins, sans-serif', 'Roboto, sans-serif',
  'DM Sans, sans-serif', 'Nunito, sans-serif', 'Playfair Display, serif', 'Lora, serif',
];

const PRESET_COLOR_PALETTES = [
  { name: '⚡ Electric Royal Indigo', primary: '#4f46e5', secondary: '#3730a3', accent: '#818cf8', preview: 'linear-gradient(135deg, #4f46e5, #818cf8)' },
  { name: '✨ Vibrant Emerald Mint', primary: '#059669', secondary: '#047857', accent: '#34d399', preview: 'linear-gradient(135deg, #059669, #34d399)' },
  { name: '🔥 Cyber Amber & Gold', primary: '#d97706', secondary: '#92400e', accent: '#fbbf24', preview: 'linear-gradient(135deg, #d97706, #fbbf24)' },
  { name: '🌊 Deep Ocean Sapphire', primary: '#0284c7', secondary: '#0369a1', accent: '#38bdf8', preview: 'linear-gradient(135deg, #0284c7, #38bdf8)' },
  { name: '💎 Neon Violet Luxe', primary: '#7c3aed', secondary: '#5b21b6', accent: '#a78bfa', preview: 'linear-gradient(135deg, #7c3aed, #a78bfa)' },
  { name: '🌹 Velvet Crimson Bold', primary: '#e11d48', secondary: '#9f1239', accent: '#fb7185', preview: 'linear-gradient(135deg, #e11d48, #fb7185)' },
  { name: '⚡ Cyber Cyan Aqua', primary: '#0891b2', secondary: '#155e75', accent: '#22d3ee', preview: 'linear-gradient(135deg, #0891b2, #22d3ee)' },
  { name: '🛡️ Cobalt Pro Navy', primary: '#2563eb', secondary: '#1e40af', accent: '#60a5fa', preview: 'linear-gradient(135deg, #2563eb, #60a5fa)' },
  { name: '☀️ Sunset Terracotta', primary: '#ea580c', secondary: '#9a3412', accent: '#fb923c', preview: 'linear-gradient(135deg, #ea580c, #fb923c)' },
  { name: '🌌 Titanium Obsidian Dark', primary: '#334155', secondary: '#0f172a', accent: '#94a3b8', preview: 'linear-gradient(135deg, #334155, #94a3b8)' },
];

const PRESET_PAGE_WALLPAPERS = [
  { label: 'Modern Living Space', url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&q=80&auto=format&fit=crop', icon: '🛋️' },
  { label: 'Minimalist Architecture', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80&auto=format&fit=crop', icon: '🏛️' },
  { label: 'Luxury Villa Interior', url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=80&auto=format&fit=crop', icon: '✨' },
  { label: 'Sleek Dark Abstract', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&q=80&auto=format&fit=crop', icon: '🌌' },
  { label: 'Modern Tech Studio', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&q=80&auto=format&fit=crop', icon: '📐' },
  { label: 'Soft Marble Texture', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1600&q=80&auto=format&fit=crop', icon: '🏛️' },
];

const PRESET_HERO_WALLPAPERS = [
  { label: 'Home Renovation & Living', url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&q=85&auto=format&fit=crop', icon: '🏡' },
  { label: 'Verified Pro Technicians', url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1600&q=85&auto=format&fit=crop', icon: '⚡' },
  { label: 'Modern Kitchen & Cleaning', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1600&q=85&auto=format&fit=crop', icon: '✨' },
  { label: 'Power, Panels & Solar', url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1600&q=85&auto=format&fit=crop', icon: '☀️' },
  { label: 'Luxury Commercial Space', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=85&auto=format&fit=crop', icon: '🏢' },
];

const PRESET_GRADIENTS = [
  { label: 'Midnight Aura', value: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #020617 100%)', preview: 'linear-gradient(135deg, #0f172a, #1e1b4b, #020617)' },
  { label: 'Royal Indigo Mesh', value: 'radial-gradient(at 0% 0%, #312e81 0px, transparent 50%), radial-gradient(at 100% 100%, #1e1b4b 0px, transparent 50%), #030712', preview: 'linear-gradient(135deg, #312e81, #1e1b4b, #030712)' },
  { label: 'Deep Emerald Glow', value: 'radial-gradient(at 50% 0%, #064e3b 0px, transparent 60%), #022c22', preview: 'linear-gradient(135deg, #064e3b, #022c22)' },
  { label: 'Sunset Glow', value: 'linear-gradient(135deg, #4c0519 0%, #1e1b4b 100%)', preview: 'linear-gradient(135deg, #4c0519, #1e1b4b)' },
  { label: 'Clean Light Frost', value: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)', preview: 'linear-gradient(180deg, #f8fafc, #e2e8f0)' },
  { label: 'Soft Lavender Mist', value: 'linear-gradient(135deg, #f1f5f9 0%, #e0e7ff 100%)', preview: 'linear-gradient(135deg, #f1f5f9, #e0e7ff)' },
];

const PRESET_PATTERNS = [
  { id: 'none', label: 'None', desc: 'Clean flat background' },
  { id: 'dots', label: 'Subtle Dots', desc: 'Minimal dot matrix pattern' },
  { id: 'grid', label: 'Tech Grid', desc: 'Modern blueprint grid lines' },
  { id: 'mesh', label: 'Ambient Mesh', desc: 'Dynamic dual-color mesh glow' },
  { id: 'waves', label: 'Soft Waves', desc: 'Diagonal micro-texture' },
];

const PRESET_LOGOS = [
  { label: 'Shield Pro', svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40"><rect width="120" height="40" rx="8" fill="%230284c7"/><path d="M20 10 L28 14 V22 C28 27 20 30 20 30 C20 30 12 27 12 22 V14 Z" fill="white"/><text x="36" y="25" fill="white" font-family="Arial, sans-serif" font-weight="900" font-size="14">PRO SERVICES</text></svg>' },
  { label: 'Bolt Electric', svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40"><rect width="120" height="40" rx="8" fill="%23f59e0b"/><polygon points="22,8 14,22 21,22 18,32 28,18 21,18" fill="white"/><text x="36" y="25" fill="white" font-family="Arial, sans-serif" font-weight="900" font-size="14">VOLT TEAM</text></svg>' },
  { label: 'Clean Star', svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40"><rect width="120" height="40" rx="8" fill="%2310b981"/><circle cx="20" cy="20" r="10" fill="white"/><path d="M20 13 L22 18 L27 19 L23 22 L24 27 L20 24 L16 27 L17 22 L13 19 L18 18 Z" fill="%2310b981"/><text x="36" y="25" fill="white" font-family="Arial, sans-serif" font-weight="900" font-size="14">CLEANPRO</text></svg>' },
  { label: 'Royal Touch', svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40"><rect width="120" height="40" rx="8" fill="%23ec4899"/><polygon points="12,25 28,25 26,14 20,18 14,14" fill="white"/><text x="36" y="25" fill="white" font-family="Arial, sans-serif" font-weight="900" font-size="14">ROYAL CRAFT</text></svg>' },
];

const SERVICE_IMAGES: Record<string, string> = {
  clean: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
  electric: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400',
  plumb: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400',
  paint: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400',
  pest: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400',
  carpenter: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=400',
  appliance: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
  car: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400',
  default: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
};

const PRESET_SERVICE_IMAGES = [
  { label: 'Deep Cleaning', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80&auto=format&fit=crop', icon: '✨' },
  { label: 'Electrical & AC', url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500&q=80&auto=format&fit=crop', icon: '⚡' },
  { label: 'Plumbing & Pipe', url: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=500&q=80&auto=format&fit=crop', icon: '🚰' },
  { label: 'AC Cooling Service', url: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=500&q=80&auto=format&fit=crop', icon: '❄️' },
  { label: 'Wall Painting', url: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=500&q=80&auto=format&fit=crop', icon: '🎨' },
  { label: 'Pest Protection', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&q=80&auto=format&fit=crop', icon: '🛡️' },
  { label: 'Carpentry & Wood', url: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&q=80&auto=format&fit=crop', icon: '🪚' },
  { label: 'Appliance Repair', url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&q=80&auto=format&fit=crop', icon: '📺' },
];



function getServiceImg(name: string, cat: string) {
  const k = `${name} ${cat}`.toLowerCase();
  for (const [key, url] of Object.entries(SERVICE_IMAGES)) {
    if (k.includes(key)) return url;
  }
  return SERVICE_IMAGES.default;
}

function getInitialComponents(config: any) {
  const homePage = (config.cmsPages || []).find((p: any) => p.slug === 'home');
  if (homePage?.components?.length > 0) {
    const existing = homePage.components;
    const existingIds = existing.map((c: any) => c.id);
    const missing = ALL_SECTIONS
      .filter(s => !existingIds.includes(s.id))
      .map(s => ({ id: s.id, type: s.type, enabled: s.defaultEnabled, settings: {} }));
    return [...existing, ...missing];
  }
  return ALL_SECTIONS.map(s => ({ id: s.id, type: s.type, enabled: s.defaultEnabled, settings: {} }));
}

/* ─── Helper: Small form elements ────────────────────────── */
const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{children}</label>
);
const FieldInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className="form-input w-full text-xs" />
);
const FieldTextarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className="form-input w-full text-xs resize-none" />
);
const SectionCard = ({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
    <div>
      <p className="text-xs font-black text-white">{title}</p>
      {subtitle && <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

/* ─── Mini Site Preview ──────────────────────────────────── */
interface MiniSitePreviewProps {
  subdomain: string;
  previewDevice: 'desktop' | 'tablet' | 'mobile';
  primaryColor: string;
  themeMode: string;
  themeFont: string;
  themeRadius: 'modern' | 'rounded' | 'square';
  themeButtonStyle: 'filled' | 'outline' | 'soft';
  logoImage: string;
  logoText: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  primaryCta: string;
  secondaryCta: string;
  announceActive: boolean;
  announceText: string;
  announceExpiry?: string;
  pageComponents: any[];
  services: Service[];
  featuredServiceIds: string[];
  homepageServiceCount: number;
  portfolio: any[];
  workers: any[];
  campaigns: any[];
  testimonials: any[];
  faqs: any[];
  city: string;
  nearbyCities: string[];
  bizHours: string;
  bizPhone: string;
  bizWhatsApp: string;
  bizAddress: string;
  navbarTagline?: string;
  navLinksList?: Array<{ id: string; name: string; tab?: string; url?: string }>;
  showTrackButton?: boolean;
  trackButtonText?: string;
  showBookButton?: boolean;
  bookButtonText?: string;
  showLoginButton?: boolean;
  loginButtonText?: string;
  footerAbout?: string;
  footerCopyright?: string;
  showPoweredBy?: boolean;
  footerSocials?: Record<string, string>;
  footerColumns?: Array<{ id: string; title: string; items: string[] }>;
  secondaryColor?: string;
  accentColor?: string;
  bgType?: 'solid' | 'gradient' | 'image' | 'pattern';
  bgImage?: string;
  bgGradient?: string;
  bgPattern?: 'dots' | 'grid' | 'mesh' | 'waves' | 'none';
  bgOverlayOpacity?: number;
  bgOverlayColor?: string;
  bgBlur?: number;
  heroBgType?: 'default' | 'image' | 'gradient' | 'mesh';
  heroBgImage?: string;
  heroBgOverlayOpacity?: number;
  heroGlowActive?: boolean;
  cardStyle?: 'glassmorphic' | 'solid' | 'bordered' | 'minimal';
  showLiveAvailability?: boolean;
  liveAvailTitle?: string;
  liveAvailText?: string;
  liveAvailSlot?: string;
  showEmergencyCard?: boolean;
  emergencyCardTitle?: string;
  emergencyCardText?: string;
  showTrustBadges?: boolean;
  trustBadgesList?: Array<{ id: string; icon: string; title: string }>;
  activeEditorTab?: EditorTab;
  onSelectTab: (tab: EditorTab) => void;
  onEditService?: (svc: Service) => void;
  showToast: (msg: string, type?: string) => void;
}

function MiniSitePreview({
  subdomain, previewDevice, primaryColor, secondaryColor = '#4f46e5',
  themeMode, themeFont, themeRadius, themeButtonStyle, cardStyle = 'glassmorphic',
  bgType = 'solid', bgImage = '', bgGradient = 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #020617 100%)',
  bgPattern = 'none', bgOverlayOpacity = 40, bgOverlayColor = '#000000', bgBlur = 0,
  heroBgImage = '', heroBgOverlayOpacity = 50, heroGlowActive = true,
  logoImage, logoText, heroTitle, heroSubtitle, heroBadge, primaryCta, secondaryCta,
  showLiveAvailability = true, liveAvailTitle = 'Live Availability',
  liveAvailText = '', liveAvailSlot = 'Today, 3:00 PM',
  showEmergencyCard = true, emergencyCardTitle = '⚡ Emergency Home Service',
  emergencyCardText = 'Arriving in 30 Minutes or Free',
  showTrustBadges = true, trustBadgesList = [
    { id: 'tb-1', icon: '🪪', title: 'Aadhaar Verified' },
    { id: 'tb-2', icon: '🛡️', title: 'Police Verified' },
    { id: 'tb-3', icon: '🔄', title: '30-Day Warranty' },
    { id: 'tb-4', icon: '💰', title: 'No Hidden Costs' },
  ],
  announceActive, announceText, announceExpiry, pageComponents, services,
  featuredServiceIds, homepageServiceCount, portfolio, workers, campaigns,
  testimonials, faqs, city, nearbyCities, bizHours, bizPhone, bizWhatsApp, bizAddress,
  navbarTagline, navLinksList, showTrackButton, trackButtonText, showBookButton, bookButtonText,
  showLoginButton, loginButtonText,
  footerAbout, footerCopyright, showPoweredBy, footerSocials, footerColumns,
  activeEditorTab, onSelectTab, onEditService, showToast
}: MiniSitePreviewProps) {
  const isDark = themeMode === 'dark';
  const bg        = isDark ? '#0f172a' : '#ffffff';
  const navBg     = isDark ? 'rgba(13, 20, 32, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const textClr   = isDark ? '#f1f5f9' : '#0f172a';
  const mutedClr  = isDark ? '#94a3b8' : '#64748b';
  const borderClr = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  const isMobile = previewDevice === 'mobile';
  const isTablet = previewDevice === 'tablet';

  // Radius map
  const rad = themeRadius === 'rounded' ? '24px' : themeRadius === 'square' ? '4px' : '12px';
  const btnRad = themeRadius === 'rounded' ? '999px' : themeRadius === 'square' ? '4px' : '10px';

  // Button style map based on themeButtonStyle
  const primaryBtnStyle: React.CSSProperties = themeButtonStyle === 'outline'
    ? { backgroundColor: 'transparent', color: primaryColor, border: `2px solid ${primaryColor}` }
    : themeButtonStyle === 'soft'
    ? { backgroundColor: `${primaryColor}25`, color: primaryColor, border: 'none' }
    : { backgroundColor: primaryColor, color: '#fff', border: 'none', boxShadow: `0 4px 16px ${primaryColor}50` };

  // Background pattern map
  const getPatternBg = () => {
    if (bgPattern === 'dots') {
      return isDark
        ? 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)'
        : 'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)';
    }
    if (bgPattern === 'grid') {
      const line = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
      return `linear-gradient(to right, ${line} 1px, transparent 1px), linear-gradient(to bottom, ${line} 1px, transparent 1px)`;
    }
    if (bgPattern === 'mesh') {
      return `radial-gradient(at 0% 0%, ${primaryColor}20 0px, transparent 50%), radial-gradient(at 100% 100%, ${secondaryColor}20 0px, transparent 50%)`;
    }
    if (bgPattern === 'waves') {
      const line = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
      return `repeating-linear-gradient(45deg, ${line} 0px, ${line} 2px, transparent 2px, transparent 14px)`;
    }
    return 'none';
  };

  const getPatternSize = () => {
    if (bgPattern === 'dots') return '24px 24px';
    if (bgPattern === 'grid') return '32px 32px';
    if (bgPattern === 'waves') return 'auto';
    return undefined;
  };

  // Card background styling based on cardStyle
  const getEffectiveCardBg = () => {
    if (cardStyle === 'glassmorphic') {
      return isDark ? 'rgba(30, 41, 59, 0.75)' : 'rgba(255, 255, 255, 0.85)';
    }
    if (cardStyle === 'bordered') {
      return isDark ? '#0b111e' : '#ffffff';
    }
    if (cardStyle === 'minimal') {
      return isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc';
    }
    return isDark ? '#1e293b' : '#ffffff'; // solid
  };

  const cardBg = getEffectiveCardBg();

  // Dynamic state for interactivity in preview
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [cartCount, setCartCount] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Customer Auth modal state in preview
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmailOrPhone, setAuthEmailOrPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authFullName, setAuthFullName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authAddress, setAuthAddress] = useState('');
  const [demoCustomer, setDemoCustomer] = useState<{ name: string; phone: string; email?: string } | null>(null);

  const enabled = pageComponents.filter(c => c.enabled).map(c => c.type);

  // Helper for section container with click-to-edit badge
  const SectionWrapper = ({ id, tab, label, children }: { id: string; tab: EditorTab; label: string; children: React.ReactNode }) => {
    const isSelected = activeEditorTab === tab;
    return (
      <div 
        id={id}
        className={`relative group transition-all duration-200 cursor-pointer ${isSelected ? 'ring-2 ring-emerald-500/80 ring-offset-2 ring-offset-slate-900' : 'hover:outline hover:outline-2 hover:outline-blue-500/50'}`}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (!target.closest('button') && !target.closest('input')) {
            onSelectTab(tab);
            showToast(`Editing ${label} Section`);
          }
        }}
      >
        {/* Floating Edit Badge */}
        <div className="absolute top-2 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg border border-slate-700 flex items-center gap-1 backdrop-blur-sm pointer-events-none">
          <span>✏️ Click to Edit {label}</span>
        </div>
        {children}
      </div>
    );
  };

  const handleCartClick = (svcName: string) => {
    setCartCount(prev => prev + 1);
    showToast(`🛒 "${svcName}" added to preview cart!`, 'success');
  };

  const handleCopyCode = (code: string) => {
    setCopiedCode(code);
    showToast(`🎟️ Offer code "${code}" copied!`, 'info');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Filtered services to show (strictly max 8 on homepage)
  const homeLimit = Math.min(homepageServiceCount || 8, 8);
  const displayServices = services.filter(s => featuredServiceIds.includes(s.id)).slice(0, homeLimit);
  const rawServices = displayServices.length > 0 ? displayServices : services.slice(0, homeLimit);
  const effectiveServices = rawServices.slice(0, homeLimit);

  const effectiveWorkers = workers;
  const effectiveTestimonials = testimonials;
  const effectiveFaqs = faqs;

  return (
    <div style={{
      fontFamily: themeFont,
      backgroundColor: bgType === 'solid' ? bg : isDark ? '#0f172a' : '#ffffff',
      backgroundImage: bgType === 'image' && bgImage
        ? `url(${bgImage})`
        : bgType === 'gradient' && bgGradient
        ? bgGradient
        : bgType === 'pattern'
        ? getPatternBg()
        : undefined,
      backgroundSize: bgType === 'pattern' ? getPatternSize() : 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: bgType === 'image' ? 'scroll' : undefined,
      width: '100%',
      fontSize: '14px',
      position: 'relative',
      minHeight: '100%'
    }}>

      {/* Global Page Background Image Overlay if Image Mode */}
      {bgType === 'image' && bgImage && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: bgOverlayColor || (isDark ? '#000000' : '#ffffff'),
          opacity: (bgOverlayOpacity ?? 40) / 100,
          backdropFilter: bgBlur > 0 ? `blur(${bgBlur}px)` : 'none',
          pointerEvents: 'none',
          zIndex: 1
        }} />
      )}
      {announceActive && (
        <SectionWrapper id="preview-announcement" tab="hero" label="Announcement">
          <div style={{ 
            backgroundColor: primaryColor, 
            color: '#fff', 
            textAlign: 'center', 
            padding: '10px 16px', 
            fontSize: '12px', 
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <span>{announceText || '🎉 Special offer: Book online today and save!'}</span>
            {announceExpiry && (
              <span style={{ fontSize: '10px', background: 'rgba(0,0,0,0.25)', padding: '2px 8px', borderRadius: '6px' }}>
                Valid till {announceExpiry}
              </span>
            )}
          </div>
        </SectionWrapper>
      )}

      {/* Navbar */}
      <SectionWrapper id="preview-navbar" tab="navbar" label="Navbar & Header">
        <div style={{ 
          backgroundColor: navBg, 
          borderBottom: `1px solid ${borderClr}`, 
          padding: isMobile ? '12px 16px' : '14px 36px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Brand Logo & Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {logoImage ? (
              <img 
                src={logoImage} 
                alt={logoText} 
                style={{ 
                  maxHeight: '38px', 
                  maxWidth: isMobile ? '110px' : '150px', 
                  objectFit: 'contain',
                  borderRadius: rad,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }} 
              />
            ) : (
              <div style={{ 
                width: '38px', 
                height: '38px', 
                borderRadius: rad, 
                backgroundColor: primaryColor, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#fff', 
                fontWeight: 900, 
                fontSize: '16px',
                boxShadow: `0 4px 12px ${primaryColor}40`
              }}>
                {logoText.charAt(0) || '🏪'}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 900, fontSize: isMobile ? '13px' : '15px', color: primaryColor, letterSpacing: '-0.02em' }}>
                {logoText}
              </div>
              <div style={{ fontSize: '10px', color: mutedClr, fontWeight: 500 }}>
                {navbarTagline || 'One Call. We Do It All.'}
              </div>
            </div>
          </div>

          {/* Navigation Links (Hidden on Mobile) */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: isTablet ? '12px' : '18px', fontSize: '13px', color: mutedClr, fontWeight: 600, flexWrap: 'wrap' }}>
              {(navLinksList && navLinksList.length > 0 ? navLinksList : [
                { id: '1', name: 'Home', tab: 'hero' },
                { id: '2', name: 'Services', tab: 'services' },
                { id: '3', name: 'Offers', tab: 'offers' },
                { id: '4', name: 'Team', tab: 'team' },
                { id: '5', name: 'Gallery', tab: 'gallery' },
                { id: '6', name: 'Reviews', tab: 'reviews' },
                { id: '7', name: 'FAQs', tab: 'faqs' },
                { id: '8', name: 'Contact', tab: 'coverage' },
              ]).map(link => (
                <button 
                  key={link.id || link.name} 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (link.tab) {
                      onSelectTab(link.tab as EditorTab);
                      showToast(`Viewing ${link.name} Section`);
                    }
                  }}
                  className="hover:text-emerald-500 transition-colors cursor-pointer bg-transparent border-none p-0 text-[13px] font-semibold"
                  style={{ color: mutedClr }}
                >
                  {link.name}
                </button>
              ))}
            </div>
          )}

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {!isMobile && showTrackButton !== false && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  showToast('🔍 Tracking status: 8 Active technicians online');
                }}
                style={{ 
                  fontSize: '11px', 
                  color: textClr, 
                  border: `1px solid ${borderClr}`, 
                  padding: '8px 14px', 
                  borderRadius: btnRad,
                  background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                🔍 {trackButtonText || 'Track Booking'}
              </button>
            )}

            {showLoginButton !== false && (
              demoCustomer ? (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDemoCustomer(null);
                    showToast('Signed out of customer account', 'info');
                  }}
                  style={{ 
                    fontSize: '11px', 
                    color: primaryColor, 
                    border: `1px solid ${primaryColor}60`, 
                    padding: '8px 12px', 
                    borderRadius: btnRad,
                    background: `${primaryColor}15`,
                    cursor: 'pointer',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Click to sign out"
                >
                  <span>👤</span> {demoCustomer.name.split(' ')[0]}
                </button>
              ) : (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAuthModal(true);
                  }}
                  style={{ 
                    fontSize: '11px', 
                    color: textClr, 
                    border: `1px solid ${borderClr}`, 
                    padding: '8px 12px', 
                    borderRadius: btnRad,
                    background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                    cursor: 'pointer',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>👤</span> {loginButtonText || 'Sign In'}
                </button>
              )
            )}

            {showBookButton !== false && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  showToast(`📅 Booking initiated with ${cartCount} services in cart!`, 'success');
                }}
                style={{ 
                  ...primaryBtnStyle,
                  padding: isMobile ? '7px 12px' : '9px 18px', 
                  borderRadius: btnRad, 
                  fontWeight: 900, 
                  fontSize: '12px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ShoppingBag size={14} /> {bookButtonText || 'Book Service'} {cartCount > 0 ? `(${cartCount})` : ''}
              </button>
            )}
          </div>
        </div>
      </SectionWrapper>

      {/* Hero Section */}
      {enabled.includes('hero') && (
        <SectionWrapper id="preview-hero" tab="hero" label="Hero">
          <div style={{
            backgroundColor: isDark ? '#0b0f19' : '#0f172a',
            backgroundImage: heroBgImage ? `url(${heroBgImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: isMobile ? '36px 18px' : '72px 48px', 
            minHeight: '420px', 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '7fr 5fr', 
            gap: isMobile ? '24px' : '36px', 
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Hero Image Overlay */}
            {heroBgImage && (
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: isDark ? '#000000' : '#0f172a',
                opacity: (heroBgOverlayOpacity ?? 50) / 100,
                pointerEvents: 'none'
              }} />
            )}

            {/* Background Glow */}
            {heroGlowActive !== false && (
              <div style={{
                position: 'absolute',
                top: '-20%',
                right: '10%',
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background: `${primaryColor}30`,
                filter: 'blur(90px)',
                pointerEvents: 'none'
              }} />
            )}

            <div>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                background: primaryColor, 
                color: '#fff', 
                padding: '6px 14px', 
                borderRadius: '999px', 
                fontSize: '11px', 
                fontWeight: 900, 
                marginBottom: '20px', 
                boxShadow: `0 4px 20px ${primaryColor}60` 
              }}>
                ⚡ {heroBadge || '30 MIN ARRIVAL GUARANTEE'}
              </div>
              <h1 style={{ fontSize: isMobile ? '28px' : '42px', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: '16px', letterSpacing: '-0.02em' }}>
                {heroTitle || 'All Home Services One Trusted Team'}
              </h1>
              <p style={{ fontSize: isMobile ? '13px' : '15px', color: '#cbd5e1', marginBottom: '28px', lineHeight: 1.6, maxWidth: '520px' }}>
                {heroSubtitle || 'Professional. Verified. On-time. Making homes better, every day.'}
              </p>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    showToast('📅 Launching instant booking modal...', 'success');
                  }}
                  style={{ 
                    ...primaryBtnStyle,
                    padding: '14px 28px', 
                    borderRadius: btnRad, 
                    fontWeight: 900, 
                    fontSize: '13px', 
                    cursor: 'pointer'
                  }}
                >
                  {primaryCta || 'Book Service Now'} →
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    showToast(`📞 Dialing support: ${bizPhone || '+91 98765 43210'}`);
                  }}
                  style={{ 
                    border: '2px solid rgba(255,255,255,0.25)', 
                    color: '#fff', 
                    padding: '14px 24px', 
                    borderRadius: btnRad, 
                    fontWeight: 700, 
                    fontSize: '13px',
                    background: 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  📞 {secondaryCta || 'Call Now'}
                </button>
              </div>

              {/* Trust badges */}
              {showTrustBadges && trustBadgesList.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : `repeat(${Math.min(trustBadgesList.length, 4)}, 1fr)`, gap: '10px' }}>
                  {trustBadgesList.map((b) => (
                    <div key={b.id || b.title} style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '8px 10px', fontSize: '10px', color: '#fff', fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                      <span>{b.icon}</span>
                      <span>{b.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Hero Cards */}
            {(showLiveAvailability || showEmergencyCard) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {showLiveAvailability && (
                  <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: rad, padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{liveAvailTitle || 'Live Availability'}</span>
                    </div>
                    <p style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 900, color: '#fff', margin: 0 }}>
                      {liveAvailText || `${workers?.length || 8} Technicians Available in ${city || 'Nellore, AP'}`}
                    </p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '6px 0 0' }}>Next Slot: <span style={{ color: primaryColor, fontWeight: 900 }}>{liveAvailSlot || 'Today, 3:00 PM'}</span></p>
                  </div>
                )}

                {showEmergencyCard && (
                  <div style={{ background: 'rgba(245,158,11,0.12)', backdropFilter: 'blur(16px)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: rad, padding: '16px 20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: '#f59e0b', marginBottom: '6px' }}>{emergencyCardTitle || '⚡ Emergency Home Service'}</div>
                    <p style={{ fontSize: '14px', fontWeight: 900, color: '#fff', margin: 0 }}>
                      {emergencyCardText || 'Arriving in 30 Minutes or Free'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </SectionWrapper>
      )}

      {/* Statistics Strip */}
      {enabled.includes('stats') && (
        <SectionWrapper id="preview-stats" tab="hero" label="Statistics">
          <div style={{ 
            backgroundColor: isDark ? '#060b14' : '#0f172a', 
            padding: isMobile ? '20px 16px' : '24px 48px', 
            display: 'grid', 
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)', 
            gap: '12px', 
            textAlign: 'center', 
            borderTop: `1px solid ${borderClr}`, 
            borderBottom: `1px solid ${borderClr}` 
          }}>
            {[
              { v: '4.9/5', s: '1,240+ Reviews', c: '#f59e0b' },
              { v: '5,250+', s: 'Jobs Completed', c: primaryColor },
              { v: '1,850+', s: 'Happy Customers', c: '#22c55e' },
              { v: '30 Min', s: 'Avg. Response', c: '#38bdf8' },
              { v: '100%', s: 'Satisfaction', c: '#a78bfa' },
              { v: '24/7', s: 'Support Active', c: '#f97316' },
            ].map((s, i) => (
              <div key={i} className="hover:scale-105 transition-transform p-1">
                <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 900, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>{s.s}</div>
              </div>
            ))}
          </div>
        </SectionWrapper>
      )}

      {/* Services Grid */}
      {enabled.includes('services') && (
        <SectionWrapper id="preview-services" tab="services" label="Services">
          <div style={{ padding: isMobile ? '36px 16px' : '60px 48px', backgroundColor: bg }}>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px' }}>— What We Offer —</div>
              <h2 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: 900, color: textClr, margin: 0 }}>Our Professional Services</h2>
              <p style={{ fontSize: '13px', color: mutedClr, marginTop: '8px' }}>Verified & background-checked experts for every corner of your home in {city || 'Nellore'}</p>
            </div>
            
            {effectiveServices.length > 0 ? (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)', 
                gap: '16px' 
              }}>
                {effectiveServices.map((svc, i) => (
                  <div 
                    key={svc.id || i} 
                    style={{ 
                      borderRadius: rad, 
                      overflow: 'hidden', 
                      backgroundColor: cardBg, 
                      border: `1px solid ${borderClr}`, 
                      boxShadow: '0 4px 14px rgba(0,0,0,0.05)', 
                      transition: 'all 0.3s' 
                    }}
                    className="hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div style={{ height: '105px', backgroundImage: `url(${svc.imageUrl || getServiceImg(svc.name, svc.category)})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '8px' }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)' }} />
                      <span style={{ position: 'relative', zIndex: 1, fontSize: '10px', fontWeight: 900, color: '#fff', backgroundColor: primaryColor, padding: '2px 8px', borderRadius: '6px' }}>
                        From ₹{svc.basePrice}
                      </span>

                      {/* Direct Edit Service Action Button */}
                      {onEditService && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditService(svc);
                          }}
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            zIndex: 10,
                            backgroundColor: 'rgba(15, 23, 42, 0.85)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.5)',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '9px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            backdropFilter: 'blur(6px)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                          }}
                          title={`Edit "${svc.name}" Card`}
                        >
                          ✏️ Edit
                        </button>
                      )}
                    </div>
                    <div style={{ padding: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 900, color: textClr, marginBottom: '6px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <span>{svc.icon || '🛠️'}</span> <span className="truncate">{svc.name}</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCartClick(svc.name);
                        }}
                        style={{ 
                          backgroundColor: primaryColor, 
                          color: '#fff', 
                          fontSize: '10px', 
                          fontWeight: 900, 
                          padding: '6px', 
                          borderRadius: btnRad, 
                          textAlign: 'center', 
                          width: '100%',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        + Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px', border: `1px dashed ${borderClr}`, borderRadius: rad, color: mutedClr, fontSize: '12px' }}>
                No services added yet. Add service cards in the Services tab to display here.
              </div>
            )}

            {/* View More Services / Navigate to Services Section */}
            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTab('services');
                  showToast('Navigating into Services section...', 'info');
                }}
                style={{
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor,
                  border: `2px solid ${primaryColor}`,
                  padding: '10px 24px',
                  borderRadius: btnRad,
                  fontSize: '12px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  boxShadow: `0 4px 14px ${primaryColor}20`
                }}
                className="hover:scale-105"
              >
                <span>View More Services ({services.length > 0 ? services.length : '8+'})</span> →
              </button>
            </div>
          </div>
        </SectionWrapper>
      )}

      {/* How It Works */}
      {enabled.includes('how_it_works') && (
        <SectionWrapper id="preview-how-it-works" tab="sections" label="How It Works">
          <div style={{ padding: isMobile ? '36px 16px' : '52px 48px', backgroundColor: isDark ? '#0d1526' : '#f1f5fd' }}>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px' }}>— Simple 3-Step Process —</div>
              <h2 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 900, color: textClr, margin: 0 }}>How It Works</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '28px', textAlign: 'center' }}>
              {[
                { n: '01', icon: '📱', title: 'Choose a Service', desc: 'Select from 100+ verified home services with upfront clear pricing.' },
                { n: '02', icon: '📅', title: 'Schedule & Pay', desc: 'Pick your preferred arrival time and pay securely online or on-site.' },
                { n: '03', icon: '✅', title: 'Relax, We Handle It', desc: 'A background-verified technician arrives with full toolkit & warranty.' },
              ].map(step => (
                <div key={step.n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '76px', height: '76px', borderRadius: '50%', background: `${primaryColor}18`, border: `2px solid ${primaryColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', marginBottom: '16px', position: 'relative' }}>
                    {step.icon}
                    <div style={{ position: 'absolute', top: '-6px', right: '-6px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: primaryColor, color: '#fff', fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{step.n}</div>
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 900, color: textClr, marginBottom: '6px' }}>{step.title}</h3>
                  <p style={{ fontSize: '12px', color: mutedClr, lineHeight: 1.5, maxWidth: '280px' }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionWrapper>
      )}

      {/* Offers & Campaigns */}
      {enabled.includes('offers_row') && (
        <SectionWrapper id="preview-offers" tab="offers" label="Offers">
          <div style={{ padding: isMobile ? '36px 16px' : '48px', backgroundColor: bg }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '6px' }}>— Exclusive Discounts —</div>
              <h2 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: 900, color: textClr, margin: 0 }}>Special Offers & Coupon Codes</h2>
            </div>
            {campaigns.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '16px' }}>
                {campaigns.map(camp => (
                  <div 
                    key={camp.id} 
                    style={{ 
                      borderRadius: rad, 
                      border: `1px dashed ${primaryColor}60`, 
                      padding: '16px 20px', 
                      backgroundColor: cardBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '10px', color: primaryColor, fontWeight: 900, textTransform: 'uppercase' }}>Limited Time</span>
                      <h4 style={{ fontSize: '14px', fontWeight: 900, color: textClr, margin: '2px 0 4px' }}>{camp.title}</h4>
                      <p style={{ fontSize: '11px', color: mutedClr, margin: 0 }}>{camp.subtitle || `Valid till ${camp.endDate || 'No Expiry'}`}</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCode(camp.offerCode);
                      }}
                      style={{ 
                        backgroundColor: copiedCode === camp.offerCode ? '#10b981' : primaryColor, 
                        color: '#fff', 
                        padding: '8px 14px', 
                        borderRadius: '8px', 
                        fontSize: '11px', 
                        fontWeight: 900, 
                        border: 'none', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedCode === camp.offerCode ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> {camp.offerCode}</>}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', border: `1px dashed ${borderClr}`, borderRadius: rad, color: mutedClr, fontSize: '12px' }}>
                No offers yet. Create coupon codes in the Offers tab to display here.
              </div>
            )}
          </div>
        </SectionWrapper>
      )}

      {/* Meet Our Team */}
      {enabled.includes('team') && (
        <SectionWrapper id="preview-team" tab="team" label="Team">
          <div style={{ padding: isMobile ? '36px 16px' : '48px', backgroundColor: isDark ? '#0b1120' : '#f8fafc' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '6px' }}>— Certified Specialists —</div>
              <h2 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: 900, color: textClr, margin: 0 }}>Meet Our Dedicated Experts</h2>
            </div>
            {effectiveWorkers.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : `repeat(${Math.min(effectiveWorkers.length, 4)}, 1fr)`, gap: '18px' }}>
                {effectiveWorkers.slice(0, 4).map(w => (
                  <div key={w.id} style={{ borderRadius: rad, backgroundColor: cardBg, border: `1px solid ${borderClr}`, padding: '20px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: `${primaryColor}20`, color: primaryColor, fontWeight: 900, fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', border: `2px solid ${primaryColor}40` }}>
                      {w.name.charAt(0)}
                    </div>
                    <h4 style={{ fontSize: '14px', fontWeight: 900, color: textClr, margin: 0 }}>{w.name}</h4>
                    <p style={{ fontSize: '11px', color: primaryColor, fontWeight: 700, margin: '3px 0 8px' }}>{w.designation || w.skills?.slice(0,2).join(', ') || 'Senior Specialist'}</p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#f59e0b', fontWeight: 800, background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: '999px' }}>
                      ⭐ 4.9 Rating (120+ Jobs)
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', border: `1px dashed ${borderClr}`, borderRadius: rad, color: mutedClr, fontSize: '12px' }}>
                No team members visible. Enable workers in the Team tab to display here.
              </div>
            )}
          </div>
        </SectionWrapper>
      )}

      {/* Photo & Video Gallery */}
      {enabled.includes('gallery') && (
        <SectionWrapper id="preview-gallery" tab="gallery" label="Gallery">
          <div style={{ padding: isMobile ? '36px 16px' : '48px', backgroundColor: isDark ? '#0b1120' : '#f1f5fd' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '6px' }}>— Our Work In Action —</div>
              <h2 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: 900, color: textClr, margin: 0 }}>Recent Project Gallery</h2>
            </div>
            {portfolio.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '16px' }}>
                {portfolio.slice(0, 6).map((item: any) => (
                  <div 
                    key={item.id} 
                    style={{ 
                      borderRadius: rad, 
                      backgroundColor: cardBg, 
                      border: `1px solid ${borderClr}`, 
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '24px' }}>{item.icon || '🏠'}</span>
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 900, color: textClr, margin: 0 }}>{item.title}</h4>
                        <p style={{ fontSize: '10px', color: primaryColor, fontWeight: 700, margin: '2px 0 0' }}>{item.category} {item.workerName ? `• by ${item.workerName}` : ''}</p>
                      </div>
                    </div>
                    {(item.youtubeUrl || item.instagramUrl) && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        {item.youtubeUrl && (
                          <span style={{ fontSize: '9px', background: '#ef444415', color: '#ef4444', border: '1px solid #ef444430', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>▶ YouTube</span>
                        )}
                        {item.instagramUrl && (
                          <span style={{ fontSize: '9px', background: '#ec489915', color: '#ec4899', border: '1px solid #ec489930', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>📸 Instagram</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', border: `1px dashed ${borderClr}`, borderRadius: rad, color: mutedClr, fontSize: '12px' }}>
                No gallery projects yet. Add completed projects in the Gallery tab to display here.
              </div>
            )}
          </div>
        </SectionWrapper>
      )}

      {/* Customer Reviews */}
      {enabled.includes('testimonials') && (
        <SectionWrapper id="preview-reviews" tab="reviews" label="Reviews">
          <div style={{ padding: isMobile ? '36px 16px' : '48px', backgroundColor: bg }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '6px' }}>— Real Customer Feedback —</div>
              <h2 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: 900, color: textClr, margin: 0 }}>What Our Clients Say</h2>
            </div>
            {effectiveTestimonials.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '16px' }}>
                {effectiveTestimonials.slice(0, 3).map(t => (
                  <div key={t.id} style={{ borderRadius: rad, backgroundColor: cardBg, border: `1px solid ${borderClr}`, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ color: '#f59e0b', fontSize: '13px', marginBottom: '8px' }}>{'⭐'.repeat(t.rating || 5)}</div>
                    <p style={{ fontSize: '12px', color: textClr, fontStyle: 'italic', lineHeight: 1.6, marginBottom: '14px' }}>"{t.text}"</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 900, color: textClr, margin: 0 }}>{t.author}</p>
                        <p style={{ fontSize: '10px', color: mutedClr, margin: '2px 0 0' }}>{t.role}</p>
                      </div>
                      <span style={{ fontSize: '9px', background: '#10b98115', color: '#10b981', border: '1px solid #10b98130', padding: '2px 6px', borderRadius: '6px', fontWeight: 800 }}>✓ Verified</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', border: `1px dashed ${borderClr}`, borderRadius: rad, color: mutedClr, fontSize: '12px' }}>
                No customer reviews yet. Add customer testimonials in the Reviews tab to display here.
              </div>
            )}
          </div>
        </SectionWrapper>
      )}

      {/* FAQs */}
      {enabled.includes('faq') && (
        <SectionWrapper id="preview-faqs" tab="faqs" label="FAQs">
          <div style={{ padding: isMobile ? '36px 16px' : '48px', backgroundColor: isDark ? '#0d1526' : '#f8fafc' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '6px' }}>— Got Questions? —</div>
              <h2 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: 900, color: textClr, margin: 0 }}>Frequently Asked Questions</h2>
            </div>
            {effectiveFaqs.length > 0 ? (
              <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {effectiveFaqs.map((f, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div 
                      key={f.id || idx} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenFaqIndex(isOpen ? null : idx);
                      }}
                      style={{ 
                        borderRadius: rad, 
                        backgroundColor: cardBg, 
                        border: `1px solid ${isOpen ? primaryColor + '60' : borderClr}`, 
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 800, fontSize: '13px', color: textClr }}>
                        <span>{f.question}</span>
                        <span style={{ color: primaryColor }}>{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
                      </div>
                      {isOpen && (
                        <div style={{ padding: '0 18px 14px', fontSize: '12px', color: mutedClr, lineHeight: 1.6, borderTop: `1px solid ${borderClr}`, paddingTop: '10px' }}>
                          {f.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', border: `1px dashed ${borderClr}`, borderRadius: rad, color: mutedClr, fontSize: '12px', maxWidth: '800px', margin: '0 auto' }}>
                No FAQs added yet. Add frequently asked questions in the FAQs tab to display here.
              </div>
            )}
          </div>
        </SectionWrapper>
      )}

      {/* Coverage & Contact */}
      {enabled.includes('map') && (
        <SectionWrapper id="preview-coverage" tab="coverage" label="Coverage">
          <div style={{ padding: isMobile ? '36px 16px' : '48px', backgroundColor: bg }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '32px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 900, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '6px' }}>— Service Areas —</div>
                <h2 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: 900, color: textClr, margin: '0 0 12px' }}>Serving {city || 'Nellore, AP'} & Surrounding Areas</h2>
                <p style={{ fontSize: '13px', color: mutedClr, lineHeight: 1.6, marginBottom: '20px' }}>
                  Our local certified service units are distributed throughout {city || 'Nellore'} ensuring rapid on-time arrival within 30 minutes.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                  {(nearbyCities.length > 0 ? nearbyCities : ['Kavali', 'Gudur', 'Venkatagiri', 'Naidupeta']).map(c => (
                    <span key={c} style={{ background: `${primaryColor}15`, color: primaryColor, border: `1px solid ${primaryColor}30`, padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}>
                      📍 {c}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: textClr }}>
                  <div>📞 <strong>Phone:</strong> {bizPhone || '+91 98765 43210'}</div>
                  <div>💬 <strong>WhatsApp:</strong> +{bizWhatsApp || '919876543210'}</div>
                  <div>⏰ <strong>Hours:</strong> {bizHours || 'Mon–Sun, 8 AM – 8 PM'}</div>
                </div>
              </div>
              <div style={{ height: '220px', borderRadius: rad, backgroundColor: isDark ? '#1e293b' : '#e2e8f0', border: `1px solid ${borderClr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', color: mutedClr }}>
                <span style={{ fontSize: '32px' }}>🗺️</span>
                <span style={{ fontWeight: 800, fontSize: '13px', color: textClr }}>Interactive Coverage Map</span>
                <span style={{ fontSize: '11px' }}>{bizAddress || 'Main Road, City Center'}</span>
              </div>
            </div>
          </div>
        </SectionWrapper>
      )}

      {/* Footer */}
      <SectionWrapper id="preview-footer" tab="footer" label="Footer & Copyright">
        <div style={{ backgroundColor: isDark ? '#060b14' : '#0f172a', padding: isMobile ? '36px 16px' : '48px', color: '#94a3b8' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : `repeat(${Math.max(2, 2 + (footerColumns?.length || 3))}, 1fr)`, gap: isMobile ? '24px' : '32px', marginBottom: '32px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                {logoImage ? (
                  <img 
                    src={logoImage} 
                    alt={logoText} 
                    style={{ 
                      maxHeight: '30px', 
                      maxWidth: '120px', 
                      objectFit: 'contain',
                      borderRadius: '6px'
                    }} 
                  />
                ) : (
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: primaryColor, color: '#fff', fontWeight: 900, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {logoText.charAt(0) || '🏪'}
                  </div>
                )}
                <span style={{ fontWeight: 900, fontSize: '13px', color: '#fff' }}>{logoText}</span>
              </div>
              <p style={{ fontSize: '11px', lineHeight: 1.6, color: '#94a3b8' }}>
                {footerAbout || `Your trusted home services partner in ${city || 'your city'}.`}
              </p>
              <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                {Object.entries(footerSocials || { 'Facebook': 'f', 'Instagram': 'ig', 'YouTube': 'yt', 'WhatsApp': '💬' }).map(([key, val]) => (
                  <div 
                    key={key} 
                    onClick={() => showToast(`Opening ${key}`)}
                    style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900, color: '#cbd5e1', cursor: 'pointer', background: 'rgba(255,255,255,0.03)' }}
                  >
                    {key === 'Facebook' ? 'f' : key === 'Instagram' ? 'ig' : key === 'YouTube' ? 'yt' : key === 'WhatsApp' ? '💬' : val || '🔗'}
                  </div>
                ))}
              </div>
            </div>

            {(footerColumns && footerColumns.length > 0 ? footerColumns : [
              { id: '1', title: 'Quick Links', items: ['Home', 'Services', 'Offers', 'About Us', 'Contact'] },
              { id: '2', title: 'Popular Services', items: ['Cleaning', 'Electrical', 'Plumbing', 'Painting', 'Pest Control'] },
              { id: '3', title: 'Company', items: ['About Us', 'Our Team', 'Reviews', 'Blog', 'Careers'] },
            ]).map(col => (
              <div key={col.id || col.title}>
                <p style={{ fontWeight: 900, fontSize: '12px', color: '#fff', marginBottom: '12px' }}>{col.title}</p>
                {col.items.map(item => (
                  <p 
                    key={item} 
                    onClick={() => showToast(`Navigating to ${item}`)}
                    style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', cursor: 'pointer' }}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    {item}
                  </p>
                ))}
              </div>
            ))}

            <div>
              <p style={{ fontWeight: 900, fontSize: '12px', color: '#fff', marginBottom: '12px' }}>Contact Us</p>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>📍 {city || 'Nellore, AP'}</p>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>📞 {bizPhone || '+91 98765 43210'}</p>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>✉️ hello@{subdomain || 'servos'}.in</p>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>⏰ {bizHours || 'Mon–Sun, 8 AM – 8 PM'}</p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', flexWrap: 'wrap', gap: '8px' }}>
            <span>{footerCopyright || `© ${new Date().getFullYear()} ${logoText} Services. All rights reserved.`}</span>
            {showPoweredBy !== false && (
              <span>Powered by <span style={{ color: primaryColor, fontWeight: 700 }}>Anarav Business OS</span></span>
            )}
          </div>
        </div>
      </SectionWrapper>

      {/* ===== INTERACTIVE CUSTOMER AUTH MODAL IN PREVIEW ===== */}
      {showAuthModal && (
        <div 
          onClick={() => setShowAuthModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(2, 6, 23, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '24px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              color: '#f8fafc',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: primaryColor, background: `${primaryColor}15`, padding: '3px 8px', borderRadius: '6px' }}>
                  Customer Portal
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#fff', marginTop: '6px', margin: '6px 0 0 0' }}>
                  {authMode === 'signin' ? 'Sign In to Your Account' : 'Create Customer Account'}
                </h3>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                  {authMode === 'signin' ? 'Track bookings, download receipts & book instantly' : 'Join to manage home service appointments effortlessly'}
                </p>
              </div>
              <button 
                onClick={() => setShowAuthModal(false)}
                style={{ background: '#1e293b', border: 'none', color: '#94a3b8', width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div style={{ display: 'flex', background: '#020617', padding: '4px', borderRadius: '12px', marginBottom: '18px', border: '1px solid #1e293b' }}>
              <button 
                onClick={() => setAuthMode('signin')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: authMode === 'signin' ? primaryColor : 'transparent',
                  color: authMode === 'signin' ? '#fff' : '#94a3b8',
                  transition: 'all 0.2s'
                }}
              >
                🔑 Sign In (Login)
              </button>
              <button 
                onClick={() => setAuthMode('signup')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: authMode === 'signup' ? primaryColor : 'transparent',
                  color: authMode === 'signup' ? '#fff' : '#94a3b8',
                  transition: 'all 0.2s'
                }}
              >
                ✨ Create Account
              </button>
            </div>

            {/* SIGN IN FORM */}
            {authMode === 'signin' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}>
                    Mobile Number or Email
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. 9876543210 or user@example.com"
                    value={authEmailOrPhone}
                    onChange={e => {
                      const val = e.target.value;
                      if (/^\d+$/.test(val)) {
                        setAuthEmailOrPhone(val.slice(0, 10));
                      } else {
                        setAuthEmailOrPhone(val);
                      }
                    }}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#020617',
                      border: '1px solid #334155',
                      color: '#fff',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>
                      Password
                    </label>
                    <span 
                      onClick={() => showToast('Password reset link sent to demo registered email.', 'info')}
                      style={{ fontSize: '10px', color: primaryColor, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Forgot password?
                    </span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showAuthPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your account password"
                      value={authPassword}
                      onChange={e => setAuthPassword(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 38px 10px 14px',
                        borderRadius: '10px',
                        background: '#020617',
                        border: '1px solid #334155',
                        color: '#fff',
                        fontSize: '12px',
                        outline: 'none'
                      }}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowAuthPassword(v => !v)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      {showAuthPassword ? '👁️' : '🙈'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
                  <input type="checkbox" id="rememberMePreview" defaultChecked style={{ accentColor: primaryColor }} />
                  <label htmlFor="rememberMePreview" style={{ cursor: 'pointer' }}>Keep me logged in on this browser</label>
                </div>

                <button 
                  type="button"
                  onClick={() => {
                    const identifier = authEmailOrPhone.trim() || 'Ravi Kumar';
                    const name = identifier.includes('@') ? identifier.split('@')[0] : (identifier.length > 5 ? 'Customer User' : 'Ravi Kumar');
                    setDemoCustomer({ name, phone: authEmailOrPhone || '9876543210', email: authEmailOrPhone.includes('@') ? authEmailOrPhone : 'customer@example.com' });
                    setShowAuthModal(false);
                    showToast(`✨ Welcome back, ${name}! Logged into customer portal.`, 'success');
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: primaryColor,
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: `0 4px 14px ${primaryColor}40`,
                    marginTop: '4px'
                  }}
                >
                  Sign In to Account
                </button>

                {/* 1-Click Fast Demo Login */}
                <div style={{ borderTop: '1px solid #1e293b', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setDemoCustomer({ name: 'Ravi Kumar', phone: '9876543210', email: 'ravi@example.com' });
                      setShowAuthModal(false);
                      showToast('✨ Signed in as demo customer: Ravi Kumar', 'success');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '10px',
                      border: '1px solid #334155',
                      background: 'rgba(255,255,255,0.03)',
                      color: '#cbd5e1',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ⚡ 1-Click Instant Demo Login (Ravi Kumar)
                  </button>
                  <p style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', margin: 0 }}>
                    Don't have an account? <span onClick={() => setAuthMode('signup')} style={{ color: primaryColor, fontWeight: 800, cursor: 'pointer' }}>Create Account</span>
                  </p>
                </div>
              </div>
            ) : (
              /* SIGN UP FORM */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}>
                    Full Name
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Pradeep Kumar"
                    value={authFullName}
                    onChange={e => setAuthFullName(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      background: '#020617',
                      border: '1px solid #334155',
                      color: '#fff',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}>
                      Mobile Phone
                    </label>
                    <input 
                      type="tel"
                      placeholder="9876543210"
                      maxLength={10}
                      value={authPhone}
                      onChange={e => setAuthPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        background: '#020617',
                        border: '1px solid #334155',
                        color: '#fff',
                        fontSize: '12px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}>
                      Email Address
                    </label>
                    <input 
                      type="email"
                      placeholder="user@example.com"
                      value={authEmail}
                      onChange={e => setAuthEmail(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        background: '#020617',
                        border: '1px solid #334155',
                        color: '#fff',
                        fontSize: '12px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}>
                    Create Password
                  </label>
                  <input 
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      background: '#020617',
                      border: '1px solid #334155',
                      color: '#fff',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}>
                    Service Address / Street / Flat No.
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Flat 302, Lakeview Apartments, Nellore"
                    value={authAddress}
                    onChange={e => setAuthAddress(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      background: '#020617',
                      border: '1px solid #334155',
                      color: '#fff',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                </div>

                <button 
                  type="button"
                  onClick={() => {
                    const name = authFullName.trim() || 'New Customer';
                    const phone = authPhone.trim() || '9876543210';
                    setDemoCustomer({ name, phone, email: authEmail });
                    setShowAuthModal(false);
                    showToast(`✨ Account created successfully! Logged in as ${name}.`, 'success');
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: primaryColor,
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: `0 4px 14px ${primaryColor}40`,
                    marginTop: '4px'
                  }}
                >
                  Create Account & Sign In
                </button>

                <p style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', margin: 0 }}>
                  Already have an account? <span onClick={() => setAuthMode('signin')} style={{ color: primaryColor, fontWeight: 800, cursor: 'pointer' }}>Sign In</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function WebsiteManagerTab({ tenant, myServices, myWorkers, setTenants, setServices, showToast }: Props) {
  const c = tenant.config;

  /* ── Appearance & Customer UI Suite ────────────────────────── */
  const [primaryColor,        setPrimaryColor]        = useState(c.primaryColor);
  const [secondaryColor,      setSecondaryColor]      = useState(c.secondaryColor || '#4f46e5');
  const [accentColor,         setAccentColor]         = useState((c as any).accentColor || '#38bdf8');
  const [themeMode,           setThemeMode]           = useState<'light' | 'dark' | 'auto'>(c.themeMode || 'light');
  const [themeFont,           setThemeFont]           = useState(c.themeFont || 'Inter, sans-serif');
  const [themeRadius,         setThemeRadius]         = useState<'modern' | 'rounded' | 'square'>(c.themeRadius || 'modern');
  const [themeButtonStyle,    setThemeButtonStyle]    = useState<'filled' | 'outline' | 'soft'>(c.themeButtonStyle || 'filled');
  const [cardStyle,           setCardStyle]           = useState<'glassmorphic' | 'solid' | 'bordered' | 'minimal'>((c as any).cardStyle || 'glassmorphic');
  
  // Brand Logo
  const [logoImage,           setLogoImage]           = useState<string>(c.logoImage || '');
  const [logoText,            setLogoText]            = useState(c.logoText || tenant.name);
  const [logoUrlInput,        setLogoUrlInput]        = useState('');
  
  // Page Background & Wallpaper
  const [bgType,              setBgType]              = useState<'solid' | 'gradient' | 'image' | 'pattern'>((c as any).bgType || 'solid');
  const [bgImage,             setBgImage]             = useState<string>((c as any).bgImage || '');
  const [bgImageUrlInput,     setBgImageUrlInput]     = useState('');
  const [bgGradient,          setBgGradient]          = useState<string>((c as any).bgGradient || 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #020617 100%)');
  const [bgPattern,           setBgPattern]           = useState<'dots' | 'grid' | 'mesh' | 'waves' | 'none'>((c as any).bgPattern || 'none');
  const [bgOverlayOpacity,    setBgOverlayOpacity]    = useState<number>((c as any).bgOverlayOpacity ?? 40);
  const [bgOverlayColor,      setBgOverlayColor]      = useState<string>((c as any).bgOverlayColor || '#000000');
  const [bgBlur,              setBgBlur]              = useState<number>((c as any).bgBlur ?? 0);

  // Hero Atmosphere & Wallpaper
  const [heroBgType,          setHeroBgType]          = useState<'default' | 'image' | 'gradient' | 'mesh'>((c as any).heroBgType || 'default');
  const [heroBgImage,         setHeroBgImage]         = useState<string>((c as any).heroBgImage || '');
  const [heroBgImageUrlInput, setHeroBgImageUrlInput] = useState('');
  const [heroBgOverlayOpacity,setHeroBgOverlayOpacity]= useState<number>((c as any).heroBgOverlayOpacity ?? 50);
  const [heroGlowActive,      setHeroGlowActive]      = useState<boolean>((c as any).heroGlowActive ?? true);

  // Subtab for Appearance suite
  const [appearanceSubTab,    setAppearanceSubTab]    = useState<'brand' | 'colors' | 'background' | 'hero' | 'typography'>('brand');

  const [techSelectionActive, setTechSelectionActive] = useState(c.allowTechnicianSelection ?? false);
  const [b2bEnquiryActive,    setB2bEnquiryActive]    = useState(c.enableB2bEnquiry ?? false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  /* ── Hero ───────────────────────────────────────────────── */
  const [heroTitle,      setHeroTitle]      = useState(c.heroTitle || 'All Home Services One Trusted Team');
  const [heroSubtitle,   setHeroSubtitle]   = useState(c.heroSubtitle || 'Professional. Verified. On-time. Making homes better, every day.');
  const [heroBadge,      setHeroBadge]      = useState((c as any).heroArrivalGuarantee || '30 MIN ARRIVAL GUARANTEE');
  const [announceActive, setAnnounceActive] = useState(c.announcementActive ?? true);
  const [announceText,   setAnnounceText]   = useState(c.announcementText || '🎉 Special offer: Book online and save!');
  const [announceExpiry, setAnnounceExpiry] = useState(c.announcementExpiry || '');
  const [primaryCta,     setPrimaryCta]     = useState('Book Service Now');
  const [secondaryCta,   setSecondaryCta]   = useState('Call Now');

  /* ── Hero Feature Cards & Trust Badges ───────────────────── */
  const [showLiveAvailability, setShowLiveAvailability] = useState<boolean>((c as any).showLiveAvailability ?? true);
  const [liveAvailTitle, setLiveAvailTitle] = useState<string>((c as any).liveAvailTitle || 'Live Availability');
  const [liveAvailText, setLiveAvailText] = useState<string>((c as any).liveAvailText || '');
  const [liveAvailSlot, setLiveAvailSlot] = useState<string>((c as any).liveAvailSlot || 'Today, 3:00 PM');

  const [showEmergencyCard, setShowEmergencyCard] = useState<boolean>((c as any).showEmergencyCard ?? true);
  const [emergencyCardTitle, setEmergencyCardTitle] = useState<string>((c as any).emergencyCardTitle || '⚡ Emergency Home Service');
  const [emergencyCardText, setEmergencyCardText] = useState<string>((c as any).emergencyCardText || 'Arriving in 30 Minutes or Free');

  const [showTrustBadges, setShowTrustBadges] = useState<boolean>((c as any).showTrustBadges ?? true);
  const [trustBadgesList, setTrustBadgesList] = useState<Array<{ id: string; icon: string; title: string }>>(() => {
    if ((c as any).trustBadgesList && Array.isArray((c as any).trustBadgesList) && (c as any).trustBadgesList.length > 0) {
      return (c as any).trustBadgesList;
    }
    return [
      { id: 'tb-1', icon: '🪪', title: 'Aadhaar Verified' },
      { id: 'tb-2', icon: '🛡️', title: 'Police Verified' },
      { id: 'tb-3', icon: '🔄', title: '30-Day Warranty' },
      { id: 'tb-4', icon: '💰', title: 'No Hidden Costs' },
    ];
  });
  const [newBadgeIcon, setNewBadgeIcon] = useState('✨');
  const [newBadgeTitle, setNewBadgeTitle] = useState('');
  const [editingBadgeId, setEditingBadgeId] = useState<string | null>(null);
  const [editingBadgeTitle, setEditingBadgeTitle] = useState('');
  const [editingBadgeIcon, setEditingBadgeIcon] = useState('');

  /* ── Navbar Customization ────────────────────────────────── */
  const [navbarTagline, setNavbarTagline] = useState<string>((c as any).navbarTagline || 'One Call. We Do It All.');
  const [navLinksList, setNavLinksList] = useState<Array<{ id: string; name: string; tab?: string; url?: string }>>(() => {
    const tabNameMap: Record<string, string> = {
      hero: 'Hero', services: 'Services', offers: 'Offers', team: 'Our Team',
      gallery: 'Gallery', reviews: 'Reviews', faqs: 'FAQs', coverage: 'Contact'
    };
    const initial = (c as any).navLinksList || [
      { id: 'nav-1', name: 'Home', tab: 'hero' },
      { id: 'nav-2', name: 'Services', tab: 'services' },
      { id: 'nav-3', name: 'Offers', tab: 'offers' },
      { id: 'nav-4', name: 'Team', tab: 'team' },
      { id: 'nav-5', name: 'Gallery', tab: 'gallery' },
      { id: 'nav-6', name: 'Reviews', tab: 'reviews' },
      { id: 'nav-7', name: 'FAQs', tab: 'faqs' },
      { id: 'nav-8', name: 'Contact', tab: 'coverage' },
    ];
    return initial.map((l: any, i: number) => ({
      ...l,
      name: (l.name && l.name.trim()) ? l.name : (tabNameMap[l.tab] || `Link ${i + 1}`)
    }));
  });
  const [showTrackButton, setShowTrackButton] = useState<boolean>((c as any).showTrackButton ?? true);
  const [trackButtonText, setTrackButtonText] = useState<string>((c as any).trackButtonText || 'Track Booking');
  const [showBookButton, setShowBookButton] = useState<boolean>((c as any).showBookButton ?? true);
  const [bookButtonText, setBookButtonText] = useState<string>((c as any).bookButtonText || 'Book Service');
  const [showLoginButton, setShowLoginButton] = useState<boolean>((c as any).showLoginButton ?? true);
  const [loginButtonText, setLoginButtonText] = useState<string>((c as any).loginButtonText || 'Sign In');
  const [newNavLinkName, setNewNavLinkName] = useState('');
  const [newNavLinkTab, setNewNavLinkTab] = useState<string>('services');

  /* ── Footer Customization ────────────────────────────────── */
  const [footerAbout, setFooterAbout] = useState<string>((c as any).footerAbout || `Your trusted home services partner in ${c.city || 'your city'}.`);
  const [footerCopyright, setFooterCopyright] = useState<string>((c as any).footerCopyright || `© ${new Date().getFullYear()} ${c.logoText || tenant.name} Services. All rights reserved.`);
  const [showPoweredBy, setShowPoweredBy] = useState<boolean>((c as any).showPoweredBy ?? true);
  const [footerSocials, setFooterSocials] = useState<Record<string, string>>((c as any).footerSocials || { 'Facebook': '#', 'Instagram': '#', 'YouTube': '#', 'WhatsApp': '#' });
  const [footerColumns, setFooterColumns] = useState<Array<{ id: string; title: string; items: string[] }>>(
    (c as any).footerColumns || [
      { id: 'fcol-1', title: 'Quick Links', items: ['Home', 'Services', 'Offers', 'About Us', 'Contact'] },
      { id: 'fcol-2', title: 'Popular Services', items: ['Cleaning', 'Electrical', 'Plumbing', 'Painting', 'Pest Control'] },
      { id: 'fcol-3', title: 'Company', items: ['About Us', 'Our Team', 'Reviews', 'Blog', 'Careers'] },
    ]
  );
  const [newFooterColTitle, setNewFooterColTitle] = useState('');
  const [newFooterItemText, setNewFooterItemText] = useState('');
  const [selectedFooterColId, setSelectedFooterColId] = useState('');

  /* ── Custom Sections Manager ─────────────────────────────── */
  const [newCustomSectionTitle, setNewCustomSectionTitle] = useState('');
  const [newCustomSectionDesc, setNewCustomSectionDesc] = useState('');
  const [newCustomSectionIcon, setNewCustomSectionIcon] = useState('✨');
  const [catalogSectionToAdd, setCatalogSectionToAdd] = useState('');

  /* ── Sections ───────────────────────────────────────────── */
  const [pageComponents, setPageComponents] = useState(() => getInitialComponents(c));

  /* ── Services ───────────────────────────────────────────── */
  const [featuredServiceIds, setFeaturedServiceIds] = useState<string[]>(
    (c as any).featuredServiceIds || myServices.filter(s => s.isActive).slice(0, 8).map(s => s.id)
  );
  const [homepageServiceCount, setHomepageServiceCount] = useState<number>((c as any).homepageServiceCount || 8);

  // New Service Card Form State (Upload Image, Price, Item Name)
  const [newSvcCardName, setNewSvcCardName] = useState('');
  const [newSvcCardPrice, setNewSvcCardPrice] = useState<number>(499);
  const [newSvcCardImage, setNewSvcCardImage] = useState<string>('');
  const [newSvcCardImageUrl, setNewSvcCardImageUrl] = useState<string>('');
  const [newSvcCardCategory, setNewSvcCardCategory] = useState('Cleaning');
  const [newSvcCardIcon, setNewSvcCardIcon] = useState('✨');
  const [newSvcCardDuration, setNewSvcCardDuration] = useState(60);
  const [newSvcCardDesc, setNewSvcCardDesc] = useState('');
  const serviceFileInputRef = useRef<HTMLInputElement>(null);

  // Full-Page / Modal Service Editor State
  const [editingServiceModal, setEditingServiceModal] = useState<Service | null>(null);
  const [editModalName, setEditModalName] = useState('');
  const [editModalPrice, setEditModalPrice] = useState<number>(0);
  const [editModalDuration, setEditModalDuration] = useState<number>(60);
  const [editModalCategory, setEditModalCategory] = useState('Cleaning');
  const [editModalIcon, setEditModalIcon] = useState('🛠️');
  const [editModalImage, setEditModalImage] = useState('');
  const [editModalImageUrl, setEditModalImageUrl] = useState('');
  const [editModalDesc, setEditModalDesc] = useState('');
  const [editModalIsFeatured, setEditModalIsFeatured] = useState(true);
  const editModalFileInputRef = useRef<HTMLInputElement>(null);

  const openEditServiceModal = (svc: Service) => {
    setEditingServiceModal(svc);
    setEditModalName(svc.name);
    setEditModalPrice(svc.basePrice);
    setEditModalDuration(svc.durationMin || 60);
    setEditModalCategory(svc.category);
    setEditModalIcon(svc.icon || '🛠️');
    setEditModalImage(svc.imageUrl || '');
    setEditModalImageUrl(svc.imageUrl || '');
    setEditModalDesc(svc.description || '');
    setEditModalIsFeatured(featuredServiceIds.includes(svc.id));
  };

  /* ── Service Fallback Images ────────────────────────────── */
  const SERVICE_FALLBACK_IMAGES: Record<string, string> = {
    clean:       'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80&auto=format&fit=crop',
    sofa:        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80&auto=format&fit=crop',
    tank:        'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&q=80&auto=format&fit=crop',
    electric:    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80&auto=format&fit=crop',
    wire:        'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=600&q=80&auto=format&fit=crop',
    plumb:       'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600&q=80&auto=format&fit=crop',
    pipe:        'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&q=80&auto=format&fit=crop',
    tap:         'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80&auto=format&fit=crop',
    mixer:       'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80&auto=format&fit=crop',
    leak:        'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600&q=80&auto=format&fit=crop',
    paint:       'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=600&q=80&auto=format&fit=crop',
    pest:        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80&auto=format&fit=crop',
    appliance:   'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=600&q=80&auto=format&fit=crop',
    ac:          'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=600&q=80&auto=format&fit=crop',
    carpent:     'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&q=80&auto=format&fit=crop',
    wood:        'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&q=80&auto=format&fit=crop',
    furniture:   'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&q=80&auto=format&fit=crop',
    interior:    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&auto=format&fit=crop',
    pos:         'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=600&q=80&auto=format&fit=crop',
    default:     'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80&auto=format&fit=crop',
  };

  const getServiceImg = (name: string = '', category: string = '') => {
    const key = `${name} ${category}`.toLowerCase();
    for (const [k, v] of Object.entries(SERVICE_FALLBACK_IMAGES)) {
      if (k !== 'default' && key.includes(k)) return v;
    }
    return SERVICE_FALLBACK_IMAGES.default;
  };

  /* ── Universal S3 File Upload Helper ─────────────────────── */
  const uploadFileToS3 = async (file: File, folder: string = 'uploads'): Promise<string | null> => {
    try {
      showToast(`⏳ Uploading "${file.name}" to Supabase S3...`, 'info');
      const res = await api.uploadBinaryFile(file, folder);
      if (res?.data?.fileUrl) {
        showToast(`✅ Uploaded and stored in Supabase S3 bucket!`, 'success');
        return res.data.fileUrl;
      }
    } catch (err: any) {
      console.error('S3 upload error:', err);
      showToast(`⚠️ S3 direct upload failed, saving image locally: ${err.message || ''}`, 'error');
    }
    // Fallback to local Data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  /* ── Logo Upload Handlers ── */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFileToS3(file, 'logos');
    if (url) setLogoImage(url);
  };

  const handleApplyLogoUrl = () => {
    if (!logoUrlInput.trim()) return;
    setLogoImage(logoUrlInput.trim());
    setLogoUrlInput('');
    showToast('Brand logo image updated!', 'success');
  };

  /* ── Hero Photo Upload Handlers ── */
  const handleHeroFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFileToS3(file, 'hero');
    if (url) setHeroBgImage(url);
  };

  const handleApplyHeroUrl = () => {
    if (!heroBgImageUrlInput.trim()) return;
    setHeroBgImage(heroBgImageUrlInput.trim());
    setHeroBgImageUrlInput('');
    showToast('Hero section photo updated!', 'success');
  };

  /* ── Page Background Wallpaper Upload Handlers ── */
  const handleBgFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFileToS3(file, 'backgrounds');
    if (url) setBgImage(url);
  };

  const handleApplyBgUrl = () => {
    if (!bgImageUrlInput.trim()) return;
    setBgImage(bgImageUrlInput.trim());
    setBgImageUrlInput('');
    showToast('Background wallpaper image updated!', 'success');
  };

  /* ── Service Card Image Upload Handlers ── */
  const handleServiceCardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFileToS3(file, 'services');
    if (url) {
      setNewSvcCardImage(url);
      setNewSvcCardImageUrl(url);
    }
  };

  const handleEditModalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFileToS3(file, 'services');
    if (url) {
      setEditModalImage(url);
      setEditModalImageUrl(url);
    }
  };

  const handleAddServiceCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSvcCardName.trim()) return;

    const cardImage = newSvcCardImage || newSvcCardImageUrl || getServiceImg(newSvcCardName, newSvcCardCategory);
    const newServiceData = {
      tenantId: tenant.id,
      name: newSvcCardName.trim(),
      basePrice: Number(newSvcCardPrice) || 350,
      durationMin: Number(newSvcCardDuration) || 60,
      category: newSvcCardCategory || 'General',
      icon: newSvcCardIcon || '🛠️',
      imageUrl: cardImage,
      description: newSvcCardDesc || `${newSvcCardName.trim()} professional verified service with 30-day warranty.`,
      isActive: true,
    };

    try {
      const res = await api.createService(newServiceData);
      const created = res.data || { ...newServiceData, id: `svc-${Date.now()}` };
      if (setServices) {
        setServices(prev => [created, ...prev]);
      }
      setFeaturedServiceIds(prev => [created.id, ...prev]);
      setNewSvcCardName('');
      setNewSvcCardImage('');
      setNewSvcCardImageUrl('');
      setNewSvcCardDesc('');
      showToast(`🎉 Service "${created.name}" created and saved!`, 'success');
    } catch (err: any) {
      const fallbackSvc = { ...newServiceData, id: `svc-${Date.now()}` };
      if (setServices) {
        setServices(prev => [fallbackSvc, ...prev]);
      }
      setFeaturedServiceIds(prev => [fallbackSvc.id, ...prev]);
      setNewSvcCardName('');
      setNewSvcCardImage('');
      setNewSvcCardImageUrl('');
      setNewSvcCardDesc('');
      showToast(`🎉 Service "${fallbackSvc.name}" created!`, 'success');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      await api.deleteService(serviceId);
    } catch {}
    if (setServices) {
      setServices(prev => prev.filter(s => s.id !== serviceId));
    }
    setFeaturedServiceIds(prev => prev.filter(id => id !== serviceId));
    showToast('Service card deleted', 'info');
  };

  const handleSaveEditedService = () => {
    if (!editingServiceModal) return;
    const finalImage = editModalImage || editModalImageUrl || getServiceImg(editModalName, editModalCategory);
    const updatedSvc: Service = {
      ...editingServiceModal,
      name: editModalName.trim() || editingServiceModal.name,
      basePrice: Number(editModalPrice) || 0,
      durationMin: Number(editModalDuration) || 60,
      category: editModalCategory || editingServiceModal.category,
      icon: editModalIcon || editingServiceModal.icon,
      imageUrl: finalImage || editingServiceModal.imageUrl,
      description: editModalDesc,
    };

    if (setServices) {
      setServices(prev => prev.map(s => s.id === updatedSvc.id ? updatedSvc : s));
    }

    // Save to backend
    api.updateService(updatedSvc.id, updatedSvc).catch(() => {});

    if (editModalIsFeatured && !featuredServiceIds.includes(updatedSvc.id)) {
      setFeaturedServiceIds(prev => [...prev, updatedSvc.id]);
    } else if (!editModalIsFeatured && featuredServiceIds.includes(updatedSvc.id)) {
      setFeaturedServiceIds(prev => prev.filter(id => id !== updatedSvc.id));
    }

    setEditingServiceModal(null);
    showToast(`✨ Updated "${updatedSvc.name}" service card!`, 'success');
  };

  /* ── Gallery / Portfolio ────────────────────────────────── */
  const [portfolio, setPortfolio] = useState<any[]>(c.portfolio || []);
  const [newPortTitle,    setNewPortTitle]    = useState('');
  const [newPortCategory, setNewPortCategory] = useState('Cleaning');
  const [newPortIcon,     setNewPortIcon]     = useState('🏠');
  const [newPortWorker,   setNewPortWorker]   = useState('');

  /* ── Team Visibility ────────────────────────────────────── */
  const [workerVisibility, setWorkerVisibility] = useState<Record<string, boolean>>(
    myWorkers.reduce((acc, w) => ({ ...acc, [w.id]: (w as any).showOnWebsite !== false }), {})
  );
  const [workerDesignation, setWorkerDesignation] = useState<Record<string, string>>(
    myWorkers.reduce((acc, w) => ({ ...acc, [w.id]: (w as any).designation || '' }), {})
  );

  /* ── Offers / Campaigns ─────────────────────────────────── */
  const [campaigns,    setCampaigns]    = useState<any[]>(c.campaigns || []);
  const [newCampTitle, setNewCampTitle] = useState('');
  const [newCampCode,  setNewCampCode]  = useState('');
  const [newCampEnd,   setNewCampEnd]   = useState('');
  const [newCampDisc,  setNewCampDisc]  = useState('');

  /* ── Reviews / Testimonials ─────────────────────────────── */
  const [testimonials,    setTestimonials]    = useState<any[]>(c.testimonials || []);
  const [newTestAuthor,   setNewTestAuthor]   = useState('');
  const [newTestRole,     setNewTestRole]     = useState('Customer');
  const [newTestText,     setNewTestText]     = useState('');
  const [newTestRating,   setNewTestRating]   = useState(5);
  const [newTestVerified, setNewTestVerified] = useState(true);

  /* ── FAQs ───────────────────────────────────────────────── */
  const [faqs,    setFaqs]    = useState<any[]>(c.faqs || []);
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  /* ── Coverage ───────────────────────────────────────────── */
  const [cityName,      setCityName]      = useState(c.city || '');
  const [nearbyCities,  setNearbyCities]  = useState<string[]>(c.localSeoConfig?.nearbyCities || []);
  const [newNearbyCity, setNewNearbyCity] = useState('');
  const [bizHours,      setBizHours]      = useState(c.businessHours || 'Mon–Sun, 8 AM – 8 PM');
  const [bizPhone,      setBizPhone]      = useState(c.phone || '');
  const [bizWhatsApp,   setBizWhatsApp]   = useState(c.whatsAppNumber || '');
  const [bizAddress,    setBizAddress]    = useState(c.address || '');

  /* ── UI State ───────────────────────────────────────────── */
  const [editorTab, setEditorTab] = useState<EditorTab>(() => {
    try {
      const saved = sessionStorage.getItem('anarav_website_editor_tab') || localStorage.getItem('anarav_website_editor_tab');
      if (saved) return saved as EditorTab;
    } catch {}
    return 'appearance';
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('anarav_website_editor_tab', editorTab);
      localStorage.setItem('anarav_website_editor_tab', editorTab);
    } catch {}
  }, [editorTab]);

  const [previewDevice,setPreviewDevice]= useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSaving,     setIsSaving]     = useState(false);
  const [wcagOk,       setWcagOk]       = useState(true);
  const [webVitals]                     = useState({ perf: 96, a11y: 98, seo: 95 });

  // Sync with tenant changes
  useEffect(() => {
    setPrimaryColor(c.primaryColor);
    setSecondaryColor(c.secondaryColor || '#4f46e5');
    setAccentColor((c as any).accentColor || '#38bdf8');
    setThemeMode(c.themeMode || 'light');
    setThemeFont(c.themeFont || 'Inter, sans-serif');
    setThemeRadius(c.themeRadius || 'modern');
    setThemeButtonStyle(c.themeButtonStyle || 'filled');
    setCardStyle((c as any).cardStyle || 'glassmorphic');
    setLogoImage(c.logoImage || '');
    setLogoText(c.logoText || tenant.name);
    setBgType((c as any).bgType || 'solid');
    setBgImage((c as any).bgImage || '');
    setBgGradient((c as any).bgGradient || 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #020617 100%)');
    setBgPattern((c as any).bgPattern || 'none');
    setBgOverlayOpacity((c as any).bgOverlayOpacity ?? 40);
    setBgOverlayColor((c as any).bgOverlayColor || '#000000');
    setBgBlur((c as any).bgBlur ?? 0);
    setHeroBgType((c as any).heroBgType || 'default');
    setHeroBgImage((c as any).heroBgImage || '');
    setHeroBgOverlayOpacity((c as any).heroBgOverlayOpacity ?? 50);
    setHeroGlowActive((c as any).heroGlowActive ?? true);
    setNavbarTagline((c as any).navbarTagline || 'One Call. We Do It All.');
    const tabNameMap: Record<string, string> = {
      hero: 'Hero', services: 'Services', offers: 'Offers', team: 'Our Team',
      gallery: 'Gallery', reviews: 'Reviews', faqs: 'FAQs', coverage: 'Contact'
    };
    const rawLinks = (c as any).navLinksList || [
      { id: 'nav-1', name: 'Home', tab: 'hero' },
      { id: 'nav-2', name: 'Services', tab: 'services' },
      { id: 'nav-3', name: 'Offers', tab: 'offers' },
      { id: 'nav-4', name: 'Team', tab: 'team' },
      { id: 'nav-5', name: 'Gallery', tab: 'gallery' },
      { id: 'nav-6', name: 'Reviews', tab: 'reviews' },
      { id: 'nav-7', name: 'FAQs', tab: 'faqs' },
      { id: 'nav-8', name: 'Contact', tab: 'coverage' },
    ];
    setNavLinksList(rawLinks.map((l: any, i: number) => ({
      ...l,
      name: (l.name && l.name.trim()) ? l.name : (tabNameMap[l.tab] || `Link ${i + 1}`)
    })));
    setShowTrackButton((c as any).showTrackButton ?? true);
    setTrackButtonText((c as any).trackButtonText || 'Track Booking');
    setShowBookButton((c as any).showBookButton ?? true);
    setBookButtonText((c as any).bookButtonText || 'Book Service');
    setShowLoginButton((c as any).showLoginButton ?? true);
    setLoginButtonText((c as any).loginButtonText || 'Sign In');
    setFooterAbout((c as any).footerAbout || `Your trusted home services partner in ${c.city || 'your city'}.`);
    setFooterCopyright((c as any).footerCopyright || `© ${new Date().getFullYear()} ${c.logoText || tenant.name} Services. All rights reserved.`);
    setShowPoweredBy((c as any).showPoweredBy ?? true);
    setFooterSocials((c as any).footerSocials || { 'Facebook': '#', 'Instagram': '#', 'YouTube': '#', 'WhatsApp': '#' });
    setFooterColumns((c as any).footerColumns || [
      { id: 'fcol-1', title: 'Quick Links', items: ['Home', 'Services', 'Offers', 'About Us', 'Contact'] },
      { id: 'fcol-2', title: 'Popular Services', items: ['Cleaning', 'Electrical', 'Plumbing', 'Painting', 'Pest Control'] },
      { id: 'fcol-3', title: 'Company', items: ['About Us', 'Our Team', 'Reviews', 'Blog', 'Careers'] },
    ]);
    setHeroTitle(c.heroTitle || '');
    setHeroSubtitle(c.heroSubtitle || '');
    setHeroBadge((c as any).heroArrivalGuarantee || '30 MIN ARRIVAL GUARANTEE');
    setShowLiveAvailability((c as any).showLiveAvailability ?? true);
    setLiveAvailTitle((c as any).liveAvailTitle || 'Live Availability');
    setLiveAvailText((c as any).liveAvailText || '');
    setLiveAvailSlot((c as any).liveAvailSlot || 'Today, 3:00 PM');
    setShowEmergencyCard((c as any).showEmergencyCard ?? true);
    setEmergencyCardTitle((c as any).emergencyCardTitle || '⚡ Emergency Home Service');
    setEmergencyCardText((c as any).emergencyCardText || 'Arriving in 30 Minutes or Free');
    setShowTrustBadges((c as any).showTrustBadges ?? true);
    if ((c as any).trustBadgesList && Array.isArray((c as any).trustBadgesList)) {
      setTrustBadgesList((c as any).trustBadgesList);
    }
    setAnnounceActive(c.announcementActive ?? true);
    setAnnounceText(c.announcementText || '');
    setAnnounceExpiry(c.announcementExpiry || '');
    setTechSelectionActive(c.allowTechnicianSelection ?? false);
    setB2bEnquiryActive(c.enableB2bEnquiry ?? false);
    setPageComponents(getInitialComponents(c));
    setPortfolio(c.portfolio || []);
    setTestimonials(c.testimonials || []);
    setFaqs(c.faqs || []);
    setCampaigns(c.campaigns || []);
    setCityName(c.city || '');
    setNearbyCities(c.localSeoConfig?.nearbyCities || []);
    setBizHours(c.businessHours || 'Mon–Sun, 8 AM – 8 PM');
    setBizPhone(c.phone || '');
    setBizWhatsApp(c.whatsAppNumber || '');
    setBizAddress(c.address || '');
  }, [tenant.id]);

  // WCAG check whenever primary color changes
  useEffect(() => {
    const ratio = getContrastRatio('#ffffff', primaryColor);
    setWcagOk(ratio >= 4.5);
  }, [primaryColor]);

  // Auto-sync changes to shared store & debounced database save
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const updatedCmsPages = (() => {
      const pages = [...(c.cmsPages || [])];
      const homeIdx = pages.findIndex(p => p.slug === 'home');
      const homePage = { id: 'home', title: 'Home', slug: 'home', components: pageComponents };
      if (homeIdx >= 0) pages[homeIdx] = homePage;
      else pages.unshift(homePage);
      return pages;
    })();

    const updatedConfig = {
      ...tenant.config,
      primaryColor, secondaryColor, accentColor,
      themeMode, themeFont, themeRadius, themeButtonStyle, cardStyle,
      bgType, bgImage, bgGradient, bgPattern, bgOverlayOpacity, bgOverlayColor, bgBlur,
      heroBgType, heroBgImage, heroBgOverlayOpacity, heroGlowActive,
      logoImage,
      logoText,
      navbarTagline,
      navLinksList,
      showTrackButton,
      trackButtonText,
      showBookButton,
      bookButtonText,
      showLoginButton,
      loginButtonText,
      footerAbout,
      footerCopyright,
      showPoweredBy,
      footerSocials,
      footerColumns,
      heroTitle, heroSubtitle, heroArrivalGuarantee: heroBadge,
      showLiveAvailability, liveAvailTitle, liveAvailText, liveAvailSlot,
      showEmergencyCard, emergencyCardTitle, emergencyCardText,
      showTrustBadges, trustBadgesList,
      announcementActive: announceActive, announcementText: announceText,
      announcementExpiry: announceExpiry,
      allowTechnicianSelection: techSelectionActive,
      enableB2bEnquiry: b2bEnquiryActive,
      cmsPages: updatedCmsPages,
      portfolio, testimonials, faqs, campaigns,
      city: cityName, businessHours: bizHours, phone: bizPhone,
      whatsAppNumber: bizWhatsApp, address: bizAddress,
      localSeoConfig: { ...(tenant.config.localSeoConfig as any), nearbyCities } as any,
      featuredServiceIds, homepageServiceCount,
    };

    setTenants(prev => prev.map(t => t.id === tenant.id ? {
      ...t,
      name: logoText || t.name,
      config: updatedConfig
    } : t));

    const timer = setTimeout(() => {
      api.updateTenant(tenant.id, {
        name: logoText || tenant.name,
        config: updatedConfig,
        primaryColor,
        secondaryColor: secondaryColor || '#4f46e5',
        font: themeFont
      }).catch(err => {
        console.error('Auto-save error:', err);
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [
    primaryColor, secondaryColor, accentColor,
    themeMode, themeFont, themeRadius, themeButtonStyle, cardStyle,
    bgType, bgImage, bgGradient, bgPattern, bgOverlayOpacity, bgOverlayColor, bgBlur,
    heroBgType, heroBgImage, heroBgOverlayOpacity, heroGlowActive,
    logoImage, logoText, navbarTagline, navLinksList, showTrackButton, trackButtonText, showBookButton, bookButtonText, showLoginButton, loginButtonText,
    footerAbout, footerCopyright, showPoweredBy, footerSocials, footerColumns,
    heroTitle, heroSubtitle, heroBadge, primaryCta, secondaryCta,
    announceActive, announceText, announceExpiry, techSelectionActive, b2bEnquiryActive,
    pageComponents, portfolio, testimonials, faqs, campaigns, cityName, nearbyCities,
    bizHours, bizPhone, bizWhatsApp, bizAddress, featuredServiceIds, homepageServiceCount
  ]);

  /* ── Navbar Handlers ─────────────────────────────────────── */
  const addNavLink = () => {
    const tabNameMap: Record<string, string> = {
      hero: 'Hero',
      services: 'Services',
      offers: 'Offers',
      team: 'Our Team',
      gallery: 'Gallery',
      reviews: 'Reviews',
      faqs: 'FAQs',
      coverage: 'Contact'
    };
    const finalName = newNavLinkName.trim() || tabNameMap[newNavLinkTab] || 'New Page';
    const item = {
      id: `nav-${Date.now()}`,
      name: finalName,
      tab: newNavLinkTab || 'services',
    };
    setNavLinksList(prev => [...prev, item]);
    setNewNavLinkName('');
    showToast(`Added "${item.name}" link to navbar!`, 'success');
  };

  const deleteNavLink = (id: string) => {
    setNavLinksList(prev => prev.filter(l => l.id !== id));
    showToast('Navbar link deleted', 'info');
  };

  const moveNavLink = (idx: number, dir: 'up' | 'down') => {
    setNavLinksList(prev => {
      const next = [...prev];
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= next.length) return next;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const resetNavLinks = () => {
    setNavLinksList([
      { id: 'nav-1', name: 'Home', tab: 'hero' },
      { id: 'nav-2', name: 'Services', tab: 'services' },
      { id: 'nav-3', name: 'Offers', tab: 'offers' },
      { id: 'nav-4', name: 'Team', tab: 'team' },
      { id: 'nav-5', name: 'Gallery', tab: 'gallery' },
      { id: 'nav-6', name: 'Reviews', tab: 'reviews' },
      { id: 'nav-7', name: 'FAQs', tab: 'faqs' },
      { id: 'nav-8', name: 'Contact', tab: 'coverage' },
    ]);
    showToast('Navbar links reset to default', 'info');
  };

  /* ── Footer Handlers ─────────────────────────────────────── */
  const addFooterColumn = () => {
    if (!newFooterColTitle.trim()) return;
    const col = {
      id: `fcol-${Date.now()}`,
      title: newFooterColTitle.trim(),
      items: ['Overview', 'Inquire Now']
    };
    setFooterColumns(prev => [...prev, col]);
    setNewFooterColTitle('');
    showToast(`Added "${col.title}" column to footer!`, 'success');
  };

  const deleteFooterColumn = (colId: string) => {
    setFooterColumns(prev => prev.filter(c => c.id !== colId));
    showToast('Footer column deleted', 'info');
  };

  const addFooterItem = (colId: string) => {
    if (!newFooterItemText.trim()) return;
    setFooterColumns(prev => prev.map(col => {
      if (col.id === colId) {
        return { ...col, items: [...col.items, newFooterItemText.trim()] };
      }
      return col;
    }));
    setNewFooterItemText('');
    showToast('Item added to footer column', 'success');
  };

  const deleteFooterItem = (colId: string, itemIdx: number) => {
    setFooterColumns(prev => prev.map(col => {
      if (col.id === colId) {
        return { ...col, items: col.items.filter((_, idx) => idx !== itemIdx) };
      }
      return col;
    }));
    showToast('Footer link deleted', 'info');
  };

  const resetFooterColumns = () => {
    setFooterColumns([
      { id: 'fcol-1', title: 'Quick Links', items: ['Home', 'Services', 'Offers', 'About Us', 'Contact'] },
      { id: 'fcol-2', title: 'Popular Services', items: ['Cleaning', 'Electrical', 'Plumbing', 'Painting', 'Pest Control'] },
      { id: 'fcol-3', title: 'Company', items: ['About Us', 'Our Team', 'Reviews', 'Blog', 'Careers'] },
    ]);
    showToast('Footer columns reset to default', 'info');
  };



  /* ── Section Handlers ────────────────────────────────────── */
  const deleteSection = (compId: string) => {
    setPageComponents(prev => prev.filter(c => c.id !== compId));
    showToast('Section deleted from page layout', 'info');
  };

  const addCatalogSection = (secType: string) => {
    const meta = ALL_SECTIONS.find(s => s.type === secType);
    if (!meta) return;
    const newComp = {
      id: `comp-${secType}-${Date.now()}`,
      type: secType,
      enabled: true,
      title: meta.label,
    };
    setPageComponents(prev => [...prev, newComp]);
    showToast(`Added ${meta.label} section to layout!`, 'success');
  };

  const addCustomSection = () => {
    if (!newCustomSectionTitle.trim()) return;
    const newComp = {
      id: `comp-custom-${Date.now()}`,
      type: 'custom',
      enabled: true,
      title: newCustomSectionTitle.trim(),
      desc: newCustomSectionDesc.trim() || 'Provide your clients with key service highlights, custom packages, or regional announcements.',
      icon: newCustomSectionIcon || '✨',
      buttonText: 'Learn More'
    };
    setPageComponents(prev => [...prev, newComp]);
    setNewCustomSectionTitle('');
    setNewCustomSectionDesc('');
    showToast(`Added custom section "${newComp.title}"!`, 'success');
  };

  const resetDefaultSections = () => {
    setPageComponents(getInitialComponents(tenant.config));
    showToast('Sections reset to default template', 'info');
  };

  const handleSave = async () => {
    setIsSaving(true);

    const updatedCmsPages = (() => {
      const pages = [...(c.cmsPages || [])];
      const homeIdx = pages.findIndex(p => p.slug === 'home');
      const homePage = { id: 'home', title: 'Home', slug: 'home', components: pageComponents };
      if (homeIdx >= 0) pages[homeIdx] = homePage;
      else pages.unshift(homePage);
      return pages;
    })();

    const updatedConfig = {
      ...tenant.config,
      primaryColor, secondaryColor, accentColor,
      themeMode, themeFont, themeRadius, themeButtonStyle, cardStyle,
      bgType, bgImage, bgGradient, bgPattern, bgOverlayOpacity, bgOverlayColor, bgBlur,
      heroBgType, heroBgImage, heroBgOverlayOpacity, heroGlowActive,
      logoImage,
      logoText,
      navbarTagline,
      navLinksList,
      showTrackButton,
      trackButtonText,
      showBookButton,
      bookButtonText,
      showLoginButton,
      loginButtonText,
      footerAbout,
      footerCopyright,
      showPoweredBy,
      footerSocials,
      footerColumns,
      heroTitle, heroSubtitle, announcementActive: announceActive, announcementText: announceText,
      announcementExpiry: announceExpiry,
      allowTechnicianSelection: techSelectionActive,
      enableB2bEnquiry: b2bEnquiryActive,
      cmsPages: updatedCmsPages,
      portfolio, testimonials, faqs, campaigns,
      city: cityName, businessHours: bizHours, phone: bizPhone,
      whatsAppNumber: bizWhatsApp, address: bizAddress,
      localSeoConfig: { ...(tenant.config.localSeoConfig as any), nearbyCities } as any,
      featuredServiceIds, homepageServiceCount,
    };

    setTenants(prev => prev.map(t => t.id === tenant.id ? {
      ...t,
      name: logoText || t.name,
      config: updatedConfig
    } : t));

    try {
      await api.updateTenant(tenant.id, {
        name: logoText || tenant.name,
        config: updatedConfig,
        primaryColor,
        secondaryColor: secondaryColor || '#4f46e5',
        font: themeFont
      });
      showToast('🚀 Website published! Changes saved to database and live.', 'success');
    } catch (err) {
      console.error('Error saving website configuration to DB:', err);
      showToast('🚀 Website updated and saved locally!', 'success');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSection = (compId: string) =>
    setPageComponents(prev => prev.map(c => c.id === compId ? { ...c, enabled: !c.enabled } : c));

  const moveSection = (idx: number, dir: 'up' | 'down') =>
    setPageComponents(prev => {
      const next = [...prev];
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= next.length) return next;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });

  const [newPortYoutube,   setNewPortYoutube]   = useState('');
  const [newPortInstagram, setNewPortInstagram] = useState('');

  const addPortfolioItem = () => {
    if (!newPortTitle.trim()) return;
    const item = {
      id: `port-${Date.now()}`, title: newPortTitle, category: newPortCategory,
      icon: newPortIcon, workerName: newPortWorker || 'Our Team',
      youtubeUrl: newPortYoutube.trim() || undefined,
      instagramUrl: newPortInstagram.trim() || undefined,
    };
    setPortfolio(prev => [...prev, item]);
    setNewPortTitle(''); setNewPortWorker(''); setNewPortYoutube(''); setNewPortInstagram('');
    showToast('Portfolio item added!');
  };

  const addTestimonial = () => {
    if (!newTestAuthor.trim() || !newTestText.trim()) return;
    const t = {
      id: `test-${Date.now()}`, author: newTestAuthor, role: newTestRole,
      text: newTestText, rating: newTestRating, verified: newTestVerified,
    };
    setTestimonials(prev => [...prev, t]);
    setNewTestAuthor(''); setNewTestRole('Customer'); setNewTestText(''); setNewTestRating(5);
    showToast('Review added!');
  };

  const addFaq = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    setFaqs(prev => [...prev, { id: `faq-${Date.now()}`, question: newFaqQ, answer: newFaqA }]);
    setNewFaqQ(''); setNewFaqA('');
    showToast('FAQ added!');
  };

  const addCampaign = () => {
    if (!newCampTitle.trim() || !newCampCode.trim()) return;
    const camp = {
      id: `camp-${Date.now()}`, title: newCampTitle, offerCode: newCampCode,
      endDate: newCampEnd || '31/12/2026', subtitle: newCampDisc, enabled: true, priority: 1, targetSlug: 'services',
    };
    setCampaigns(prev => [...prev, camp]);
    setNewCampTitle(''); setNewCampCode(''); setNewCampEnd(''); setNewCampDisc('');
    showToast('Offer added!');
  };

  /* Device width constraints */
  const deviceWidthMap = {
    desktop: '100%',
    tablet: '768px',
    mobile: '390px',
  };

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="flex h-full -m-6 overflow-hidden animate-fadeIn relative">

      {/* ═══════════ LEFT: EDITOR PANEL ═══════════ */}
      <div className="w-[380px] flex-shrink-0 flex flex-col bg-slate-950 border-r border-slate-800 shadow-2xl z-10">

        {/* Panel Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-900/60">
          <div>
            <p className="text-sm font-black text-white flex items-center gap-2">🌐 Website Manager</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{tenant.subdomain}.servos.in</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary px-4 py-2 text-[11px] font-black flex items-center gap-1.5 shrink-0 disabled:opacity-60 shadow-lg"
            style={{ background: isSaving ? '#475569' : primaryColor }}
          >
            {isSaving ? (
              <><span className="animate-spin">⏳</span> Publishing...</>
            ) : (
              <>🚀 Publish Live</>
            )}
          </button>
        </div>

        {/* Tab Pills */}
        <div className="flex flex-wrap gap-1 p-2 border-b border-slate-800 shrink-0 bg-slate-950/80 backdrop-blur-sm">
          {EDITOR_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setEditorTab(t.id)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${editorTab === t.id ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* ═══ APPEARANCE & CUSTOMER USER INTERFACE ═══ */}
          {editorTab === 'appearance' && (
            <div className="space-y-4">

              {/* Sub Navigation Bar for Appearance Controls */}
              <div className="flex rounded-xl bg-slate-900/90 p-1 border border-slate-800 gap-1 overflow-x-auto">
                {[
                  { id: 'brand', icon: '🏢', label: 'Brand' },
                  { id: 'colors', icon: '🎨', label: 'Colors' },
                  { id: 'background', icon: '🖼️', label: 'Wallpaper' },
                  { id: 'hero', icon: '🦸', label: 'Hero' },
                  { id: 'typography', icon: '🔤', label: 'Styling' },
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setAppearanceSubTab(sub.id as any)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                      appearanceSubTab === sub.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{sub.icon}</span> <span>{sub.label}</span>
                  </button>
                ))}
              </div>

              {/* ── SUBTAB 1: BRAND LOGO & IDENTITY ── */}
              {appearanceSubTab === 'brand' && (
                <div className="space-y-4 animate-fadeIn">
                  <SectionCard title="Brand Logo & Icon" subtitle="Upload an image logo or choose instant presets">
                    {/* Logo Image Preview or State */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          className="w-14 h-14 rounded-xl border border-slate-700/80 flex items-center justify-center overflow-hidden shrink-0 shadow-inner"
                          style={{
                            backgroundImage: 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
                            backgroundSize: '12px 12px',
                            backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
                            backgroundColor: '#0f172a'
                          }}
                        >
                          {logoImage ? (
                            <img src={logoImage} alt="Brand Logo" className="w-full h-full object-contain p-1" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-white text-base shadow-sm" style={{ background: primaryColor }}>
                              {logoText.charAt(0) || '🏪'}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white truncate">{logoImage ? 'Custom Image Logo Active' : 'Text Monogram Active'}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Live on navbar & footer in preview</p>
                        </div>
                      </div>

                      {logoImage && (
                        <button
                          onClick={() => {
                            setLogoImage('');
                            showToast('Logo image removed. Reverted to monogram.');
                          }}
                          className="text-xs text-rose-400 hover:text-rose-300 p-2 rounded-lg hover:bg-rose-950/30 transition-colors flex items-center gap-1 shrink-0 font-bold"
                          title="Remove Logo"
                        >
                          <Trash2 size={13} /> Clear
                        </button>
                      )}
                    </div>

                    {/* File Upload Zone */}
                    <div>
                      <FieldLabel>Upload Logo File (PNG, SVG, JPG, WebP)</FieldLabel>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        accept="image/*" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 bg-slate-950/60 hover:bg-slate-950 rounded-xl p-4 text-center cursor-pointer transition-all group"
                      >
                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-400 mx-auto mb-1.5 transition-transform group-hover:scale-110" />
                        <p className="text-xs font-bold text-slate-200">Click to upload brand logo</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Recommended height: 40px – 80px (Max 5MB)</p>
                      </div>
                    </div>

                    {/* Or Enter URL */}
                    <div>
                      <FieldLabel>Or Enter Image URL</FieldLabel>
                      <div className="flex gap-2">
                        <FieldInput 
                          value={logoUrlInput} 
                          onChange={e => setLogoUrlInput(e.target.value)} 
                          placeholder="https://example.com/logo.png" 
                          onKeyDown={e => e.key === 'Enter' && handleApplyLogoUrl()}
                        />
                        <button 
                          onClick={handleApplyLogoUrl}
                          className="btn-secondary px-3 py-1.5 text-xs font-bold shrink-0"
                        >
                          Apply
                        </button>
                      </div>
                    </div>

                    {/* Instant Preset Logos */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <FieldLabel>Instant AI / Preset Logos</FieldLabel>
                        <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1"><Sparkles size={10} /> 1-Click Apply</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {PRESET_LOGOS.map((p, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setLogoImage(p.svg);
                              showToast(`✨ ${p.label} logo applied!`);
                            }}
                            className="bg-slate-950 border border-slate-800 hover:border-emerald-500/60 p-2 rounded-xl text-left transition-all hover:bg-slate-800/60 flex items-center gap-2 group"
                          >
                            <img src={p.svg} alt={p.label} className="h-6 w-auto object-contain rounded shrink-0 group-hover:scale-105 transition-transform" />
                            <span className="text-[10px] font-bold text-slate-300 group-hover:text-white truncate">{p.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Logo Text */}
                    <div className="pt-2 border-t border-slate-800">
                      <FieldLabel>Brand Name (Logo Text)</FieldLabel>
                      <FieldInput 
                        value={logoText} 
                        onChange={e => setLogoText(e.target.value)} 
                        placeholder="e.g. 🏪 CleanPro Pro"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Used in website title, SEO, footer, and when image is loading.</p>
                    </div>
                  </SectionCard>
                </div>
              )}

              {/* ── SUBTAB 2: COLORS & PALETTES ── */}
              {appearanceSubTab === 'colors' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Curated 1-Click Palettes */}
                  <SectionCard title="Curated Brand Palettes" subtitle="Instant harmonious color schemes designed for home services">
                    <div className="grid grid-cols-2 gap-2">
                      {PRESET_COLOR_PALETTES.map((pal, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setPrimaryColor(pal.primary);
                            setSecondaryColor(pal.secondary);
                            setAccentColor(pal.accent);
                            showToast(`🎨 "${pal.name}" palette applied!`, 'success');
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                            primaryColor === pal.primary
                              ? 'border-emerald-500 bg-slate-900 shadow-md ring-1 ring-emerald-500/50'
                              : 'border-slate-800 bg-slate-950 hover:bg-slate-900 hover:border-slate-700'
                          }`}
                        >
                          <div 
                            className="w-7 h-7 rounded-lg shrink-0 shadow-sm border border-white/20" 
                            style={{ background: pal.preview }}
                          />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-200 truncate">{pal.name}</p>
                            <p className="text-[9px] text-slate-500 font-mono">{pal.primary}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </SectionCard>

                  {/* Primary Color Picker */}
                  <SectionCard title="Primary Brand Color" subtitle="Drives booking buttons, headers, active accents & badges">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input 
                          type="color" 
                          value={primaryColor} 
                          onChange={e => setPrimaryColor(e.target.value)} 
                          className="w-12 h-10 rounded-xl border-0 cursor-pointer bg-transparent" 
                        />
                      </div>
                      <input
                        type="text" 
                        value={primaryColor}
                        onChange={e => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && setPrimaryColor(e.target.value)}
                        className="form-input flex-1 text-xs font-mono uppercase"
                        maxLength={7}
                      />
                      <div className="w-10 h-10 rounded-xl border border-slate-700 shrink-0 shadow-sm" style={{ backgroundColor: primaryColor }} />
                    </div>
                    
                    {/* WCAG status */}
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg text-[10px] font-bold border mt-2 ${wcagOk ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-400' : 'bg-red-950/30 border-red-900/40 text-red-400'}`}>
                      {wcagOk ? '✓ WCAG AA Compliant — Color contrast is fully accessible' : '✗ Low contrast ratio — Consider a darker shade for better readability'}
                    </div>
                  </SectionCard>

                  {/* Secondary & Accent Colors */}
                  <SectionCard title="Secondary & Highlight Accent" subtitle="Used in badges, gradient shifts, and icons">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <FieldLabel>Secondary Color</FieldLabel>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={secondaryColor} 
                            onChange={e => setSecondaryColor(e.target.value)} 
                            className="w-9 h-8 rounded-lg border-0 cursor-pointer bg-transparent" 
                          />
                          <input
                            type="text" 
                            value={secondaryColor}
                            onChange={e => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && setSecondaryColor(e.target.value)}
                            className="form-input flex-1 text-[11px] font-mono uppercase py-1"
                            maxLength={7}
                          />
                        </div>
                      </div>
                      <div>
                        <FieldLabel>Accent Color</FieldLabel>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={accentColor} 
                            onChange={e => setAccentColor(e.target.value)} 
                            className="w-9 h-8 rounded-lg border-0 cursor-pointer bg-transparent" 
                          />
                          <input
                            type="text" 
                            value={accentColor}
                            onChange={e => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && setAccentColor(e.target.value)}
                            className="form-input flex-1 text-[11px] font-mono uppercase py-1"
                            maxLength={7}
                          />
                        </div>
                      </div>
                    </div>
                  </SectionCard>

                  {/* Theme Mode */}
                  <SectionCard title="Theme Mode" subtitle="Customer site color scheme">
                    <div className="grid grid-cols-3 gap-2">
                      {(['light', 'dark', 'auto'] as const).map(mode => (
                        <button 
                          key={mode} 
                          onClick={() => setThemeMode(mode)}
                          className={`py-2.5 rounded-xl text-[10px] font-black border transition-all capitalize ${themeMode === mode ? 'text-white border-transparent' : 'text-slate-400 border-slate-800 hover:border-slate-700 bg-slate-950'}`}
                          style={themeMode === mode ? { background: primaryColor, borderColor: primaryColor } : {}}
                        >
                          {mode === 'light' ? '☀️ Light' : mode === 'dark' ? '🌙 Dark' : '⚙️ Auto'}
                        </button>
                      ))}
                    </div>
                  </SectionCard>
                </div>
              )}

              {/* ── SUBTAB 3: PAGE BACKGROUND & WALLPAPER ── */}
              {appearanceSubTab === 'background' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Background Mode Selector */}
                  <SectionCard title="Page Background Mode" subtitle="Choose how your customer website background renders">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'image', icon: '🖼️', label: 'Image Wallpaper', desc: 'Custom photo background' },
                        { id: 'gradient', icon: '🌈', label: 'Modern Gradient', desc: 'Vibrant mesh gradients' },
                        { id: 'pattern', icon: '📐', label: 'Geometric Pattern', desc: 'Subtle dots & tech grids' },
                        { id: 'solid', icon: '🎨', label: 'Clean Solid Color', desc: 'Minimal clean surface' },
                      ].map(bm => (
                        <button
                          key={bm.id}
                          onClick={() => {
                            setBgType(bm.id as any);
                            showToast(`Background mode: ${bm.label}`);
                          }}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            bgType === bm.id
                              ? 'border-emerald-500 bg-slate-900 shadow-md ring-1 ring-emerald-500/50'
                              : 'border-slate-800 bg-slate-950 hover:bg-slate-900/60'
                          }`}
                        >
                          <div className="text-base mb-1">{bm.icon}</div>
                          <div className="text-xs font-bold text-white">{bm.label}</div>
                          <div className="text-[9px] text-slate-400">{bm.desc}</div>
                        </button>
                      ))}
                    </div>
                  </SectionCard>

                  {/* Image Wallpaper Controls */}
                  {bgType === 'image' && (
                    <SectionCard title="Background Image & Overlay" subtitle="Upload wallpaper, pick HD textures, and tweak opacity">
                      {/* Current Background Preview */}
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div 
                            className="w-16 h-12 rounded-lg border border-slate-700 overflow-hidden shrink-0 shadow-inner bg-cover bg-center"
                            style={{ backgroundImage: bgImage ? `url(${bgImage})` : undefined, backgroundColor: '#0f172a' }}
                          >
                            {!bgImage && <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">None</div>}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-white truncate">{bgImage ? 'Custom Wallpaper Active' : 'No image selected'}</p>
                            <p className="text-[10px] text-slate-400">Live on customer preview</p>
                          </div>
                        </div>

                        {bgImage && (
                          <button
                            onClick={() => {
                              setBgImage('');
                              showToast('Background image removed');
                            }}
                            className="text-xs text-rose-400 hover:text-rose-300 p-2 rounded-lg hover:bg-rose-950/30 transition-colors flex items-center gap-1 font-bold shrink-0"
                          >
                            <Trash2 size={13} /> Clear
                          </button>
                        )}
                      </div>

                      {/* File Upload Zone */}
                      <div>
                        <FieldLabel>Upload Wallpaper Photo (JPG, PNG, WebP up to 8MB)</FieldLabel>
                        <input 
                          type="file" 
                          ref={bgFileInputRef} 
                          accept="image/*" 
                          onChange={handleBgFileUpload} 
                          className="hidden" 
                        />
                        <div 
                          onClick={() => bgFileInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 bg-slate-950/60 hover:bg-slate-950 rounded-xl p-4 text-center cursor-pointer transition-all group"
                        >
                          <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-400 mx-auto mb-1.5 transition-transform group-hover:scale-110" />
                          <p className="text-xs font-bold text-slate-200">Click to upload background photo</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">High resolution landscape wallpaper (auto-compressed)</p>
                        </div>
                      </div>

                      {/* Image URL Input */}
                      <div>
                        <FieldLabel>Or Enter Wallpaper Image URL</FieldLabel>
                        <div className="flex gap-2">
                          <FieldInput 
                            value={bgImageUrlInput} 
                            onChange={e => setBgImageUrlInput(e.target.value)} 
                            placeholder="https://images.unsplash.com/..." 
                            onKeyDown={e => e.key === 'Enter' && handleApplyBgUrl()}
                          />
                          <button 
                            onClick={handleApplyBgUrl}
                            className="btn-secondary px-3 py-1.5 text-xs font-bold shrink-0"
                          >
                            Apply
                          </button>
                        </div>
                      </div>

                      {/* Curated Wallpaper Presets */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <FieldLabel>Curated HD Wallpapers</FieldLabel>
                          <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1"><Sparkles size={10} /> 1-Click Apply</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {PRESET_PAGE_WALLPAPERS.map((wp, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setBgImage(wp.url);
                                showToast(`✨ Applied "${wp.label}" background!`);
                              }}
                              className="bg-slate-950 border border-slate-800 hover:border-emerald-500/60 p-1.5 rounded-xl text-left transition-all hover:bg-slate-900 flex items-center gap-2 group overflow-hidden"
                            >
                              <div 
                                className="w-10 h-8 rounded-lg bg-cover bg-center shrink-0 border border-slate-700 group-hover:scale-105 transition-transform"
                                style={{ backgroundImage: `url(${wp.url})` }}
                              />
                              <span className="text-[10px] font-bold text-slate-300 group-hover:text-white truncate">{wp.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Overlay Opacity Slider */}
                      <div className="pt-2 border-t border-slate-800 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <FieldLabel>Dark Overlay Opacity</FieldLabel>
                          <span className="text-emerald-400 font-mono font-bold text-[11px]">{bgOverlayOpacity}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={90}
                          step={5}
                          value={bgOverlayOpacity}
                          onChange={e => setBgOverlayOpacity(Number(e.target.value))}
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                        <p className="text-[10px] text-slate-500">Controls contrast so text and service cards remain readable over photos.</p>
                      </div>

                      {/* Backdrop Blur Slider */}
                      <div className="pt-2 border-t border-slate-800 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <FieldLabel>Frosted Glass / Background Blur</FieldLabel>
                          <span className="text-emerald-400 font-mono font-bold text-[11px]">{bgBlur}px</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[0, 4, 12, 24].map(b => (
                            <button
                              key={b}
                              onClick={() => setBgBlur(b)}
                              className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                bgBlur === b ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              {b === 0 ? 'None' : `${b}px`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </SectionCard>
                  )}

                  {/* Gradient Background Controls */}
                  {bgType === 'gradient' && (
                    <SectionCard title="Modern Gradient Presets" subtitle="Select ultra-modern smooth mesh gradients">
                      <div className="grid grid-cols-2 gap-2">
                        {PRESET_GRADIENTS.map((g, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setBgGradient(g.value);
                              showToast(`✨ Applied "${g.label}" gradient!`);
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                              bgGradient === g.value
                                ? 'border-emerald-500 bg-slate-900 shadow-md ring-1 ring-emerald-500/50'
                                : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
                            }`}
                          >
                            <div 
                              className="w-7 h-7 rounded-lg shrink-0 shadow-sm border border-white/20" 
                              style={{ background: g.preview }}
                            />
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-slate-200 truncate">{g.label}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {/* Pattern Background Controls */}
                  {bgType === 'pattern' && (
                    <SectionCard title="Geometric Pattern Overlays" subtitle="Subtle repeating dot grids and architectural textures">
                      <div className="space-y-2">
                        {PRESET_PATTERNS.map((pat) => (
                          <button
                            key={pat.id}
                            onClick={() => {
                              setBgPattern(pat.id as any);
                              showToast(`✨ Pattern set to "${pat.label}"`);
                            }}
                            className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                              bgPattern === pat.id
                                ? 'border-emerald-500 bg-slate-900 ring-1 ring-emerald-500/50'
                                : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
                            }`}
                          >
                            <div>
                              <p className="text-xs font-bold text-white">{pat.label}</p>
                              <p className="text-[10px] text-slate-400">{pat.desc}</p>
                            </div>
                            {bgPattern === pat.id && <span className="text-emerald-400 text-xs font-black">✓ Active</span>}
                          </button>
                        ))}
                      </div>
                    </SectionCard>
                  )}
                </div>
              )}

              {/* ── SUBTAB 4: HERO ATMOSPHERE & WALLPAPER ── */}
              {appearanceSubTab === 'hero' && (
                <div className="space-y-4 animate-fadeIn">
                  <SectionCard title="Hero Section Atmosphere" subtitle="Upload hero photography, choose presets & tune ambient glows">
                    {/* Hero Background Preview */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          className="w-16 h-12 rounded-lg border border-slate-700 overflow-hidden shrink-0 shadow-inner bg-cover bg-center"
                          style={{ backgroundImage: heroBgImage ? `url(${heroBgImage})` : undefined, backgroundColor: '#0f172a' }}
                        >
                          {!heroBgImage && <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">Default</div>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white truncate">{heroBgImage ? 'Custom Hero Photo Active' : 'Default Mesh Glow'}</p>
                          <p className="text-[10px] text-slate-400">Live on hero banner in preview</p>
                        </div>
                      </div>

                      {heroBgImage && (
                        <button
                          onClick={() => {
                            setHeroBgImage('');
                            showToast('Hero photo reset to default glow');
                          }}
                          className="text-xs text-rose-400 hover:text-rose-300 p-2 rounded-lg hover:bg-rose-950/30 transition-colors flex items-center gap-1 font-bold shrink-0"
                        >
                          <Trash2 size={13} /> Clear
                        </button>
                      )}
                    </div>

                    {/* File Upload Zone */}
                    <div>
                      <FieldLabel>Upload Hero Section Photo</FieldLabel>
                      <input 
                        type="file" 
                        ref={heroFileInputRef} 
                        accept="image/*" 
                        onChange={handleHeroFileUpload} 
                        className="hidden" 
                      />
                      <div 
                        onClick={() => heroFileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 bg-slate-950/60 hover:bg-slate-950 rounded-xl p-4 text-center cursor-pointer transition-all group"
                      >
                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-400 mx-auto mb-1.5 transition-transform group-hover:scale-110" />
                        <p className="text-xs font-bold text-slate-200">Click to upload hero section photo</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">High-impact wide banner image (Max 8MB)</p>
                      </div>
                    </div>

                    {/* Hero Image URL Input */}
                    <div>
                      <FieldLabel>Or Enter Hero Image URL</FieldLabel>
                      <div className="flex gap-2">
                        <FieldInput 
                          value={heroBgImageUrlInput} 
                          onChange={e => setHeroBgImageUrlInput(e.target.value)} 
                          placeholder="https://images.unsplash.com/..." 
                          onKeyDown={e => e.key === 'Enter' && handleApplyHeroUrl()}
                        />
                        <button 
                          onClick={handleApplyHeroUrl}
                          className="btn-secondary px-3 py-1.5 text-xs font-bold shrink-0"
                        >
                          Apply
                        </button>
                      </div>
                    </div>

                    {/* Curated Hero Presets */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <FieldLabel>Curated Industry Hero Photos</FieldLabel>
                        <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1"><Sparkles size={10} /> 1-Click Apply</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {PRESET_HERO_WALLPAPERS.map((h, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setHeroBgImage(h.url);
                              showToast(`✨ Hero set to "${h.label}"!`);
                            }}
                            className="bg-slate-950 border border-slate-800 hover:border-emerald-500/60 p-1.5 rounded-xl text-left transition-all hover:bg-slate-900 flex items-center gap-2 group overflow-hidden"
                          >
                            <div 
                              className="w-10 h-8 rounded-lg bg-cover bg-center shrink-0 border border-slate-700 group-hover:scale-105 transition-transform"
                              style={{ backgroundImage: `url(${h.url})` }}
                            />
                            <span className="text-[10px] font-bold text-slate-300 group-hover:text-white truncate">{h.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Hero Overlay Slider */}
                    {heroBgImage && (
                      <div className="pt-2 border-t border-slate-800 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <FieldLabel>Hero Overlay Darkness</FieldLabel>
                          <span className="text-emerald-400 font-mono font-bold text-[11px]">{heroBgOverlayOpacity}%</span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={90}
                          step={5}
                          value={heroBgOverlayOpacity}
                          onChange={e => setHeroBgOverlayOpacity(Number(e.target.value))}
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                      </div>
                    )}

                    {/* Ambient Glow Toggle */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-200">Ambient Aura Glow</p>
                        <p className="text-[10px] text-slate-500">Radiates glowing primary color ring behind hero title</p>
                      </div>
                      <button 
                        onClick={() => setHeroGlowActive(v => !v)} 
                        className={`w-10 h-5 rounded-full transition-all relative ${heroGlowActive ? 'bg-emerald-500' : 'bg-slate-700'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${heroGlowActive ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  </SectionCard>
                </div>
              )}

              {/* ── SUBTAB 5: TYPOGRAPHY, SHAPES & CARD STYLING ── */}
              {appearanceSubTab === 'typography' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Font Family */}
                  <SectionCard title="Font Family" subtitle="Modern Google web typography for titles and paragraphs">
                    <select 
                      className="form-input w-full text-xs" 
                      value={themeFont} 
                      onChange={e => setThemeFont(e.target.value)}
                    >
                      {GOOGLE_FONTS.map(f => (
                        <option key={f} value={f}>{f.split(',')[0]}</option>
                      ))}
                    </select>
                  </SectionCard>

                  {/* Card Surface Style */}
                  <SectionCard title="Card & Surface Appearance" subtitle="Defines how service cards, review boxes, and modals look">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'glassmorphic', label: '✨ Glassmorphic', desc: 'Frosted blur glass' },
                        { id: 'solid', label: '🏢 Solid Clean', desc: 'Opaque crisp surfaces' },
                        { id: 'bordered', label: '📐 Bordered', desc: 'Dark stroke contrast' },
                        { id: 'minimal', label: '🍃 Minimal Flat', desc: 'Subtle translucent tint' },
                      ].map(cs => (
                        <button
                          key={cs.id}
                          onClick={() => {
                            setCardStyle(cs.id as any);
                            showToast(`Card style: ${cs.label}`);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            cardStyle === cs.id
                              ? 'border-emerald-500 bg-slate-900 ring-1 ring-emerald-500/50 shadow-md'
                              : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
                          }`}
                        >
                          <div className="text-xs font-bold text-white">{cs.label}</div>
                          <div className="text-[9px] text-slate-400">{cs.desc}</div>
                        </button>
                      ))}
                    </div>
                  </SectionCard>

                  {/* Border Radius Style */}
                  <SectionCard title="Corner Radius Style" subtitle="Rounded curves for buttons, images, and cards">
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { val: 'modern',  label: 'Modern', radius: '12px' },
                        { val: 'rounded', label: 'Round',  radius: '24px' },
                        { val: 'square',  label: 'Square', radius: '4px'  },
                      ] as const).map(opt => (
                        <button 
                          key={opt.val} 
                          onClick={() => setThemeRadius(opt.val)}
                          className={`py-2.5 text-[10px] font-black border transition-all ${themeRadius === opt.val ? 'text-white border-transparent' : 'text-slate-400 border-slate-800 bg-slate-900'}`}
                          style={{ borderRadius: opt.radius, ...(themeRadius === opt.val ? { background: primaryColor } : {}) }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </SectionCard>

                  {/* Button Style */}
                  <SectionCard title="Button Style" subtitle="Action button fills and highlights">
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { val: 'filled',  label: 'Filled'  },
                        { val: 'outline', label: 'Outline' },
                        { val: 'soft',    label: 'Soft'    },
                      ] as const).map(opt => (
                        <button 
                          key={opt.val} 
                          onClick={() => setThemeButtonStyle(opt.val)}
                          className={`py-2.5 rounded-lg text-[10px] font-black transition-all ${themeButtonStyle === opt.val ? 'text-white' : 'border border-slate-800 text-slate-400 bg-slate-900'}`}
                          style={themeButtonStyle === opt.val ? { background: primaryColor } : {}}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </SectionCard>

                  {/* B2B Mode */}
                  <SectionCard title="B2B Switchgear Mode" subtitle="Swaps online checkout baskets with professional quotes/enquiry sheets">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-slate-400 font-bold">Request Quote Enquiry</span>
                      <button 
                        onClick={() => setB2bEnquiryActive(v => !v)} 
                        className={`w-10 h-5 rounded-full transition-all relative ${b2bEnquiryActive ? 'bg-emerald-500' : 'bg-slate-700'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${b2bEnquiryActive ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  </SectionCard>
                </div>
              )}

            </div>
          )}

          {/* ═══ NAVBAR & HEADER ═══ */}
          {editorTab === 'navbar' && (
            <div className="space-y-4">
              <SectionCard title="Brand Tagline & Action Buttons" subtitle="Configure logo subtitle and header action buttons">
                <FieldLabel>Brand Subtitle / Tagline</FieldLabel>
                <FieldInput 
                  value={navbarTagline} 
                  onChange={e => setNavbarTagline(e.target.value)} 
                  placeholder="One Call. We Do It All." 
                />

                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-200">Show "Track Booking" Button</p>
                      <p className="text-[10px] text-slate-500">Live technician tracker popup</p>
                    </div>
                    <button onClick={() => setShowTrackButton(v => !v)} className={`w-10 h-5 rounded-full transition-all relative ${showTrackButton ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${showTrackButton ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                  {showTrackButton && (
                    <div>
                      <FieldLabel>Track Button Label</FieldLabel>
                      <FieldInput value={trackButtonText} onChange={e => setTrackButtonText(e.target.value)} placeholder="Track Booking" />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-200">Show "Book Service" Button</p>
                      <p className="text-[10px] text-slate-500">Primary booking CTA button</p>
                    </div>
                    <button onClick={() => setShowBookButton(v => !v)} className={`w-10 h-5 rounded-full transition-all relative ${showBookButton ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${showBookButton ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                  {showBookButton && (
                    <div>
                      <FieldLabel>Book Button Label</FieldLabel>
                      <FieldInput value={bookButtonText} onChange={e => setBookButtonText(e.target.value)} placeholder="Book Service" />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-200">Show "Login / Sign In" Button</p>
                      <p className="text-[10px] text-slate-500">Customer authentication & portal modal</p>
                    </div>
                    <button onClick={() => setShowLoginButton(v => !v)} className={`w-10 h-5 rounded-full transition-all relative ${showLoginButton ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${showLoginButton ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                  {showLoginButton && (
                    <div>
                      <FieldLabel>Login Button Label</FieldLabel>
                      <FieldInput value={loginButtonText} onChange={e => setLoginButtonText(e.target.value)} placeholder="Sign In" />
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Navigation Menu Links" subtitle="Add, edit, reorder, or delete links displayed in the navbar">
                <div className="space-y-2.5">
                  {navLinksList.map((link, idx) => (
                    <div key={link.id} className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-2 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded-md border border-slate-800">
                            <button onClick={() => moveNavLink(idx, 'up')} disabled={idx === 0} className="text-slate-400 hover:text-white disabled:opacity-20 text-[10px]" title="Move Up">▲</button>
                            <button onClick={() => moveNavLink(idx, 'down')} disabled={idx === navLinksList.length - 1} className="text-slate-400 hover:text-white disabled:opacity-20 text-[10px]" title="Move Down">▼</button>
                          </div>
                          <span className="text-[11px] font-bold text-slate-300">Link #{idx + 1}</span>
                        </div>
                        <button 
                          onClick={() => deleteNavLink(link.id)}
                          className="px-2 py-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
                          title="Delete Link"
                        >
                          <Trash2 size={12} /> <span className="text-[10px]">Delete</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 mb-1">Link Name / Title</p>
                          <input 
                            className="form-input text-xs w-full py-1.5 px-2 bg-slate-950 border-slate-750 font-medium"
                            value={link.name}
                            placeholder="Link name (e.g. Home, Services)..."
                            onChange={e => {
                              const val = e.target.value;
                              setNavLinksList(prev => prev.map(l => l.id === link.id ? { ...l, name: val } : l));
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 mb-1">Target Section</p>
                          <select
                            className="form-input text-xs w-full py-1.5 px-2 bg-slate-950 border-slate-750"
                            value={link.tab || 'services'}
                            onChange={e => {
                              const val = e.target.value;
                              setNavLinksList(prev => prev.map(l => l.id === link.id ? { ...l, tab: val } : l));
                            }}
                          >
                            <option value="hero">Hero (Home Section)</option>
                            <option value="services">Services Section</option>
                            <option value="offers">Offers Section</option>
                            <option value="team">Our Team Section</option>
                            <option value="gallery">Gallery Section</option>
                            <option value="reviews">Reviews Section</option>
                            <option value="faqs">FAQs Section</option>
                            <option value="coverage">Contact Section</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Nav Link Form */}
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <p className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                    <span>➕</span> Add New Navbar Link
                  </p>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 mb-1">Link Title / Label</p>
                      <input 
                        className="form-input text-xs w-full py-2 px-2.5 bg-slate-950 border-slate-750"
                        placeholder="e.g. Special Offers, Pricing, FAQs..."
                        value={newNavLinkName}
                        onChange={e => setNewNavLinkName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addNavLink()}
                      />
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 mb-1">Target Page Section</p>
                      <div className="flex gap-2">
                        <select
                          className="form-input text-xs flex-1 py-2 px-2.5 bg-slate-950 border-slate-750"
                          value={newNavLinkTab}
                          onChange={e => {
                            setNewNavLinkTab(e.target.value);
                            if (!newNavLinkName.trim()) {
                              const tabNameMap: Record<string, string> = {
                                hero: 'Home',
                                services: 'Services',
                                offers: 'Offers',
                                team: 'Team',
                                gallery: 'Gallery',
                                reviews: 'Reviews',
                                faqs: 'FAQs',
                                coverage: 'Contact'
                              };
                              setNewNavLinkName(tabNameMap[e.target.value] || '');
                            }
                          }}
                        >
                          <option value="hero">Hero (Home Section)</option>
                          <option value="services">Services Section</option>
                          <option value="offers">Offers / Deals Section</option>
                          <option value="team">Our Team Section</option>
                          <option value="gallery">Work Gallery Section</option>
                          <option value="reviews">Customer Reviews Section</option>
                          <option value="faqs">FAQs Section</option>
                          <option value="coverage">Contact / Coverage Section</option>
                        </select>
                        <button 
                          type="button"
                          onClick={addNavLink}
                          className="btn-primary px-4 py-2 text-xs font-black shrink-0 flex items-center gap-1 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button 
                    onClick={resetNavLinks}
                    className="text-[10px] text-slate-500 hover:text-slate-300 font-bold underline"
                  >
                    Reset default navbar links
                  </button>
                </div>
              </SectionCard>
            </div>
          )}

          {/* ═══ HERO ═══ */}
          {editorTab === 'hero' && (
            <div className="space-y-4">
              <SectionCard title="Announcement Bar">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-slate-400 font-bold">Show Announcement</span>
                  <button onClick={() => setAnnounceActive(v => !v)} className={`w-10 h-5 rounded-full transition-all relative ${announceActive ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${announceActive ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
                {announceActive && (
                  <>
                    <FieldLabel>Announcement Text</FieldLabel>
                    <FieldInput value={announceText} onChange={e => setAnnounceText(e.target.value)} />
                    
                    <FieldLabel>Expiry Date (Optional)</FieldLabel>
                    <input 
                      type="date" 
                      value={announceExpiry} 
                      onChange={e => setAnnounceExpiry(e.target.value)} 
                      className="form-input text-xs w-full mt-1.5" 
                    />
                  </>
                )}
              </SectionCard>

              <SectionCard title="Hero Content">
                <FieldLabel>Main Headline</FieldLabel>
                <FieldTextarea rows={2} value={heroTitle} onChange={e => setHeroTitle(e.target.value)} placeholder="All Home Services One Trusted Team" />
                <FieldLabel>Subtitle</FieldLabel>
                <FieldTextarea rows={2} value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} />
                <FieldLabel>Arrival Badge Text</FieldLabel>
                <FieldInput value={heroBadge} onChange={e => setHeroBadge(e.target.value)} />
              </SectionCard>

              <SectionCard title="Call-to-Action Buttons">
                <FieldLabel>Primary Button Label</FieldLabel>
                <FieldInput value={primaryCta} onChange={e => setPrimaryCta(e.target.value)} />
                <FieldLabel>Secondary Button Label</FieldLabel>
                <FieldInput value={secondaryCta} onChange={e => setSecondaryCta(e.target.value)} />
              </SectionCard>

              {/* ── Trust Badges & Feature Cards (Add, Edit, Delete) ── */}
              <SectionCard 
                title="Trust Badges & Feature Cards" 
                subtitle="Edit, add or delete the guarantee cards shown on the hero section"
              >
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <div>
                    <p className="text-xs font-bold text-slate-200">Show Trust Badges</p>
                    <p className="text-[10px] text-slate-500">Display verification badges below call-to-action buttons</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowTrustBadges(v => !v)} 
                    className={`w-10 h-5 rounded-full transition-all relative ${showTrustBadges ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${showTrustBadges ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>

                {showTrustBadges && (
                  <div className="space-y-3">
                    {/* List of badges */}
                    <div className="space-y-2">
                      {trustBadgesList.map((badge, bIdx) => (
                        <div key={badge.id || bIdx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                          {editingBadgeId === badge.id ? (
                            <div className="flex-1 flex gap-2 items-center">
                              <input 
                                type="text"
                                value={editingBadgeIcon}
                                onChange={e => setEditingBadgeIcon(e.target.value)}
                                className="w-10 text-center form-input text-xs py-1 px-1"
                                placeholder="Icon"
                              />
                              <input 
                                type="text"
                                value={editingBadgeTitle}
                                onChange={e => setEditingBadgeTitle(e.target.value)}
                                className="flex-1 form-input text-xs py-1"
                                placeholder="Badge Title"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (editingBadgeTitle.trim()) {
                                    setTrustBadgesList(prev => prev.map(b => b.id === badge.id ? { ...b, icon: editingBadgeIcon.trim() || '✨', title: editingBadgeTitle.trim() } : b));
                                    setEditingBadgeId(null);
                                    showToast('✨ Badge updated!', 'success');
                                  }
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingBadgeId(null)}
                                className="px-2 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-base shrink-0">{badge.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-200 truncate">{badge.title}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingBadgeId(badge.id);
                                  setEditingBadgeIcon(badge.icon);
                                  setEditingBadgeTitle(badge.title);
                                }}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setTrustBadgesList(prev => prev.filter(b => b.id !== badge.id));
                                  showToast('🗑️ Badge deleted', 'info');
                                }}
                                className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                                title="Delete Badge"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add new trust badge form */}
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                      <p className="text-[11px] font-bold text-slate-300">+ Add New Trust Badge</p>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={newBadgeIcon}
                          onChange={e => setNewBadgeIcon(e.target.value)}
                          className="w-12 text-center form-input text-xs"
                          placeholder="Icon"
                        />
                        <input 
                          type="text"
                          value={newBadgeTitle}
                          onChange={e => setNewBadgeTitle(e.target.value)}
                          className="flex-1 form-input text-xs"
                          placeholder="e.g. 100% Quality Guaranteed"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newBadgeTitle.trim()) {
                              const newBadge = {
                                id: `tb-${Date.now()}`,
                                icon: newBadgeIcon.trim() || '✨',
                                title: newBadgeTitle.trim()
                              };
                              setTrustBadgesList(prev => [...prev, newBadge]);
                              setNewBadgeTitle('');
                              showToast('🎉 Trust badge added!', 'success');
                            }
                          }}
                          disabled={!newBadgeTitle.trim()}
                          className="btn-primary px-3 py-1.5 text-xs font-bold disabled:opacity-40"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* ── Live Availability Card (Edit & Delete) ── */}
              <SectionCard 
                title="Live Availability Card" 
                subtitle="Live status box on the right of your hero section"
              >
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <div>
                    <p className="text-xs font-bold text-slate-200">Show Availability Card</p>
                    <p className="text-[10px] text-slate-500">Toggle live technician count badge</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowLiveAvailability(v => !v)} 
                    className={`w-10 h-5 rounded-full transition-all relative ${showLiveAvailability ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${showLiveAvailability ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>

                {showLiveAvailability && (
                  <div className="space-y-2.5">
                    <div>
                      <FieldLabel>Status Tag Label</FieldLabel>
                      <FieldInput 
                        value={liveAvailTitle} 
                        onChange={e => setLiveAvailTitle(e.target.value)} 
                        placeholder="Live Availability" 
                      />
                    </div>
                    <div>
                      <FieldLabel>Main Headline (e.g. Technicians Available)</FieldLabel>
                      <FieldInput 
                        value={liveAvailText} 
                        onChange={e => setLiveAvailText(e.target.value)} 
                        placeholder={`8 Technicians Available in ${cityName || 'Nellore, AP'}`} 
                      />
                    </div>
                    <div>
                      <FieldLabel>Next Slot Text</FieldLabel>
                      <FieldInput 
                        value={liveAvailSlot} 
                        onChange={e => setLiveAvailSlot(e.target.value)} 
                        placeholder="Today, 3:00 PM" 
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowLiveAvailability(false);
                        showToast('🗑️ Live Availability card hidden', 'info');
                      }}
                      className="w-full mt-2 py-1.5 px-3 rounded-lg border border-rose-900/50 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Trash2 size={13} /> Delete / Hide Availability Card
                    </button>
                  </div>
                )}
              </SectionCard>

              {/* ── Emergency Service Card (Edit & Delete) ── */}
              <SectionCard 
                title="Emergency Service Card" 
                subtitle="Fast response guarantee badge on the right of your hero"
              >
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <div>
                    <p className="text-xs font-bold text-slate-200">Show Emergency Card</p>
                    <p className="text-[10px] text-slate-500">Toggle arrival guarantee badge</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowEmergencyCard(v => !v)} 
                    className={`w-10 h-5 rounded-full transition-all relative ${showEmergencyCard ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${showEmergencyCard ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>

                {showEmergencyCard && (
                  <div className="space-y-2.5">
                    <div>
                      <FieldLabel>Badge Title</FieldLabel>
                      <FieldInput 
                        value={emergencyCardTitle} 
                        onChange={e => setEmergencyCardTitle(e.target.value)} 
                        placeholder="⚡ Emergency Home Service" 
                      />
                    </div>
                    <div>
                      <FieldLabel>Guarantee Headline</FieldLabel>
                      <FieldInput 
                        value={emergencyCardText} 
                        onChange={e => setEmergencyCardText(e.target.value)} 
                        placeholder="Arriving in 30 Minutes or Free" 
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmergencyCard(false);
                        showToast('🗑️ Emergency card hidden', 'info');
                      }}
                      className="w-full mt-2 py-1.5 px-3 rounded-lg border border-rose-900/50 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Trash2 size={13} /> Delete / Hide Emergency Card
                    </button>
                  </div>
                )}
              </SectionCard>
            </div>
          )}

          {/* ═══ SECTIONS ═══ */}
          {editorTab === 'sections' && (
            <div className="space-y-4">
              <SectionCard title="Page Sections Layout" subtitle="Toggle on/off, reorder, or delete any section from your homepage">
                <div className="space-y-2">
                  {pageComponents.map((comp, idx) => {
                    const meta = ALL_SECTIONS.find(s => s.type === comp.type);
                    const icon = comp.icon || meta?.icon || '📋';
                    const title = comp.title || meta?.label || 'Custom Section';
                    return (
                      <div key={comp.id} className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 shadow-sm">
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button onClick={() => moveSection(idx, 'up')} disabled={idx === 0} className="text-slate-500 hover:text-slate-300 disabled:opacity-20 text-[10px] leading-none">▲</button>
                          <button onClick={() => moveSection(idx, 'down')} disabled={idx === pageComponents.length - 1} className="text-slate-500 hover:text-slate-300 disabled:opacity-20 text-[10px] leading-none">▼</button>
                        </div>
                        <span className="text-sm">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-200 truncate">{title}</p>
                          <p className="text-[9px] text-slate-500 capitalize">{comp.type.replace('_', ' ')}</p>
                        </div>
                        <button onClick={() => toggleSection(comp.id)} className={`w-9 h-5 rounded-full transition-all relative shrink-0 ${comp.enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${comp.enabled ? 'left-4' : 'left-0.5'}`} />
                        </button>
                        <button
                          onClick={() => deleteSection(comp.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                          title="Delete Section"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>

              {/* Add Standard Catalog Section */}
              <SectionCard title="Add Catalog Section" subtitle="Include additional pre-designed sections">
                <div className="flex gap-2">
                  <select 
                    className="form-input text-xs flex-1 py-1.5"
                    value={catalogSectionToAdd}
                    onChange={e => setCatalogSectionToAdd(e.target.value)}
                  >
                    <option value="">-- Choose section from catalog --</option>
                    {ALL_SECTIONS.map(s => (
                      <option key={s.id} value={s.type}>{s.icon} {s.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (catalogSectionToAdd) {
                        addCatalogSection(catalogSectionToAdd);
                        setCatalogSectionToAdd('');
                      }
                    }}
                    disabled={!catalogSectionToAdd}
                    className="btn-secondary px-3 py-1.5 text-xs font-bold shrink-0 disabled:opacity-50"
                  >
                    + Add
                  </button>
                </div>
              </SectionCard>

              {/* Add Custom Highlight / Banner Section */}
              <SectionCard title="Create Custom Section" subtitle="Add custom banner, announcement, or highlight block">
                <FieldLabel>Section Heading</FieldLabel>
                <FieldInput 
                  value={newCustomSectionTitle} 
                  onChange={e => setNewCustomSectionTitle(e.target.value)} 
                  placeholder="e.g. 24x7 Emergency Service Guarantee" 
                />
                <FieldLabel>Description & Details</FieldLabel>
                <FieldTextarea 
                  rows={2}
                  value={newCustomSectionDesc} 
                  onChange={e => setNewCustomSectionDesc(e.target.value)} 
                  placeholder="Explain your unique guarantee, pricing package, or seasonal offer..." 
                />
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <FieldLabel>Icon / Emoji</FieldLabel>
                    <FieldInput 
                      value={newCustomSectionIcon} 
                      onChange={e => setNewCustomSectionIcon(e.target.value)} 
                      placeholder="⚡" 
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={addCustomSection}
                      disabled={!newCustomSectionTitle.trim()}
                      className="btn-primary w-full py-2 text-xs font-bold disabled:opacity-50"
                    >
                      + Add Custom Section
                    </button>
                  </div>
                </div>
              </SectionCard>

              <div className="pt-1 flex justify-end">
                <button 
                  onClick={resetDefaultSections}
                  className="text-[10px] text-slate-500 hover:text-slate-300 font-bold underline"
                >
                  Reset to default template layout
                </button>
              </div>
            </div>
          )}

          {/* ═══ SERVICES ═══ */}
          {editorTab === 'services' && (
            <div className="space-y-4">
              {/* 1. HOMEPAGE DISPLAY COUNT */}
              <SectionCard title="Homepage Display" subtitle="Control how many service cards appear on your homepage">
                <FieldLabel>Cards to Show on Homepage (Default: 8)</FieldLabel>
                <div className="flex gap-1.5 mb-2">
                  {[4, 6, 8, 12, 16].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        setHomepageServiceCount(n);
                        showToast(`Set homepage display to ${n} service cards`, 'info');
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                        homepageServiceCount === n
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {n} Cards {n === 8 ? '⭐' : ''}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                  <span>Currently displaying: <strong className="text-emerald-400 font-bold">{homepageServiceCount} Cards</strong></span>
                  <span className="text-[10px] text-slate-500">Auto-arranged in responsive grid</span>
                </div>
              </SectionCard>

              {/* 2. ADD NEW SERVICE CARD */}
              <SectionCard title="✨ Add New Service Card" subtitle="Upload image, price & item name to display on cards">
                <form onSubmit={handleAddServiceCard} className="space-y-3">
                  <div>
                    <FieldLabel>Item / Service Name *</FieldLabel>
                    <FieldInput
                      value={newSvcCardName}
                      onChange={e => setNewSvcCardName(e.target.value)}
                      placeholder="e.g. Sofa Deep Cleaning, AC Repair & Gas"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <FieldLabel>Price (₹) *</FieldLabel>
                      <FieldInput
                        type="number"
                        value={newSvcCardPrice}
                        onChange={e => setNewSvcCardPrice(Number(e.target.value))}
                        placeholder="499"
                        required
                      />
                    </div>
                    <div>
                      <FieldLabel>Duration (Min)</FieldLabel>
                      <FieldInput
                        type="number"
                        value={newSvcCardDuration}
                        onChange={e => setNewSvcCardDuration(Number(e.target.value))}
                        placeholder="60"
                      />
                    </div>
                  </div>

                  {/* Image Upload Zone */}
                  <div>
                    <FieldLabel>Upload Service Card Image *</FieldLabel>
                    <input
                      type="file"
                      ref={serviceFileInputRef}
                      accept="image/*"
                      onChange={handleServiceCardImageUpload}
                      className="hidden"
                    />

                    {/* Preview or Upload box */}
                    {newSvcCardImage || newSvcCardImageUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-emerald-500/50 bg-slate-950 p-2">
                        <div className="h-28 rounded-lg overflow-hidden relative">
                          <img
                            src={newSvcCardImage || newSvcCardImageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setNewSvcCardImage('');
                                setNewSvcCardImageUrl('');
                              }}
                              className="p-1.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg text-xs shadow"
                              title="Remove image"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-emerald-600/90 text-white text-[10px] font-black rounded-md">
                            ₹{newSvcCardPrice} • Card Photo Ready
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => serviceFileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 bg-slate-950/60 hover:bg-slate-950 rounded-xl p-3.5 text-center cursor-pointer transition-all group"
                      >
                        <Upload className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 mx-auto mb-1 transition-transform group-hover:scale-110" />
                        <p className="text-xs font-bold text-slate-200">Click to upload photo from computer</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, WebP (Max 5MB)</p>
                      </div>
                    )}

                    {/* Or enter Image URL */}
                    <div className="mt-2 flex gap-1.5">
                      <FieldInput
                        value={newSvcCardImageUrl}
                        onChange={e => setNewSvcCardImageUrl(e.target.value)}
                        placeholder="Or paste image URL (https://...)"
                      />
                      {newSvcCardImageUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewSvcCardImage(newSvcCardImageUrl);
                            showToast('Applied custom image URL!', 'success');
                          }}
                          className="btn-secondary px-3 text-[11px] font-bold shrink-0"
                        >
                          Apply
                        </button>
                      )}
                    </div>

                    {/* 1-Click Preset Images */}
                    <div className="mt-2.5">
                      <p className="text-[10px] font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                        <Sparkles size={10} className="text-emerald-400" /> Instant Preset Photos (1-Click Pick):
                      </p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {PRESET_SERVICE_IMAGES.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setNewSvcCardImage(preset.url);
                              setNewSvcCardImageUrl('');
                              if (!newSvcCardName) setNewSvcCardName(preset.label);
                              showToast(`Selected "${preset.label}" image`, 'info');
                            }}
                            className={`p-1 rounded-lg border text-left transition-all relative overflow-hidden group ${
                              (newSvcCardImage === preset.url || newSvcCardImageUrl === preset.url)
                                ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-950/30'
                                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                            }`}
                          >
                            <img src={preset.url} alt={preset.label} className="w-full h-8 object-cover rounded mb-1" />
                            <p className="text-[9px] font-medium text-slate-300 truncate">{preset.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Category and Icon */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <FieldLabel>Category</FieldLabel>
                      <FieldInput
                        value={newSvcCardCategory}
                        onChange={e => setNewSvcCardCategory(e.target.value)}
                        placeholder="Cleaning, Electrician, Plumber..."
                      />
                    </div>
                    <div>
                      <FieldLabel>Icon / Emoji</FieldLabel>
                      <div className="flex gap-1">
                        <FieldInput
                          value={newSvcCardIcon}
                          onChange={e => setNewSvcCardIcon(e.target.value)}
                          className="w-12 text-center text-base"
                        />
                        <div className="flex-1 flex items-center gap-1 overflow-x-auto py-1">
                          {['✨', '❄️', '⚡', '🚰', '🎨', '🛡️', '🧹', '🛋️', '🔧'].map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => setNewSvcCardIcon(emoji)}
                              className={`px-1.5 py-0.5 rounded text-xs transition-transform hover:scale-125 ${newSvcCardIcon === emoji ? 'bg-slate-800 ring-1 ring-emerald-500' : ''}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Short Description (optional)</FieldLabel>
                    <FieldTextarea
                      rows={2}
                      value={newSvcCardDesc}
                      onChange={e => setNewSvcCardDesc(e.target.value)}
                      placeholder="Verified technician, on-time arrival & complete warranty..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary w-full py-2.5 text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                  >
                    <Plus size={14} /> Add Service Card to Homepage
                  </button>
                </form>
              </SectionCard>

              {/* 3. FEATURED SERVICES LIST */}
              <SectionCard title="Featured & Configured Services" subtitle="Toggle which services show on the homepage, edit prices, or change images">
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {myServices.filter(s => s.isActive).map(svc => {
                    const isFeatured = featuredServiceIds.includes(svc.id);
                    const cardImg = svc.imageUrl || getServiceImg(svc.name, svc.category);
                    return (
                      <div
                        key={svc.id}
                        className={`p-2 rounded-xl border transition-all ${
                          isFeatured
                            ? 'bg-slate-900/90 border-slate-700/80 shadow-sm'
                            : 'bg-slate-950/40 border-slate-800/40 opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Image Thumbnail */}
                          <div className="w-12 h-10 rounded-lg overflow-hidden relative bg-slate-950 shrink-0 border border-slate-800">
                            <img src={cardImg} alt={svc.name} className="w-full h-full object-cover" />
                            <span className="absolute bottom-0 right-0 text-[9px] bg-slate-950/80 px-1 rounded-tl">{svc.icon || '🛠️'}</span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs text-white font-bold truncate">{svc.name}</h4>
                              <span className="text-[9px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded-md font-medium">{svc.category}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-emerald-400 font-black">₹{svc.basePrice}</span>
                              <span className="text-[9px] text-slate-500">• {svc.durationMin || 60}m</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Full Edit Modal Button */}
                            <button
                              type="button"
                              onClick={() => openEditServiceModal(svc)}
                              className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-sm"
                              title="Full Edit Service Card"
                            >
                              ✏️ Edit
                            </button>

                            {/* Homepage Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => setFeaturedServiceIds(prev =>
                                prev.includes(svc.id) ? prev.filter(id => id !== svc.id) : [...prev, svc.id]
                              )}
                              className={`w-8 h-4.5 rounded-full transition-all relative shrink-0 ${isFeatured ? 'bg-emerald-500' : 'bg-slate-700'}`}
                              title={isFeatured ? 'Visible on Homepage' : 'Hidden from Homepage'}
                            >
                              <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all ${isFeatured ? 'left-4' : 'left-0.5'}`} />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete service card "${svc.name}"?`)) {
                                  handleDeleteService(svc.id);
                                }
                              }}
                              className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                              title="Delete Card"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {myServices.filter(s => s.isActive).length === 0 && (
                    <p className="text-[10px] text-slate-500 text-center py-3">No services found. Use the form above to add your first service card!</p>
                  )}
                </div>
              </SectionCard>
            </div>
          )}

          {/* ═══ GALLERY ═══ */}
          {editorTab === 'gallery' && (
            <div className="space-y-4">
              <SectionCard title="Add Portfolio Item" subtitle="Showcase before & after transformations">
                <FieldLabel>Project Title</FieldLabel>
                <FieldInput value={newPortTitle} onChange={e => setNewPortTitle(e.target.value)} placeholder="Deep Cleaning - Kitchen" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FieldLabel>Category</FieldLabel>
                    <FieldInput value={newPortCategory} onChange={e => setNewPortCategory(e.target.value)} placeholder="Cleaning" />
                  </div>
                  <div>
                    <FieldLabel>Icon / Emoji</FieldLabel>
                    <FieldInput value={newPortIcon} onChange={e => setNewPortIcon(e.target.value)} placeholder="🏠" />
                  </div>
                </div>
                <FieldLabel>Technician Name (optional)</FieldLabel>
                <FieldInput value={newPortWorker} onChange={e => setNewPortWorker(e.target.value)} placeholder="Ramesh Kumar" />
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FieldLabel>YouTube Link</FieldLabel>
                    <FieldInput value={newPortYoutube} onChange={e => setNewPortYoutube(e.target.value)} placeholder="https://youtube.com/..." />
                  </div>
                  <div>
                    <FieldLabel>Instagram Link</FieldLabel>
                    <FieldInput value={newPortInstagram} onChange={e => setNewPortInstagram(e.target.value)} placeholder="https://instagram.com/..." />
                  </div>
                </div>
                
                <button onClick={addPortfolioItem} className="btn-primary w-full py-2 text-xs font-bold">+ Add to Portfolio</button>
              </SectionCard>

              <div className="space-y-2">
                {portfolio.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5">
                    <span className="text-xl">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-500">{item.category} · {item.workerName}</p>
                    </div>
                    <button onClick={() => setPortfolio(prev => prev.filter(p => p.id !== item.id))} className="text-slate-500 hover:text-red-400 text-xs">✕</button>
                  </div>
                ))}
                {portfolio.length === 0 && <p className="text-[10px] text-slate-500 text-center py-4">No portfolio items yet.</p>}
              </div>
            </div>
          )}

          {/* ═══ TEAM ═══ */}
          {editorTab === 'team' && (
            <div className="space-y-4">
              <SectionCard title="Technician Selection Rule" subtitle="Let customers select specific specialists during checkout">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold">Enable Technician Selector</span>
                  <button 
                    onClick={() => setTechSelectionActive(v => !v)} 
                    className={`w-10 h-5 rounded-full transition-all relative ${techSelectionActive ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${techSelectionActive ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              </SectionCard>

              <p className="text-[10px] text-slate-400">Toggle which technicians appear on your public website and customize titles.</p>
              <div className="space-y-3">
                {myWorkers.map(w => (
                  <div key={w.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-black text-slate-300">{w.name.charAt(0)}</div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-white">{w.name}</p>
                        <p className="text-[10px] text-slate-400">{w.skills?.slice(0,2).join(', ')}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400">{workerVisibility[w.id] !== false ? 'Visible' : 'Hidden'}</span>
                        <button
                          onClick={() => setWorkerVisibility(prev => ({ ...prev, [w.id]: !prev[w.id] }))}
                          className={`w-9 h-5 rounded-full transition-all relative shrink-0 ${workerVisibility[w.id] !== false ? 'bg-emerald-500' : 'bg-slate-700'}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${workerVisibility[w.id] !== false ? 'left-4' : 'left-0.5'}`} />
                        </button>
                      </div>
                    </div>
                    {workerVisibility[w.id] !== false && (
                      <div>
                        <FieldLabel>Website Title / Designation</FieldLabel>
                        <FieldInput
                          value={workerDesignation[w.id] || ''}
                          onChange={e => setWorkerDesignation(prev => ({ ...prev, [w.id]: e.target.value }))}
                          placeholder="Senior Specialist"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ OFFERS ═══ */}
          {editorTab === 'offers' && (
            <div className="space-y-4">
              <SectionCard title="Add New Offer" subtitle="Create coupon codes that appear on your website">
                <FieldLabel>Offer Title</FieldLabel>
                <FieldInput value={newCampTitle} onChange={e => setNewCampTitle(e.target.value)} placeholder="Flat ₹50 Off on First Booking" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FieldLabel>Coupon Code</FieldLabel>
                    <FieldInput value={newCampCode} onChange={e => setNewCampCode(e.target.value.toUpperCase())} placeholder="FIRST50" />
                  </div>
                  <div>
                    <FieldLabel>Valid Till</FieldLabel>
                    <FieldInput type="date" value={newCampEnd} onChange={e => setNewCampEnd(e.target.value)} />
                  </div>
                </div>
                <FieldLabel>Discount Description</FieldLabel>
                <FieldInput value={newCampDisc} onChange={e => setNewCampDisc(e.target.value)} placeholder="Flat ₹50 off, min order ₹300" />
                <button onClick={addCampaign} className="btn-primary w-full py-2 text-xs font-bold">+ Add Offer</button>
              </SectionCard>

              <div className="space-y-2">
                {campaigns.map((camp: any) => (
                  <div key={camp.id} className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5">
                    <div className="px-2.5 py-1.5 rounded-lg text-[10px] font-black text-white shrink-0" style={{ background: primaryColor }}>{camp.offerCode}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{camp.title}</p>
                      <p className="text-[10px] text-slate-500">Valid till {camp.endDate}</p>
                    </div>
                    <button
                      onClick={() => setCampaigns(prev => prev.map(c => c.id === camp.id ? { ...c, enabled: !c.enabled } : c))}
                      className={`w-9 h-5 rounded-full transition-all relative shrink-0 ${camp.enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${camp.enabled ? 'left-4' : 'left-0.5'}`} />
                    </button>
                    <button onClick={() => setCampaigns(prev => prev.filter(c => c.id !== camp.id))} className="text-slate-500 hover:text-red-400 text-xs shrink-0">✕</button>
                  </div>
                ))}
                {campaigns.length === 0 && <p className="text-[10px] text-slate-500 text-center py-4">No offers yet.</p>}
              </div>
            </div>
          )}

          {/* ═══ REVIEWS ═══ */}
          {editorTab === 'reviews' && (
            <div className="space-y-4">
              <SectionCard title="Add Customer Review">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FieldLabel>Customer Name</FieldLabel>
                    <FieldInput value={newTestAuthor} onChange={e => setNewTestAuthor(e.target.value)} placeholder="Priya Sharma" />
                  </div>
                  <div>
                    <FieldLabel>Role / Location</FieldLabel>
                    <FieldInput value={newTestRole} onChange={e => setNewTestRole(e.target.value)} placeholder="Homemaker, Nellore" />
                  </div>
                </div>
                <FieldLabel>Review Text</FieldLabel>
                <FieldTextarea rows={3} value={newTestText} onChange={e => setNewTestText(e.target.value)} placeholder="Excellent service! Very professional team..." />
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <FieldLabel>Star Rating</FieldLabel>
                    <select className="form-input w-full text-xs" value={newTestRating} onChange={e => setNewTestRating(Number(e.target.value))}>
                      {[5,4,3,2,1].map(r => <option key={r} value={r}>{'⭐'.repeat(r)} ({r}/5)</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Verified</FieldLabel>
                    <button onClick={() => setNewTestVerified(v => !v)} className={`w-9 h-5 rounded-full transition-all relative ${newTestVerified ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${newTestVerified ? 'left-4' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
                <button onClick={addTestimonial} className="btn-primary w-full py-2 text-xs font-bold">+ Add Review</button>
              </SectionCard>

              <div className="space-y-2">
                {testimonials.map((t: any) => (
                  <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-black text-white">{t.author}</p>
                        <p className="text-[10px] text-slate-400">{t.role} · {'⭐'.repeat(t.rating)}</p>
                        <p className="text-[10px] text-slate-300 mt-1 italic line-clamp-2">"{t.text}"</p>
                      </div>
                      <button onClick={() => setTestimonials(prev => prev.filter(x => x.id !== t.id))} className="text-slate-500 hover:text-red-400 text-xs shrink-0">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ FAQS ═══ */}
          {editorTab === 'faqs' && (
            <div className="space-y-4">
              <SectionCard title="Add FAQ" subtitle="Common questions your customers ask">
                <FieldLabel>Question</FieldLabel>
                <FieldInput value={newFaqQ} onChange={e => setNewFaqQ(e.target.value)} placeholder="How long does a service take?" />
                <FieldLabel>Answer</FieldLabel>
                <FieldTextarea rows={3} value={newFaqA} onChange={e => setNewFaqA(e.target.value)} placeholder="Most services take 1-3 hours depending on..." />
                <button onClick={addFaq} className="btn-primary w-full py-2 text-xs font-bold">+ Add FAQ</button>
              </SectionCard>

              <div className="space-y-2">
                {faqs.map((f: any, idx: number) => (
                  <div key={f.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-slate-500 mb-0.5">Q{idx + 1}</p>
                        <p className="text-xs font-bold text-white">{f.question}</p>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{f.answer}</p>
                      </div>
                      <button onClick={() => setFaqs(prev => prev.filter(x => x.id !== f.id))} className="text-slate-500 hover:text-red-400 text-xs shrink-0">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ COVERAGE ═══ */}
          {editorTab === 'coverage' && (
            <div className="space-y-4">
              <SectionCard title="Service Location">
                <FieldLabel>Primary City</FieldLabel>
                <FieldInput value={cityName} onChange={e => setCityName(e.target.value)} placeholder="Nellore, AP" />
                <FieldLabel>Nearby Cities / Areas</FieldLabel>
                <div className="flex gap-2 mb-2">
                  <FieldInput value={newNearbyCity} onChange={e => setNewNearbyCity(e.target.value)} placeholder="Kavali" onKeyDown={e => { if (e.key === 'Enter' && newNearbyCity.trim()) { setNearbyCities(p => [...p, newNearbyCity.trim()]); setNewNearbyCity(''); }}} />
                  <button onClick={() => { if (newNearbyCity.trim()) { setNearbyCities(p => [...p, newNearbyCity.trim()]); setNewNearbyCity(''); }}} className="btn-secondary px-3 py-1 text-[10px] font-bold shrink-0">+ Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {nearbyCities.map(city => (
                    <span key={city} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 rounded-lg text-[10px] font-bold text-slate-300">
                      📍 {city}
                      <button onClick={() => setNearbyCities(p => p.filter(c => c !== city))} className="text-slate-500 hover:text-red-400 ml-0.5">✕</button>
                    </span>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Contact Information">
                <FieldLabel>Support Phone</FieldLabel>
                <FieldInput maxLength={10} value={bizPhone} onChange={e => setBizPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" />
                <FieldLabel>WhatsApp Number</FieldLabel>
                <FieldInput maxLength={10} value={bizWhatsApp} onChange={e => setBizWhatsApp(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" />
                <FieldLabel>Office Address</FieldLabel>
                <FieldTextarea rows={2} value={bizAddress} onChange={e => setBizAddress(e.target.value)} placeholder="12-3-456, Main Road, Nellore" />
                <FieldLabel>Business Hours</FieldLabel>
                <FieldInput value={bizHours} onChange={e => setBizHours(e.target.value)} placeholder="Mon–Sun, 8 AM – 8 PM" />
              </SectionCard>
            </div>
          )}

          {/* ═══ FOOTER ═══ */}
          {editorTab === 'footer' && (
            <div className="space-y-4">
              <SectionCard title="Footer Branding & Identity" subtitle="Customize about text, copyright, and platform badge">
                <FieldLabel>About Blurb / Tagline</FieldLabel>
                <FieldTextarea 
                  rows={2}
                  value={footerAbout} 
                  onChange={e => setFooterAbout(e.target.value)} 
                  placeholder="Your trusted home services partner..." 
                />

                <FieldLabel>Copyright Notice</FieldLabel>
                <FieldInput 
                  value={footerCopyright} 
                  onChange={e => setFooterCopyright(e.target.value)} 
                  placeholder="© 2026 Brand Services. All rights reserved." 
                />

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div>
                    <p className="text-xs font-bold text-slate-200">Show "Powered by Anarav OS"</p>
                    <p className="text-[10px] text-slate-500">Platform badge in footer bottom</p>
                  </div>
                  <button onClick={() => setShowPoweredBy(v => !v)} className={`w-10 h-5 rounded-full transition-all relative ${showPoweredBy ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${showPoweredBy ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              </SectionCard>

              <SectionCard title="Footer Navigation Columns" subtitle="Add, edit, or delete link columns in the footer">
                <div className="space-y-3">
                  {footerColumns.map(col => (
                    <div key={col.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <input 
                          className="form-input text-xs font-bold text-white py-1 px-2 flex-1"
                          value={col.title}
                          onChange={e => {
                            const val = e.target.value;
                            setFooterColumns(prev => prev.map(c => c.id === col.id ? { ...c, title: val } : c));
                          }}
                        />
                        <button 
                          onClick={() => deleteFooterColumn(col.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                          title="Delete Column"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Links list in column */}
                      <div className="flex flex-wrap gap-1.5">
                        {col.items.map((item, itemIdx) => (
                          <span key={itemIdx} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-950 rounded-lg text-[10px] font-medium text-slate-300 border border-slate-800">
                            {item}
                            <button 
                              onClick={() => deleteFooterItem(col.id, itemIdx)}
                              className="text-slate-500 hover:text-rose-400 ml-0.5 font-bold"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Add Item to column */}
                      <div className="flex gap-2 pt-1">
                        <input 
                          className="form-input text-[11px] py-1 px-2 flex-1"
                          placeholder="Add link (e.g. Terms)"
                          value={selectedFooterColId === col.id ? newFooterItemText : ''}
                          onFocus={() => setSelectedFooterColId(col.id)}
                          onChange={e => {
                            setSelectedFooterColId(col.id);
                            setNewFooterItemText(e.target.value);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && newFooterItemText.trim()) {
                              addFooterItem(col.id);
                            }
                          }}
                        />
                        <button 
                          onClick={() => addFooterItem(col.id)}
                          className="btn-secondary px-2.5 py-1 text-[10px] font-bold shrink-0"
                        >
                          + Add Link
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Column Form */}
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                  <p className="text-[11px] font-bold text-slate-300">+ Add New Footer Column</p>
                  <div className="flex gap-2">
                    <input 
                      className="form-input text-xs flex-1 py-1.5"
                      placeholder="Column Title (e.g. Legal)"
                      value={newFooterColTitle}
                      onChange={e => setNewFooterColTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addFooterColumn()}
                    />
                    <button 
                      onClick={addFooterColumn}
                      className="btn-secondary px-3 py-1.5 text-xs font-bold shrink-0"
                    >
                      + Add Column
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button 
                    onClick={resetFooterColumns}
                    className="text-[10px] text-slate-500 hover:text-slate-300 font-bold underline"
                  >
                    Reset default footer columns
                  </button>
                </div>
              </SectionCard>
            </div>
          )}

          {/* ═══ PUBLISH ═══ */}
          {editorTab === 'publish' && (
            <div className="space-y-4">
              <SectionCard title="Website Health Scores" subtitle="Automated quality scores for your live website">
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Performance', value: webVitals.perf, color: '#22c55e' },
                    { label: 'Accessibility', value: webVitals.a11y, color: '#3b82f6' },
                    { label: 'SEO Score', value: webVitals.seo, color: '#f59e0b' },
                  ].map(v => (
                    <div key={v.label} className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                      <p className="text-xl font-black" style={{ color: v.color }}>{v.value}%</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{v.label}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Publish Website">
                <div className="flex items-start gap-2 p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl mb-3">
                  <span className="text-blue-400 text-sm mt-0.5">ℹ️</span>
                  <p className="text-[10px] text-blue-400 leading-relaxed">Publishing will apply all your changes, custom logo, colors, and content live on your custom domain immediately.</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-3.5 rounded-xl font-black text-sm text-white transition-all hover:scale-[1.02] disabled:opacity-60 shadow-xl"
                  style={{ background: isSaving ? '#475569' : `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`, boxShadow: `0 8px 24px ${primaryColor}40` }}
                >
                  {isSaving ? '⏳ Publishing changes...' : '🚀 Publish Website Changes'}
                </button>
              </SectionCard>

              <SectionCard title="Live Website URL">
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <span className="text-emerald-400 text-sm">🔗</span>
                  <p className="text-xs font-mono text-slate-300 flex-1 truncate">{tenant.customDomain || `${tenant.subdomain}.servos.in`}</p>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">LIVE</span>
                </div>
              </SectionCard>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ RIGHT: LIVE PREVIEW ═══════════ */}
      <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">

        {/* Preview Header Bar */}
        <div className="shrink-0 p-3 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm" />
            <div className="ml-2 bg-slate-800 rounded-lg px-3 py-1 flex items-center gap-1.5 border border-slate-700/60">
              <span className="text-slate-400 text-[10px]">🌐</span>
              <span className="text-slate-300 text-[10px] font-mono truncate">{tenant.customDomain || `${tenant.subdomain}.servos.in`}</span>
            </div>
          </div>

          {/* Device & Fullscreen Controls */}
          <div className="flex items-center gap-2">
            {/* Device Toggle */}
            <div className="flex gap-1 bg-slate-800/80 rounded-xl p-1 border border-slate-700/60">
              {([
                { id: 'desktop', icon: '🖥️', label: 'Desktop' },
                { id: 'tablet',  icon: '📱', label: 'Tablet' },
                { id: 'mobile',  icon: '📲', label: 'Mobile' },
              ] as const).map(d => (
                <button
                  key={d.id}
                  onClick={() => setPreviewDevice(d.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${previewDevice === d.id ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {d.icon} {d.label}
                </button>
              ))}
            </div>

            {/* Fullscreen Modal Toggle Button */}
            <button
              onClick={() => setIsFullScreen(true)}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm"
              title="Expand to Fullscreen View"
            >
              <Maximize2 size={12} /> ⛶ Full Page View
            </button>

            {/* Live Link Button */}
            <button
              onClick={() => window.open(`#/site?tenant=${tenant.id}`, '_blank')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold transition-all flex items-center gap-1"
              title="Open Public Site in New Tab"
            >
              <ExternalLink size={12} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">Interactive Live Preview</span>
          </div>
        </div>

        {/* Preview Viewport Container */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6 bg-[#14171f] flex justify-center items-start"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
          <div
            className="bg-white rounded-xl overflow-hidden shadow-2xl border border-slate-700/80 transition-all duration-300"
            style={{
              width: deviceWidthMap[previewDevice],
              maxWidth: '100%',
              minHeight: '100%',
            }}
          >
            <MiniSitePreview
              subdomain={tenant.subdomain}
              previewDevice={previewDevice}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              accentColor={accentColor}
              themeMode={themeMode}
              themeFont={themeFont}
              themeRadius={themeRadius}
              themeButtonStyle={themeButtonStyle}
              cardStyle={cardStyle}
              bgType={bgType}
              bgImage={bgImage}
              bgGradient={bgGradient}
              bgPattern={bgPattern}
              bgOverlayOpacity={bgOverlayOpacity}
              bgOverlayColor={bgOverlayColor}
              bgBlur={bgBlur}
              heroBgType={heroBgType}
              heroBgImage={heroBgImage}
              heroBgOverlayOpacity={heroBgOverlayOpacity}
              heroGlowActive={heroGlowActive}
              logoImage={logoImage}
              logoText={logoText}
              heroTitle={heroTitle}
              heroSubtitle={heroSubtitle}
              heroBadge={heroBadge}
              primaryCta={primaryCta}
              secondaryCta={secondaryCta}
              showLiveAvailability={showLiveAvailability}
              liveAvailTitle={liveAvailTitle}
              liveAvailText={liveAvailText}
              liveAvailSlot={liveAvailSlot}
              showEmergencyCard={showEmergencyCard}
              emergencyCardTitle={emergencyCardTitle}
              emergencyCardText={emergencyCardText}
              showTrustBadges={showTrustBadges}
              trustBadgesList={trustBadgesList}
              announceActive={announceActive}
              announceText={announceText}
              announceExpiry={announceExpiry}
              pageComponents={pageComponents}
              services={myServices}
              featuredServiceIds={featuredServiceIds}
              homepageServiceCount={homepageServiceCount}
              portfolio={portfolio}
              workers={myWorkers.filter(w => workerVisibility[w.id] !== false).map(w => ({ ...w, designation: workerDesignation[w.id] }))}
              campaigns={campaigns.filter(c => c.enabled !== false)}
              testimonials={testimonials}
              faqs={faqs}
              city={cityName}
              nearbyCities={nearbyCities}
              bizHours={bizHours}
              bizPhone={bizPhone}
              bizWhatsApp={bizWhatsApp}
              bizAddress={bizAddress}
              navbarTagline={navbarTagline}
              navLinksList={navLinksList}
              showTrackButton={showTrackButton}
              trackButtonText={trackButtonText}
              showBookButton={showBookButton}
              bookButtonText={bookButtonText}
              showLoginButton={showLoginButton}
              loginButtonText={loginButtonText}
              footerAbout={footerAbout}
              footerCopyright={footerCopyright}
              showPoweredBy={showPoweredBy}
              footerSocials={footerSocials}
              footerColumns={footerColumns}
              activeEditorTab={editorTab}
              onSelectTab={(tab) => setEditorTab(tab)}
              onEditService={openEditServiceModal}
              showToast={showToast}
            />
          </div>
        </div>
      </div>

      {/* ═══════════ FULL SCREEN MODAL VIEW ═══════════ */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col animate-fadeIn">
          {/* Fullscreen Header */}
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-white flex items-center gap-2">🌐 Full Page Website Preview</span>
              <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 bg-slate-800 rounded-md border border-slate-700">{tenant.subdomain}.servos.in</span>
            </div>

            {/* Device Switcher in Modal */}
            <div className="flex gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
              {([
                { id: 'desktop', icon: '🖥️', label: 'Desktop' },
                { id: 'tablet',  icon: '📱', label: 'Tablet' },
                { id: 'mobile',  icon: '📲', label: 'Mobile' },
              ] as const).map(d => (
                <button
                  key={d.id}
                  onClick={() => setPreviewDevice(d.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${previewDevice === d.id ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {d.icon} {d.label}
                </button>
              ))}
            </div>

            {/* Exit Fullscreen */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.open(`#/site?tenant=${tenant.id}`, '_blank')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5"
              >
                <ExternalLink size={14} /> Open Live Site
              </button>
              <button
                onClick={() => setIsFullScreen(false)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-md"
              >
                <Minimize2 size={14} /> Exit Fullscreen
              </button>
            </div>
          </div>

          {/* Fullscreen Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start bg-[#10131a]">
            <div
              className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-700 transition-all duration-300"
              style={{
                width: deviceWidthMap[previewDevice],
                maxWidth: '100%',
              }}
            >
              <MiniSitePreview
                subdomain={tenant.subdomain}
                previewDevice={previewDevice}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                accentColor={accentColor}
                themeMode={themeMode}
                themeFont={themeFont}
                themeRadius={themeRadius}
                themeButtonStyle={themeButtonStyle}
                cardStyle={cardStyle}
                bgType={bgType}
                bgImage={bgImage}
                bgGradient={bgGradient}
                bgPattern={bgPattern}
                bgOverlayOpacity={bgOverlayOpacity}
                bgOverlayColor={bgOverlayColor}
                bgBlur={bgBlur}
                heroBgType={heroBgType}
                heroBgImage={heroBgImage}
                heroBgOverlayOpacity={heroBgOverlayOpacity}
                heroGlowActive={heroGlowActive}
                logoImage={logoImage}
                logoText={logoText}
                heroTitle={heroTitle}
                heroSubtitle={heroSubtitle}
                heroBadge={heroBadge}
                primaryCta={primaryCta}
                secondaryCta={secondaryCta}
                showLiveAvailability={showLiveAvailability}
                liveAvailTitle={liveAvailTitle}
                liveAvailText={liveAvailText}
                liveAvailSlot={liveAvailSlot}
                showEmergencyCard={showEmergencyCard}
                emergencyCardTitle={emergencyCardTitle}
                emergencyCardText={emergencyCardText}
                showTrustBadges={showTrustBadges}
                trustBadgesList={trustBadgesList}
                announceActive={announceActive}
                announceText={announceText}
                announceExpiry={announceExpiry}
                pageComponents={pageComponents}
                services={myServices}
                featuredServiceIds={featuredServiceIds}
                homepageServiceCount={homepageServiceCount}
                portfolio={portfolio}
                workers={myWorkers.filter(w => workerVisibility[w.id] !== false).map(w => ({ ...w, designation: workerDesignation[w.id] }))}
                campaigns={campaigns.filter(c => c.enabled !== false)}
                testimonials={testimonials}
                faqs={faqs}
                city={cityName}
                nearbyCities={nearbyCities}
                bizHours={bizHours}
                bizPhone={bizPhone}
                bizWhatsApp={bizWhatsApp}
                bizAddress={bizAddress}
                navbarTagline={navbarTagline}
                navLinksList={navLinksList}
                showTrackButton={showTrackButton}
                trackButtonText={trackButtonText}
                showBookButton={showBookButton}
                bookButtonText={bookButtonText}
                showLoginButton={showLoginButton}
                loginButtonText={loginButtonText}
                footerAbout={footerAbout}
                footerCopyright={footerCopyright}
                showPoweredBy={showPoweredBy}
                footerSocials={footerSocials}
                footerColumns={footerColumns}
                activeEditorTab={editorTab}
                onSelectTab={(tab) => {
                  setEditorTab(tab);
                  setIsFullScreen(false);
                }}
                onEditService={openEditServiceModal}
                showToast={showToast}
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ SERVICE CARD EDIT MODAL ═══════════ */}
      {editingServiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <span className="text-base">{editModalIcon || '🛠️'}</span>
                <div>
                  <h3 className="text-sm font-black text-white">Edit Service Card</h3>
                  <p className="text-[10px] text-slate-400">Update pricing, photo, duration & details live on preview</p>
                </div>
              </div>
              <button
                onClick={() => setEditingServiceModal(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
              {/* Card Photo Preview & Upload */}
              <div>
                <FieldLabel>Card Photo / Image</FieldLabel>
                <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div 
                    className="w-16 h-14 rounded-lg bg-cover bg-center shrink-0 border border-slate-700 shadow-inner"
                    style={{ backgroundImage: `url(${editModalImage || editModalImageUrl || getServiceImg(editModalName, editModalCategory)})` }}
                  />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <input 
                      type="file"
                      ref={editModalFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleEditModalImageUpload}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => editModalFileInputRef.current?.click()}
                        className="btn-secondary py-1 px-2.5 text-[10px] font-bold flex items-center gap-1 shrink-0"
                      >
                        <Upload size={11} /> Upload Photo
                      </button>
                      {editModalImage && (
                        <button
                          type="button"
                          onClick={() => setEditModalImage('')}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-bold"
                        >
                          Clear Upload
                        </button>
                      )}
                    </div>
                    <FieldInput
                      value={editModalImageUrl}
                      onChange={e => setEditModalImageUrl(e.target.value)}
                      placeholder="Or enter Image URL (https://...)"
                    />
                  </div>
                </div>
              </div>

              {/* Service Name & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Service / Item Name *</FieldLabel>
                  <FieldInput
                    value={editModalName}
                    onChange={e => setEditModalName(e.target.value)}
                    placeholder="e.g. AC Deep Cleaning"
                  />
                </div>
                <div>
                  <FieldLabel>Category</FieldLabel>
                  <FieldInput
                    value={editModalCategory}
                    onChange={e => setEditModalCategory(e.target.value)}
                    placeholder="e.g. Electrical, Cleaning"
                  />
                </div>
              </div>

              {/* Price, Duration, Icon */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <FieldLabel>Price (₹) *</FieldLabel>
                  <FieldInput
                    type="number"
                    value={editModalPrice}
                    onChange={e => setEditModalPrice(Number(e.target.value))}
                  />
                </div>
                <div>
                  <FieldLabel>Duration (Min)</FieldLabel>
                  <FieldInput
                    type="number"
                    value={editModalDuration}
                    onChange={e => setEditModalDuration(Number(e.target.value))}
                  />
                </div>
                <div>
                  <FieldLabel>Emoji / Icon</FieldLabel>
                  <FieldInput
                    value={editModalIcon}
                    onChange={e => setEditModalIcon(e.target.value)}
                    placeholder="⚡"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <FieldLabel>Description / Inclusions (Optional)</FieldLabel>
                <FieldTextarea
                  rows={2}
                  value={editModalDesc}
                  onChange={e => setEditModalDesc(e.target.value)}
                  placeholder="Comprehensive service with verified technician and 30-day warranty..."
                />
              </div>

              {/* Homepage Featured Toggle */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-200">Show on Website Homepage</p>
                  <p className="text-[10px] text-slate-400">Displays this service card in the homepage showcase grid</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditModalIsFeatured(v => !v)}
                  className={`w-10 h-5 rounded-full transition-all relative ${editModalIsFeatured ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${editModalIsFeatured ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-3 border-t border-slate-800 flex items-center justify-end gap-2 bg-slate-950/80">
              <button
                type="button"
                onClick={() => setEditingServiceModal(null)}
                className="btn-secondary px-3 py-1.5 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedService}
                className="btn-primary px-4 py-1.5 text-xs font-black flex items-center gap-1 shadow-lg"
                style={{ background: primaryColor }}
              >
                <Check size={13} /> Save Service Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
