// ─── Layout & Animation Constants ────────────────────────────────────────────
// Single source of truth for all numeric values used by the mobile menu.
// Keep the SCSS counterparts ($mm-*) in mobile-menu.scss in sync with these.
export const MOBILE_MENU_MAX_WIDTH = 380; // px — matches CSS max-width
export const MOBILE_BREAKPOINT_PX = 992; // px — matches header/breakpoint.service
export const DRAWER_TRANSITION_DURATION_MS = 400;
export const DRAWER_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';
export const DRAWER_TRANSITION = `transform ${DRAWER_TRANSITION_DURATION_MS}ms ${DRAWER_EASING}`;

// Gesture defaults (overridable via MobileMenuGestureConfig)
export const GESTURE_EDGE_THRESHOLD = 30; // px from screen edge to trigger edge-swipe
export const GESTURE_OPEN_THRESHOLD = 0.3; // fraction of menu width to confirm open
export const GESTURE_MIN_SWIPE_DISTANCE = 30; // px
export const GESTURE_VELOCITY_THRESHOLD = 0.25; // px/ms
export const GESTURE_HORIZONTAL_THRESHOLD = 6; // px before locking to horizontal
export const GESTURE_VERTICAL_LOCK_THRESHOLD = 14; // px vertical movement that cancels gesture
export const GESTURE_ANGULAR_RATIO = 1.15; // |dx| > GESTURE_ANGULAR_RATIO * |dy| to confirm horizontal
export const GESTURE_VELOCITY_WINDOW_MS = 100; // ms window for instantaneous velocity
export const GESTURE_TAP_TIMEOUT_MS = 220; // ms window for tap detection
export const GESTURE_COOLDOWN_MS = 100; // ms cooldown after state transition
export const GESTURE_ELASTIC_RESISTANCE = 100; // 0-100
export const GESTURE_MAX_STRETCH_PERCENT = 4; // %

// ─── Search Constants ─────────────────────────────────────────────────────────
// Maximum number of sections auto-expanded when a search query is active.
export const SEARCH_MAX_AUTO_EXPANDED_SECTIONS = 2;

export enum DrawerState {
  CLOSED   = 'closed',
  OPENING  = 'opening',
  OPEN     = 'open',
  CLOSING  = 'closing',
  DRAGGING = 'dragging',
}

// ─── Social Links ─────────────────────────────────────────────────────────────
export const SOCIAL_LINKS = {
  linkedin:  'https://linkedin.com/company/jsl-technology',
  github:    'https://github.com/jsl-technology',
  twitter:   'https://twitter.com/jsl_tech',
  instagram: 'https://instagram.com/jsl_tech',
} as const;

// ─── External URLs ───────────────────────────────────────────────────────────
// All external hrefs in one place so domain changes only require editing here.
//
// NOTA DE MARCA: El producto se llama "Virteex" (doble 'e') internamente,
// pero el dominio registrado es "virtex.com" (una 'e'). Las rutas internas
// Angular usan "virteex" (doble 'e') para coincidir con las claves i18n.
export const EXTERNAL_URLS = {
  // Productos
  erp:           'https://virtex.com',
  pos:           'https://pos.jsl.technology',
  mobileApp:     'https://apps.jsl.technology',
  // Login / portales
  loginVirteex:  'https://app.virtex.com',
  loginClient:   'https://portal.jsl.technology',
  loginSupport:  'https://support.jsl.technology',
  // Acceso rápido
  quickSupport:  'https://support.jsl.technology',
} as const;

// ─── Menu Link Types ──────────────────────────────────────────────────────────

export interface InternalMenuLink {
  key: string;
  icon: string;
  route: (string | number)[];
}

export interface ExternalMenuLink {
  key: string;
  icon: string;
  href: string;
}

export type MobileMenuLink = InternalMenuLink | ExternalMenuLink;

export function isInternalLink(link: MobileMenuLink): link is InternalMenuLink {
  return 'route' in link;
}

export function isExternalLink(link: MobileMenuLink): link is ExternalMenuLink {
  return 'href' in link;
}

export interface MobileMenuSectionData {
  id: string;
  titleKey: string;
  links: MobileMenuLink[];
}

export function getMobileMenuSections(currentLang: string): MobileMenuSectionData[] {
  return [
    {
      id: 'services',
      titleKey: 'HEADER.SERVICES',
      links: [
        { key: 'HEADER.VIEW_ALL_SERVICES', route: [currentLang, 'solutions'], icon: 'LayoutGrid' },
        { key: 'SERVICES_LIST.WEB', route: [currentLang, 'solutions', 'web-development'], icon: 'Monitor' },
        { key: 'SERVICES_LIST.MOBILE', route: [currentLang, 'solutions', 'mobile-apps'], icon: 'Smartphone' },
        { key: 'SERVICES_LIST.DESKTOP', route: [currentLang, 'solutions', 'desktop-software'], icon: 'Laptop' },
        { key: 'SERVICES_LIST.CLOUD', route: [currentLang, 'solutions', 'cloud-architecture'], icon: 'CloudCog' },
        { key: 'HEADER.INDUSTRIES', route: [currentLang, 'industries'], icon: 'Building2' },
      ],
    },
    {
      id: 'products',
      titleKey: 'HEADER.PRODUCTS',
      links: [
        { key: 'HEADER.VIEW_ALL_PRODUCTS', route: [currentLang, 'products'], icon: 'Package' },
        { key: 'PRODUCTS_LIST.ERP',    href: EXTERNAL_URLS.erp,       icon: 'ExternalLink' },
        { key: 'PRODUCTS_LIST.POS',    href: EXTERNAL_URLS.pos,       icon: 'ExternalLink' },
        { key: 'PRODUCTS_LIST.MOBILE', href: EXTERNAL_URLS.mobileApp, icon: 'ExternalLink' },
        { key: 'HEADER.VIRTEEX_ECOSYSTEM', route: [currentLang, 'virteex-ecosystem'], icon: 'Layers' },
        { key: 'HEADER.PRICING', route: [currentLang, 'pricing'], icon: 'CircleDollarSign' },
      ],
    },
    {
      id: 'company',
      titleKey: 'FOOTER.COMPANY',
      links: [
        { key: 'HEADER.ABOUT',      route: [currentLang, 'about-us'],   icon: 'Info' },       // era 'Users'
        { key: 'HEADER.PROCESS',    route: [currentLang, 'process'],     icon: 'Workflow' },
        { key: 'HEADER.TECH_STACK', route: [currentLang, 'tech-stack'],  icon: 'Cpu' },
        { key: 'HEADER.CAREERS',    route: [currentLang, 'careers'],     icon: 'Briefcase' },
        { key: 'HEADER.PARTNERS',   route: [currentLang, 'partners'],    icon: 'Network' },   // era 'Users'
        { key: 'HEADER.LIFE_AT_JSL', route: [currentLang, 'life-at-jsl'], icon: 'Heart' },
        { key: 'HEADER.INVESTORS',  route: [currentLang, 'investors'],   icon: 'TrendingUp' },
        { key: 'HEADER.VENTURES',   route: [currentLang, 'ventures'],    icon: 'Rocket' },
        { key: 'HEADER.SECURITY',   route: [currentLang, 'security'],    icon: 'ShieldCheck' },
      ],
    },
    {
      id: 'resources',
      titleKey: 'FOOTER.RESOURCES',
      links: [
        { key: 'HEADER.PROJECTS',   route: [currentLang, 'projects'], icon: 'Lightbulb' },
        { key: 'HEADER.BLOG',       route: [currentLang, 'blog'],     icon: 'Newspaper' },
        { key: 'HEADER.EVENTS',     route: [currentLang, 'events'],   icon: 'CalendarDays' },
        { key: 'HEADER.NEWS',       route: [currentLang, 'news'],     icon: 'Radio' },
        { key: 'HEADER.PRESS',      route: [currentLang, 'press'],    icon: 'BookOpen' },
        { key: 'HEADER.ROADMAP',    route: [currentLang, 'roadmap'],  icon: 'Map' },
        { key: 'HEADER.FAQ',        route: [currentLang, 'faq'],      icon: 'HelpCircle' },
        { key: 'HEADER.DEVELOPERS', route: [currentLang, 'developers'], icon: 'Code' },
      ],
    },
    {
      id: 'login',
      titleKey: 'HEADER.LOGIN',
      links: [
        { key: 'HEADER.LOGIN_VIRTEEX', href: EXTERNAL_URLS.loginVirteex, icon: 'ExternalLink' },
        { key: 'HEADER.LOGIN_CLIENT',  href: EXTERNAL_URLS.loginClient,  icon: 'ExternalLink' },
        { key: 'HEADER.LOGIN_SUPPORT', href: EXTERNAL_URLS.loginSupport, icon: 'ExternalLink' },
      ],
    },
  ];
}
