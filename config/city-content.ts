import type { Locale } from '@/lib/i18n/config';

export type CityContentKey = 'casablanca';

export interface CityPageCopy {
  title: string;
  subtitle: string;
  introduction: string;
  architecture: string;
  realEstateContext: string;
  neighborhoodsTitle: string;
  neighborhoods: readonly string[];
  imageDescriptions: readonly string[];
  estimationCta: string;
  availabilityMessage: string;
  seo: { title: string; description: string };
}

export interface LocalizedCityContent {
  fr: CityPageCopy;
  ar: CityPageCopy;
}

export const CITY_CONTENT: Record<CityContentKey, LocalizedCityContent> = {
  casablanca: {
    fr: {
      title: 'Casablanca',
      subtitle: 'Métropole atlantique, architecture plurielle et cœur économique du Maroc.',
      introduction: 'Découvrez Casablanca à travers son identité urbaine, ses quartiers et son patrimoine architectural.',
      architecture: 'La ville conjugue héritage Art déco, modernisme et création architecturale contemporaine.',
      realEstateContext: 'Le service local s’appuie sur un modèle dédié à Casablanca et n’est jamais utilisé pour estimer une autre ville.',
      neighborhoodsTitle: 'Quartiers de référence',
      neighborhoods: ['Maârif', 'Anfa', 'Gauthier', 'Racine', 'Californie'],
      imageDescriptions: [
        'Architecture urbaine à Casablanca',
        'Perspective architecturale de Casablanca',
        'Paysage bâti de Casablanca',
        'Détail du cadre urbain casablancais',
        'Ambiance architecturale de Casablanca',
      ],
      estimationCta: 'Estimer un bien à Casablanca',
      availabilityMessage: 'Service d’estimation disponible à Casablanca',
      seo: { title: 'Casablanca — MaisonDeLUX', description: 'Découvrez Casablanca et la future expérience locale MaisonDeLUX.' },
    },
    ar: {
      title: 'الدار البيضاء',
      subtitle: 'حاضرة أطلسية ذات عمارة متنوعة، وقلب المغرب الاقتصادي.',
      introduction: 'اكتشفوا الدار البيضاء من خلال هويتها الحضرية وأحيائها وتراثها المعماري.',
      architecture: 'تجمع المدينة بين إرث الآرت ديكو والحداثة والإبداع المعماري المعاصر.',
      realEstateContext: 'تعتمد الخدمة المحلية على نموذج مخصص للدار البيضاء، ولا يُستخدم أبداً لتقييم عقار في مدينة أخرى.',
      neighborhoodsTitle: 'أحياء مرجعية',
      neighborhoods: ['المعاريف', 'أنفا', 'غوتييه', 'راسين', 'كاليفورنيا'],
      imageDescriptions: [
        'عمارة حضرية في الدار البيضاء',
        'منظور معماري لمدينة الدار البيضاء',
        'مشهد عمراني في الدار البيضاء',
        'تفصيل من النسيج الحضري للدار البيضاء',
        'أجواء معمارية في الدار البيضاء',
      ],
      estimationCta: 'تقييم عقار في الدار البيضاء',
      availabilityMessage: 'خدمة التقييم متاحة في الدار البيضاء',
      seo: { title: 'الدار البيضاء — MaisonDeLUX', description: 'اكتشفوا الدار البيضاء وتجربة MaisonDeLUX المحلية القادمة.' },
    },
  },
};

export function getCityContent(key: CityContentKey, locale: string): CityPageCopy {
  return CITY_CONTENT[key][locale === 'ar' ? 'ar' : 'fr'];
}

export function isSupportedContentLocale(locale: string): locale is Locale {
  return locale === 'fr' || locale === 'ar';
}
