export interface NavLink {
  href: string;
  labelFr: string;
  labelAr: string;
}

export const NAV_LINKS: NavLink[] = [
  {
    href: '/cities',
    labelFr: 'Territoires',
    labelAr: 'المناطق الجغرافية',
  },
  {
    href: '#demarche',
    labelFr: 'Démarche',
    labelAr: 'منهجية العمل',
  },
  {
    href: '#pourquoi',
    labelFr: 'Pourquoi MaisonDeLUX',
    labelAr: 'لماذا MaisonDeLUX',
  },
  {
    href: '#methodologie',
    labelFr: 'Transparence & Données',
    labelAr: 'الشفافية والبيانات',
  },
];
