// Anarav Business OS — V2 Types

export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise';
export type ThemeKey = 'modern' | 'luxury' | 'professional' | 'minimal' | 'local' | 'medical';

// ─── Auth ──────────────────────────────────────────────────────────
export interface AuthSession {
  role: 'super_admin' | 'tenant' | null;
  tenantId?: string;
  tenantName?: string;
  email?: string;
}

// ─── Theme Config ──────────────────────────────────────────────────
export interface ThemeConfig {
  key: ThemeKey;
  label: string;
  bg: string;
  cardBg: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  headingFont: string;
  borderRadius: string;
  isDark: boolean;
  themeMode: 'light' | 'dark' | 'auto';
  themeFont: string;
  themeRadius: 'modern' | 'rounded' | 'square';
  themeButtonStyle: 'filled' | 'outline' | 'soft';
}

// ─── Tenant ────────────────────────────────────────────────────────
export interface TenantConfig {
  primaryColor: string;
  secondaryColor: string;
  logoText: string;
  logoImage?: string;
  heroTitle: string;
  heroSubtitle: string;
  whatsAppNumber: string;
  email: string;
  phone: string;
  businessHours: string;
  cancellationPolicy: string;
  refundPolicy: string;
  warrantyPolicy: string;
  ownerPassword?: string;
  gstNumber?: string;
  paymentGatewayKey?: string;
  googleMapsLink?: string;
  aboutText: string;
  address: string;
  city: string;
  websiteDarkMode: boolean;
  themeMode: 'light' | 'dark' | 'auto';
  themeFont: string;
  themeRadius: 'modern' | 'rounded' | 'square';
  themeButtonStyle: 'filled' | 'outline' | 'soft';
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
  cardBgColor?: string;
  maintenanceMode: boolean;
  seoTitle: string;
  seoDescription: string;
  socialFacebook?: string;
  socialInstagram?: string;
  socialGoogle?: string;
  sections: {
    hero: boolean;
    services: boolean;
    team: boolean;
    gallery: boolean;
    testimonials: boolean;
    offers: boolean;
    faq: boolean;
    about: boolean;
    contact: boolean;
  };
  testimonials: Array<{ id: string; author: string; role: string; text: string; rating: number; service?: string; verified?: boolean }>;
  faqs: Array<{ id: string; question: string; answer: string; category?: string }>;
  // ─── Premium Section Data ──────────────────────────────────
  stats?: {
    jobsCompleted: number;
    happyClients: number;
    yearsInBusiness: number;
    citiesServed: number;
    fiveStarReviews: number;
  };
  portfolio?: Array<{
    id: string;
    category: string;
    title: string;
    description: string;
    afterDescription: string;
    icon: string;
    workerName: string;
    clientInitials: string;
    rating: number;
    youtubeUrl?: string;
    instagramUrl?: string;
  }>;
  awards?: Array<{
    id: string;
    title: string;
    year: string;
    description: string;
    icon: string;
    source?: string;
  }>;
  founderName?: string;
  founderStory?: string;
  founderPhotoEmoji?: string;
  businessFoundedYear?: number;
  milestones?: Array<{ year: string; text: string; icon: string }>;
  videoYouTubeUrl?: string;
  videoTitle?: string;
  videoDescription?: string;
  coverageNote?: string;
  galleryImages: string[];
  // ─── Dynamic CMS & Campaigns Registry ──────────────────────
  campaigns?: WebsiteCampaign[];
  cmsPages?: CMSPage[];
  mediaLibrary?: MediaAsset[];
  footerWidgets?: FooterWidget[];
  trustBadges?: {
    gstVerified?: boolean;
    aadhaarWorkers?: boolean;
    policeVerified?: boolean;
    businessRegistration?: boolean;
    bankVerified?: boolean;
    goldPartner?: boolean;
  };
  seoKeywords?: string;
  announcementActive?: boolean;
  announcementText?: string;
  announcementExpiry?: string; // ISO date string or YYYY-MM-DD
  allowTechnicianSelection?: boolean; // Select worker feature flag
  enableB2bEnquiry?: boolean; // B2B quote enquiry instead of direct purchase
  navLinks?: Array<{ label: string; url: string }>;
  trustBadgesActive?: boolean;
  branches?: Array<{ id: string; name: string; city: string; manager: string; serviceAreaRadius: number }>;
  activeBranchId?: string;
  companyVerification?: {
    gstNumber: string;
    panNumber: string;
    aadhaarNumber: string;
    licenseNumber: string;
    status: 'verified' | 'pending' | 'unverified';
  };
  brandingAssets?: {
    darkLogo: string;
    appIcon: string;
    loadingScreenActive: boolean;
    emailLogo: string;
    invoiceLogo: string;
    successColor: string;
    warningColor: string;
    dangerColor: string;
    fontSelection: string;
    buttonStyle: 'rounded' | 'square' | 'pill';
    borderStyle: 'none' | 'thin' | 'thick';
  };
  homepageSectionsOrder?: string[];
  aiProviderConfig?: {
    provider: 'gemini' | 'openai' | 'claude' | 'offline';
    monthlyLimit: number;
    usageThisMonth: number;
    knowledgeDocs: string[];
  };
  paymentConfig?: {
    methods: { upi: boolean; cash: boolean; stripe: boolean; razorpay: boolean; bank: boolean };
    gstRate: number;
    invoicePrefix: string;
    refundRules: string;
  };
  whatsappConfig?: {
    notifyBooking: boolean;
    notifyWorker: boolean;
    notifyPayment: boolean;
    apiToken: string;
  };
  localSeoConfig?: {
    nearbyCities: string[];
    localBusinessSchema: boolean;
    napMatchesProfile: boolean;
  };
  publishHistory?: Array<{ version: string; publishedAt: string; seoScore: number; performanceScore: number; status: 'active' | 'rollback' }>;
}

export interface Tenant {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  subdomain: string;
  customDomain?: string;
  status: 'active' | 'suspended' | 'pending';
  plan: SubscriptionPlan;
  industries: string[];
  theme: ThemeKey;
  config: TenantConfig;
  features: {
    crm: boolean;
    ai: boolean;
    quotation: boolean;
    emergencyBooking: boolean;
    analytics: boolean;
    marketing: boolean;
    inventory: boolean;
  };
  registeredAt: string;
}

// ─── Service ───────────────────────────────────────────────────────
export interface FormField {
  key: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea';
  label: string;
  required: boolean;
  options?: string[];
}

export interface ServiceVariant {
  id: string;
  name: string;
  price: number;
  description: string;
  bookingRule?: 'Immediate' | 'Need Inspection';
}

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  basePrice: number;
  durationMin: number;
  emergencyAllowed?: boolean;
  requiredSkills?: string[];
  formFields?: FormField[];
  isActive: boolean;
  industry?: string;
  variants?: ServiceVariant[];
  imageUrl?: string;
  isPopular?: boolean;
  rating?: number;
  ratingCount?: number;
  tags?: string[];
}

// ─── Product ───────────────────────────────────────────────────────
export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  stock: number;
  category: string;
  isActive: boolean;
  createdAt?: string;
}

// ─── Order ─────────────────────────────────────────────────────────
export interface Order {
  id: string;
  tenantId: string;
  userId?: string;
  orderNumber: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    type?: 'service' | 'product';
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentStatus: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  orderStatus: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  customerDetails: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  notes?: string;
  createdAt: string;
}

// ─── Payment ───────────────────────────────────────────────────────
export interface Payment {
  id: string;
  tenantId: string;
  userId?: string;
  orderId?: string;
  paymentGateway: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  utrNumber?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─── Worker ────────────────────────────────────────────────────────
export interface Worker {
  id: string;
  tenantId: string;
  name: string;
  skills: string[];
  availability: 'available' | 'busy' | 'offline';
  rating: number;
  aadhaarStatus: 'verified' | 'pending';
  panStatus: 'verified' | 'pending';
  currentJobsCount: number;
  phone: string;
  photoUrl: string;
  completedJobs: number;
  earningsToday: number;
  earningsMonth: number;
  joinedDate: string;
  attendanceToday: 'present' | 'absent' | 'leave' | null;
  // Premium profile fields
  showOnWebsite?: boolean;
  designation?: string;
  yearsExperience?: number;
  policeVerified?: boolean;
}

// ─── Booking ───────────────────────────────────────────────────────
export type BookingStatus =
  | 'requested' | 'quotation' | 'approved' | 'payment'
  | 'assigned' | 'on_the_way' | 'started'
  | 'completed' | 'cancelled' | 'closed';

export interface Booking {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  serviceId: string;
  serviceName: string;
  status: BookingStatus;
  scheduledDate: string;
  scheduledTime: string;
  isEmergency: boolean;
  formData: Record<string, unknown>;
  priceDetails: {
    baseVisit: number;
    distanceCharge: number;
    labour: number;
    material: number;
    emergencySurcharge: number;
    tax: number;
    discount: number;
    total: number;
  };
  workerId?: string;
  workerName?: string;
  customerRating?: number;
  customerReview?: string;
  notes?: string;
  couponCode?: string;
  createdAt: string;
}

// ─── Lead ──────────────────────────────────────────────────────────
export interface Lead {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string;
  serviceInterest: string;
  notes: string;
  status: 'new' | 'contacted' | 'quoted' | 'won' | 'lost';
  createdAt: string;
}

// ─── Customer Profile ──────────────────────────────────────────────
export interface CustomerProfile {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  address: string;
  totalBookings: number;
  totalSpend: number;
  lastService: string;
  lastBookingDate: string;
  loyaltyPoints: number;
  status: 'active' | 'inactive';
  notes: string;
}

// ─── Quotation ─────────────────────────────────────────────────────
export interface QuotationItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Quotation {
  id: string;
  tenantId: string;
  bookingId?: string;
  customerName: string;
  customerPhone: string;
  items: QuotationItem[];
  notes: string;
  validDays: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

// ─── Coupon ────────────────────────────────────────────────────────
export interface Coupon {
  id: string;
  tenantId: string;
  code: string;
  type: 'percent' | 'flat';
  value: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  validTill: string;
  applicableServices: string[];
  status: 'active' | 'paused' | 'expired';
  createdAt: string;
}

// ─── Campaign ──────────────────────────────────────────────────────
export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  type: 'whatsapp' | 'email' | 'festival';
  message: string;
  targetSegment: 'all' | 'active' | 'inactive' | 'high_value';
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  sentCount: number;
  scheduledAt?: string;
  createdAt: string;
}

// ─── Audit Log ─────────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  tenantId?: string;
  userId?: string;
  userName?: string;
  action: string;
  details?: string;
  entityType?: string;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ip?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: string;
  createdAt?: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

// ─── Industry Pack ─────────────────────────────────────────────────
export interface IndustryPack {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  theme: ThemeKey;
  defaultServices: Array<{ name: string; icon: string; price: number; duration: number; category: string; desc: string }>;
  workerSkills: string[];
  crmStages: string[];
}

// ─── Support Ticket ───────────────────────────────────────────────
export interface TicketReply {
  id: string;
  sender: 'super_admin' | 'tenant';
  senderName: string;
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  tenantId: string;
  tenantName: string;
  subject: string;
  message: string;
  category: 'billing' | 'technical' | 'feature_request' | 'other';
  status: 'open' | 'replied' | 'closed';
  createdAt: string;
  replies: TicketReply[];
}

// ─── Dynamic Website Builder Engine Types ──────────────────────────

export interface WebsiteComponent {
  id: string;
  type: 'hero' | 'stats' | 'services' | 'gallery' | 'testimonials' | 'faq' | 'video' | 'team' | 'founder' | 'awards' | 'map' | 'custom_html';
  enabled: boolean;
  settings: Record<string, any>;
}

export interface CMSPage {
  id: string;
  title: string;
  slug: string;
  components: WebsiteComponent[];
}

export interface WebsiteCampaign {
  id: string;
  heroImage: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  offerCode?: string;
  startDate: string;
  endDate: string;
  priority: number;
  targetSlug: string;
  enabled: boolean;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'pdf' | 'doc';
  url: string;
  tags: string[];
  uploadedAt: string;
}

export interface BasketItem {
  serviceId: string;
  serviceName: string;
  variantId: string;
  variantName: string;
  price: number;
  quantity: number;
}

export interface BookingDraft {
  id: string;
  tenantId: string;
  customerId: string;
  items: BasketItem[];
  address: string;
  schedule: { date: string; time: string };
  paymentMethod: 'upi' | 'card' | 'cod';
  couponCode?: string;
  status: 'basket' | 'checkout' | 'draft_pending_payment' | 'confirmed';
  totalPrice: number;
  createdAt: string;
}

export interface FooterWidget {
  id: string;
  type: 'quick_links' | 'contact_info' | 'social_media' | 'custom_html' | 'payment_methods' | 'copyright';
  title: string;
  settings: Record<string, any>;
}


