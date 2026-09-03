import type { Tenant, Service, Worker, Booking, Lead, Coupon, Quotation, Campaign, IndustryPack, ThemeConfig, SupportTicket, CMSPage, MediaAsset, FooterWidget } from './types';

// ============================================================
// THEME SYSTEM — 6 premium themes
// ============================================================
export const THEME_CONFIGS: Record<string, ThemeConfig> = {
  modern: { key: 'modern', label: 'Modern Dark', bg: '#070d1a', cardBg: '#0d1526', textColor: '#e2e8f0', mutedColor: '#64748b', borderColor: '#1e293b', headingFont: 'Inter, sans-serif', borderRadius: '14px', isDark: true, themeMode: 'dark', themeFont: 'Inter, sans-serif', themeRadius: 'modern', themeButtonStyle: 'soft' },
  luxury: { key: 'luxury', label: 'Luxury Gold', bg: '#f9f0e0', cardBg: '#fffdf7', textColor: '#1a0e00', mutedColor: '#78550a', borderColor: '#d4a853', headingFont: 'Georgia, "Times New Roman", serif', borderRadius: '4px', isDark: false, themeMode: 'light', themeFont: 'Georgia, serif', themeRadius: 'square', themeButtonStyle: 'outline' },
  professional: { key: 'professional', label: 'Corporate Blue', bg: '#f8fafc', cardBg: '#ffffff', textColor: '#0f172a', mutedColor: '#475569', borderColor: '#e2e8f0', headingFont: 'Inter, sans-serif', borderRadius: '8px', isDark: false, themeMode: 'light', themeFont: 'Inter, sans-serif', themeRadius: 'rounded', themeButtonStyle: 'filled' },
  minimal: { key: 'minimal', label: 'Fresh Minimal', bg: '#f0fdf4', cardBg: '#ffffff', textColor: '#1e293b', mutedColor: '#64748b', borderColor: '#d1fae5', headingFont: 'Inter, sans-serif', borderRadius: '4px', isDark: false, themeMode: 'light', themeFont: 'Inter, sans-serif', themeRadius: 'rounded', themeButtonStyle: 'soft' },
  local: { key: 'local', label: 'Warm Local', bg: '#fff8f1', cardBg: '#ffffff', textColor: '#431407', mutedColor: '#9a3412', borderColor: '#fed7aa', headingFont: 'Inter, sans-serif', borderRadius: '20px', isDark: false, themeMode: 'light', themeFont: 'Inter, sans-serif', themeRadius: 'modern', themeButtonStyle: 'filled' },
  medical: { key: 'medical', label: 'Medical Clean', bg: '#f0fdfa', cardBg: '#ffffff', textColor: '#0f172a', mutedColor: '#0d9488', borderColor: '#ccfbf1', headingFont: 'Inter, sans-serif', borderRadius: '10px', isDark: false, themeMode: 'light', themeFont: 'Inter, sans-serif', themeRadius: 'modern', themeButtonStyle: 'filled' },
};

// ============================================================
// INDUSTRY PACKS — 20 industries
// ============================================================
export const INDUSTRY_PACKS: IndustryPack[] = [
  { id: 'electrician', name: 'Electrician', icon: '⚡', description: 'Wiring, repairs, installations, panel upgrades', color: '#2563eb', theme: 'modern', defaultServices: [{ name: 'Short Circuit Repair', icon: '⚡', price: 350, duration: 45, category: 'Troubleshooting', desc: 'Diagnose and fix short circuits, sparking switches.' }, { name: 'Full House Wiring', icon: '🏠', price: 5000, duration: 240, category: 'Installation', desc: 'Complete ISI-grade wiring with conduit pipes.' }, { name: 'Fan Installation', icon: '🌀', price: 299, duration: 30, category: 'Installation', desc: 'Install any ceiling fan brand with balancing.' }, { name: 'Inverter Setup', icon: '🔋', price: 800, duration: 90, category: 'Installation', desc: 'Full inverter and battery installation with bypass.' }, { name: 'DB Board Upgrade', icon: '🔌', price: 1200, duration: 120, category: 'Upgrade', desc: 'Upgrade MCB/RCCB distribution board.' }], workerSkills: ['Wiring', 'Troubleshooting', 'Installation', 'Safety Compliance', 'Inverter'], crmStages: ['New Enquiry', 'Site Visit Scheduled', 'Quotation Sent', 'Work Started', 'Completed', 'Reviewed'] },
  { id: 'plumber', name: 'Plumber', icon: '🔧', description: 'Pipe repairs, tank cleaning, leakage fixing', color: '#0891b2', theme: 'professional', defaultServices: [{ name: 'Pipe Leak Repair', icon: '💧', price: 299, duration: 45, category: 'Repair', desc: 'Fix all pipe leaks with quality fittings.' }, { name: 'Tank Cleaning', icon: '🪣', price: 499, duration: 90, category: 'Cleaning', desc: 'Complete water tank cleaning and sanitization.' }, { name: 'Tap & Mixer Repair', icon: '🚿', price: 199, duration: 30, category: 'Repair', desc: 'Fix dripping taps and broken mixers.' }, { name: 'Drain Unblocking', icon: '🌀', price: 399, duration: 60, category: 'Repair', desc: 'Unblock kitchen, bathroom, and outdoor drains.' }], workerSkills: ['Pipe Fitting', 'Leak Detection', 'Drainage', 'Sanitary'], crmStages: ['New', 'Scheduled', 'In Progress', 'Done'] },
  { id: 'ac_service', name: 'AC Service', icon: '❄️', description: 'AC servicing, repair, gas refill, installation', color: '#06b6d4', theme: 'medical', defaultServices: [{ name: 'AC Service & Clean', icon: '❄️', price: 499, duration: 60, category: 'Service', desc: 'Filter cleaning, coil wash, performance check.' }, { name: 'Gas Refilling', icon: '🧊', price: 1200, duration: 90, category: 'Repair', desc: 'R22/R32/R410A gas refill with leak check.' }, { name: 'AC Installation', icon: '🔧', price: 1500, duration: 120, category: 'Installation', desc: 'New AC split unit installation with piping.' }, { name: 'Compressor Repair', icon: '⚙️', price: 2500, duration: 180, category: 'Repair', desc: 'Diagnose and fix compressor faults.' }], workerSkills: ['AC Servicing', 'Gas Refilling', 'Installation', 'Refrigeration'], crmStages: ['New', 'Diagnosed', 'Repaired', 'Verified'] },
  { id: 'painting', name: 'Painter', icon: '🎨', description: 'Interior, exterior, texture painting', color: '#b45309', theme: 'luxury', defaultServices: [{ name: 'Interior Painting', icon: '🎨', price: 8000, duration: 180, category: 'Interior', desc: '2 coats premium emulsion with putty.' }, { name: 'Exterior Coat', icon: '🏗️', price: 15000, duration: 480, category: 'Exterior', desc: 'Waterproof exterior paint with primer.' }, { name: 'Texture Design', icon: '✨', price: 12000, duration: 300, category: 'Specialty', desc: 'Designer wall textures — sand, marble, rustic.' }, { name: 'Wood Polish', icon: '🪵', price: 3000, duration: 120, category: 'Specialty', desc: 'PU polish for doors, windows, furniture.' }], workerSkills: ['Roller Paint', 'Texture', 'Putty', 'Exterior', 'Wood Polish'], crmStages: ['Enquiry', 'Site Visit', 'Quotation', 'Started', 'Completed'] },
  { id: 'cleaning', name: 'Cleaning', icon: '🧹', description: 'Deep cleaning, sanitization, sofa cleaning', color: '#059669', theme: 'minimal', defaultServices: [{ name: 'Bathroom Deep Clean', icon: '🚿', price: 499, duration: 60, category: 'Sanitization', desc: 'Full tile scrubbing, descaling, sanitization.' }, { name: 'Full Home Clean', icon: '🏠', price: 1999, duration: 240, category: 'Deep Cleaning', desc: 'End-to-end cleaning of all rooms.' }, { name: 'Sofa Cleaning', icon: '🛋️', price: 799, duration: 90, category: 'Upholstery', desc: 'Steam cleaning for sofas and chairs.' }, { name: 'Kitchen Deep Clean', icon: '🍳', price: 699, duration: 90, category: 'Deep Cleaning', desc: 'Chimney, tiles, racks, appliances.' }], workerSkills: ['Deep Cleaning', 'Sanitization', 'Steam Clean', 'Chemicals'], crmStages: ['New', 'Scheduled', 'Ongoing', 'Done'] },
  { id: 'pest_control', name: 'Pest Control', icon: '🐛', description: 'Cockroach, termite, mosquito, rodent control', color: '#7c3aed', theme: 'professional', defaultServices: [{ name: 'Cockroach Control', icon: '🪳', price: 599, duration: 60, category: 'Insect', desc: 'Gel treatment for kitchens and bathrooms.' }, { name: 'Termite Control', icon: '🐛', price: 1500, duration: 120, category: 'Wood Pest', desc: 'Anti-termite chemical barrier treatment.' }, { name: 'Mosquito Control', icon: '🦟', price: 699, duration: 60, category: 'Flying Pest', desc: 'Fogging and larvicide treatment.' }, { name: 'Rodent Control', icon: '🐭', price: 999, duration: 90, category: 'Rodent', desc: 'Bait stations and seal all entry points.' }], workerSkills: ['Chemical Treatment', 'Pest Identification', 'Safety'], crmStages: ['New', 'Scheduled', 'Treated', 'Follow-up'] },
  { id: 'car_wash', name: 'Car Wash', icon: '🚗', description: 'Interior, exterior, detailing car wash services', color: '#0f766e', theme: 'minimal', defaultServices: [{ name: 'Basic Wash', icon: '🚗', price: 199, duration: 30, category: 'Wash', desc: 'Exterior hand wash with microfiber.' }, { name: 'Full Detailing', icon: '✨', price: 999, duration: 120, category: 'Detailing', desc: 'Interior + exterior full detailing.' }, { name: 'Ceramic Coating', icon: '💎', price: 3000, duration: 180, category: 'Protection', desc: '9H ceramic coating with 2-year warranty.' }], workerSkills: ['Washing', 'Detailing', 'Polishing'], crmStages: ['Booked', 'In Progress', 'Ready', 'Delivered'] },
  { id: 'appliance_repair', name: 'Appliance Repair', icon: '📺', description: 'TV, fridge, washing machine, microwave repair', color: '#dc2626', theme: 'professional', defaultServices: [{ name: 'TV Repair', icon: '📺', price: 499, duration: 60, category: 'Electronics', desc: 'LED/LCD panel, board, remote issues.' }, { name: 'Washing Machine Repair', icon: '🫧', price: 599, duration: 75, category: 'Appliance', desc: 'Motor, drum, pump, PCB repairs.' }, { name: 'Refrigerator Repair', icon: '❄️', price: 799, duration: 90, category: 'Appliance', desc: 'Compressor, thermostat, cooling issues.' }, { name: 'Microwave Repair', icon: '📡', price: 399, duration: 45, category: 'Electronics', desc: 'Magnetron, turntable, control board.' }], workerSkills: ['Electronics', 'Appliance Repair', 'Circuit Repair'], crmStages: ['Received', 'Diagnosed', 'Repaired', 'Delivered'] },
  { id: 'ro_purifier', name: 'RO Purifier', icon: '💧', description: 'TDS balancing, filter change, membrane service', color: '#0ea5e9', theme: 'medical', defaultServices: [{ name: 'Annual Service', icon: '🔧', price: 499, duration: 60, category: 'Service', desc: 'Filter replacement, membrane check, TDS test.' }, { name: 'Filter Change', icon: '💧', price: 299, duration: 30, category: 'Maintenance', desc: 'Sediment and carbon filter replacement.' }, { name: 'New Installation', icon: '🏗️', price: 999, duration: 90, category: 'Installation', desc: 'Full RO unit installation with testing.' }], workerSkills: ['Water Purification', 'Filter Change', 'Installation'], crmStages: ['Booked', 'Serviced', 'Done'] },
  { id: 'carpenter', name: 'Carpenter', icon: '🪚', description: 'Furniture repair, doors, wardrobes, woodwork', color: '#78350f', theme: 'local', defaultServices: [{ name: 'Furniture Repair', icon: '🪑', price: 399, duration: 60, category: 'Repair', desc: 'Fix broken chairs, tables, hinges.' }, { name: 'Door Fitting', icon: '🚪', price: 799, duration: 90, category: 'Installation', desc: 'New door frame fitting and alignment.' }, { name: 'Wardrobe Making', icon: '🗄️', price: 8000, duration: 480, category: 'Custom', desc: 'Custom sliding wardrobe with laminates.' }], workerSkills: ['Woodwork', 'Furniture', 'Polishing'], crmStages: ['Enquiry', 'Design', 'Making', 'Installed'] },
  { id: 'cctv', name: 'CCTV Setup', icon: '📷', description: 'IP cameras, DVR/NVR, cloud storage setup', color: '#6366f1', theme: 'modern', defaultServices: [{ name: 'CCTV Installation', icon: '📷', price: 2500, duration: 120, category: 'Installation', desc: '4-camera HD setup with DVR and remote access.' }, { name: 'Cloud Storage Setup', icon: '☁️', price: 999, duration: 60, category: 'Configuration', desc: 'Connect cameras to cloud backup.' }, { name: 'Maintenance Visit', icon: '🔧', price: 499, duration: 45, category: 'Maintenance', desc: 'Lens cleaning, cable check, software update.' }], workerSkills: ['CCTV', 'Networking', 'Installation'], crmStages: ['Survey', 'Quotation', 'Installation', 'Testing'] },
  { id: 'solar', name: 'Solar', icon: '☀️', description: 'Solar panel installation, AMC, net metering', color: '#ea580c', theme: 'local', defaultServices: [{ name: 'Solar Panel Install', icon: '☀️', price: 45000, duration: 480, category: 'Installation', desc: '3kW rooftop solar with inverter and batteries.' }, { name: 'AMC Service', icon: '🔧', price: 1500, duration: 120, category: 'Maintenance', desc: 'Annual maintenance and panel cleaning.' }], workerSkills: ['Solar', 'Electrical', 'Wiring'], crmStages: ['Site Survey', 'Design', 'Install', 'Handover'] },
  { id: 'interior', name: 'Interior Design', icon: '🛋️', description: 'Modular kitchen, false ceiling, wardrobe design', color: '#9333ea', theme: 'luxury', defaultServices: [{ name: 'Modular Kitchen', icon: '🍳', price: 80000, duration: 2880, category: 'Kitchen', desc: 'Full modular kitchen with shutters and hardware.' }, { name: 'False Ceiling', icon: '⬜', price: 15000, duration: 480, category: 'Ceiling', desc: 'POP/gypsum false ceiling with LED strip.' }], workerSkills: ['Design', 'Carpentry', 'Execution'], crmStages: ['Consultation', '3D Design', 'Approved', 'Execution', 'Handover'] },
  { id: 'packers', name: 'Packers & Movers', icon: '📦', description: 'Packing, shifting, loading, unloading', color: '#d97706', theme: 'local', defaultServices: [{ name: 'Local Shifting', icon: '🚛', price: 3000, duration: 240, category: 'Shifting', desc: 'Within city moving with packing materials.' }, { name: 'Long Distance', icon: '🗺️', price: 12000, duration: 480, category: 'Shifting', desc: 'Interstate moving with tracking.' }], workerSkills: ['Packing', 'Loading', 'Driving'], crmStages: ['Inquiry', 'Survey', 'Booked', 'Moved'] },
  { id: 'tutor', name: 'Home Tutor', icon: '📚', description: 'School tutoring, competitive exams, online/offline', color: '#0284c7', theme: 'professional', defaultServices: [{ name: 'School Coaching', icon: '📚', price: 2500, duration: 60, category: 'Academic', desc: 'Class 6–10 all subjects, home visit.' }, { name: 'Competitive Prep', icon: '🎯', price: 3500, duration: 90, category: 'Exam Prep', desc: 'EAMCET, JEE, NEET preparation.' }], workerSkills: ['Teaching', 'Mathematics', 'Science', 'English'], crmStages: ['Trial Class', 'Enrolled', 'Active', 'Completed'] },
  { id: 'gardening', name: 'Gardening', icon: '🌿', description: 'Lawn care, plant care, landscaping', color: '#16a34a', theme: 'minimal', defaultServices: [{ name: 'Lawn Mowing', icon: '🌿', price: 299, duration: 60, category: 'Lawn', desc: 'Weekly/monthly lawn mowing and edging.' }, { name: 'Plant Care', icon: '🪴', price: 499, duration: 90, category: 'Plants', desc: 'Pruning, fertilizing, pest protection.' }, { name: 'Landscaping', icon: '🌺', price: 5000, duration: 480, category: 'Design', desc: 'Complete garden layout with plants.' }], workerSkills: ['Gardening', 'Landscaping', 'Plant Care'], crmStages: ['Enquiry', 'Visit', 'Started', 'Done'] },
  { id: 'marble', name: 'Marble Polish', icon: '💎', description: 'Floor polishing, tile grinding, restoration', color: '#64748b', theme: 'professional', defaultServices: [{ name: 'Marble Polishing', icon: '💎', price: 5000, duration: 300, category: 'Polishing', desc: 'Diamond polishing for marble floors.' }, { name: 'Tile Restoration', icon: '🪟', price: 3000, duration: 180, category: 'Restoration', desc: 'Grout cleaning and tile sealing.' }], workerSkills: ['Polishing', 'Grinding', 'Restoration'], crmStages: ['Enquiry', 'Site Visit', 'Work', 'Done'] },
  { id: 'construction', name: 'Construction', icon: '🏗️', description: 'Civil work, renovation, tiling, waterproofing', color: '#b45309', theme: 'professional', defaultServices: [{ name: 'House Renovation', icon: '🏗️', price: 50000, duration: 5760, category: 'Construction', desc: 'Complete interior renovation.' }, { name: 'Waterproofing', icon: '💧', price: 8000, duration: 240, category: 'Protection', desc: 'Terrace and bathroom waterproofing.' }], workerSkills: ['Civil', 'Masonry', 'Tiling', 'Waterproofing'], crmStages: ['Site Visit', 'Estimate', 'Approved', 'Ongoing', 'Handover'] },
  { id: 'event', name: 'Event Decoration', icon: '🎉', description: 'Birthday, wedding, corporate decoration setup', color: '#ec4899', theme: 'luxury', defaultServices: [{ name: 'Birthday Setup', icon: '🎂', price: 2500, duration: 120, category: 'Celebration', desc: 'Balloon setup, banner, theme decoration.' }, { name: 'Wedding Decoration', icon: '💒', price: 25000, duration: 480, category: 'Wedding', desc: 'Floral mandap, stage decoration, lighting.' }], workerSkills: ['Decoration', 'Floristry', 'Lighting'], crmStages: ['Enquiry', 'Design', 'Setup', 'Event Day'] },
  { id: 'local', name: 'Local Services', icon: '🏪', description: 'General home services, handyman, odd jobs', color: '#475569', theme: 'local', defaultServices: [{ name: 'Handyman Service', icon: '🔨', price: 399, duration: 60, category: 'General', desc: 'Shelves, curtain rods, minor fixes.' }, { name: 'Furniture Assembly', icon: '🛏️', price: 599, duration: 90, category: 'Assembly', desc: 'IKEA-style flat pack furniture assembly.' }], workerSkills: ['Handyman', 'Assembly', 'General Repairs'], crmStages: ['Booked', 'Done'] },
];

// ============================================================
// INITIAL TENANTS
// ============================================================
export const makeConfig = (pack: typeof INDUSTRY_PACKS[0], overrides: Partial<{ heroTitle: string; heroSubtitle: string; logoText: string; phone: string; email: string; whatsApp: string; gst: string; about: string; city: string; address: string; enableB2bEnquiry: boolean; testimonials: Array<{ id: string; author: string; role: string; text: string; rating: number; service?: string; verified?: boolean }>; seoTitle: string; seoDescription: string; seoKeywords: string; announcementActive: boolean; announcementText: string; navLinks: Array<{ label: string; url: string }>; trustBadgesActive: boolean; }> = {}) => ({
  primaryColor: pack.color,
  secondaryColor: pack.color,
  logoText: overrides.logoText || `${pack.icon} ${pack.name} Pro`,
  heroTitle: overrides.heroTitle || `Professional ${pack.name} Services`,
  heroSubtitle: overrides.heroSubtitle || `Expert ${pack.name.toLowerCase()} solutions at your doorstep. Same-day service available.`,
  whatsAppNumber: overrides.whatsApp || '919876543210',
  email: overrides.email || `contact@${pack.id}.in`,
  phone: overrides.phone || '+91 98765 43210',
  businessHours: '08:00 AM – 08:00 PM',
  cancellationPolicy: 'Free cancellation up to 2 hours before the scheduled slot. Late cancellations incur a ₹150 visit charge.',
  refundPolicy: 'Refunds processed within 3–5 working days if cancelled per our terms.',
  warrantyPolicy: 'We provide 30 days warranty on all completed services. Same fault recurrence fixed free of charge.',
  gstNumber: overrides.gst || '',
  enableB2bEnquiry: overrides.enableB2bEnquiry ?? false,
  aboutText: overrides.about || `We are professional ${pack.name.toLowerCase()} service providers with verified, trained technicians serving ${overrides.city || 'your city'} since 2020.`,
  address: overrides.address || 'Main Road, City Centre',
  city: overrides.city || 'Nellore, AP',
  websiteDarkMode: false,
  themeMode: 'light' as 'light' | 'dark' | 'auto',
  themeFont: 'Inter, sans-serif',
  themeRadius: 'modern' as 'modern' | 'rounded' | 'square',
  themeButtonStyle: 'filled' as 'filled' | 'outline' | 'soft',
  maintenanceMode: false,
  seoTitle: overrides.seoTitle || `Best ${pack.name} Services | Fast & Reliable`,
  seoDescription: overrides.seoDescription || `Trusted ${pack.name.toLowerCase()} services at affordable prices. Book online today.`,
  sections: { hero: true, services: true, team: true, gallery: true, testimonials: true, offers: true, faq: true, about: true, contact: true },
  testimonials: overrides.testimonials || [],
  faqs: [
    { id: 'faq-1', question: 'How soon can I get a technician?', answer: 'We offer same-day service for most bookings. Emergency slots available within 2 hours.' },
    { id: 'faq-2', question: 'What is your cancellation policy?', answer: 'Free cancellation up to 2 hours before scheduled time. A ₹150 charge applies for late cancellations.' },
    { id: 'faq-3', question: 'Do you provide warranty?', answer: 'Yes, we provide 30-day warranty on all services. If the same issue recurs, we fix it free.' },
    { id: 'faq-4', question: 'Are your technicians verified?', answer: 'All technicians are Aadhaar-verified, background-checked, and professionally trained.' },
  ],
  galleryImages: [],
  seoKeywords: overrides.seoKeywords || 'local services, professional booking, expert repairs',
  announcementActive: overrides.announcementActive ?? true,
  announcementText: overrides.announcementText || `🎉 Welcome to our brand new site! Book directly online and save.`,
  navLinks: overrides.navLinks || [
    { label: 'Services', url: '#services' },
    { label: 'Reviews', url: '#reviews' },
    { label: 'Contact', url: '#contact' }
  ],
  trustBadgesActive: overrides.trustBadgesActive ?? true,
  // ─── Premium Section Defaults ──────────────────────────────────
  stats: {
    jobsCompleted: 4250,
    happyClients: 1350,
    yearsInBusiness: 8,
    citiesServed: 3,
    fiveStarReviews: 940,
  },
  portfolio: [
    { id: 'port-1', category: pack.defaultServices[0]?.category || 'General', title: `${pack.defaultServices[0]?.name || pack.name} Completed`, description: `Before: Faulty/damaged ${pack.name.toLowerCase()} issue at client premises.`, afterDescription: `After: Fully restored to premium working condition. Clean and safe.`, icon: pack.defaultServices[0]?.icon || pack.icon, workerName: 'Expert Technician', clientInitials: 'RK', rating: 5 },
    { id: 'port-2', category: pack.defaultServices[1]?.category || 'Installation', title: `Premium ${pack.name} Installation`, description: `Before: Old/missing system needing ${pack.name.toLowerCase()} upgrade.`, afterDescription: `After: New installation with manufacturer warranty and testing done.`, icon: pack.defaultServices[1]?.icon || pack.icon, workerName: 'Senior Specialist', clientInitials: 'SM', rating: 5 },
    { id: 'port-3', category: pack.defaultServices[0]?.category || 'Repair', title: `Emergency ${pack.name} Response`, description: `Before: Urgent fault causing inconvenience and safety risk.`, afterDescription: `After: Issue resolved within 45 minutes. Customer satisfaction 5/5.`, icon: pack.icon, workerName: 'Certified Engineer', clientInitials: 'PL', rating: 4 },
  ],
  awards: [
    { id: 'award-1', title: `Best ${pack.name} Service`, year: '2025', description: `Voted best local ${pack.name.toLowerCase()} service provider by community.`, icon: '🏆', source: 'Local Business Awards' },
    { id: 'award-2', title: 'Customer Choice Award', year: '2024', description: 'Highest customer satisfaction rating in our industry category.', icon: '⭐', source: 'Google Reviews' },
  ],
  founderName: 'Ravi Kumar',
  founderStory: `Started with just one van and a promise — to give every home in ${overrides.city || 'our city'} access to honest, skilled ${pack.name.toLowerCase()} services without the city-markup pricing. Today we're proud to have served 1,000+ homes.`,
  founderPhotoEmoji: '👨‍🔧',
  businessFoundedYear: 2018,
  milestones: [
    { year: '2018', text: 'Started with 1 van and 2 technicians', icon: '🚐' },
    { year: '2021', text: 'Crossed 500 happy customers', icon: '🎉' },
    { year: '2023', text: 'Expanded to 3 cities in AP', icon: '📍' },
    { year: '2026', text: '4,000+ jobs completed', icon: '🏆' },
  ],
  videoYouTubeUrl: '',
  videoTitle: `Watch ${pack.name} Experts at Work`,
  videoDescription: `See how our verified technicians handle ${pack.name.toLowerCase()} jobs with precision, safety, and care.`,
  coverageNote: `We serve ${overrides.city || 'Nellore'} and surrounding areas. Not in our zone? Join the waitlist!`,
  branches: [
    { id: 'br-1', name: 'Nellore Main Branch', city: 'Nellore', manager: 'Ravi Kumar', serviceAreaRadius: 15 },
    { id: 'br-2', name: 'Tirupati Branch', city: 'Tirupati', manager: 'Kalyan Ram', serviceAreaRadius: 20 }
  ],
  activeBranchId: 'br-1',
  companyVerification: {
    gstNumber: overrides.gst || '37AAAAA0000A1Z5',
    panNumber: 'ABCDE1234F',
    aadhaarNumber: '1234-5678-9012',
    licenseNumber: 'LIC-2026-991A',
    status: 'verified' as 'verified' | 'pending' | 'unverified'
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
    fontSelection: 'Inter, sans-serif',
    buttonStyle: 'rounded' as 'rounded' | 'square' | 'pill',
    borderStyle: 'thin' as 'none' | 'thin' | 'thick'
  },
  // ─── Dynamic Engine Defaults ──────────────────────────────────
  campaigns: [
    { id: 'camp-diwali', title: '🪔 Diwali Super Cleaning Deal', subtitle: 'Get your entire home sparkling clean with a flat 20% discount on deep cleaning.', heroImage: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=1200&q=80', ctaText: 'Claim Festive Discount ➔', ctaLink: '#services', offerCode: 'DIWALI20', startDate: '2026-10-01', endDate: '2026-11-15', priority: 10, targetSlug: 'home', enabled: true },
    { id: 'camp-monsoon', title: '🌧️ Monsoon Electrical Safety Audit', subtitle: 'Free short-circuit inspections with every residential wiring overhaul. Stay safe.', heroImage: 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=1200&q=80', ctaText: 'Schedule Audit Now ⚡', ctaLink: '#services', startDate: '2026-06-01', endDate: '2026-09-30', priority: 5, targetSlug: 'home', enabled: true }
  ],
  cmsPages: [
    {
      id: 'home',
      title: 'Home',
      slug: 'home',
      components: [
        { id: 'comp-hero', type: 'hero', enabled: true, settings: { showTelemetry: true } },
        { id: 'comp-stats', type: 'stats', enabled: true, settings: {} },
        { id: 'comp-services-grid', type: 'services', enabled: true, settings: { allowSearch: true, showCategoryFilters: true } },
        { id: 'comp-how-it-works', type: 'how_it_works', enabled: true, settings: {} },
        { id: 'comp-offers-row', type: 'offers_row', enabled: true, settings: {} },
        { id: 'comp-team', type: 'team', enabled: true, settings: { showVerifiedBadges: true } },
        { id: 'comp-gallery', type: 'gallery', enabled: true, settings: {} },
        { id: 'comp-testimonials', type: 'testimonials', enabled: true, settings: {} },
        { id: 'comp-trust-bar', type: 'trust_bar', enabled: true, settings: {} },
        { id: 'comp-founder', type: 'founder', enabled: true, settings: {} },
        { id: 'comp-awards', type: 'awards', enabled: true, settings: {} },
        { id: 'comp-faq', type: 'faq', enabled: true, settings: {} },
        { id: 'comp-map', type: 'map', enabled: true, settings: { showWaitlist: true } }
      ]
    },
    {
      id: 'services',
      title: 'Services',
      slug: 'services',
      components: [
        { id: 'comp-services-grid', type: 'services', enabled: true, settings: { allowSearch: true, showCategoryFilters: true } }
      ]
    },
    {
      id: 'gallery',
      title: 'Portfolio & Work',
      slug: 'gallery',
      components: [
        { id: 'comp-before-after', type: 'gallery', enabled: true, settings: { showBeforeAfter: true } },
        { id: 'comp-video', type: 'video', enabled: true, settings: {} }
      ]
    },
    {
      id: 'about',
      title: 'About Us',
      slug: 'about',
      components: [
        { id: 'comp-founder', type: 'founder', enabled: true, settings: {} },
        { id: 'comp-team', type: 'team', enabled: true, settings: { showVerifiedBadges: true } },
        { id: 'comp-awards', type: 'awards', enabled: true, settings: {} }
      ]
    },
    {
      id: 'contact',
      title: 'Contact Support',
      slug: 'contact',
      components: [
        { id: 'comp-map', type: 'map', enabled: true, settings: { showWaitlist: true } }
      ]
    }
  ] as CMSPage[],
  mediaLibrary: [
    { id: 'media-1', name: 'Technician Working', type: 'image', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80', tags: ['team', 'banner'], uploadedAt: '2026-07-15' },
    { id: 'media-2', name: 'Before Clean Room', type: 'image', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80', tags: ['before-after', 'cleaning'], uploadedAt: '2026-07-15' },
    { id: 'media-3', name: 'After Restored Room', type: 'image', url: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80', tags: ['before-after', 'cleaning'], uploadedAt: '2026-07-15' }
  ] as MediaAsset[],
  footerWidgets: [
    { id: 'fw-links', type: 'quick_links', title: 'Navigation', settings: { links: [{ label: 'Browse Home', slug: 'home' }, { label: 'Explore Services', slug: 'services' }, { label: 'Our Work Gallery', slug: 'gallery' }] } },
    { id: 'fw-contact', type: 'contact_info', title: 'Helpline Desk', settings: { showWorkingHours: true } },
    { id: 'fw-social', type: 'social_media', title: 'Social Connect', settings: { facebook: 'https://facebook.com', instagram: 'https://instagram.com', linkedin: 'https://linkedin.com' } },
    { id: 'fw-copyright', type: 'copyright', title: 'Rights', settings: { copyrightText: 'All rights reserved. Powered by Anarav OS.' } }
  ] as FooterWidget[],
  trustBadges: {
    gstVerified: true,
    aadhaarWorkers: true,
    policeVerified: true,
    businessRegistration: true,
    bankVerified: true,
    goldPartner: true
  },
  homepageSectionsOrder: ['announcement', 'hero', 'badges', 'stats', 'services', 'portfolio', 'video', 'crew', 'reviews', 'founder', 'coverage', 'faq', 'awards', 'offers', 'about'],
  aiProviderConfig: {
    provider: 'gemini' as 'gemini' | 'openai' | 'claude' | 'offline',
    monthlyLimit: 100000,
    usageThisMonth: 12450,
    knowledgeDocs: ['Standard Operating Procedures.pdf', 'Warranty Rules 2026.docx']
  },
  paymentConfig: {
    methods: { upi: true, cash: true, stripe: false, razorpay: true, bank: true },
    gstRate: 18,
    invoicePrefix: 'INV-2026-',
    refundRules: 'Full refund if cancelled at least 2 hours before booking slot.'
  },
  whatsappConfig: {
    notifyBooking: true,
    notifyWorker: true,
    notifyPayment: true,
    apiToken: 'wa_token_mock_123456789'
  },
  localSeoConfig: {
    nearbyCities: ['Nellore Rural', 'Kavali', 'Gudur'],
    localBusinessSchema: true,
    napMatchesProfile: true
  },
  publishHistory: [
    { version: 'v1.0.2', publishedAt: '2026-07-15 10:30', seoScore: 92, performanceScore: 95, status: 'active' as 'active' | 'rollback' },
    { version: 'v1.0.1', publishedAt: '2026-07-10 14:15', seoScore: 85, performanceScore: 90, status: 'rollback' as 'active' | 'rollback' }
  ]
});

export const INITIAL_TENANTS: Tenant[] = [];
export const INITIAL_SERVICES: Service[] = [];
export const INITIAL_WORKERS: Worker[] = [];
export const INITIAL_BOOKINGS: Booking[] = [];
export const INITIAL_LEADS: Lead[] = [];
export const INITIAL_COUPONS: Coupon[] = [];
export const INITIAL_QUOTATIONS: Quotation[] = [];
export const INITIAL_CAMPAIGNS: Campaign[] = [];
export const INITIAL_AUDIT_LOGS: any[] = [];
export const INITIAL_TICKETS: SupportTicket[] = [];
if (typeof window !== 'undefined') {
  localStorage.removeItem('anarav_cached_tenants');
  localStorage.removeItem('anarav_cached_services');
  localStorage.removeItem('anarav_cached_workers');
  localStorage.removeItem('anarav_cached_bookings');
  localStorage.removeItem('anarav_cached_leads');
  localStorage.removeItem('anarav_cached_coupons');
  localStorage.removeItem('anarav_cached_quotations');
  localStorage.removeItem('anarav_cached_campaigns');
  localStorage.removeItem('anarav_cached_tickets');
}

if (typeof window !== 'undefined') {
  sessionStorage.removeItem('anarav_cached_tenants');
  sessionStorage.removeItem('anarav_cached_services');
  sessionStorage.removeItem('anarav_cached_workers');
  sessionStorage.removeItem('anarav_cached_bookings');
  sessionStorage.removeItem('anarav_cached_leads');
  sessionStorage.removeItem('anarav_cached_coupons');
  sessionStorage.removeItem('anarav_cached_quotations');
  sessionStorage.removeItem('anarav_cached_campaigns');
  sessionStorage.removeItem('anarav_cached_tickets');
}
