import type { Locale } from '@/lib/i18n/config';

export type LocalizedMediaText = Record<Locale, string>;
export type CityMediaKey = 'casablanca' | 'marrakech';

export interface ImageMedia {
  id: string;
  src: string;
  alt: LocalizedMediaText;
  caption?: LocalizedMediaText;
  provenance?: string;
}

export interface VideoMedia {
  src: string;
  poster: string | null;
  ariaLabel: LocalizedMediaText;
}

export interface CityMediaConfig {
  id: string;
  hero: VideoMedia | null;
  gallery: readonly ImageMedia[];
  fallback: string;
  /** Compatibility list consumed by the existing landing-page cards. */
  images: readonly string[];
}

const BRAND_FALLBACK = '/brand/logo/maisondelux-logo-primary.png';

export const LANDING_MEDIA_CONFIG = {
  hero: {
    dark: '/media/landing/hero-dark.webm',
    light: '/media/landing/hero-light.webm',
    type: 'video/webm',
    darkPoster: '/media/landing/hero-dark-poster.jpg',
    lightPoster: '/media/landing/hero-light-poster.jpg',
  },
} as const;

const casablancaGallery: readonly ImageMedia[] = [
  { id: 'casablanca-1', src: '/media/cities/casablanca/casa-image1.jpg', alt: { fr: 'Vue urbaine de Casablanca ouverte sur l’Atlantique', ar: 'مشهد حضري للدار البيضاء منفتح على المحيط الأطلسي' }, provenance: 'Existing project asset; no embedded stock licensor metadata detected.' },
  { id: 'casablanca-2', src: '/media/cities/casablanca/casa-image2.jpg', alt: { fr: 'Boulevard casablancais au crépuscule', ar: 'شارع في الدار البيضاء عند الغروب' }, provenance: 'Existing project asset; no embedded stock licensor metadata detected.' },
  { id: 'casablanca-3', src: '/media/cities/casablanca/casa-image3.jpg', alt: { fr: 'Front de mer et paysage bâti de Casablanca', ar: 'الواجهة البحرية والنسيج العمراني للدار البيضاء' }, provenance: 'Existing project asset; no embedded stock licensor metadata detected.' },
];

/** Preserved on disk but intentionally excluded from public rendering pending licensing review. */
export const EXCLUDED_CASABLANCA_MEDIA = [
  { src: '/media/cities/casablanca/casa-image4.jpg', reason: 'Getty Images metadata; metadata describes a Rabat subject.' },
  { src: '/media/cities/casablanca/casa-image5.jpg', reason: 'Getty Images metadata; commercial publication rights not established.' },
] as const;

const marrakechGallery: readonly ImageMedia[] = [
  { id: 'marrakech-1', src: '/media/cities/marrakech/marrakech-1.jpg', alt: { fr: 'Architecture à Marrakech', ar: 'عمارة في مراكش' } },
];

export const CITY_MEDIA_CONFIG: Record<string, CityMediaConfig> = {
  casablanca: {
    id: 'casablanca',
    hero: {
      src: '/media/cities/casablanca/Casablanca-hero-web.mp4',
      poster: '/media/cities/casablanca/Casablanca-hero-poster.jpg',
      ariaLabel: { fr: 'Présentation vidéo de Casablanca', ar: 'عرض مرئي لمدينة الدار البيضاء' },
    },
    gallery: casablancaGallery,
    images: casablancaGallery.map((asset) => asset.src),
    fallback: BRAND_FALLBACK,
  },
  marrakech: {
    id: 'marrakech',
    hero: null,
    gallery: marrakechGallery,
    images: marrakechGallery.map((asset) => asset.src),
    fallback: BRAND_FALLBACK,
  },
  ...Object.fromEntries(
    ['rabat', 'tanger', 'agadir', 'fes', 'meknes', 'oujda', 'tetouan'].map((id) => [
      id,
      { id, hero: null, gallery: [], images: [], fallback: BRAND_FALLBACK },
    ])
  ),
};

export function localizedMediaText(text: LocalizedMediaText, locale: string): string {
  return text[locale === 'ar' ? 'ar' : 'fr'];
}

export function getCityMedia(key: CityMediaKey | null): CityMediaConfig | null {
  return key ? CITY_MEDIA_CONFIG[key] ?? null : null;
}

export function cityImageSource(media: CityMediaConfig, index: number): string {
  return media.gallery[index]?.src ?? media.fallback;
}
