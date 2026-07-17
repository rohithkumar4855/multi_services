import React, { useState, useEffect } from 'react';
import type { Tenant, Service, Worker } from '../../types';
import { getContrastRatio } from '../../utils/themeEngine';

/* ─── Types ──────────────────────────────────────────────── */
interface Props {
  tenant: Tenant;
  myServices: Service[];
  myWorkers: Worker[];
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
  showToast: (msg: string, type?: string) => void;
}

type EditorTab =
  | 'appearance' | 'hero' | 'sections' | 'services'
  | 'gallery' | 'team' | 'offers' | 'reviews'
  | 'faqs' | 'coverage' | 'publish';

/* ─── Constants ──────────────────────────────────────────── */
const EDITOR_TABS: { id: EditorTab; icon: string; label: string }[] = [
  { id: 'appearance', icon: '🎨', label: 'Appearance' },
  { id: 'hero',       icon: '🏠', label: 'Hero' },
  { id: 'sections',   icon: '📋', label: 'Sections' },
  { id: 'services',   icon: '🛠️', label: 'Services' },
  { id: 'gallery',    icon: '🖼️', label: 'Gallery' },
  { id: 'team',       icon: '👥', label: 'Team' },
  { id: 'offers',     icon: '🎟️', label: 'Offers' },
  { id: 'reviews',    icon: '⭐', label: 'Reviews' },
  { id: 'faqs',       icon: '❓', label: 'FAQs' },
  { id: 'coverage',   icon: '📍', label: 'Coverage' },
  { id: 'publish',    icon: '🚀', label: 'Publish' },
];

const ALL_SECTIONS = [
  { id: 'comp-hero',          type: 'hero',         label: 'Hero Section',          icon: '🏠', defaultEnabled: true },
  { id: 'comp-stats',         type: 'stats',        label: 'Statistics Bar',        icon: '📊', defaultEnabled: true },
  { id: 'comp-services-grid', type: 'services',     label: 'Our Services Grid',     icon: '🛠️', defaultEnabled: true },
  { id: 'comp-how-it-works',  type: 'how_it_works', label: 'How It Works',          icon: '📋', defaultEnabled: true },
  { id: 'comp-offers-row',    type: 'offers_row',   label: 'Offers & Why Us Row',   icon: '🎟️', defaultEnabled: true },
  {id: 'comp-team',          type: 'team',         label: 'Meet Our Team',         icon: '👥', defaultEnabled: true },
  { id: 'comp-gallery',       type: 'gallery',      label: 'Photo & Video Gallery', icon: '🖼️', defaultEnabled: true },
  { id: 'comp-testimonials',  type: 'testimonials', label: 'Customer Reviews',      icon: '⭐', defaultEnabled: true },
  { id: 'comp-trust-bar',     type: 'trust_bar',    label: 'Trust Assurance Bar',   icon: '🔒', defaultEnabled: true },
  { id: 'comp-founder',       type: 'founder',      label: 'About / Our Story',     icon: '👤', defaultEnabled: false },
  { id: 'comp-awards',        type: 'awards',       label: 'Awards & Certifications', icon: '🏆', defaultEnabled: false },
  { id: 'comp-faq',           type: 'faq',          label: 'FAQ Accordion',         icon: '❓', defaultEnabled: true },
  { id: 'comp-map',           type: 'map',          label: 'Contact & Coverage',    icon: '📍', defaultEnabled: true },
];

const GOOGLE_FONTS = [
  'Inter, sans-serif', 'Poppins, sans-serif', 'Roboto, sans-serif',
  'Outfit, sans-serif', 'DM Sans, sans-serif', 'Nunito, sans-serif',
  'Playfair Display, serif', 'Lora, serif',
];

const SERVICE_IMAGES: Record<string, string> = {
  clean: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
  electric: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400',
  plumb: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400',
  paint: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400',
  default: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
};

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

/* ─── Mini Site Preview ──────────────────────────────────── */
function MiniSitePreview({
  primaryColor, themeMode, themeFont, heroTitle, heroSubtitle,
  announceActive, announceText, pageComponents, services, logoText, city
}: {
  primaryColor: string; themeMode: string; themeFont: string;
  heroTitle: string; heroSubtitle: string; announceActive: boolean; announceText: string;
  pageComponents: any[]; services: Service[]; logoText: string; city: string;
}) {
  const isDark = themeMode === 'dark';
  const bg      = isDark ? '#0f172a' : '#ffffff';
  const navBg   = isDark ? '#0d1420' : '#ffffff';
  const textClr = isDark ? '#f1f5f9' : '#0f172a';
  const mutedClr= isDark ? '#94a3b8' : '#64748b';
  const cardBg  = isDark ? '#1e293b' : '#f8fafc';
  const borderClr = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';

  const enabled = pageComponents.filter(c => c.enabled).map(c => c.type);

  return (
    <div style={{ fontFamily: themeFont, backgroundColor: bg, minWidth: '1280px', fontSize: '14px' }}>

      {/* Utility bar Removed */}

      {/* Announcement */}
      {announceActive && (
        <div style={{ backgroundColor: primaryColor, color: '#fff', textAlign: 'center', padding: '8px', fontSize: '12px', fontWeight: 800 }}>
          {announceText}
        </div>
      )}

      {/* Navbar */}
      <div style={{ backgroundColor: navBg, borderBottom: `1px solid ${borderClr}`, padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '15px' }}>{logoText.charAt(0)}</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '14px', color: primaryColor }}>{logoText}</div>
            <div style={{ fontSize: '9px', color: mutedClr }}>One Call. We Do It All.</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '24px', fontSize: '12px', color: mutedClr, fontWeight: 600 }}>
          {['Home', 'Services', 'Offers', 'About Us', 'Reviews', 'Contact Us'].map(l => (
            <span key={l}>{l}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', color: mutedClr, border: `1px solid ${borderClr}`, padding: '7px 14px', borderRadius: '10px' }}>🔍 Track Booking</div>
          <div style={{ backgroundColor: primaryColor, color: '#fff', padding: '9px 18px', borderRadius: '10px', fontWeight: 900, fontSize: '12px', boxShadow: `0 4px 16px ${primaryColor}50` }}>📅 Book Service</div>
        </div>
      </div>

      {/* Hero */}
      {enabled.includes('hero') && (
        <div style={{
          backgroundColor: isDark ? '#0b0f19' : '#0f172a',
          padding: '72px 48px', minHeight: '380px', display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '32px', alignItems: 'center',
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: primaryColor, color: '#fff', padding: '6px 14px', borderRadius: '999px', fontSize: '11px', fontWeight: 900, marginBottom: '20px', boxShadow: `0 4px 20px ${primaryColor}60` }}>
              ⚡ 30 MIN ARRIVAL GUARANTEE
            </div>
            <h1 style={{ fontSize: '42px', fontWeight: 900, color: '#fff', lineHeight: 1.05, marginBottom: '14px' }}>{heroTitle}</h1>
            <p style={{ fontSize: '15px', color: '#cbd5e1', marginBottom: '28px', lineHeight: 1.6, maxWidth: '520px' }}>{heroSubtitle}</p>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
              <div style={{ backgroundColor: primaryColor, color: '#fff', padding: '15px 30px', borderRadius: '14px', fontWeight: 900, fontSize: '13px', boxShadow: `0 8px 28px ${primaryColor}50` }}>Book Service Now →</div>
              <div style={{ border: '2px solid rgba(255,255,255,0.22)', color: '#fff', padding: '15px 22px', borderRadius: '14px', fontWeight: 700, fontSize: '13px' }}>📞 Call Now</div>
            </div>
            {/* Trust badges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {['🪪 Aadhaar Verified', '🛡️ Police Verified', '🔄 30-Day Warranty', '💰 No Hidden Costs'].map(b => (
                <div key={b} style={{ background: 'rgba(255,255,255,0.09)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '8px 10px', fontSize: '10px', color: '#fff', fontWeight: 700 }}>{b}</div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Live availability glass card */}
            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '16px', padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span>
                <span style={{ fontSize: '11px', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live Availability</span>
              </div>
              <p style={{ fontSize: '18px', fontWeight: 900, color: '#fff', margin: 0 }}>8 Technicians Available</p>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0' }}>Next Slot: <span style={{ color: primaryColor, fontWeight: 900 }}>Today, 3:00 PM</span></p>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.12)', backdropFilter: 'blur(16px)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '16px', padding: '14px 18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#f59e0b', marginBottom: '6px' }}>⚡ Emergency Service</div>
              <p style={{ fontSize: '14px', fontWeight: 900, color: '#fff', margin: 0 }}>Available in <span style={{ color: '#f59e0b' }}>30 Minutes</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Stats strip */}
      {enabled.includes('stats') && (
        <div style={{ backgroundColor: isDark ? '#060b14' : '#0f172a', padding: '20px 48px', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', textAlign: 'center' }}>
          {[
            { v: '4.9/5', s: '1,240+ Reviews', c: '#f59e0b' },
            { v: '5,250+', s: 'Jobs Completed', c: primaryColor },
            { v: '1,850+', s: 'Happy Customers', c: '#22c55e' },
            { v: '30 Min', s: 'Avg. Response', c: '#38bdf8' },
            { v: '100%', s: 'Satisfaction', c: '#a78bfa' },
            { v: '24/7', s: 'Support', c: '#f97316' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>{s.s}</div>
            </div>
          ))}
        </div>
      )}

      {/* Services grid */}
      {enabled.includes('services') && (
        <div style={{ padding: '56px 48px', backgroundColor: bg }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ fontSize: '11px', fontWeight: 900, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px' }}>— What We Offer —</div>
            <h2 style={{ fontSize: '30px', fontWeight: 900, color: textClr, margin: 0 }}>Our Top Services</h2>
            <p style={{ fontSize: '13px', color: mutedClr, marginTop: '8px' }}>Solutions for every corner of your home</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
            {services.slice(0, 6).map((svc, i) => (
              <div key={i} style={{ borderRadius: '16px', overflow: 'hidden', backgroundColor: cardBg, border: `1px solid ${borderClr}`, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', transition: 'all 0.3s' }}>
                <div style={{ height: '90px', backgroundImage: `url(${getServiceImg(svc.name, svc.category)})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '8px' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }} />
                  <span style={{ position: 'relative', zIndex: 1, fontSize: '10px', fontWeight: 900, color: '#fff', backgroundColor: primaryColor, padding: '2px 7px', borderRadius: '6px' }}>From ₹{svc.basePrice}</span>
                </div>
                <div style={{ padding: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 900, color: textClr, marginBottom: '4px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span>{svc.icon || '🛠️'}</span> {svc.name}
                  </div>
                  <div style={{ backgroundColor: primaryColor, color: '#fff', fontSize: '10px', fontWeight: 900, padding: '5px', borderRadius: '7px', textAlign: 'center', cursor: 'pointer' }}>Add to Cart</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      {enabled.includes('how_it_works') && (
        <div style={{ padding: '48px', backgroundColor: isDark ? '#0d1526' : '#f1f5fd' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '11px', fontWeight: 900, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px' }}>— Simple Process —</div>
            <h2 style={{ fontSize: '26px', fontWeight: 900, color: textClr, margin: 0 }}>How It Works</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', textAlign: 'center' }}>
            {[
              { n: '01', icon: '📱', title: 'Choose a Service', desc: 'Browse 100+ services and pick what you need.' },
              { n: '02', icon: '📅', title: 'Schedule & Pay', desc: 'Pick your time slot and pay securely in 60 seconds.' },
              { n: '03', icon: '✅', title: 'Relax, We Handle It', desc: 'A verified expert arrives on time with a guarantee.' },
            ].map(step => (
              <div key={step.n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: `${primaryColor}15`, border: `2px solid ${primaryColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '14px', position: 'relative' }}>
                  {step.icon}
                  <div style={{ position: 'absolute', top: '-6px', right: '-6px', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: primaryColor, color: '#fff', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{step.n}</div>
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: 900, color: textClr, marginBottom: '6px' }}>{step.title}</h3>
                <p style={{ fontSize: '12px', color: mutedClr, lineHeight: 1.5 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other sections as visual pills */}
      <div style={{ padding: '20px 48px', backgroundColor: isDark ? '#080d1b' : '#f8fafc', borderTop: `1px solid ${borderClr}`, borderBottom: `1px solid ${borderClr}` }}>
        <div style={{ fontSize: '10px', fontWeight: 900, color: mutedClr, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Additional Sections</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {pageComponents
            .filter(comp => !['hero', 'stats', 'services', 'how_it_works'].includes(comp.type))
            .map(comp => {
              const meta = ALL_SECTIONS.find(s => s.type === comp.type);
              if (!meta) return null;
              return (
                <div key={comp.id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '5px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                  backgroundColor: comp.enabled ? `${primaryColor}15` : (isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'),
                  color: comp.enabled ? primaryColor : mutedClr,
                  border: `1px solid ${comp.enabled ? primaryColor + '40' : borderClr}`,
                  opacity: comp.enabled ? 1 : 0.5,
                }}>
                  {meta.icon} {meta.label}
                </div>
              );
            })}
        </div>
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: isDark ? '#060b14' : '#0f172a', padding: '48px', color: '#94a3b8' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '36px', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: primaryColor, color: '#fff', fontWeight: 900, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{logoText.charAt(0)}</div>
              <span style={{ fontWeight: 900, fontSize: '12px', color: '#fff' }}>{logoText}</span>
            </div>
            <p style={{ fontSize: '11px', lineHeight: 1.6, color: '#64748b' }}>Your trusted home services partner in {city || 'your city'}.</p>
            <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
              {['f', 'ig', 'yt', '💬'].map(s => (
                <div key={s} style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900, color: '#475569', cursor: 'pointer' }}>{s}</div>
              ))}
            </div>
          </div>
          {[
            { title: 'Quick Links', items: ['Home', 'Services', 'Offers', 'About Us', 'Contact'] },
            { title: 'Popular Services', items: ['Cleaning', 'Electrical', 'Plumbing', 'Painting', 'Pest Control'] },
            { title: 'Company', items: ['About Us', 'Our Team', 'Reviews', 'Blog', 'Careers'] },
          ].map(col => (
            <div key={col.title}>
              <p style={{ fontWeight: 900, fontSize: '12px', color: '#fff', marginBottom: '12px' }}>{col.title}</p>
              {col.items.map(item => <p key={item} style={{ fontSize: '11px', color: '#475569', marginBottom: '6px', cursor: 'pointer' }}>{item}</p>)}
            </div>
          ))}
          <div>
            <p style={{ fontWeight: 900, fontSize: '12px', color: '#fff', marginBottom: '12px' }}>Contact Us</p>
            <p style={{ fontSize: '11px', color: '#475569', marginBottom: '6px' }}>📍 {city || 'Nellore, AP'}</p>
            <p style={{ fontSize: '11px', color: '#475569', marginBottom: '6px' }}>📞 +91 98765 43210</p>
            <p style={{ fontSize: '11px', color: '#475569', marginBottom: '6px' }}>✉️ hello@company.com</p>
            <p style={{ fontSize: '11px', color: '#475569', marginBottom: '6px' }}>⏰ Mon–Sun, 8 AM – 8 PM</p>
            {['Track Booking', 'Privacy Policy', 'Terms & Conditions'].map(l => <p key={l} style={{ fontSize: '10px', color: '#334155', marginBottom: '4px', cursor: 'pointer' }}>{l}</p>)}
          </div>
        </div>
        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#334155' }}>
          <span>© 2026 {logoText} Services. All rights reserved.</span>
          <span>Powered by <span style={{ color: primaryColor, fontWeight: 700 }}>Anarav Business OS</span></span>
        </div>
      </div>
    </div>
  );
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

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function WebsiteManagerTab({ tenant, myServices, myWorkers, setTenants, showToast }: Props) {
  const c = tenant.config;

  /* ── Appearance ─────────────────────────────────────────── */
  const [primaryColor,    setPrimaryColor]    = useState(c.primaryColor);
  const [themeMode,       setThemeMode]       = useState<'light' | 'dark' | 'auto'>(c.themeMode || 'light');
  const [themeFont,       setThemeFont]       = useState(c.themeFont || 'Inter, sans-serif');
  const [themeRadius,     setThemeRadius]     = useState<'modern' | 'rounded' | 'square'>(c.themeRadius || 'modern');
  const [themeButtonStyle,setThemeButtonStyle]= useState<'filled' | 'outline' | 'soft'>(c.themeButtonStyle || 'filled');
  const [logoText,         setLogoText]         = useState(c.logoText || tenant.name);
  const [techSelectionActive, setTechSelectionActive] = useState(c.allowTechnicianSelection ?? false);

  /* ── Hero ───────────────────────────────────────────────── */
  const [heroTitle,      setHeroTitle]      = useState(c.heroTitle || 'All Home Services One Trusted Team');
  const [heroSubtitle,   setHeroSubtitle]   = useState(c.heroSubtitle || 'Professional. Verified. On-time. Making homes better, every day.');
  const [heroBadge,      setHeroBadge]      = useState((c as any).heroArrivalGuarantee || '30 MIN ARRIVAL GUARANTEE');
  const [announceActive, setAnnounceActive] = useState(c.announcementActive ?? true);
  const [announceText,   setAnnounceText]   = useState(c.announcementText || '🎉 Special offer: Book online and save!');
  const [announceExpiry, setAnnounceExpiry] = useState(c.announcementExpiry || '');
  const [primaryCta,     setPrimaryCta]     = useState('Book Service Now');
  const [secondaryCta,   setSecondaryCta]   = useState('Call Now');

  /* ── Sections ───────────────────────────────────────────── */
  const [pageComponents, setPageComponents] = useState(() => getInitialComponents(c));

  /* ── Services ───────────────────────────────────────────── */
  const [featuredServiceIds, setFeaturedServiceIds] = useState<string[]>(
    (c as any).featuredServiceIds || myServices.filter(s => s.isActive).slice(0, 6).map(s => s.id)
  );
  const [homepageServiceCount, setHomepageServiceCount] = useState<number>((c as any).homepageServiceCount || 6);

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
  const [editorTab,    setEditorTab]    = useState<EditorTab>('appearance');
  const [previewDevice,setPreviewDevice]= useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isSaving,     setIsSaving]     = useState(false);
  const [wcagOk,       setWcagOk]       = useState(true);
  const [webVitals]                     = useState({ perf: 94, a11y: 98, seo: 92 });

  // Sync with tenant changes (e.g., switching tenants)
  useEffect(() => {
    setPrimaryColor(c.primaryColor);
    setThemeMode(c.themeMode || 'light');
    setHeroTitle(c.heroTitle || '');
    setHeroSubtitle(c.heroSubtitle || '');
    setAnnounceActive(c.announcementActive ?? true);
    setAnnounceText(c.announcementText || '');
    setAnnounceExpiry(c.announcementExpiry || '');
    setLogoText(c.logoText || tenant.name);
    setTechSelectionActive(c.allowTechnicianSelection ?? false);
    setPageComponents(getInitialComponents(c));
    setPortfolio(c.portfolio || []);
    setTestimonials(c.testimonials || []);
    setFaqs(c.faqs || []);
    setCampaigns(c.campaigns || []);
  }, [tenant.id]);

  // WCAG check whenever primary color changes
  useEffect(() => {
    const ratio = getContrastRatio('#ffffff', primaryColor);
    setWcagOk(ratio >= 4.5);
  }, [primaryColor]);

  /* ── Handlers ───────────────────────────────────────────── */
  const handleSave = () => {
    setIsSaving(true);

    // Build updated cmsPages
    const updatedCmsPages = (() => {
      const pages = [...(c.cmsPages || [])];
      const homeIdx = pages.findIndex(p => p.slug === 'home');
      const homePage = { id: 'home', title: 'Home', slug: 'home', components: pageComponents };
      if (homeIdx >= 0) pages[homeIdx] = homePage;
      else pages.unshift(homePage);
      return pages;
    })();

    setTenants(prev => prev.map(t => t.id === tenant.id ? {
      ...t,
      config: {
        ...t.config,
        primaryColor, themeMode, themeFont, themeRadius, themeButtonStyle,
        logoText,
        heroTitle, heroSubtitle, announcementActive: announceActive, announcementText: announceText,
        announcementExpiry: announceExpiry,
        allowTechnicianSelection: techSelectionActive,
        cmsPages: updatedCmsPages,
        portfolio, testimonials, faqs, campaigns,
        city: cityName, businessHours: bizHours, phone: bizPhone,
        whatsAppNumber: bizWhatsApp, address: bizAddress,
        localSeoConfig: { ...(t.config.localSeoConfig as any), nearbyCities } as any,
        featuredServiceIds, homepageServiceCount,
      }
    } : t));

    setTimeout(() => {
      setIsSaving(false);
      showToast('🚀 Website published! Changes are now live.', 'success');
    }, 1400);
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

  /* Device dimensions for preview */
  const deviceConfig = {
    desktop: { width: 1280, scale: 0.58 },
    tablet:  { width: 768,  scale: 0.75 },
    mobile:  { width: 390,  scale: 0.85 },
  };
  const { width: dvW, scale: dvS } = deviceConfig[previewDevice];

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="flex h-full -m-6 overflow-hidden animate-fadeIn">

      {/* ═══════════ LEFT: EDITOR PANEL ═══════════ */}
      <div className="w-[360px] flex-shrink-0 flex flex-col bg-slate-950 border-r border-slate-800">

        {/* Panel Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div>
            <p className="text-sm font-black text-white flex items-center gap-2">🌐 Website Manager</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{tenant.subdomain}.servos.in</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary px-4 py-2 text-[11px] font-black flex items-center gap-1.5 shrink-0 disabled:opacity-60"
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
        <div className="flex flex-wrap gap-1 p-2 border-b border-slate-800 shrink-0">
          {EDITOR_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setEditorTab(t.id)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${editorTab === t.id ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* ═══ APPEARANCE ═══ */}
          {editorTab === 'appearance' && (
            <div className="space-y-4">
              <SectionCard title="Brand Logo" subtitle="Sets the primary text logo in the site header">
                <FieldLabel>Logo Text</FieldLabel>
                <FieldInput 
                  value={logoText} 
                  onChange={e => setLogoText(e.target.value)} 
                  placeholder="e.g. 🏪 CleanPro Pro"
                />
              </SectionCard>
              <SectionCard title="Brand Color" subtitle="Drives buttons, accents, and highlights">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-12 h-10 rounded-xl border-0 cursor-pointer bg-transparent" />
                  </div>
                  <input
                    type="text" value={primaryColor}
                    onChange={e => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && setPrimaryColor(e.target.value)}
                    className="form-input flex-1 text-xs font-mono uppercase"
                    maxLength={7}
                  />
                  <div className="w-10 h-10 rounded-xl border border-slate-700 shrink-0" style={{ backgroundColor: primaryColor }} />
                </div>
                {/* WCAG status */}
                <div className={`flex items-center gap-2 p-2.5 rounded-lg text-[10px] font-bold border ${wcagOk ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-400' : 'bg-red-950/30 border-red-900/40 text-red-400'}`}>
                  {wcagOk ? '✓ WCAG AA Compliant — Color contrast is accessible' : '✗ Low contrast ratio — Consider a darker shade'}
                </div>
              </SectionCard>

              <SectionCard title="Theme Mode">
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'dark', 'auto'] as const).map(mode => (
                    <button key={mode} onClick={() => setThemeMode(mode)}
                      className={`py-2.5 rounded-xl text-[10px] font-black border transition-all capitalize ${themeMode === mode ? 'text-white border-transparent' : 'text-slate-500 border-slate-800 hover:border-slate-700'}`}
                      style={themeMode === mode ? { background: primaryColor, borderColor: primaryColor } : {}}>
                      {mode === 'light' ? '☀️' : mode === 'dark' ? '🌙' : '⚙️'} {mode}
                    </button>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Font Family">
                <select className="form-input w-full text-xs" value={themeFont} onChange={e => setThemeFont(e.target.value)}>
                  {GOOGLE_FONTS.map(f => (
                    <option key={f} value={f}>{f.split(',')[0]}</option>
                  ))}
                </select>
              </SectionCard>

              <SectionCard title="Border Radius Style">
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { val: 'modern',  label: 'Modern', radius: '12px' },
                    { val: 'rounded', label: 'Round',  radius: '24px' },
                    { val: 'square',  label: 'Square', radius: '4px'  },
                  ] as const).map(opt => (
                    <button key={opt.val} onClick={() => setThemeRadius(opt.val)}
                      className={`py-2.5 text-[10px] font-black border transition-all ${themeRadius === opt.val ? 'text-white border-transparent' : 'text-slate-500 border-slate-800 bg-slate-900'}`}
                      style={{ borderRadius: opt.radius, ...(themeRadius === opt.val ? { background: primaryColor } : {}) }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Button Style">
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { val: 'filled',  label: 'Filled'  },
                    { val: 'outline', label: 'Outline' },
                    { val: 'soft',    label: 'Soft'    },
                  ] as const).map(opt => (
                    <button key={opt.val} onClick={() => setThemeButtonStyle(opt.val)}
                      className={`py-2.5 rounded-lg text-[10px] font-black transition-all ${themeButtonStyle === opt.val ? 'text-white' : 'border border-slate-800 text-slate-500 bg-slate-900'}`}
                      style={themeButtonStyle === opt.val ? { background: primaryColor } : {}}>
                      {opt.label}
                    </button>
                  ))}
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
                    
                    <FieldLabel>Expiry Date (Automatically Disappears)</FieldLabel>
                    <input 
                      type="date" 
                      value={announceExpiry} 
                      onChange={e => setAnnounceExpiry(e.target.value)} 
                      className="form-input text-xs w-full mt-1.5" 
                    />
                    <p className="text-[9px] text-slate-500 mt-1">If set, the banner automatically disappears after this date. If blank, it remains indefinitely.</p>
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
            </div>
          )}

          {/* ═══ SECTIONS ═══ */}
          {editorTab === 'sections' && (
            <div className="space-y-2">
              <p className="text-[10px] text-slate-500 mb-3">Toggle sections on/off and reorder them. The preview updates in real time.</p>
              {pageComponents.map((comp, idx) => {
                const meta = ALL_SECTIONS.find(s => s.type === comp.type);
                if (!meta) return null;
                return (
                  <div key={comp.id} className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5">
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button onClick={() => moveSection(idx, 'up')} disabled={idx === 0} className="text-slate-600 hover:text-slate-400 disabled:opacity-30 text-[10px] leading-none">▲</button>
                      <button onClick={() => moveSection(idx, 'down')} disabled={idx === pageComponents.length - 1} className="text-slate-600 hover:text-slate-400 disabled:opacity-30 text-[10px] leading-none">▼</button>
                    </div>
                    <span className="text-sm">{meta.icon}</span>
                    <span className="flex-1 text-xs font-bold text-slate-300">{meta.label}</span>
                    {/* Toggle */}
                    <button onClick={() => toggleSection(comp.id)} className={`w-9 h-5 rounded-full transition-all relative shrink-0 ${comp.enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${comp.enabled ? 'left-4' : 'left-0.5'}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ SERVICES ═══ */}
          {editorTab === 'services' && (
            <div className="space-y-4">
              <SectionCard title="Homepage Display" subtitle="Control how services appear on your homepage">
                <FieldLabel>Services to Show on Homepage</FieldLabel>
                <select className="form-input w-full text-xs" value={homepageServiceCount} onChange={e => setHomepageServiceCount(Number(e.target.value))}>
                  {[3,4,6,8,12].map(n => <option key={n} value={n}>{n} Services</option>)}
                </select>
              </SectionCard>

              <SectionCard title="Featured Services" subtitle="Toggle which services show on the homepage">
                <div className="space-y-2">
                  {myServices.filter(s => s.isActive).map(svc => (
                    <div key={svc.id} className="flex items-center gap-2 py-1.5">
                      <span className="text-base">{svc.icon || '🛠️'}</span>
                      <span className="flex-1 text-xs text-slate-300 font-medium">{svc.name}</span>
                      <span className="text-[10px] text-slate-500 mr-2">₹{svc.basePrice}</span>
                      <button
                        onClick={() => setFeaturedServiceIds(prev =>
                          prev.includes(svc.id) ? prev.filter(id => id !== svc.id) : [...prev, svc.id]
                        )}
                        className={`w-9 h-5 rounded-full transition-all relative shrink-0 ${featuredServiceIds.includes(svc.id) ? 'bg-emerald-500' : 'bg-slate-700'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${featuredServiceIds.includes(svc.id) ? 'left-4' : 'left-0.5'}`} />
                      </button>
                    </div>
                  ))}
                  {myServices.filter(s => s.isActive).length === 0 && (
                    <p className="text-[10px] text-slate-500">No services found. Add services in the Services tab first.</p>
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
                    <FieldLabel>YouTube Video Link</FieldLabel>
                    <FieldInput value={newPortYoutube} onChange={e => setNewPortYoutube(e.target.value)} placeholder="https://youtube.com/..." />
                  </div>
                  <div>
                    <FieldLabel>Instagram Video Link</FieldLabel>
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
                    <button onClick={() => setPortfolio(prev => prev.filter(p => p.id !== item.id))} className="text-slate-600 hover:text-red-400 text-xs">✕</button>
                  </div>
                ))}
                {portfolio.length === 0 && <p className="text-[10px] text-slate-500 text-center py-4">No portfolio items yet. Add your first project above.</p>}
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

              <p className="text-[10px] text-slate-500">Toggle which technicians appear on your public website and set their website display title.</p>
              <div className="space-y-3">
                {myWorkers.map(w => (
                  <div key={w.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-black text-slate-300">{w.name.charAt(0)}</div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-white">{w.name}</p>
                        <p className="text-[10px] text-slate-500">{w.skills?.slice(0,2).join(', ')}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500">{workerVisibility[w.id] !== false ? 'Visible' : 'Hidden'}</span>
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
                          placeholder="Senior Electrician"
                        />
                      </div>
                    )}
                  </div>
                ))}
                {myWorkers.length === 0 && <p className="text-[10px] text-slate-500 text-center py-4">No team members yet. Add staff in the Workers tab.</p>}
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
                    <button onClick={() => setCampaigns(prev => prev.filter(c => c.id !== camp.id))} className="text-slate-600 hover:text-red-400 text-xs shrink-0">✕</button>
                  </div>
                ))}
                {campaigns.length === 0 && <p className="text-[10px] text-slate-500 text-center py-4">No offers yet. Create your first offer above.</p>}
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
                        <p className="text-[10px] text-slate-500">{t.role} · {'⭐'.repeat(t.rating)}</p>
                        <p className="text-[10px] text-slate-400 mt-1 italic line-clamp-2">"{t.text}"</p>
                      </div>
                      <button onClick={() => setTestimonials(prev => prev.filter(x => x.id !== t.id))} className="text-slate-600 hover:text-red-400 text-xs shrink-0">✕</button>
                    </div>
                  </div>
                ))}
                {testimonials.length === 0 && <p className="text-[10px] text-slate-500 text-center py-4">No reviews yet. Add your first customer review above.</p>}
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
                      <button onClick={() => setFaqs(prev => prev.filter(x => x.id !== f.id))} className="text-slate-600 hover:text-red-400 text-xs shrink-0">✕</button>
                    </div>
                  </div>
                ))}
                {faqs.length === 0 && <p className="text-[10px] text-slate-500 text-center py-4">No FAQs yet. Add your first FAQ above.</p>}
              </div>
            </div>
          )}

          {/* ═══ COVERAGE ═══ */}
          {editorTab === 'coverage' && (
            <div className="space-y-4">
              <SectionCard title="Service Location">
                <FieldLabel>Primary City</FieldLabel>
                <FieldInput value={cityName} onChange={e => setCityName(e.target.value)} placeholder="Nellore, AP" />
                <FieldLabel>Nearby Cities / Areas (shown on website)</FieldLabel>
                <div className="flex gap-2 mb-2">
                  <FieldInput value={newNearbyCity} onChange={e => setNewNearbyCity(e.target.value)} placeholder="Kavali" onKeyDown={e => { if (e.key === 'Enter' && newNearbyCity.trim()) { setNearbyCities(p => [...p, newNearbyCity.trim()]); setNewNearbyCity(''); }}} />
                  <button onClick={() => { if (newNearbyCity.trim()) { setNearbyCities(p => [...p, newNearbyCity.trim()]); setNewNearbyCity(''); }}} className="btn-secondary px-3 py-1 text-[10px] font-bold shrink-0">+ Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {nearbyCities.map(city => (
                    <span key={city} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 rounded-lg text-[10px] font-bold text-slate-300">
                      📍 {city}
                      <button onClick={() => setNearbyCities(p => p.filter(c => c !== city))} className="text-slate-600 hover:text-red-400 ml-0.5">✕</button>
                    </span>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Contact Information">
                <FieldLabel>Support Phone</FieldLabel>
                <FieldInput value={bizPhone} onChange={e => setBizPhone(e.target.value)} placeholder="+91 98765 43210" />
                <FieldLabel>WhatsApp Number (with country code)</FieldLabel>
                <FieldInput value={bizWhatsApp} onChange={e => setBizWhatsApp(e.target.value)} placeholder="919876543210" />
                <FieldLabel>Office Address</FieldLabel>
                <FieldTextarea rows={2} value={bizAddress} onChange={e => setBizAddress(e.target.value)} placeholder="12-3-456, Main Road, Nellore - 524001" />
                <FieldLabel>Business Hours</FieldLabel>
                <FieldInput value={bizHours} onChange={e => setBizHours(e.target.value)} placeholder="Mon–Sun, 8 AM – 8 PM" />
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
                      <p className="text-[9px] text-slate-500 mt-0.5">{v.label}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Publish Website">
                <div className="flex items-start gap-2 p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl mb-3">
                  <span className="text-blue-400 text-sm mt-0.5">ℹ️</span>
                  <p className="text-[10px] text-blue-400 leading-relaxed">Clicking publish will apply all your changes and make them live on your public website immediately.</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-3.5 rounded-xl font-black text-sm text-white transition-all hover:scale-[1.02] disabled:opacity-60"
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

              <SectionCard title="Recent Publish History">
                {(c.publishHistory || []).slice(0, 3).map((h: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                    <div>
                      <p className="text-[10px] font-bold text-white">Version {h.version}</p>
                      <p className="text-[9px] text-slate-500">{new Date(h.publishedAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${h.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>{h.status}</span>
                  </div>
                ))}
                {(c.publishHistory || []).length === 0 && <p className="text-[10px] text-slate-500 text-center py-2">No publish history yet.</p>}
              </SectionCard>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ RIGHT: LIVE PREVIEW ═══════════ */}
      <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">

        {/* Preview Header */}
        <div className="shrink-0 p-3 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <div className="ml-2 bg-slate-800 rounded-lg px-3 py-1 flex items-center gap-1.5 min-w-48">
              <span className="text-slate-500 text-[10px]">🌐</span>
              <span className="text-slate-400 text-[10px] font-mono truncate">{tenant.customDomain || `${tenant.subdomain}.servos.in`}</span>
            </div>
          </div>

          {/* Device Toggle */}
          <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
            {([
              { id: 'desktop', icon: '🖥️', label: 'Desktop' },
              { id: 'tablet',  icon: '📱', label: 'Tablet' },
              { id: 'mobile',  icon: '📲', label: 'Mobile' },
            ] as const).map(d => (
              <button
                key={d.id}
                onClick={() => setPreviewDevice(d.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${previewDevice === d.id ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {d.icon} {d.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">Live Preview</span>
          </div>
        </div>

        {/* Preview Viewport */}
        <div className="flex-1 overflow-auto flex items-start justify-center p-6 bg-[#1a1d24]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
          <div
            className="bg-white rounded-xl overflow-hidden shadow-2xl border border-slate-700"
            style={{
              width: `${dvW}px`,
              transform: `scale(${dvS})`,
              transformOrigin: 'top center',
              marginBottom: `-${dvW * (1 - dvS) * 1.5}px`,
            }}
          >
            <MiniSitePreview
              primaryColor={primaryColor}
              themeMode={themeMode}
              themeFont={themeFont}
              heroTitle={heroTitle}
              heroSubtitle={heroSubtitle}
              announceActive={announceActive}
              announceText={announceText}
              pageComponents={pageComponents}
              services={myServices}
              logoText={c.logoText || tenant.name}
              city={cityName || c.city || 'Nellore, AP'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
