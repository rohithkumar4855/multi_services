// @ts-nocheck
import React, { useState } from 'react';
import {
  Search, ChevronLeft, ChevronRight, Star, ShoppingCart, Zap,
  Phone, MessageCircle, MapPin, Clock, Shield, CheckCircle,
  ArrowRight
} from 'lucide-react';
import type { Tenant, BasketItem, Service } from '../types';

/* ─── Image Utilities ─────────────────────────────────────── */
const SERVICE_IMAGES: Record<string, string> = {
  clean:       'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80&auto=format&fit=crop',
  electric:    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500&q=80&auto=format&fit=crop',
  plumb:       'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=500&q=80&auto=format&fit=crop',
  paint:       'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=500&q=80&auto=format&fit=crop',
  pest:        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&q=80&auto=format&fit=crop',
  appliance:   'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=500&q=80&auto=format&fit=crop',
  carpenter:   'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&q=80&auto=format&fit=crop',
  interior:    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&q=80&auto=format&fit=crop',
  default:     'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80&auto=format&fit=crop',
};

const getServiceImage = (name: string, category: string) => {
  const key = `${name} ${category}`.toLowerCase();
  for (const [k, v] of Object.entries(SERVICE_IMAGES)) {
    if (key.includes(k)) return v;
  }
  return SERVICE_IMAGES.default;
};

const TECH_PHOTOS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80&auto=format&fit=crop&face=center',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80&auto=format&fit=crop&face=center',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?w=300&q=80&auto=format&fit=crop&face=center',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80&auto=format&fit=crop&face=center',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&q=80&auto=format&fit=crop&face=center',
  'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&q=80&auto=format&fit=crop&face=center',
];

const HERO_BG = 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&q=85&auto=format&fit=crop';

/* ─── Reusable Design Primitives ──────────────────────────── */
const SectionLabel = ({ text, color }: { text: string; color: string }) => (
  <div className="flex items-center justify-center gap-2 mb-3">
    <div className="h-px w-8 rounded" style={{ background: color }} />
    <span className="text-xs font-black uppercase tracking-[0.15em]" style={{ color }}>{text}</span>
    <div className="h-px w-8 rounded" style={{ background: color }} />
  </div>
);

const SectionTitle = ({ children, center = true, color }: { children: React.ReactNode; center?: boolean; color: string }) => (
  <h2
    className={`text-3xl sm:text-4xl font-black leading-tight tracking-tight ${center ? 'text-center' : 'text-left'}`}
    style={{ color }}
  >
    {children}
  </h2>
);

/* ─── Props Interface ─────────────────────────────────────── */
interface CmsRendererProps {
  tenant: Tenant;
  activePageSlug: string;
  activeCampaign: any;
  pc: string;
  sc: string;
  localDark: boolean;
  getTextColorForBg: (color: string) => string;
  myWorkers: any[];
  myServices: any[];
  universalSearch: string;
  setUniversalSearch: (val: string) => void;
  basket: BasketItem[];
  setBasket: React.Dispatch<React.SetStateAction<BasketItem[]>>;
  setIsBasketOpen: (val: boolean) => void;
  portfolioFilter: string;
  setPortfolioFilter: (val: string) => void;
  openFaqId: string | null;
  setOpenFaqId: (val: string | null) => void;
  faqSearch: string;
  setFaqSearch: (val: string) => void;
  statsVisible: boolean;
  setStatsVisible: (val: boolean) => void;
  animatedStats: any;
  coverageSubmitted: boolean;
  setCoverageSubmitted: (val: boolean) => void;
  coverageEmail: string;
  setCoverageEmail: (val: string) => void;
  setActivePageSlug: (val: string) => void;
  setViewMode: (val: 'website' | 'dashboard') => void;
  setBookingService: (service: Service | null) => void;
  setDetailService?: (service: Service | null) => void;
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function CmsRenderer({
  tenant,
  activePageSlug,
  activeCampaign,
  pc,
  localDark,
  getTextColorForBg,
  myWorkers,
  myServices,
  universalSearch,
  setUniversalSearch,
  basket,
  setBasket,
  setIsBasketOpen,
  portfolioFilter,
  setPortfolioFilter,
  openFaqId,
  setOpenFaqId,
  faqSearch,
  setFaqSearch,
  statsVisible,
  setStatsVisible,
  animatedStats,
  coverageSubmitted,
  setCoverageSubmitted,
  coverageEmail,
  setCoverageEmail,
  setActivePageSlug,
  setViewMode,
  setBookingService,
  setDetailService
}: CmsRendererProps) {
  const c = tenant.config;
  const [techPage, setTechPage] = useState(0);
  const [testimonialPage, setTestimonialPage] = useState(0);
  const [hoveredService, setHoveredService] = useState<string | null>(null);
  const TECHS_PER_PAGE = 4;
  const TEST_PER_PAGE = 3;

  const textPrimary = 'var(--color-text-primary)';
  const textMuted   = 'var(--color-text-secondary)';

  /* Background for sections */
  const bg0 = localDark ? '#060b14' : '#ffffff';
  const bg1 = localDark ? '#0d1526' : '#f8fafc';
  const bg2 = localDark ? '#111927' : '#f1f5fd';

  const scrollToServices = () => {
    setActivePageSlug('services');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const el = document.getElementById('services');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  /* Resolve page or isolated section based on activePageSlug */
  const isIsolatedSection = activePageSlug !== 'home' && activePageSlug !== 'hero' && Boolean(activePageSlug);

  const getSectionMetadata = (slug: string) => {
    switch (slug) {
      case 'services':
        return { title: 'Our Services Catalogue', icon: '🛠️', desc: 'Browse, filter, and book all verified home services in your area' };
      case 'offers':
        return { title: 'Special Offers & Promotions', icon: '🔥', desc: 'Limited-time deals, discount coupon codes, and exclusive packages' };
      case 'team':
        return { title: 'Our Verified Team & Specialists', icon: '👥', desc: 'Meet our trained, Aadhaar-verified, and background-checked technicians' };
      case 'gallery':
        return { title: 'Project Transformation Gallery', icon: '📸', desc: 'Explore our latest verified project executions and before & after highlights' };
      case 'reviews':
      case 'testimonials':
        return { title: 'Customer Ratings & Reviews', icon: '⭐', desc: 'Verified reviews and feedback from happy customers across your city' };
      case 'faqs':
      case 'faq':
        return { title: 'Frequently Asked Questions', icon: '❓', desc: 'Instant answers to pricing, booking, warranties, and service details' };
      case 'coverage':
      case 'contact':
      case 'map':
        return { title: 'Service Coverage & Contact Us', icon: '📍', desc: 'Direct contact details, operational hours, and serviceable locations' };
      default:
        return { title: 'Section', icon: '📄', desc: '' };
    }
  };

  const getActiveComponents = () => {
    // Check if custom page is configured
    const customPage = (c.cmsPages || []).find(p => p.slug === activePageSlug);
    if (customPage && activePageSlug !== 'home') return customPage.components;

    switch (activePageSlug) {
      case 'services':
        return [
          { id: 'comp-services-full', type: 'services', enabled: true, settings: { showAll: true } },
        ];
      case 'offers':
        return [
          { id: 'comp-offers-row', type: 'offers_row', enabled: true, settings: {} },
        ];
      case 'team':
        return [
          { id: 'comp-team', type: 'team', enabled: true, settings: {} },
        ];
      case 'gallery':
        return [
          { id: 'comp-gallery', type: 'gallery', enabled: true, settings: {} },
        ];
      case 'reviews':
      case 'testimonials':
        return [
          { id: 'comp-testimonials', type: 'testimonials', enabled: true, settings: {} },
        ];
      case 'faqs':
      case 'faq':
        return [
          { id: 'comp-faq', type: 'faq', enabled: true, settings: {} },
        ];
      case 'coverage':
      case 'contact':
      case 'map':
        return [
          { id: 'comp-map', type: 'map', enabled: true, settings: {} },
        ];
      case 'home':
      case 'hero':
      default: {
        const homePage = (c.cmsPages || []).find(p => p.slug === 'home');
        if (homePage) return homePage.components;
        return [
          { id: 'comp-hero', type: 'hero', enabled: true, settings: {} },
          { id: 'comp-stats', type: 'stats', enabled: true, settings: {} },
          { id: 'comp-services-grid', type: 'services', enabled: true, settings: {} },
          { id: 'comp-how', type: 'how_it_works', enabled: true, settings: {} },
          { id: 'comp-offers-row', type: 'offers_row', enabled: true, settings: {} },
          { id: 'comp-team', type: 'team', enabled: true, settings: {} },
          { id: 'comp-gallery', type: 'gallery', enabled: true, settings: {} },
          { id: 'comp-testimonials', type: 'testimonials', enabled: true, settings: {} },
          { id: 'comp-trust-bar', type: 'trust_bar', enabled: true, settings: {} },
          { id: 'comp-faq', type: 'faq', enabled: true, settings: {} },
          { id: 'comp-map', type: 'map', enabled: true, settings: {} },
        ];
      }
    }
  };

  const activeComponents = getActiveComponents();
  const sectionMeta = getSectionMetadata(activePageSlug);

  return (
    <>
      {/* Isolated Section Header Breadcrumb Banner */}
      {isIsolatedSection && (
        <div 
          className="border-b py-8 px-4 sm:px-6 relative transition-all animate-fadeIn"
          style={{ 
            backgroundColor: localDark ? '#0b1120' : '#f1f5f9',
            borderColor: 'var(--color-border)' 
          }}
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2 text-xs font-bold" style={{ color: textMuted }}>
                <button
                  type="button"
                  onClick={() => {
                    setActivePageSlug('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:underline flex items-center gap-1"
                  style={{ color: pc }}
                >
                  🏠 Home
                </button>
                <span>/</span>
                <span className="capitalize" style={{ color: textPrimary }}>{activePageSlug}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2" style={{ color: textPrimary }}>
                <span>{sectionMeta.icon}</span> <span>{sectionMeta.title}</span>
              </h1>
              {sectionMeta.desc && (
                <p className="text-xs sm:text-sm max-w-2xl" style={{ color: textMuted }}>
                  {sectionMeta.desc}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setActivePageSlug('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-105 shadow-sm shrink-0"
              style={{
                borderColor: pc,
                color: pc,
                background: `${pc}15`
              }}
            >
              ← Back to Full Homepage
            </button>
          </div>
        </div>
      )}

      {activeComponents.filter(comp => comp.enabled).map(comp => {
        switch (comp.type) {

          /* ══════════════════════════════════════════════════
             HERO — Full-bleed photography + glassmorphism
          ══════════════════════════════════════════════════ */
          case 'hero': {
            const heroBgImg = (c as any).heroBgImage;
            const heroOverlayDarkness = (c as any).heroBgOverlayOpacity ?? 50;
            const heroGlowOn = (c as any).heroGlowActive ?? true;

            return (
              <section
                key={comp.id}
                id="hero"
                className="relative overflow-hidden flex items-center justify-center py-24 px-6 sm:py-36 bg-cover bg-center"
                style={{
                  backgroundColor: localDark ? '#0b0f19' : '#0f172a',
                  backgroundImage: heroBgImg ? `url(${heroBgImg})` : undefined,
                  minHeight: '520px',
                }}
              >
                {/* Hero Photo Dark Overlay if image active */}
                {heroBgImg && (
                  <div 
                    className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                    style={{
                      backgroundColor: '#000000',
                      opacity: heroOverlayDarkness / 100,
                    }}
                  />
                )}

                {/* 🎨 Premium Animated Gradient Mesh Background */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-45 mix-blend-screen"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${pc}44 0%, transparent 60%), 
                                 radial-gradient(circle at 10% 20%, ${pc}22 0%, transparent 40%),
                                 radial-gradient(circle at 90% 80%, ${pc}22 0%, transparent 40%)`,
                    filter: 'blur(75px)',
                  }}
                />

                {/* ✨ Aura Glow Center Ring Effect */}
                {heroGlowOn && (
                  <div 
                    className="absolute pointer-events-none w-[320px] h-[320px] rounded-full opacity-35 blur-[80px] animate-pulse"
                    style={{
                      background: pc,
                      top: '20%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  />
                )}

                <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8 animate-fadeIn">
                  {/* Arrival guarantee badge with float and pulse effects */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white animate-float border"
                    style={{ 
                      background: `linear-gradient(135deg, ${pc}, ${pc}dd)`, 
                      boxShadow: `0 8px 30px ${pc}60`,
                      borderColor: 'rgba(255,255,255,0.25)',
                    }}>
                    <Zap className="w-3 h-3 text-amber-300 animate-pulse" />
                    {(c as any).heroArrivalGuarantee || '30 Min Arrival Guarantee'}
                  </div>

                  {/* Main Headline with dual-color gradient accentuation */}
                  <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight text-white max-w-4xl mx-auto font-sans">
                    {activeCampaign ? activeCampaign.title : (
                      <>
                        <span className="opacity-95">SV Power Systems</span>
                        <br />
                        <span 
                          style={{
                            background: `linear-gradient(135deg, #38bdf8 30%, ${pc} 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          Industrial Panels & substations
                        </span>
                      </>
                    )}
                  </h1>

                  {/* Subtitle with premium line height */}
                  <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed font-medium mx-auto opacity-90">
                    {activeCampaign?.subtitle || c.heroSubtitle || 'Professional. Verified. On-time. Making homes better, every day.'}
                  </p>

                  {/* CTA Buttons with hover scaling and shadow depth */}
                  <div className="flex flex-wrap justify-center gap-4 pt-2">
                    <button
                      onClick={scrollToServices}
                      className="group flex items-center gap-2.5 px-8 py-4 rounded-xl font-black text-xs transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl"
                      style={{
                        background: `linear-gradient(135deg, ${pc}, ${pc}dd)`,
                        color: getTextColorForBg(pc),
                        boxShadow: `0 10px 30px ${pc}60`,
                        borderRadius: 'var(--border-radius)',
                      }}
                    >
                      Book Service Now
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                    <a
                      href={`tel:${c.phone}`}
                      className="flex items-center gap-2 px-7 py-4 rounded-xl font-bold text-xs border text-white transition-all duration-300 hover:scale-[1.02] hover:bg-white/10"
                      style={{
                        borderColor: 'rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.06)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: 'var(--border-radius)',
                      }}
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Now
                    </a>
                  </div>

                  {/* Trust Badge Row with enhanced glass design */}
                  <div className="flex flex-wrap justify-center gap-3 pt-6">
                    {[
                      { icon: '🪪', title: 'Aadhaar Verified' },
                      { icon: '🛡️', title: 'Police Verified' },
                      { icon: '🔄', title: '30-Day Warranty' },
                      { icon: '💰', title: 'No Hidden Costs' },
                    ].map((b, i) => (
                      <div key={i}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold text-slate-300 border backdrop-blur-md"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderColor: 'rgba(255, 255, 255, 0.08)',
                        }}>
                        <span>{b.icon}</span>
                        <span>{b.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          /* ══════════════════════════════════════════════════
             STATS — Dark animated numbers strip
          ══════════════════════════════════════════════════ */
          case 'stats':
            return (
              <section
                key={comp.id}
                className="py-6 px-4"
                style={{ background: localDark ? '#060b14' : '#0f172a' }}
                ref={(el) => {
                  if (el && !statsVisible) {
                    const obs = new IntersectionObserver(([e]) => {
                      if (e.isIntersecting) { setStatsVisible(true); obs.disconnect(); }
                    }, { threshold: 0.3 });
                    obs.observe(el);
                  }
                }}
              >
                <div className="max-w-7xl mx-auto grid grid-cols-3 sm:grid-cols-6 gap-6 text-center">
                  {[
                    { icon: '⭐', value: '4.9/5', sub: `${animatedStats.fiveStarReviews.toLocaleString()}+ Reviews`, color: '#f59e0b' },
                    { icon: '💼', value: `${animatedStats.jobsCompleted.toLocaleString()}+`, sub: 'Jobs Completed', color: pc },
                    { icon: '😊', value: `${animatedStats.happyClients.toLocaleString()}+`, sub: 'Happy Customers', color: '#22c55e' },
                    { icon: '⏱️', value: '30 Min', sub: 'Avg. Response', color: '#38bdf8' },
                    { icon: '✅', value: '100%', sub: 'Satisfaction', color: '#a78bfa' },
                    { icon: '🕐', value: '24/7', sub: 'Support', color: '#f97316' },
                  ].map((stat, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className="text-2xl">{stat.icon}</span>
                      <span className="text-xl sm:text-2xl font-black leading-none" style={{ color: stat.color }}>{stat.value}</span>
                      <span className="text-[10px] text-slate-400 font-medium leading-tight">{stat.sub}</span>
                    </div>
                  ))}
                </div>
              </section>
            );

          /* ══════════════════════════════════════════════════
             SERVICES — Premium image cards with hover effects
          ══════════════════════════════════════════════════ */
          case 'services':
            const isServicesPage = activePageSlug === 'services';
            const homeCards = (tenant?.config?.featuredServiceIds && tenant.config.featuredServiceIds.length > 0
              ? myServices.filter(s => tenant.config.featuredServiceIds.includes(s.id))
              : myServices).slice(0, 8);
            const displayedServices = universalSearch
              ? myServices.filter(svc => {
                  const q = universalSearch.toLowerCase();
                  return svc.name.toLowerCase().includes(q) || svc.category.toLowerCase().includes(q);
                })
              : (isServicesPage ? myServices : homeCards);

            return (
              <section key={comp.id} id="services" className="py-20 px-4 sm:px-6" style={{ backgroundColor: bg0 }}>
                <div className="max-w-7xl mx-auto">

                  {/* Header */}
                  <div className="text-center mb-10">
                    <SectionLabel text={isServicesPage ? "Complete Catalogue" : "What We Offer"} color={pc} />
                    <SectionTitle color={textPrimary}>
                      {isServicesPage ? `All Professional Services (${myServices.length})` : "Our Top Services"}
                    </SectionTitle>
                    <p className="text-sm sm:text-base mt-3 max-w-xl mx-auto" style={{ color: textMuted }}>
                      {isServicesPage
                        ? "Browse our full range of certified services, verified technicians & upfront pricing"
                        : "Solutions for every corner of your home, delivered by verified professionals"}
                    </p>
                    {isServicesPage && (
                      <div className="mt-4">
                        <button
                          onClick={() => {
                            setActivePageSlug('home');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-slate-400 hover:text-white bg-slate-850 border border-slate-750 transition-colors"
                        >
                          ← Back to Homepage
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Search & Filter */}
                  <div className="relative max-w-md mx-auto mb-10">
                    <input
                      type="text"
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl border text-sm outline-none transition-all focus:ring-2 font-medium"
                      placeholder="Search services (e.g. cleaning, AC, plumbing)..."
                      value={universalSearch}
                      onChange={e => setUniversalSearch(e.target.value)}
                      style={{
                        backgroundColor: localDark ? '#1e293b' : '#f8fafc',
                        borderColor: localDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                        color: textPrimary,
                        boxShadow: `0 0 0 0 ${pc}00`,
                        borderRadius: '16px',
                      }}
                    />
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                    {displayedServices.map((svc: any) => {
                        const inBasket = basket.find(item => item.serviceId === svc.id);
                        const imgUrl = svc.imageUrl || getServiceImage(svc.name, svc.category);
                        const isHovered = hoveredService === svc.id;
                        return (
                          <div
                            key={svc.id}
                            className="group rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-300"
                            style={{
                              backgroundColor: localDark ? '#1e293b' : '#fff',
                              border: `1px solid ${isHovered ? pc + '60' : (localDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)')}`,
                              boxShadow: isHovered
                                ? `0 12px 40px ${pc}25, 0 4px 12px rgba(0,0,0,0.1)`
                                : '0 2px 8px rgba(0,0,0,0.05)',
                              borderRadius: 'var(--border-radius)',
                              transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                            }}
                            onClick={() => setDetailService && setDetailService(svc)}
                            onMouseEnter={() => setHoveredService(svc.id)}
                            onMouseLeave={() => setHoveredService(null)}
                          >
                            {/* Image */}
                            <div className="relative h-32 overflow-hidden flex-shrink-0">
                              <img
                                src={imgUrl}
                                alt={svc.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                loading="lazy"
                              />
                              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
                              {/* Price badge */}
                              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-black text-white"
                                style={{ background: `linear-gradient(135deg, ${pc}, ${pc}cc)` }}>
                                From ₹{svc.basePrice}
                              </div>
                              {svc.isPopular && (
                                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[8px] font-black bg-amber-400 text-amber-900">
                                  Popular
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="p-3 flex flex-col flex-1">
                              <div className="flex items-start gap-1.5 mb-1">
                                <span className="text-lg flex-shrink-0 -mt-0.5">{svc.icon || '🛠️'}</span>
                                <h3 className="text-xs font-black leading-tight" style={{ color: textPrimary }}>{svc.name}</h3>
                              </div>
                              <p className="text-[10px] leading-relaxed flex-1 mb-2 line-clamp-2" style={{ color: textMuted }}>{svc.description}</p>

                              {/* Rating */}
                              <div className="flex items-center gap-1 mb-2">
                                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                <span className="text-[10px] font-black text-amber-500">4.9</span>
                                <span className="text-[9px]" style={{ color: textMuted }}>(200+)</span>
                              </div>

                              {/* Add to Cart */}
                              {c.enableB2bEnquiry ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setBookingService(svc);
                                    setBookingSubmitted(false);
                                  }}
                                  className="w-full py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1"
                                  style={{ background: 'var(--color-button)', color: 'var(--color-button-text)', borderRadius: 'calc(var(--border-radius) * 0.5)' }}
                                >
                                  <span>📋</span> Request Quote
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (inBasket) {
                                      setBasket(prev => prev.filter(item => item.serviceId !== svc.id));
                                    } else {
                                      setBasket(prev => [...prev, {
                                        serviceId: svc.id, serviceName: svc.name,
                                        variantId: `${svc.id}-default`, variantName: 'Standard',
                                        price: svc.basePrice, quantity: 1
                                      }]);
                                      setIsBasketOpen(true);
                                    }
                                  }}
                                  className="w-full py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1"
                                  style={inBasket
                                    ? { background: '#dc2626', color: '#fff', borderRadius: 'calc(var(--border-radius) * 0.5)' }
                                    : { background: 'var(--color-button)', color: 'var(--color-button-text)', borderRadius: 'calc(var(--border-radius) * 0.5)' }
                                  }
                                >
                                  <ShoppingCart className="w-3 h-3" />
                                  {inBasket ? 'Remove' : 'Add to Cart'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* View More / All Services Button on Homepage */}
                  {!isServicesPage && (
                    <div className="text-center mt-10">
                      <button
                        onClick={scrollToServices}
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm border-2 transition-all hover:scale-[1.03] shadow-lg"
                        style={{
                          borderColor: pc,
                          color: pc,
                          borderRadius: 'var(--border-radius)',
                          background: `${pc}12`,
                        }}
                      >
                        <span>View More Services ({myServices.length > 0 ? myServices.length : '8+'})</span> <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </section>
            );

          /* ══════════════════════════════════════════════════
             HOW IT WORKS — 3-step premium process
          ══════════════════════════════════════════════════ */
          case 'how_it_works':
            return (
              <section key={comp.id} className="py-20 px-4 sm:px-6 relative overflow-hidden" style={{ backgroundColor: bg2 }}>
                {/* Subtle pattern */}
                <div className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, ${pc}30 1px, transparent 0)`,
                    backgroundSize: '32px 32px',
                  }}
                />
                <div className="max-w-7xl mx-auto relative">
                  <div className="text-center mb-14">
                    <SectionLabel text="Simple Process" color={pc} />
                    <SectionTitle color={textPrimary}>How It Works</SectionTitle>
                    <p className="text-sm sm:text-base mt-3" style={{ color: textMuted }}>
                      Book, relax, and let our experts handle everything in 3 easy steps
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
                    {/* Connecting line (desktop) */}
                    <div className="hidden sm:block absolute top-12 left-[22%] right-[22%] h-0.5"
                      style={{ background: `linear-gradient(to right, ${pc}, ${pc}40, ${pc})`, opacity: 0.3 }}
                    />

                    {[
                      {
                        step: '01', icon: '📱', title: 'Choose a Service',
                        desc: 'Browse 100+ home services and pick what you need. Filter by category, price, or availability.',
                        color: pc,
                      },
                      {
                        step: '02', icon: '📅', title: 'Schedule & Pay',
                        desc: 'Pick your preferred date, time slot, and payment method. Secure checkout in under 60 seconds.',
                        color: '#10b981',
                      },
                      {
                        step: '03', icon: '✅', title: 'Relax, We Handle It',
                        desc: 'A verified professional arrives on time, completes the job, and you get a satisfaction guarantee.',
                        color: '#f59e0b',
                      },
                    ].map((step, i) => (
                      <div key={i} className="flex flex-col items-center text-center group">
                        {/* Step circle */}
                        <div
                          className="relative w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-105"
                          style={{
                            background: `linear-gradient(135deg, ${step.color}22, ${step.color}11)`,
                            border: `2px solid ${step.color}40`,
                            boxShadow: `0 8px 32px ${step.color}20`,
                          }}
                        >
                          <span className="text-4xl">{step.icon}</span>
                          <div
                            className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
                            style={{ background: step.color }}
                          >
                            {step.step}
                          </div>
                        </div>

                        <div className="max-w-xs">
                          <h3 className="text-lg font-black mb-2" style={{ color: textPrimary }}>{step.title}</h3>
                          <p className="text-sm leading-relaxed" style={{ color: textMuted }}>{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CTA under how it works */}
                  <div className="text-center mt-12">
                    <button
                      onClick={scrollToServices}
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-sm transition-all hover:scale-[1.03] shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${pc}, ${pc}cc)`,
                        color: getTextColorForBg(pc),
                        boxShadow: `0 8px 24px ${pc}40`,
                        borderRadius: 'var(--border-radius)',
                      }}
                    >
                      Book Your First Service <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </section>
            );

          /* ══════════════════════════════════════════════════
             OFFERS ROW — 3-column: Coupons | Why Us | Gallery
          ══════════════════════════════════════════════════ */
          case 'offers_row':
            return (
              <section key={comp.id} id="offers" className="py-20 px-4 sm:px-6" style={{ backgroundColor: bg1 }}>
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* ── Limited Time Offers ── */}
                  <div className="rounded-3xl border p-6 space-y-4"
                    style={{
                      backgroundColor: localDark ? '#1a2540' : '#fff',
                      borderColor: localDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
                      borderRadius: '24px',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                    }}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🔥</span>
                      <h3 className="text-lg font-black" style={{ color: textPrimary }}>Limited Time Offers</h3>
                    </div>

                    {(c.campaigns || []).filter((camp: any) => camp.enabled).length > 0 ? (
                      (c.campaigns || []).filter((camp: any) => camp.enabled).slice(0, 3).map((camp: any) => (
                        <div key={camp.id} className="flex items-center gap-3 p-3 rounded-2xl border"
                          style={{ backgroundColor: localDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderColor: `${pc}20` }}>
                          <div className="px-3 py-2 rounded-xl text-center font-black text-sm text-white flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${pc}, ${pc}bb)`, minWidth: '64px' }}>
                            {camp.offerCode || 'DEAL'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black truncate" style={{ color: textPrimary }}>{camp.title}</p>
                            <p className="text-[10px]" style={{ color: textMuted }}>Valid till {camp.endDate || 'No Expiry'}</p>
                          </div>
                          <button onClick={scrollToServices} className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black border"
                            style={{ borderColor: pc, color: pc, background: `${pc}10` }}>Apply</button>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 px-4 text-center border border-dashed rounded-2xl space-y-1" style={{ borderColor: localDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                        <p className="text-xs font-bold" style={{ color: textPrimary }}>No active offers currently</p>
                        <p className="text-[10px]" style={{ color: textMuted }}>Special promo codes will appear here once configured.</p>
                      </div>
                    )}
                    {(c.campaigns || []).filter((camp: any) => camp.enabled).length > 0 && (
                      <button onClick={scrollToServices} className="text-xs font-bold" style={{ color: pc }}>
                        View All Offers →
                      </button>
                    )}
                  </div>

                  {/* ── Why Choose Us ── */}
                  <div className="rounded-3xl border p-6"
                    style={{
                      backgroundColor: localDark ? '#1a2540' : '#fff',
                      borderColor: localDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
                      borderRadius: '24px',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                    }}>
                    <h3 className="text-lg font-black mb-5" style={{ color: textPrimary }}>
                      Why Choose {c.logoText || tenant.name}?
                    </h3>
                    <div className="space-y-3">
                      {[
                        { icon: '🎓', text: 'Trained & experienced professionals' },
                        { icon: '🪪', text: 'Aadhaar & police verified staff' },
                        { icon: '💰', text: 'Upfront pricing, no hidden costs' },
                        { icon: '⏰', text: 'On-time service or it\'s free' },
                        { icon: '🔄', text: 'Up to 30 days service warranty' },
                        { icon: '🔒', text: 'Easy online booking & secure payments' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 group">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
                            style={{ background: `${pc}15` }}>
                            {item.icon}
                          </div>
                          <span className="text-xs font-medium" style={{ color: textPrimary }}>{item.text}</span>
                          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 ml-auto" style={{ color: pc }} />
                        </div>
                      ))}
                    </div>

                    {/* Trust Seal */}
                    <div className="mt-5 flex items-center gap-4 p-4 rounded-2xl border"
                      style={{ background: 'linear-gradient(135deg, #dcfce7, #f0fdf4)', borderColor: '#86efac' }}>
                      <div className="text-4xl">🏆</div>
                      <div>
                        <p className="text-sm font-black text-emerald-700">100% Trust &</p>
                        <p className="text-sm font-black text-emerald-700">Safety Guaranteed</p>
                      </div>
                    </div>
                  </div>

                  {/* ── Our Work: Before/After ── */}
                  <div className="rounded-3xl border p-6 overflow-hidden"
                    style={{
                      backgroundColor: localDark ? '#1a2540' : '#fff',
                      borderColor: localDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
                      borderRadius: '24px',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                    }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-black" style={{ color: textPrimary }}>Our Work</h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${pc}15`, color: pc }}>Before / After</span>
                    </div>

                    {(c.portfolio || []).slice(0, 2).map((item: any) => (
                      <div key={item.id} className="mb-4 rounded-2xl overflow-hidden border"
                        style={{ borderColor: localDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                        <div className="flex h-24">
                          <div className="flex-1 relative overflow-hidden border-r"
                            style={{
                              borderColor: localDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                              background: `${pc}08`,
                            }}>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-3xl">{item.icon}</span>
                              <span className="mt-1 text-[8px] font-black px-2 py-0.5 rounded-full bg-red-500/20 text-red-500">BEFORE</span>
                            </div>
                          </div>
                          <div className="flex-1 relative overflow-hidden" style={{ background: `${pc}08` }}>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-3xl">{item.icon}</span>
                              <span className="mt-1 text-[8px] font-black px-2 py-0.5 rounded-full border" style={{ borderColor: pc, color: pc }}>AFTER ✓</span>
                            </div>
                          </div>
                        </div>
                        <div className="px-3 py-2">
                          <p className="text-xs font-black truncate" style={{ color: textPrimary }}>{item.title}</p>
                        </div>
                      </div>
                    ))}

                    {(c.portfolio || []).length === 0 && (
                      <div className="h-40 rounded-2xl flex items-center justify-center overflow-hidden relative">
                        <img
                          src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80"
                          alt="Our work"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                          <span className="text-white text-xs font-black">View Portfolio</span>
                        </div>
                      </div>
                    )}

                    <button onClick={() => { setActivePageSlug('gallery'); setViewMode('website'); }}
                      className="text-xs font-bold mt-3 block" style={{ color: pc }}>
                      View More Projects →
                    </button>
                  </div>
                </div>
              </section>
            );

          /* ══════════════════════════════════════════════════
             TEAM — Professional photo cards with carousel
          ══════════════════════════════════════════════════ */
          case 'team':
            const visibleWorkers = myWorkers.filter((w: any) => w.showOnWebsite !== false);
            if (visibleWorkers.length === 0) return null;
            const totalTechPages = Math.ceil(visibleWorkers.length / TECHS_PER_PAGE);
            const shownWorkers = visibleWorkers.slice(techPage * TECHS_PER_PAGE, techPage * TECHS_PER_PAGE + TECHS_PER_PAGE);
            return (
              <section key={comp.id} id="team" className="py-20 px-4 sm:px-6" style={{ backgroundColor: bg0 }}>
                <div className="max-w-7xl mx-auto">
                  <div className="text-center mb-12">
                    <SectionLabel text="Our Professionals" color={pc} />
                    <SectionTitle color={textPrimary}>Meet Our Expert Technicians</SectionTitle>
                  </div>

                  <div className="relative">
                    {totalTechPages > 1 && (
                      <button
                        onClick={() => setTechPage(p => Math.max(0, p - 1))}
                        disabled={techPage === 0}
                        className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full shadow-xl flex items-center justify-center border transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110"
                        style={{ backgroundColor: localDark ? '#1e293b' : '#fff', borderColor: localDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                      >
                        <ChevronLeft className="w-4 h-4" style={{ color: textPrimary }} />
                      </button>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                      {shownWorkers.map((w: any) => {
                        const photoUrl = w.photo || TECH_PHOTOS[Math.floor(Math.random() * TECH_PHOTOS.length)];
                        return (
                          <div
                            key={w.id}
                            className="group rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                            style={{
                              backgroundColor: localDark ? '#1e293b' : '#fff',
                              border: `1px solid ${localDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
                              borderRadius: '24px',
                              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                            }}
                          >
                            {/* Photo */}
                            <div className="relative h-48 overflow-hidden">
                              <img
                                src={photoUrl}
                                alt={w.name}
                                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                              {/* Verified badge overlay */}
                              <div className="absolute bottom-3 left-3 right-3 flex gap-1">
                                {w.aadhaarStatus === 'verified' && (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/90 text-white">✓ Aadhaar</span>
                                )}
                                {w.policeVerified && (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-500/90 text-white">🛡️ Verified</span>
                                )}
                              </div>
                            </div>

                            {/* Info */}
                            <div className="p-4 text-center">
                              <h4 className="font-black text-sm" style={{ color: textPrimary }}>{w.name}</h4>
                              <p className="text-[11px] font-bold mt-0.5" style={{ color: pc }}>
                                {w.designation || w.skills?.[0] || 'Technician'}
                              </p>
                              <div className="flex items-center justify-center gap-1 mt-2">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="text-xs font-black text-amber-500">{w.rating || 4.9}</span>
                                <span className="text-[10px]" style={{ color: textMuted }}>
                                  ({w.completedJobs || Math.floor(Math.random() * 400 + 300)} Jobs)
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {totalTechPages > 1 && (
                      <button
                        onClick={() => setTechPage(p => Math.min(totalTechPages - 1, p + 1))}
                        disabled={techPage >= totalTechPages - 1}
                        className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full shadow-xl flex items-center justify-center border transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110"
                        style={{ backgroundColor: localDark ? '#1e293b' : '#fff', borderColor: localDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                      >
                        <ChevronRight className="w-4 h-4" style={{ color: textPrimary }} />
                      </button>
                    )}
                  </div>

                  <div className="text-center mt-10">
                    <button className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border-2 font-bold text-sm transition-all hover:scale-[1.02]"
                      style={{ borderColor: pc, color: pc, borderRadius: 'var(--border-radius)', background: `${pc}08` }}>
                      View All Technicians <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </section>
            );

          /* ══════════════════════════════════════════════════
             TESTIMONIALS — Premium review cards with photos
          ══════════════════════════════════════════════════ */
          case 'testimonials':
            if (!c.testimonials || c.testimonials.length === 0) return null;
            const totalTestPages = Math.ceil(c.testimonials.length / TEST_PER_PAGE);
            const shownTestimonials = c.testimonials.slice(testimonialPage * TEST_PER_PAGE, testimonialPage * TEST_PER_PAGE + TEST_PER_PAGE);
            return (
              <section key={comp.id} id="reviews" className="py-20 px-4 sm:px-6 relative overflow-hidden" style={{ backgroundColor: bg1 }}>
                <div className="max-w-7xl mx-auto">
                  <div className="text-center mb-12">
                    <SectionLabel text="Customer Reviews" color={pc} />
                    <SectionTitle color={textPrimary}>What Our Customers Say</SectionTitle>
                  </div>

                  <div className="relative">
                    {totalTestPages > 1 && (
                      <button onClick={() => setTestimonialPage(p => Math.max(0, p - 1))} disabled={testimonialPage === 0}
                        className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full shadow-xl flex items-center justify-center border transition-all disabled:opacity-30"
                        style={{ backgroundColor: localDark ? '#1e293b' : '#fff', borderColor: localDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                        <ChevronLeft className="w-4 h-4" style={{ color: textPrimary }} />
                      </button>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {shownTestimonials.map((r: any) => (
                        <div key={r.id}
                          className="rounded-3xl p-6 flex flex-col gap-4 transition-all hover:-translate-y-1 hover:shadow-xl"
                          style={{
                            backgroundColor: localDark ? '#1e293b' : '#fff',
                            border: `1px solid ${localDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
                            borderRadius: '24px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                          }}>

                          {/* Stars */}
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                            ))}
                          </div>

                          {/* Quote */}
                          <p className="text-sm leading-relaxed flex-1 italic" style={{ color: textPrimary }}>"{r.text}"</p>

                          {/* Author */}
                          <div className="flex items-center justify-between pt-3 border-t"
                            style={{ borderColor: localDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-black text-sm text-white flex-shrink-0"
                                style={{ background: `linear-gradient(135deg, ${pc}, ${pc}bb)` }}
                              >
                                {r.author.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-black" style={{ color: textPrimary }}>{r.author}</p>
                                <p className="text-[10px]" style={{ color: textMuted }}>{r.role}</p>
                              </div>
                            </div>
                            {r.verified && (
                              <span className="text-[9px] font-black text-emerald-500 flex items-center gap-0.5">
                                <CheckCircle className="w-3 h-3" /> Verified
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {totalTestPages > 1 && (
                      <button onClick={() => setTestimonialPage(p => Math.min(totalTestPages - 1, p + 1))} disabled={testimonialPage >= totalTestPages - 1}
                        className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full shadow-xl flex items-center justify-center border transition-all disabled:opacity-30"
                        style={{ backgroundColor: localDark ? '#1e293b' : '#fff', borderColor: localDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                        <ChevronRight className="w-4 h-4" style={{ color: textPrimary }} />
                      </button>
                    )}
                  </div>
                </div>
              </section>
            );

          /* ══════════════════════════════════════════════════
             TRUST BAR — 5-icon assurance strip
          ══════════════════════════════════════════════════ */
          case 'trust_bar':
            return (
              <section key={comp.id} className="py-8 px-4 border-y"
                style={{ backgroundColor: localDark ? '#0d1526' : '#fff', borderColor: localDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-5 gap-6 text-center">
                  {[
                    { icon: '🔒', title: 'Secure Payments', sub: '100% Safe & Secure' },
                    { icon: '🔄', title: 'Free Cancellation', sub: 'Up to 3 Hours Before' },
                    { icon: '✅', title: 'Verified Professionals', sub: 'You Can Trust' },
                    { icon: '⏰', title: 'On-Time Guarantee', sub: 'Or It\'s Free' },
                    { icon: '🎧', title: '24/7 Support', sub: 'Always Here to Help' },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 group">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all group-hover:scale-110"
                        style={{ background: `${pc}12`, boxShadow: `0 4px 16px ${pc}15` }}>
                        {item.icon}
                      </div>
                      <p className="text-xs font-black" style={{ color: textPrimary }}>{item.title}</p>
                      <p className="text-[10px]" style={{ color: textMuted }}>{item.sub}</p>
                    </div>
                  ))}
                </div>
              </section>
            );

          /* ══════════════════════════════════════════════════
             FAQ — Search + clean accordion
          ══════════════════════════════════════════════════ */
          case 'faq':
            if (!c.faqs?.length) return null;
            return (
              <section key={comp.id} id="faqs" className="py-20 px-4 sm:px-6" style={{ backgroundColor: bg2 }}>
                <div className="max-w-3xl mx-auto">
                  <div className="text-center mb-12">
                    <SectionLabel text="FAQ" color={pc} />
                    <SectionTitle color={textPrimary}>Frequently Asked Questions</SectionTitle>
                  </div>
                  <div className="relative mb-6">
                    <input
                      type="text"
                      placeholder="Search FAQs..."
                      value={faqSearch}
                      onChange={e => setFaqSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl border text-sm outline-none font-medium"
                      style={{
                        backgroundColor: localDark ? '#1e293b' : '#fff',
                        borderColor: localDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                        color: textPrimary,
                        borderRadius: '16px',
                      }}
                    />
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  <div className="space-y-3">
                    {c.faqs
                      .filter((f: any) => !faqSearch || f.question.toLowerCase().includes(faqSearch.toLowerCase()) || f.answer.toLowerCase().includes(faqSearch.toLowerCase()))
                      .map((f: any) => (
                        <div key={f.id}
                          className="rounded-2xl border overflow-hidden transition-all"
                          style={{
                            backgroundColor: localDark ? '#1e293b' : '#fff',
                            borderColor: openFaqId === f.id ? pc + '40' : (localDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'),
                            borderRadius: '16px',
                            boxShadow: openFaqId === f.id ? `0 4px 20px ${pc}15` : '0 2px 8px rgba(0,0,0,0.04)',
                          }}>
                          <button
                            className="w-full flex items-center justify-between p-5 text-left font-bold gap-4"
                            onClick={() => setOpenFaqId(openFaqId === f.id ? null : f.id)}
                          >
                            <span className="text-sm" style={{ color: textPrimary }}>{f.question}</span>
                            <span
                              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white transition-all duration-300"
                              style={{
                                background: `linear-gradient(135deg, ${pc}, ${pc}cc)`,
                                transform: openFaqId === f.id ? 'rotate(180deg)' : 'rotate(0deg)',
                              }}
                            >▾</span>
                          </button>
                          {openFaqId === f.id && (
                            <div className="px-5 pb-5 text-sm leading-relaxed border-t"
                              style={{ color: textMuted, borderColor: localDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                              <div className="pt-3">{f.answer}</div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </section>
            );

          /* ══════════════════════════════════════════════════
             GALLERY — Before/After grid with filter
          ══════════════════════════════════════════════════ */
          case 'gallery':
            return (
              <section key={comp.id} id="gallery" className="py-20 px-4 sm:px-6" style={{ backgroundColor: bg0 }}>
                <div className="max-w-7xl mx-auto">
                  <div className="text-center mb-12">
                    <SectionLabel text="Our Work" color={pc} />
                    <SectionTitle color={textPrimary}>Before & After Transformations</SectionTitle>
                    <p className="text-sm mt-3 text-slate-400 max-w-md mx-auto">Browse real results from recent works, completed projects, and video walkthroughs.</p>
                  </div>
                  {(() => {
                    const portfolio = c.portfolio || [];
                    const cats = ['All', ...Array.from(new Set(portfolio.map((p: any) => p.category))) as string[]];
                    const filtered = portfolioFilter === 'All' ? portfolio : portfolio.filter((p: any) => p.category === portfolioFilter);
                    return (
                      <>
                        <div className="flex flex-wrap gap-2 justify-center mb-8">
                          {cats.map((cat: any) => (
                            <button key={cat} onClick={() => setPortfolioFilter(cat)}
                              className="px-5 py-2 rounded-full text-xs font-bold transition-all"
                              style={portfolioFilter === cat
                                ? { background: `linear-gradient(135deg, ${pc}, ${pc}cc)`, color: getTextColorForBg(pc), boxShadow: `0 4px 16px ${pc}40` }
                                : { background: localDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', color: textMuted }
                              }>{cat}</button>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filtered.map((item: any) => {
                            // Extract video ID from youtube URL if it exists
                            const getYoutubeEmbedUrl = (url?: string) => {
                              if (!url) return null;
                              const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                              const match = url.match(regExp);
                              return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
                            };
                            const embedUrl = getYoutubeEmbedUrl(item.youtubeUrl);

                            return (
                              <div key={item.id}
                                className="rounded-3xl overflow-hidden group transition-all duration-350 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col"
                                style={{
                                  backgroundColor: localDark ? '#1e293b' : '#fff',
                                  border: `1px solid ${localDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
                                  borderRadius: '24px',
                                }}>
                                
                                {embedUrl ? (
                                  /* 📺 YouTube Video Embed Player Component */
                                  <div className="relative aspect-video w-full overflow-hidden bg-black shrink-0">
                                    <iframe 
                                      className="w-full h-full border-0"
                                      src={embedUrl}
                                      title={item.title}
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  </div>
                                ) : item.instagramUrl ? (
                                  /* 📸 Instagram Video Overlay Card Trigger */
                                  <a 
                                    href={item.instagramUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="relative aspect-video w-full overflow-hidden bg-slate-950 shrink-0 flex items-center justify-center group"
                                  >
                                    <div className="absolute inset-0 bg-cover bg-center opacity-70 group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&q=80')` }} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
                                    
                                    <div className="relative z-10 flex flex-col items-center gap-1.5 text-center">
                                      <div className="w-12 h-12 rounded-full bg-pink-600 flex items-center justify-center text-white shadow-lg animate-pulse">
                                        📸
                                      </div>
                                      <p className="text-[10px] font-black text-white tracking-widest uppercase">Watch Video on Instagram</p>
                                    </div>
                                  </a>
                                ) : (
                                  /* 🖼️ Standard Before/After Transformation slider Card */
                                  <div className="flex h-44 shrink-0">
                                    <div className="flex-1 flex flex-col items-center justify-center border-r border-dashed" style={{ background: `${pc}08`, borderColor: localDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                                      <span className="text-5xl">{item.icon}</span>
                                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 mt-1">BEFORE</span>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center justify-center" style={{ background: `${pc}08` }}>
                                      <span className="text-5xl">{item.icon}</span>
                                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full border mt-1" style={{ borderColor: pc, color: pc }}>AFTER ✓</span>
                                    </div>
                                  </div>
                                )}

                                <div className="p-5 flex-1 flex flex-col justify-between space-y-2">
                                  <div>
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full" style={{ background: `${pc}15`, color: pc }}>
                                      {item.category}
                                    </span>
                                    <h4 className="font-black text-sm mt-2 leading-tight" style={{ color: textPrimary }}>{item.title}</h4>
                                    <p className="text-[10px] text-slate-400 mt-1">{item.description}</p>
                                  </div>
                                  <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: localDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                                    <p className="text-[10px] font-bold" style={{ color: textMuted }}>By {item.workerName}</p>
                                    <div className="flex gap-0.5">
                                      {[...Array(item.rating)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </section>
            );

          /* ══════════════════════════════════════════════════
             FOUNDER — About / Story
          ══════════════════════════════════════════════════ */
          case 'founder':
            return (
              <section key={comp.id} id="about" className="py-20 px-4 sm:px-6" style={{ backgroundColor: bg1 }}>
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <SectionLabel text="Our Story" color={pc} />
                    <h2 className="text-3xl sm:text-4xl font-black leading-tight" style={{ color: textPrimary }}>
                      {c.founderName || 'Founded With a Mission'}
                    </h2>
                    <p className="text-base leading-relaxed" style={{ color: textMuted }}>{c.founderStory || c.aboutText}</p>
                    {c.trustBadges?.gstVerified && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black"
                        style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                        <Shield className="w-4 h-4" /> GST & Business Identity Verified
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: textMuted }}>Core Milestones</p>
                    {(c.milestones || []).map((m: any, idx: number) => (
                      <div key={idx} className="flex gap-4 p-5 rounded-2xl border transition-all hover:shadow-md"
                        style={{ backgroundColor: localDark ? '#1e293b' : '#fff', borderColor: localDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)', borderRadius: '16px' }}>
                        <span className="text-3xl">{m.icon}</span>
                        <div>
                          <p className="text-xs font-black" style={{ color: pc }}>{m.year}</p>
                          <p className="text-sm font-bold mt-0.5" style={{ color: textPrimary }}>{m.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );

          /* ══════════════════════════════════════════════════
             AWARDS
          ══════════════════════════════════════════════════ */
          case 'awards':
            if (!c.awards?.length) return null;
            return (
              <section key={comp.id} className="py-20 px-4 sm:px-6" style={{ backgroundColor: bg0 }}>
                <div className="max-w-7xl mx-auto">
                  <div className="text-center mb-12">
                    <SectionLabel text="Recognition" color={pc} />
                    <SectionTitle color={textPrimary}>Awards & Certifications</SectionTitle>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {c.awards.map((aw: any) => (
                      <div key={aw.id}
                        className="p-6 rounded-3xl border text-center transition-all hover:-translate-y-1 hover:shadow-xl"
                        style={{ backgroundColor: localDark ? '#1e293b' : '#fff', borderColor: localDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)', borderRadius: '24px' }}>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
                          style={{ background: `linear-gradient(135deg, ${pc}20, ${pc}08)`, border: `2px solid ${pc}30` }}>{aw.icon}</div>
                        <h4 className="font-black text-sm" style={{ color: textPrimary }}>{aw.title}</h4>
                        <p className="text-xs font-bold mt-0.5" style={{ color: pc }}>{aw.year} · {aw.source}</p>
                        <p className="text-xs mt-2" style={{ color: textMuted }}>{aw.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );

          /* ══════════════════════════════════════════════════
             MAP / CONTACT — Service Areas & Coverage
          ══════════════════════════════════════════════════ */
          case 'map': {
            const nearbyList = (c.localSeoConfig?.nearbyCities && c.localSeoConfig.nearbyCities.length > 0)
              ? c.localSeoConfig.nearbyCities
              : [c.city].filter(Boolean);

            return (
              <section key={comp.id} id="coverage" className="py-16 px-4 sm:px-6" style={{ backgroundColor: bg1 }}>
                <div className="max-w-7xl mx-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                    {/* Left Column: Information & Contact */}
                    <div className="space-y-4 text-left">
                      <div className="text-xs font-black uppercase tracking-widest" style={{ color: pc }}>
                        — Service Areas —
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black leading-tight" style={{ color: textPrimary }}>
                        Serving {c.city || 'Nellore, AP'} & Surrounding Areas
                      </h2>
                      <p className="text-xs sm:text-sm leading-relaxed" style={{ color: textMuted }}>
                        Our local certified service units are distributed throughout {c.city ? c.city.split(',')[0] : 'Nellore'} ensuring rapid on-time arrival within 30 minutes.
                      </p>

                      {/* City badge pills */}
                      <div className="flex flex-wrap gap-2 pt-1 pb-2">
                        {nearbyList.map((cityItem: string) => (
                          <span
                            key={cityItem}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors"
                            style={{
                              backgroundColor: `${pc}12`,
                              borderColor: `${pc}30`,
                              color: pc,
                            }}
                          >
                            📍 {cityItem}
                          </span>
                        ))}
                      </div>

                      {/* Contact details */}
                      <div className="space-y-2 text-xs pt-1">
                        {c.phone && (
                          <div className="flex items-center gap-2 font-medium" style={{ color: textPrimary }}>
                            <span>📞</span> <strong>Phone:</strong> <a href={`tel:${c.phone}`} className="hover:underline">{c.phone}</a>
                          </div>
                        )}
                        {c.whatsAppNumber && (
                          <div className="flex items-center gap-2 font-medium" style={{ color: textPrimary }}>
                            <span>💬</span> <strong>WhatsApp:</strong> <a href={`https://wa.me/${c.whatsAppNumber}`} target="_blank" rel="noreferrer" className="hover:underline">+{c.whatsAppNumber}</a>
                          </div>
                        )}
                        <div className="flex items-center gap-2 font-medium" style={{ color: textPrimary }}>
                          <span>⏰</span> <strong>Hours:</strong> {c.businessHours || '08:00 AM – 08:00 PM'}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Interactive Coverage Map Card */}
                    <div 
                      className="h-64 sm:h-72 rounded-3xl border flex flex-col items-center justify-center gap-2 text-center p-6 shadow-sm transition-all"
                      style={{
                        backgroundColor: localDark ? '#1e293b' : '#f1f5fd',
                        borderColor: localDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                      }}
                    >
                      <span className="text-4xl">🗺️</span>
                      <span className="font-extrabold text-sm sm:text-base" style={{ color: textPrimary }}>
                        Interactive Coverage Map
                      </span>
                      <span className="text-xs max-w-xs" style={{ color: textMuted }}>
                        {c.address || 'Main Bazar Road, City Center'}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          /* ══════════════════════════════════════════════════
             VIDEO — YouTube embed
          ══════════════════════════════════════════════════ */
          case 'video':
            if (!c.videoYouTubeUrl) return null;
            return (
              <section key={comp.id} className="py-20 px-4 sm:px-6" style={{ backgroundColor: bg1 }}>
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-black" style={{ color: textPrimary }}>{c.videoTitle || 'Featured Video'}</h2>
                    <p className="text-sm mt-2" style={{ color: textMuted }}>{c.videoDescription}</p>
                  </div>
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl" style={{ paddingBottom: '56.25%', borderRadius: '24px' }}>
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${c.videoYouTubeUrl.replace(/.*(?:youtu.be\/|v\/|embed\/|watch\?v=)/, '').split(/[?&]/)[0]}`}
                      allowFullScreen
                    />
                  </div>
                </div>
              </section>
            );

          /* ══════════════════════════════════════════════════
             CUSTOM HIGHLIGHT / GUARANTEE SECTION
          ══════════════════════════════════════════════════ */
          case 'custom':
            return (
              <section key={comp.id} id={comp.id || 'custom'} className="py-16 px-4 sm:px-6 relative overflow-hidden" style={{ backgroundColor: bg1 }}>
                <div className="max-w-4xl mx-auto p-8 sm:p-12 rounded-3xl border text-center space-y-4 shadow-xl"
                  style={{
                    backgroundColor: localDark ? '#111927' : '#ffffff',
                    borderColor: localDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    borderRadius: '24px'
                  }}
                >
                  <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-md"
                    style={{ background: `${pc}18`, color: pc }}
                  >
                    {comp.icon || (comp.settings as any)?.icon || '✨'}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black" style={{ color: textPrimary }}>
                    {comp.title || (comp.settings as any)?.title || 'Special Guarantee'}
                  </h2>
                  <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed" style={{ color: textMuted }}>
                    {comp.desc || (comp.settings as any)?.desc || 'Learn more about our verified guarantees, pricing, and on-time service commitments.'}
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={scrollToServices}
                      className="px-6 py-3 rounded-xl font-bold text-xs shadow-md transition-all hover:scale-105"
                      style={{ background: pc, color: getTextColorForBg(pc) }}
                    >
                      Book Service Now →
                    </button>
                  </div>
                </div>
              </section>
            );

          default:
            return null;
        }
      })}
    </>
  );
}
