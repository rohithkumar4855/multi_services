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
const makeConfig = (pack: typeof INDUSTRY_PACKS[0], overrides: Partial<{ heroTitle: string; heroSubtitle: string; logoText: string; phone: string; email: string; whatsApp: string; gst: string; about: string; city: string; address: string; testimonials: Array<{ id: string; author: string; role: string; text: string; rating: number; service?: string; verified?: boolean }>; seoTitle: string; seoDescription: string; seoKeywords: string; announcementActive: boolean; announcementText: string; navLinks: Array<{ label: string; url: string }>; trustBadgesActive: boolean; }> = {}) => ({
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

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant-voltfix',
    name: 'VoltFix Electricians',
    ownerName: 'Ravi Kumar',
    ownerEmail: 'ravi@voltfix.in',
    ownerPhone: '9876543210',
    subdomain: 'voltfix',
    status: 'active',
    plan: 'professional',
    industries: ['Electrician', 'AC Service'],
    theme: 'modern',
    config: makeConfig(INDUSTRY_PACKS[0], {
      logoText: '⚡ VoltFix',
      heroTitle: 'Certified Electrical Services in Nellore',
      heroSubtitle: 'Licensed electricians at your doorstep — same-day repairs, full-house wiring & inverter setup.',
      phone: '+91 98765 43210',
      email: 'contact@voltfix.in',
      whatsApp: '919876543210',
      gst: '37AAAAA0000A1Z5',
      about: 'VoltFix has been Nellore\'s most trusted electrical service provider since 2018. All electricians are licensed, Aadhaar-verified, and equipped with professional diagnostic tools.',
      city: 'Nellore, AP',
      address: '14, Balaji Nagar, Nellore',
      testimonials: [
        { id: '1', author: 'Ravindra N.', role: 'Home Owner', text: 'Prompt and highly professional. Fixed a complex short circuit in under an hour.', rating: 5, service: 'Short Circuit Repair', verified: true },
        { id: '2', author: 'Sravani K.', role: 'Office Manager', text: 'On time and did a perfect job with the office UPS wiring. Strongly recommend!', rating: 5, service: 'Inverter & UPS Setup', verified: true },
        { id: '3', author: 'Ramesh G.', role: 'Shop Owner', text: 'Best electricians in Nellore. Very systematic and clean work.', rating: 4, service: 'Full House Wiring', verified: true },
        { id: '4', author: 'Anita P.', role: 'Resident', text: 'Fan installation done in 20 minutes! Amazing speed and quality.', rating: 5, service: 'Ceiling Fan Installation', verified: true },
        { id: '5', author: 'Krishna M.', role: 'Business Owner', text: 'DB board upgrade was seamless. No disruption to our operations.', rating: 5, service: 'DB Board Upgrade', verified: true },
      ],
    }),
    features: { crm: true, ai: true, quotation: true, emergencyBooking: true, analytics: true, marketing: true, inventory: false },
    registeredAt: '2026-01-15',
  },
  {
    id: 'tenant-royalpaint',
    name: 'Royal Brush Nellore',
    ownerName: 'Subbarao Naidu',
    ownerEmail: 'subbarao@royalbrush.in',
    ownerPhone: '9876543211',
    subdomain: 'royalpaint',
    status: 'active',
    plan: 'enterprise',
    industries: ['Painting', 'Interior Design'],
    theme: 'luxury',
    config: makeConfig(INDUSTRY_PACKS[3], {
      logoText: '🎨 Royal Brush',
      heroTitle: 'Luxury Wall Painting & Interior Aesthetics',
      heroSubtitle: 'Premium texture paints, designer walls, and exterior weatherproof coatings by certified artisans.',
      phone: '+91 98765 43211',
      email: 'info@royalbrush.in',
      whatsApp: '919876543211',
      gst: '37BBBBB1111B1Z2',
      about: 'Royal Brush brings world-class interior textures, exterior weatherproof coats, and wooden polish to homes in Nellore. Absolute cleanliness guaranteed — we cover all furniture before work begins.',
      city: 'Nellore, AP',
      address: '22, Trunk Road, Nellore',
      testimonials: [
        { id: '1', author: 'Hari Prasad', role: 'Villa Owner', text: 'The texture painting in the living room looks absolutely stunning. No paint drops anywhere.', rating: 5, service: 'Texture Wall Design', verified: true },
        { id: '2', author: 'Vasundhara D.', role: 'Apartment Resident', text: 'Professional team, prompt completion. The royal emulsion finish is worth every rupee.', rating: 4, service: 'Interior Room Painting', verified: true },
        { id: '3', author: 'Naga Babu', role: 'Commercial Space', text: 'Painted our entire office in 3 days without disrupting business. Amazing!', rating: 5, service: 'Interior Room Painting', verified: false },
      ],
    }),
    features: { crm: true, ai: true, quotation: true, emergencyBooking: false, analytics: true, marketing: true, inventory: false },
    registeredAt: '2026-02-01',
  },
  {
    id: 'tenant-cleanpro',
    name: 'CleanPro Nellore',
    ownerName: 'Anitha Varma',
    ownerEmail: 'anitha@cleanpro.in',
    ownerPhone: '9876543212',
    subdomain: 'cleanpro',
    status: 'active',
    plan: 'starter',
    industries: ['Cleaning', 'Sanitization'],
    theme: 'minimal',
    config: makeConfig(INDUSTRY_PACKS[4], {
      logoText: '✨ CleanPro',
      heroTitle: 'Deep Cleaning & Sanitization Specialists',
      heroSubtitle: 'Eco-friendly cleaning chemicals and high-powered equipment for a germ-free, spotless home.',
      phone: '+91 98765 43212',
      email: 'care@cleanpro.in',
      whatsApp: '919876543212',
      gst: '37CCCCC2222C1Z9',
      about: 'CleanPro offers specialized deep sanitization, sofa cleaning, water tank cleaning, and full home disinfection. Rated Nellore\'s #1 cleaning service for 3 consecutive years.',
      city: 'Nellore, AP',
      address: '8, Gandhi Nagar, Nellore',
      testimonials: [
        { id: '1', author: 'Anil Kumar', role: 'IT Professional', text: 'My bathroom looks brand new after their deep cleaning. Value for money.', rating: 5, service: 'Bathroom Deep Clean', verified: true },
        { id: '2', author: 'Meenakshi Reddy', role: 'Mother', text: 'Thoroughly sanitized my nursery and carpets. Absolutely trusted them with my kids\' room!', rating: 5, service: 'Sofa & Carpet Clean', verified: true },
        { id: '3', author: 'Suresh G.', role: 'Flat Owner', text: 'Sofa cleaning was outstanding. Looks like showroom quality now!', rating: 4, service: 'Sofa & Carpet Clean', verified: true },
      ],
    }),
    features: { crm: true, ai: false, quotation: true, emergencyBooking: true, analytics: false, marketing: false, inventory: false },
    registeredAt: '2026-03-10',
  },
];

// ============================================================
// INITIAL SERVICES
// ============================================================
export const INITIAL_SERVICES: Service[] = [
  // VoltFix (Electrical)
  {
    id: 'srv-volt-1',
    tenantId: 'tenant-voltfix',
    name: 'Short Circuit Repair',
    category: 'Troubleshooting',
    description: 'Diagnose and fix all short circuit, spark, and tripping issues fast.',
    icon: '⚡',
    basePrice: 350,
    durationMin: 45,
    emergencyAllowed: true,
    requiredSkills: ['Troubleshooting', 'Wiring'],
    formFields: [{ key: 'issue', type: 'text', label: 'Describe the issue briefly', required: true }],
    isActive: true,
    industry: 'Electrical',
    variants: [
      { id: 'v-volt-1-std', name: 'Standard Repair', price: 350, description: 'Fixing single tripping switch or loose circuit connection', bookingRule: 'Immediate' },
      { id: 'v-volt-1-adv', name: 'Complex Diagnosis', price: 750, description: 'Trace complete house short circuit or leakage fault lines', bookingRule: 'Immediate' }
    ]
  },
  {
    id: 'srv-volt-2',
    tenantId: 'tenant-voltfix',
    name: 'Full House Wiring',
    category: 'Installation',
    description: 'Complete ISI-grade wiring with conduit pipes and MCB panel.',
    icon: '🏠',
    basePrice: 5000,
    durationMin: 240,
    emergencyAllowed: false,
    requiredSkills: ['Wiring', 'Safety Compliance'],
    formFields: [{ key: 'rooms', type: 'number', label: 'Number of rooms', required: true }],
    isActive: true,
    industry: 'Electrical',
    variants: [
      { id: 'v-volt-2-std', name: 'Standard Installation', price: 5000, description: 'Conduit pipes + wire drawing for up to 3BHK house', bookingRule: 'Need Inspection' },
      { id: 'v-volt-2-lux', name: 'Premium Automation Prep', price: 12000, description: 'Concealed automation loop wiring with heavy load paneling', bookingRule: 'Need Inspection' }
    ]
  },
  {
    id: 'srv-volt-3',
    tenantId: 'tenant-voltfix',
    name: 'Ceiling Fan Installation',
    category: 'Installation',
    description: 'Install any brand ceiling fan with balancing and testing.',
    icon: '🌀',
    basePrice: 299,
    durationMin: 30,
    emergencyAllowed: true,
    requiredSkills: ['Installation'],
    formFields: [],
    isActive: true,
    industry: 'Electrical',
    variants: [
      { id: 'v-volt-3-std', name: 'Standard Hook Mount', price: 299, description: 'Unboxing, mounting fan with standard rod assembly', bookingRule: 'Immediate' }
    ]
  },
  {
    id: 'srv-volt-4',
    tenantId: 'tenant-voltfix',
    name: 'Inverter & UPS Setup',
    category: 'Installation',
    description: 'Full inverter battery installation with bypass switching.',
    icon: '🔋',
    basePrice: 800,
    durationMin: 90,
    emergencyAllowed: false,
    requiredSkills: ['Inverter', 'Wiring'],
    formFields: [],
    isActive: true,
    industry: 'Electrical',
    variants: [
      { id: 'v-volt-4-std', name: 'Standard Setup', price: 800, description: 'Mounting single battery with main line UPS bypass configuration', bookingRule: 'Immediate' }
    ]
  },
  {
    id: 'srv-volt-5',
    tenantId: 'tenant-voltfix',
    name: 'DB Board Upgrade',
    category: 'Upgrade',
    description: 'Upgrade MCB/RCCB distribution board for safety.',
    icon: '🔌',
    basePrice: 1200,
    durationMin: 120,
    emergencyAllowed: false,
    requiredSkills: ['Wiring', 'Safety Compliance'],
    formFields: [],
    isActive: true,
    industry: 'Electrical',
    variants: [
      { id: 'v-volt-5-std', name: 'Standard Upgrade', price: 1200, description: 'Replacing old fuse set with premium MCB/RCCB board panel', bookingRule: 'Immediate' }
    ]
  },
  // Royal Paint (Painting)
  {
    id: 'srv-paint-1',
    tenantId: 'tenant-royalpaint',
    name: 'Interior Room Painting',
    category: 'Interior',
    description: '2-coat premium emulsion with wall putty on all walls.',
    icon: '🎨',
    basePrice: 8000,
    durationMin: 180,
    emergencyAllowed: false,
    requiredSkills: ['Roller Paint', 'Putty'],
    formFields: [{ key: 'sqft', type: 'number', label: 'Wall area in sq.ft', required: true }, { key: 'finish', type: 'select', label: 'Paint Finish', required: true, options: ['Standard Matte', 'Premium Silk', 'Luxury Royal Emulsion'] }],
    isActive: true,
    industry: 'Painting',
    variants: [
      { id: 'v-paint-1-std', name: 'Standard Matte Finish', price: 8000, description: 'Standard interior paint with base putty preparation', bookingRule: 'Need Inspection' },
      { id: 'v-paint-1-lux', name: 'Asian Royale Luxury', price: 16000, description: 'Washable luxury emulsion finish with 3 coats putty', bookingRule: 'Need Inspection' }
    ]
  },
  {
    id: 'srv-paint-2',
    tenantId: 'tenant-royalpaint',
    name: 'Exterior Weather Coat',
    category: 'Exterior',
    description: 'Waterproof exterior paint with anti-fungal primer.',
    icon: '🏗️',
    basePrice: 15000,
    durationMin: 480,
    emergencyAllowed: false,
    requiredSkills: ['Exterior Paint'],
    formFields: [],
    isActive: true,
    industry: 'Painting',
    variants: [
      { id: 'v-paint-2-std', name: 'Apex WeatherCoat', price: 15000, description: 'Anti-fungal primer + 2 coats weather coat exterior', bookingRule: 'Need Inspection' }
    ]
  },
  {
    id: 'srv-paint-3',
    tenantId: 'tenant-royalpaint',
    name: 'Texture Wall Design',
    category: 'Specialty',
    description: 'Designer wall textures — sand, rustic, marble, venetian.',
    icon: '✨',
    basePrice: 12000,
    durationMin: 300,
    emergencyAllowed: false,
    requiredSkills: ['Texture'],
    formFields: [{ key: 'style', type: 'select', label: 'Texture Style', required: true, options: ['Sand Finish', 'Rustic Stone', 'Marble Effect', 'Venetian Plaster'] }],
    isActive: true,
    industry: 'Painting',
    variants: [
      { id: 'v-paint-3-std', name: 'Venetian Plaster Design', price: 12000, description: 'Mirror finish venetian texture coating on primary walls', bookingRule: 'Need Inspection' }
    ]
  },
  {
    id: 'srv-paint-4',
    tenantId: 'tenant-royalpaint',
    name: 'Wood Polish & Lacquer',
    category: 'Specialty',
    description: 'PU polish for doors, windows, and wooden furniture.',
    icon: '🪵',
    basePrice: 3000,
    durationMin: 120,
    emergencyAllowed: false,
    requiredSkills: ['Wood Polish'],
    formFields: [],
    isActive: true,
    industry: 'Painting',
    variants: [
      { id: 'v-paint-4-std', name: 'Standard Melamine Polish', price: 3000, description: 'Semi-gloss melamine spray coat for standard wooden door', bookingRule: 'Need Inspection' }
    ]
  },
  // CleanPro (Cleaning)
  {
    id: 'srv-clean-1',
    tenantId: 'tenant-cleanpro',
    name: 'Bathroom Deep Clean',
    category: 'Sanitization',
    description: 'Full tile scrubbing, descaling, and sanitization.',
    icon: '🚿',
    basePrice: 499,
    durationMin: 60,
    emergencyAllowed: true,
    requiredSkills: ['Cleaning Chemicals'],
    formFields: [{ key: 'count', type: 'number', label: 'Number of bathrooms', required: true }],
    isActive: true,
    industry: 'Cleaning',
    variants: [
      { id: 'v-clean-1-std', name: 'Standard Descaling', price: 499, description: 'Acid wash tiles, scrub tap fittings, sanitize floor', bookingRule: 'Immediate' },
      { id: 'v-clean-1-adv', name: 'Premium Polish Care', price: 899, description: 'Steam clean glass panel, chrome fittings polish + sanitization', bookingRule: 'Immediate' }
    ]
  },
  {
    id: 'srv-clean-2',
    tenantId: 'tenant-cleanpro',
    name: 'Full Home Deep Clean',
    category: 'Deep Cleaning',
    description: 'Complete home — bedrooms, kitchen, bathrooms.',
    icon: '🏠',
    basePrice: 1999,
    durationMin: 240,
    emergencyAllowed: false,
    requiredSkills: ['Cleaning Chemicals', 'Vacuum'],
    formFields: [{ key: 'bhk', type: 'select', label: 'Home Size', required: true, options: ['1 BHK', '2 BHK', '3 BHK', '4 BHK+'] }],
    isActive: true,
    industry: 'Cleaning',
    variants: [
      { id: 'v-clean-2-std', name: 'Standard 2BHK Deep Clean', price: 1999, description: 'Vacuuming, floor scrubbing, kitchen counter clean, bathroom sanitization', bookingRule: 'Immediate' },
      { id: 'v-clean-2-lux', name: 'Luxury Full Sanitization', price: 3499, description: 'Full steam deep clean, window mesh clean, cabinet insides wash', bookingRule: 'Immediate' }
    ]
  },
  {
    id: 'srv-clean-3',
    tenantId: 'tenant-cleanpro',
    name: 'Sofa & Carpet Clean',
    category: 'Upholstery',
    description: 'Dry steam cleaning for sofas, carpets, curtains.',
    icon: '🛋️',
    basePrice: 799,
    durationMin: 90,
    emergencyAllowed: false,
    requiredSkills: ['Steam Clean'],
    formFields: [],
    isActive: true,
    industry: 'Cleaning',
    variants: [
      { id: 'v-clean-3-std', name: 'Sofa Steam Shampoo', price: 799, description: 'Vacuuming, shampoo wash, dry steam clean for 3-seater sofa', bookingRule: 'Immediate' }
    ]
  },
  {
    id: 'srv-clean-4',
    tenantId: 'tenant-cleanpro',
    name: 'Kitchen Deep Clean',
    category: 'Deep Cleaning',
    description: 'Chimney, tiles, racks, stove, and all appliances.',
    icon: '🍳',
    basePrice: 699,
    durationMin: 90,
    emergencyAllowed: false,
    requiredSkills: ['Cleaning Chemicals'],
    formFields: [],
    isActive: true,
    industry: 'Cleaning',
    variants: [
      { id: 'v-clean-4-std', name: 'Standard Kitchen Scrub', price: 699, description: 'De-grease stove counter, clean chimney exterior, wash wall tiles', bookingRule: 'Immediate' }
    ]
  }
];

// ============================================================
// INITIAL WORKERS
// ============================================================
export const INITIAL_WORKERS: Worker[] = [
  { id: 'work-volt-1', tenantId: 'tenant-voltfix', name: 'Chandra Sekhar Rao', skills: ['Troubleshooting', 'Wiring'], availability: 'available', rating: 4.8, aadhaarStatus: 'verified', panStatus: 'verified', currentJobsCount: 1, phone: '9848022338', photoUrl: '', completedJobs: 142, earningsToday: 1200, earningsMonth: 28400, joinedDate: '2024-03-15', attendanceToday: 'present', showOnWebsite: true, designation: 'Senior Electrician', yearsExperience: 7, policeVerified: true },
  { id: 'work-volt-2', tenantId: 'tenant-voltfix', name: 'Manoj Kumar Reddy', skills: ['Wiring', 'Safety Compliance', 'Inverter'], availability: 'busy', rating: 4.6, aadhaarStatus: 'verified', panStatus: 'pending', currentJobsCount: 2, phone: '9988776655', photoUrl: '', completedJobs: 89, earningsToday: 800, earningsMonth: 18600, joinedDate: '2024-06-20', attendanceToday: 'present', showOnWebsite: true, designation: 'Wiring Specialist', yearsExperience: 5, policeVerified: false },
  { id: 'work-volt-3', tenantId: 'tenant-voltfix', name: 'Venkata Ramana', skills: ['Installation', 'Fan Fitting'], availability: 'available', rating: 4.4, aadhaarStatus: 'verified', panStatus: 'verified', currentJobsCount: 0, phone: '9700123456', photoUrl: '', completedJobs: 54, earningsToday: 0, earningsMonth: 9800, joinedDate: '2025-01-10', attendanceToday: 'present', showOnWebsite: true, designation: 'Installation Technician', yearsExperience: 3, policeVerified: true },
  { id: 'work-paint-1', tenantId: 'tenant-royalpaint', name: 'Subbarao Naidu', skills: ['Roller Paint', 'Texture', 'Putty'], availability: 'available', rating: 4.9, aadhaarStatus: 'verified', panStatus: 'verified', currentJobsCount: 1, phone: '9440212345', photoUrl: '', completedJobs: 310, earningsToday: 4500, earningsMonth: 62000, joinedDate: '2023-09-01', attendanceToday: 'present', showOnWebsite: true, designation: 'Master Painter', yearsExperience: 12, policeVerified: true },
  { id: 'work-paint-2', tenantId: 'tenant-royalpaint', name: 'Krishnam Raju', skills: ['Exterior Paint', 'Roller Paint', 'Wood Polish'], availability: 'available', rating: 4.7, aadhaarStatus: 'verified', panStatus: 'verified', currentJobsCount: 0, phone: '9550987654', photoUrl: '', completedJobs: 187, earningsToday: 0, earningsMonth: 34000, joinedDate: '2024-01-05', attendanceToday: 'present', showOnWebsite: true, designation: 'Texture & Polish Expert', yearsExperience: 8, policeVerified: false },
  { id: 'work-clean-1', tenantId: 'tenant-cleanpro', name: 'P. Rajesh Varma', skills: ['Cleaning Chemicals', 'Tile Polishing'], availability: 'available', rating: 4.5, aadhaarStatus: 'verified', panStatus: 'pending', currentJobsCount: 0, phone: '9676654321', photoUrl: '', completedJobs: 54, earningsToday: 600, earningsMonth: 11200, joinedDate: '2025-02-14', attendanceToday: 'present', showOnWebsite: true, designation: 'Deep Clean Specialist', yearsExperience: 4, policeVerified: true },
  { id: 'work-clean-2', tenantId: 'tenant-cleanpro', name: 'Lakshmi Prasad', skills: ['Vacuum', 'Steam Clean', 'Cleaning Chemicals'], availability: 'available', rating: 4.8, aadhaarStatus: 'verified', panStatus: 'verified', currentJobsCount: 0, phone: '9912345678', photoUrl: '', completedJobs: 98, earningsToday: 0, earningsMonth: 18400, joinedDate: '2024-11-01', attendanceToday: 'present', showOnWebsite: true, designation: 'Steam Clean Expert', yearsExperience: 6, policeVerified: true },
];

// ============================================================
// INITIAL BOOKINGS
// ============================================================
export const INITIAL_BOOKINGS: Booking[] = [
  { id: 'BK-101', tenantId: 'tenant-voltfix', customerId: 'cust-1', customerName: 'Kalyan Ram', customerPhone: '9490122334', customerAddress: 'Flat 402, Srinivasa Heights, Balaji Nagar, Nellore', serviceId: 'srv-volt-1', serviceName: 'Short Circuit Repair', status: 'completed', scheduledDate: '2026-07-14', scheduledTime: '10:00 AM', isEmergency: false, formData: { issue: 'Living room switches spark when turned on.' }, priceDetails: { baseVisit: 350, distanceCharge: 50, labour: 150, material: 80, emergencySurcharge: 0, tax: 113, discount: 0, total: 743 }, workerId: 'work-volt-1', workerName: 'Chandra Sekhar Rao', customerRating: 5, customerReview: 'Amazing response time! Fixed immediately.', createdAt: '2026-07-13T18:00:00.000Z' },
  { id: 'BK-102', tenantId: 'tenant-voltfix', customerId: 'cust-2', customerName: 'Venkatesh Prasad', customerPhone: '9849111222', customerAddress: 'House 14/122, Ranganayakulapeta, Nellore', serviceId: 'srv-volt-1', serviceName: 'Short Circuit Repair', status: 'assigned', scheduledDate: '2026-07-17', scheduledTime: '02:00 PM', isEmergency: false, formData: { issue: 'Kitchen exhaust fan fuse burned out.' }, priceDetails: { baseVisit: 350, distanceCharge: 30, labour: 100, material: 40, emergencySurcharge: 0, tax: 94, discount: 50, total: 564 }, workerId: 'work-volt-1', workerName: 'Chandra Sekhar Rao', createdAt: '2026-07-15T10:00:00.000Z' },
  { id: 'BK-103', tenantId: 'tenant-voltfix', customerId: 'cust-3', customerName: 'Sunitha Devi', customerPhone: '9712345678', customerAddress: '3-5-78, Santhapet, Nellore', serviceId: 'srv-volt-3', serviceName: 'Ceiling Fan Installation', status: 'requested', scheduledDate: '2026-07-18', scheduledTime: '11:00 AM', isEmergency: false, formData: {}, priceDetails: { baseVisit: 299, distanceCharge: 20, labour: 0, material: 0, emergencySurcharge: 0, tax: 0, discount: 0, total: 319 }, createdAt: '2026-07-16T07:30:00.000Z' },
  { id: 'BK-104', tenantId: 'tenant-voltfix', customerId: 'cust-4', customerName: 'Ramesh Babu', customerPhone: '9490088776', customerAddress: 'Plot 23, NGO Colony, Nellore', serviceId: 'srv-volt-4', serviceName: 'Inverter & UPS Setup', status: 'completed', scheduledDate: '2026-07-12', scheduledTime: '09:00 AM', isEmergency: false, formData: {}, priceDetails: { baseVisit: 800, distanceCharge: 0, labour: 200, material: 150, emergencySurcharge: 0, tax: 171, discount: 0, total: 1321 }, workerId: 'work-volt-2', workerName: 'Manoj Kumar Reddy', customerRating: 4, createdAt: '2026-07-11T09:00:00.000Z' },
  { id: 'BK-105', tenantId: 'tenant-voltfix', customerId: 'cust-3', customerName: 'Sunitha Devi', customerPhone: '9712345678', customerAddress: 'Flat 12, Pearl Apartments, Nellore', serviceId: 'srv-volt-2', serviceName: 'Full House Wiring', status: 'quotation', scheduledDate: '2026-07-20', scheduledTime: '10:00 AM', isEmergency: false, formData: { rooms: 3 }, priceDetails: { baseVisit: 5000, distanceCharge: 0, labour: 2000, material: 3500, emergencySurcharge: 0, tax: 1890, discount: 500, total: 11890 }, createdAt: '2026-07-16T06:00:00.000Z' },
  { id: 'BK-106', tenantId: 'tenant-voltfix', customerId: 'cust-5', customerName: 'Priya Lakshmi', customerPhone: '9876501234', customerAddress: 'Flat 8, Laxmi Towers, Nellore', serviceId: 'srv-volt-1', serviceName: 'Short Circuit Repair', status: 'on_the_way', scheduledDate: '2026-07-16', scheduledTime: '04:00 PM', isEmergency: true, formData: { issue: 'Complete power failure in bedroom area.' }, priceDetails: { baseVisit: 350, distanceCharge: 30, labour: 0, material: 0, emergencySurcharge: 200, tax: 86, discount: 0, total: 666 }, workerId: 'work-volt-3', workerName: 'Venkata Ramana', createdAt: '2026-07-16T15:00:00.000Z' },
  // Royal Paint
  { id: 'BK-201', tenantId: 'tenant-royalpaint', customerId: 'cust-6', customerName: 'Hari Prasad', customerPhone: '9440112233', customerAddress: 'Villa 4, Sunrise Layout, Nellore', serviceId: 'srv-paint-1', serviceName: 'Interior Room Painting', status: 'completed', scheduledDate: '2026-07-10', scheduledTime: '09:00 AM', isEmergency: false, formData: { sqft: 800, finish: 'Luxury Royal Emulsion' }, priceDetails: { baseVisit: 8000, distanceCharge: 0, labour: 3000, material: 4000, emergencySurcharge: 0, tax: 2700, discount: 1000, total: 16700 }, workerId: 'work-paint-1', workerName: 'Subbarao Naidu', customerRating: 5, customerReview: 'Stunning work. Highly recommend Royal Brush!', createdAt: '2026-07-08T11:00:00.000Z' },
  { id: 'BK-202', tenantId: 'tenant-royalpaint', customerId: 'cust-7', customerName: 'Anitha Varma', customerPhone: '9550887766', customerAddress: 'Flat 201, Lakshmi Towers, Nellore', serviceId: 'srv-paint-3', serviceName: 'Texture Wall Design', status: 'started', scheduledDate: '2026-07-16', scheduledTime: '09:00 AM', isEmergency: false, formData: { style: 'Venetian Plaster' }, priceDetails: { baseVisit: 12000, distanceCharge: 0, labour: 4000, material: 5000, emergencySurcharge: 0, tax: 3780, discount: 0, total: 24780 }, workerId: 'work-paint-1', workerName: 'Subbarao Naidu', createdAt: '2026-07-15T14:00:00.000Z' },
  { id: 'BK-203', tenantId: 'tenant-royalpaint', customerId: 'cust-8', customerName: 'Surya Kiran', customerPhone: '9912300456', customerAddress: 'Independent House, Dargamitta, Nellore', serviceId: 'srv-paint-2', serviceName: 'Exterior Weather Coat', status: 'requested', scheduledDate: '2026-07-22', scheduledTime: '08:00 AM', isEmergency: false, formData: {}, priceDetails: { baseVisit: 15000, distanceCharge: 0, labour: 5000, material: 8000, emergencySurcharge: 0, tax: 5040, discount: 0, total: 33040 }, createdAt: '2026-07-16T08:00:00.000Z' },
  // CleanPro
  { id: 'BK-301', tenantId: 'tenant-cleanpro', customerId: 'cust-9', customerName: 'Anil Kumar', customerPhone: '9490555666', customerAddress: '4-1-44, Santhapet, Nellore', serviceId: 'srv-clean-1', serviceName: 'Bathroom Deep Clean', status: 'completed', scheduledDate: '2026-07-13', scheduledTime: '10:00 AM', isEmergency: false, formData: { count: 2 }, priceDetails: { baseVisit: 499, distanceCharge: 0, labour: 0, material: 100, emergencySurcharge: 0, tax: 90, discount: 0, total: 689 }, workerId: 'work-clean-1', workerName: 'P. Rajesh Varma', customerRating: 5, customerReview: 'Excellent cleaning. Bathroom looks brand new.', createdAt: '2026-07-12T09:00:00.000Z' },
  { id: 'BK-302', tenantId: 'tenant-cleanpro', customerId: 'cust-10', customerName: 'Meenakshi Reddy', customerPhone: '9700111222', customerAddress: 'Flat 305, Vasanthi Towers, Nellore', serviceId: 'srv-clean-2', serviceName: 'Full Home Deep Clean', status: 'requested', scheduledDate: '2026-07-17', scheduledTime: '09:00 AM', isEmergency: false, formData: { bhk: '3 BHK' }, priceDetails: { baseVisit: 1999, distanceCharge: 0, labour: 0, material: 300, emergencySurcharge: 0, tax: 414, discount: 200, total: 2513 }, createdAt: '2026-07-16T10:00:00.000Z' },
  { id: 'BK-303', tenantId: 'tenant-cleanpro', customerId: 'cust-11', customerName: 'Suresh Goud', customerPhone: '9876543999', customerAddress: 'Plot 67, Brindavan Colony, Nellore', serviceId: 'srv-clean-3', serviceName: 'Sofa & Carpet Clean', status: 'assigned', scheduledDate: '2026-07-17', scheduledTime: '11:00 AM', isEmergency: false, formData: {}, priceDetails: { baseVisit: 799, distanceCharge: 0, labour: 0, material: 100, emergencySurcharge: 0, tax: 162, discount: 0, total: 1061 }, workerId: 'work-clean-2', workerName: 'Lakshmi Prasad', createdAt: '2026-07-15T16:00:00.000Z' },
];

// ============================================================
// INITIAL LEADS
// ============================================================
export const INITIAL_LEADS: Lead[] = [
  { id: 'lead-1', tenantId: 'tenant-voltfix', name: 'Prasad Babu', phone: '9000112233', email: 'prasadb@gmail.com', serviceInterest: 'Full House Wiring', notes: 'Requires site visit for new warehouse electrical plan.', status: 'contacted', createdAt: '2026-07-15T04:30:00.000Z' },
  { id: 'lead-2', tenantId: 'tenant-voltfix', name: 'Swetha Rao', phone: '9550112244', email: 'swetha@yahoo.com', serviceInterest: 'Inverter & UPS Setup', notes: 'Wants 2 kVA inverter with tubular battery.', status: 'quoted', createdAt: '2026-07-14T11:00:00.000Z' },
  { id: 'lead-3', tenantId: 'tenant-voltfix', name: 'Durga Prasad', phone: '9876001122', email: '', serviceInterest: 'Short Circuit Repair', notes: 'Main switch board tripping repeatedly.', status: 'new', createdAt: '2026-07-16T08:00:00.000Z' },
  { id: 'lead-4', tenantId: 'tenant-royalpaint', name: 'Anila Murthy', phone: '9550334455', email: 'anila@yahoo.com', serviceInterest: 'Interior Room Painting', notes: 'Interested in Royal Emulsion texture details, 4BHK house.', status: 'new', createdAt: '2026-07-15T11:00:00.000Z' },
  { id: 'lead-5', tenantId: 'tenant-royalpaint', name: 'Krishna Murthy', phone: '9440998877', email: 'kmurthy@gmail.com', serviceInterest: 'Exterior Weather Coat', notes: '2-floor independent house exterior — 1200 sqft approx.', status: 'quoted', createdAt: '2026-07-13T09:00:00.000Z' },
  { id: 'lead-6', tenantId: 'tenant-cleanpro', name: 'Sravya Devi', phone: '9491234567', email: 'sravya@gmail.com', serviceInterest: 'Full Home Deep Clean', notes: 'Post-renovation cleaning for 3BHK, asap.', status: 'new', createdAt: '2026-07-16T09:30:00.000Z' },
];

// ============================================================
// INITIAL COUPONS
// ============================================================
export const INITIAL_COUPONS: Coupon[] = [
  { id: 'coup-1', tenantId: 'tenant-voltfix', code: 'FIRST50', type: 'flat', value: 50, minOrderAmount: 300, maxUses: 100, usedCount: 23, validTill: '2026-08-31', applicableServices: [], status: 'active', createdAt: '2026-07-01T00:00:00.000Z' },
  { id: 'coup-2', tenantId: 'tenant-voltfix', code: 'MONSOON10', type: 'percent', value: 10, minOrderAmount: 500, maxUses: 50, usedCount: 8, validTill: '2026-09-30', applicableServices: [], status: 'active', createdAt: '2026-07-10T00:00:00.000Z' },
  { id: 'coup-3', tenantId: 'tenant-royalpaint', code: 'ROYAL20', type: 'percent', value: 20, minOrderAmount: 5000, maxUses: 30, usedCount: 12, validTill: '2026-08-15', applicableServices: ['srv-paint-1', 'srv-paint-3'], status: 'active', createdAt: '2026-07-05T00:00:00.000Z' },
  { id: 'coup-4', tenantId: 'tenant-cleanpro', code: 'CLEAN100', type: 'flat', value: 100, minOrderAmount: 699, maxUses: 200, usedCount: 45, validTill: '2026-07-31', applicableServices: [], status: 'active', createdAt: '2026-07-01T00:00:00.000Z' },
];

// ============================================================
// INITIAL QUOTATIONS
// ============================================================
export const INITIAL_QUOTATIONS: Quotation[] = [
  { id: 'QT-001', tenantId: 'tenant-voltfix', bookingId: 'BK-105', customerName: 'Sunitha Devi', customerPhone: '9712345678', items: [{ description: 'Full House Wiring (ISI Grade)', quantity: 1, unitPrice: 5000, amount: 5000 }, { description: 'Labour Charges', quantity: 1, unitPrice: 2000, amount: 2000 }, { description: 'Conduit Pipes & Fittings (Material)', quantity: 1, unitPrice: 3500, amount: 3500 }, { description: 'MCB Panel Upgrade', quantity: 1, unitPrice: 1200, amount: 1200 }], notes: 'Includes 1-year warranty on all wiring. GST applicable @ 18%.', validDays: 7, status: 'sent', createdAt: '2026-07-16T06:30:00.000Z', subtotal: 11700, tax: 2106, discount: 500, total: 13306 },
  { id: 'QT-002', tenantId: 'tenant-royalpaint', customerName: 'Krishna Murthy', customerPhone: '9440998877', items: [{ description: 'Exterior Weather Coat — 1200 sqft', quantity: 1, unitPrice: 15000, amount: 15000 }, { description: 'Labour (2 painters, 3 days)', quantity: 1, unitPrice: 5000, amount: 5000 }, { description: 'Asian Apex Ultima Paint (20L)', quantity: 2, unitPrice: 4000, amount: 8000 }], notes: 'Includes one free touch-up coat within 30 days if any issues arise.', validDays: 5, status: 'draft', createdAt: '2026-07-15T10:00:00.000Z', subtotal: 28000, tax: 5040, discount: 1000, total: 32040 },
];

// ============================================================
// INITIAL CAMPAIGNS
// ============================================================
export const INITIAL_CAMPAIGNS: Campaign[] = [
  { id: 'camp-1', tenantId: 'tenant-voltfix', name: 'Monsoon Safety Check', type: 'whatsapp', message: 'Dear {name}, monsoon season is here! Get your home\'s electrical safety checked by VoltFix experts. Book now and get ₹50 off. Reply YES to schedule. VoltFix: {phone}', targetSegment: 'all', status: 'sent', sentCount: 87, createdAt: '2026-07-10T09:00:00.000Z' },
  { id: 'camp-2', tenantId: 'tenant-royalpaint', name: 'Independence Day Offer', type: 'festival', message: 'Happy Independence Day! Celebrate with a fresh coat of paint. Get 15% off all interior painting this week. Royal Brush Nellore.', targetSegment: 'inactive', status: 'scheduled', sentCount: 0, scheduledAt: '2026-08-14T09:00:00.000Z', createdAt: '2026-07-16T08:00:00.000Z' },
];

// ============================================================
// AUDIT LOGS
// ============================================================
export const INITIAL_AUDIT_LOGS = [
  { id: 'audit-1', tenantId: 'tenant-voltfix', userId: 'user-volt', userName: 'Ravi Kumar', action: 'CONFIG_UPDATE', details: 'Updated primary color and business hours.', ip: '103.45.67.89', timestamp: '2026-07-15T09:30:00.000Z' },
  { id: 'audit-2', tenantId: 'tenant-royalpaint', userId: 'user-paint', userName: 'Subbarao Naidu', action: 'SERVICE_ADDED', details: 'Added "Texture Wall Design" service at ₹12,000.', ip: '103.22.44.66', timestamp: '2026-07-14T14:00:00.000Z' },
  { id: 'audit-3', tenantId: 'tenant-cleanpro', userId: 'user-clean', userName: 'Anitha Varma', action: 'WORKER_ADDED', details: 'Registered new technician Lakshmi Prasad.', ip: '103.99.11.22', timestamp: '2026-07-13T10:00:00.000Z' },
];

// ============================================================
// INITIAL SUPPORT TICKETS
// ============================================================
export const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'TKT-101',
    tenantId: 'tenant-voltfix',
    tenantName: 'VoltFix Electricians',
    subject: 'Razorpay settlement delayed',
    message: 'Hi team, our payments from BK-101 are still showing as pending settlement. Please check.',
    category: 'billing',
    status: 'open',
    createdAt: '2026-07-15T09:00:00.000Z',
    replies: []
  },
  {
    id: 'TKT-102',
    tenantId: 'tenant-cleanpro',
    tenantName: 'CleanPro Nellore',
    subject: 'Sofa cleaning service configuration question',
    message: 'Can we add custom field questions in the booking form for chemical preferences?',
    category: 'technical',
    status: 'replied',
    createdAt: '2026-07-14T11:30:00.000Z',
    replies: [
      {
        id: 'rep-1',
        sender: 'super_admin',
        senderName: 'Anarav Admin',
        message: 'Yes, you can configure form fields in the Services tab.',
        createdAt: '2026-07-14T14:00:00.000Z'
      }
    ]
  }
];

