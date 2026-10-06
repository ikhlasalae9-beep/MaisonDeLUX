import type { Locale } from '@/lib/i18n/config';

export type CityContentKey = 'casablanca' | 'rabat' | 'marrakech';

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
  marrakech: {
    fr: {
      title: 'Marrakech', subtitle: 'Tissus historiques, ville contemporaine et diversité des cadres de vie.',
      introduction: 'Une lecture urbaine de Marrakech, de sa médina à ses quartiers contemporains.',
      architecture: 'Le patrimoine bâti et les formes urbaines contemporaines invitent à situer chaque logement dans son propre contexte.',
      realEstateContext: 'Les statistiques locales et l’estimation immobilière sont en préparation, sans prix ni prédiction de substitution.',
      neighborhoodsTitle: 'Repères urbains', neighborhoods: ['Médina', 'Guéliz', 'Hivernage', 'Agdal', 'Ménara'],
      imageDescriptions: ['Patrimoine bâti', 'Architecture de Marrakech', 'Vie urbaine', 'Tissu de la médina'],
      estimationCta: 'Estimation bientôt disponible', availabilityMessage: 'La lecture de la ville est disponible. L’estimation locale sera ouverte après validation du service dédié.',
      seo: { title: 'Marrakech — MaisonDeLUX', description: 'Découvrez Marrakech, son patrimoine bâti, ses cadres urbains et la lecture immobilière MaisonDeLUX. Estimation locale bientôt disponible.' },
    },
    ar: {
      title: 'مراكش', subtitle: 'أنسجة تاريخية، مدينة معاصرة وتنوع في فضاءات العيش.',
      introduction: 'قراءة حضرية لمراكش، من المدينة العتيقة إلى أحيائها المعاصرة.',
      architecture: 'يدعو التراث المبني والأشكال الحضرية المعاصرة إلى فهم كل مسكن ضمن سياقه الخاص.',
      realEstateContext: 'الإحصاءات المحلية والتقييم العقاري قيد الإعداد، دون أسعار أو تنبؤات بديلة.',
      neighborhoodsTitle: 'معالم حضرية', neighborhoods: ['المدينة العتيقة', 'كليز', 'الحي الشتوي', 'أكدال', 'المنارة'],
      imageDescriptions: ['تراث مبني', 'عمارة مراكش', 'حياة حضرية', 'نسيج المدينة العتيقة'],
      estimationCta: 'التقييم العقاري متاح قريباً', availabilityMessage: 'القراءة الحضرية للمدينة متاحة. ستُفتح خدمة التقييم المحلي بعد التحقق من الخدمة المخصصة.',
      seo: { title: 'مراكش — MaisonDeLUX', description: 'اكتشفوا مراكش وتراثها المبني وفضاءاتها الحضرية والقراءة العقارية من MaisonDeLUX. التقييم المحلي متاح قريباً.' },
    },
  },
  rabat: {
    fr: {
      title: 'Rabat', subtitle: 'Capitale administrative, horizons atlantiques et patrimoine vivant.',
      introduction: 'Entre l’Atlantique et le Bouregreg, Rabat associe une ville historique à des espaces urbains contemporains. Découvrez son identité et ses quartiers, avant l’ouverture des services immobiliers locaux.',
      architecture: 'Des remparts de la médina aux avenues contemporaines, Rabat présente des paysages architecturaux variés. La kasbah des Oudayas et la tour Hassan participent à une identité où le patrimoine côtoie la ville moderne.',
      realEstateContext: 'Le cadre résidentiel varie selon les quartiers, le type de bien et ses caractéristiques. MaisonDeLUX prépare un service dédié à Rabat ; aucune estimation ni statistique de prix n’est publiée à ce stade.',
      neighborhoodsTitle: 'Quartiers de référence', neighborhoods: ['Agdal', 'Hay Riad', 'Hassan', 'Souissi', 'Yacoub El Mansour'],
      imageDescriptions: ['Un regard sur Rabat', 'Patrimoine et cadre urbain', 'Perspectives de la capitale', 'Une ville ouverte sur l’Atlantique'],
      estimationCta: 'Estimation bientôt disponible', availabilityMessage: 'L’estimation immobilière à Rabat sera disponible prochainement. Découvrez dès maintenant la ville et ses repères géographiques.',
      seo: { title: 'Rabat — MaisonDeLUX', description: 'Découvrez Rabat, son patrimoine, ses quartiers et ses arrondissements. L’estimation immobilière MaisonDeLUX sera bientôt disponible.' },
    },
    ar: {
      title: 'الرباط', subtitle: 'العاصمة الإدارية، آفاق أطلسية وتراث حيّ.',
      introduction: 'بين المحيط الأطلسي وأبي رقراق، تجمع الرباط بين المدينة التاريخية والفضاءات الحضرية المعاصرة. اكتشفوا هويتها وأحياءها قبل إطلاق الخدمات العقارية المحلية.',
      architecture: 'من أسوار المدينة العتيقة إلى الشوارع المعاصرة، تتنوع المشاهد المعمارية في الرباط. وتساهم قصبة الأوداية وصومعة حسان في هوية تجمع التراث بالحياة الحضرية الحديثة.',
      realEstateContext: 'يختلف الطابع السكني باختلاف الأحياء وأنواع العقارات وخصائصها. تُعدّ MaisonDeLUX خدمة مخصصة للرباط، ولا تنشر حالياً أي تقديرات عقارية أو إحصاءات للأسعار.',
      neighborhoodsTitle: 'أحياء مرجعية', neighborhoods: ['أكدال', 'حي الرياض', 'حسان', 'السويسي', 'يعقوب المنصور'],
      imageDescriptions: ['إطلالة على الرباط', 'التراث والمشهد الحضري', 'مشاهد من العاصمة', 'مدينة منفتحة على الأطلسي'],
      estimationCta: 'التقييم العقاري متاح قريباً', availabilityMessage: 'ستتوفر خدمة التقييم العقاري في الرباط قريباً. اكتشفوا الآن المدينة ومعالمها الجغرافية.',
      seo: { title: 'الرباط — MaisonDeLUX', description: 'اكتشفوا الرباط وتراثها وأحياءها ومقاطعاتها. خدمة التقييم العقاري من MaisonDeLUX متاحة قريباً.' },
    },
  },
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
