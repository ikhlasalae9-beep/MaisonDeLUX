export interface CityMediaConfig {
  id: string;
  images: string[];
  fallback: string;
}

export const CITY_MEDIA_CONFIG: Record<string, CityMediaConfig> = {
  casablanca: {
    id: 'casablanca',
    images: ['/media/cities/casablanca/casa-1.jpg'],
    fallback: '/media/cities/fallback.jpg',
  },
  rabat: {
    id: 'rabat',
    images: ['/media/cities/rabat/rabat-1.jpg'],
    fallback: '/media/cities/fallback.jpg',
  },
  marrakech: {
    id: 'marrakech',
    images: ['/media/cities/marrakech/marrakech-1.jpg'],
    fallback: '/media/cities/fallback.jpg',
  },
  tanger: {
    id: 'tanger',
    images: ['/media/cities/tanger/tanger-1.jpg'],
    fallback: '/media/cities/fallback.jpg',
  },
  agadir: {
    id: 'agadir',
    images: ['/media/cities/agadir/agadir-1.jpg'],
    fallback: '/media/cities/fallback.jpg',
  },
  fes: {
    id: 'fes',
    images: ['/media/cities/fes/fes-1.jpg'],
    fallback: '/media/cities/fallback.jpg',
  },
  meknes: {
    id: 'meknes',
    images: ['/media/cities/meknes/meknes-1.jpg'],
    fallback: '/media/cities/fallback.jpg',
  },
  oujda: {
    id: 'oujda',
    images: ['/media/cities/oujda/oujda-1.jpg'],
    fallback: '/media/cities/fallback.jpg',
  },
  tetouan: {
    id: 'tetouan',
    images: ['/media/cities/tetouan/tetouan-1.jpg'],
    fallback: '/media/cities/fallback.jpg',
  },
};
