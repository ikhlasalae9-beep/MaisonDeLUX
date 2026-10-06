import type { Locale } from '@/lib/i18n/config';
import type { CityEditorialCopy } from './city-editorial';

/** City-specific inputs only; institutional sources verified on 2026-10-06. */
export const MARRAKECH_EDITORIAL: Record<Locale, CityEditorialCopy> = {
  fr: {
    kicker: 'Regards immobiliers sur Marrakech',
    dek: 'Une lecture de la ville par son habitat, ses héritages bâtis et ses formes contemporaines, pour replacer chaque bien dans son contexte.',
    regionalFact: { value: '1985', label: 'inscription de la médina au patrimoine mondial', context: 'UNESCO — Médina de Marrakech. Ce repère concerne le patrimoine inscrit, pas une mesure des prix immobiliers.' },
    sections: [
      { id: 'territoire', imageIndex: 0, eyebrow: '01 · Territoire', title: 'Marrakech, une ville à lire au-delà de son image', paragraphs: [
        'Le dossier de l’UNESCO situe Marrakech dans une histoire de centralité politique, économique et culturelle. La médina conserve un tissu où habitat, commerces, artisanat et espaces publics participent à une même vie urbaine.',
        'Pour MaisonDeLUX, une adresse doit être comprise à cette échelle quotidienne : accès au logement, organisation du bâti et environnement immédiat. La notoriété de la ville ne permet pas, à elle seule, de comparer deux biens ou de déduire leur valeur.'
      ] },
      { id: 'architecture', imageIndex: 1, eyebrow: '02 · Cadre bâti', title: 'Des tissus historiques aux formes urbaines contemporaines', paragraphs: [
        'L’UNESCO documente les remparts, les monuments, les grandes demeures et les jardins qui composent le patrimoine marrakchi. L’Office National Marocain du Tourisme distingue aussi la médina des cadres plus contemporains de Guéliz et de l’Hivernage.',
        'Cette coexistence invite à décrire précisément le bien : maison du tissu ancien, appartement ou villa ne se lisent pas de la même manière. Les matériaux, la distribution, la surface et l’entretien doivent être examinés, sans transformer un nom de quartier en garantie de qualité ou de rendement.'
      ] },
      { id: 'market', imageIndex: 2, eyebrow: '03 · Marché', title: 'Distinguer contexte urbain et preuve immobilière', paragraphs: [
        'L’Indice des prix des actifs immobiliers de Bank Al-Maghrib et de l’ANCFCC repose sur les transactions enregistrées et la méthode des ventes répétées. Un indice décrit une évolution ; il n’est pas une grille de prix pour tous les logements d’un quartier.',
        'Les annonces décrivent des prix demandés et un marché visible, pas les montants réellement négociés. MaisonDeLUX prépare les services locaux de Marrakech : aucune médiane de prix, aucun classement de quartiers ni aucune prédiction n’est présenté avant validation des données et du service dédié.'
      ] },
    ],
    neighborhoodsTitle: 'Quartiers et repères du cadre urbain',
    neighborhoodsIntro: 'Une lecture du territoire, sans hiérarchie de prix. Les repères patrimoniaux et les quartiers sont distingués des arrondissements administratifs ; aucune correspondance n’est déduite des noms.',
    neighborhoods: [
      { name: 'Médina', description: 'Habitat ancien et activités du quotidien coexistent dans le tissu historique décrit par l’UNESCO.' },
      { name: 'Guéliz', description: 'Un repère de la ville contemporaine cité par l’Office National Marocain du Tourisme, à lire à l’échelle du bien et de son adresse.' },
      { name: 'Hivernage', description: 'Un autre cadre contemporain identifié par la même source. Son nom ne constitue ni un prix de référence ni une promesse de rendement.' },
      { name: 'Agdal · repère patrimonial', description: 'Les jardins de l’Aguedal figurent dans le dossier patrimonial. Cette mention ne définit pas les limites d’un quartier résidentiel.' },
      { name: 'Ménara · repère paysager', description: 'Les jardins et le pavillon de la Ménara sont des repères patrimoniaux, à distinguer du périmètre administratif du même nom.' },
    ],
    factorsTitle: 'Préparer une lecture immobilière responsable',
    factorsIntro: 'Ces repères aident à décrire le bien avant une analyse locale. Les informations du futur service d’estimation seront précisées lors de son ouverture.',
    factors: [
      { name: 'Typologie', description: 'Identifier l’usage et le type réel du bien avant de choisir des références comparables.' },
      { name: 'Adresse et environnement', description: 'Situer le logement et ses accès, sans attribuer un arrondissement à partir d’un simple nom.' },
      { name: 'Surface', description: 'Vérifier la mesure déclarée et distinguer les espaces concernés.' },
      { name: 'Organisation intérieure', description: 'Décrire les pièces et la distribution réelle plutôt que se fier à une catégorie commerciale.' },
      { name: 'État et entretien', description: 'Documenter la condition du bâti et les travaux éventuels, au-delà de la photographie.' },
      { name: 'Documents et usage', description: 'Examiner la situation juridique, les documents techniques et l’usage prévu du bien.' },
    ],
    methodologyNote: 'Aucune estimation n’est disponible pour Marrakech à ce stade. Le futur service précisera ses informations acceptées et ses limites après validation. Aucun modèle d’une autre ville ne remplace ce service.',
    conclusionTitle: 'Le contexte local avant le chiffre',
    conclusionBody: 'L’expérience Marrakech fournit aujourd’hui une lecture urbaine et des repères de méthode. Une analyse chiffrée devra documenter sa population d’annonces et sa couverture. La visite du bien, ses documents et les conditions de négociation demeurent indispensables.',
    sourcesTitle: 'Sources éditoriales',
    sourcesIntro: 'Sources institutionnelles pour le patrimoine, le contraste des cadres urbains et la méthode des indices. Aucun chiffre de marché local n’en est repris.',
    sources: [
      { title: 'Médina de Marrakech', organization: 'UNESCO — Centre du patrimoine mondial', href: 'https://whc.unesco.org/fr/list/331/', note: 'Inscription en 1985, habitat ancien, monuments et jardins ; périmètre patrimonial distinct des arrondissements.' },
      { title: 'Modernité et tradition au Maroc', organization: 'Office National Marocain du Tourisme', href: 'https://www.visitmorocco.com/fr/decouvrir-le-maroc/maroc-moderne', note: 'Distinction entre médina, Guéliz et Hivernage. Utilisée pour le contexte urbain, pas pour des affirmations de prix ou de rendement.' },
      { title: 'Indice des prix des actifs immobiliers — note technique', organization: 'ANCFCC & Bank Al-Maghrib', href: 'https://www.ancfcc.gov.ma/media/32591/ipai-t1-2021.pdf#page=4', note: 'Note technique du bulletin T1 2021 : transactions et ventes répétées. Aucune statistique historique n’est réutilisée comme donnée actuelle.' },
    ],
    captions: ['Patrimoine bâti et espaces ouverts dans le paysage marrakchi.', 'Les détails du bâti historique demandent une lecture attentive.', 'La place Jamaâ El Fna, un espace de vie urbaine au crépuscule.'],
  },
  ar: {
    kicker: 'نظرات عقارية على مراكش',
    dek: 'قراءة للمدينة من خلال سكنها وإرثها المبني وأشكالها المعاصرة، لفهم كل عقار ضمن سياقه.',
    regionalFact: { value: '1985', label: 'إدراج المدينة العتيقة في قائمة التراث العالمي', context: 'اليونسكو — مدينة مراكش. يخص هذا المعلم التراث المدرج، وليس قياساً للأسعار العقارية.' },
    sections: [
      { id: 'territoire', imageIndex: 0, eyebrow: '01 · المجال', title: 'مراكش، قراءة تتجاوز الصورة الشائعة', paragraphs: [
        'يضع ملف اليونسكو مراكش ضمن تاريخ من المركزية السياسية والاقتصادية والثقافية. وتحتفظ المدينة العتيقة بنسيج تتداخل فيه المساكن والتجارة والحرف والفضاءات العامة ضمن حياة حضرية واحدة.',
        'تقرأ MaisonDeLUX العنوان على مستوى الحياة اليومية: الوصول إلى المسكن وتنظيم المبنى والمحيط المباشر. فشهرة المدينة لا تكفي وحدها للمقارنة بين عقارين أو لاستنتاج قيمتهما.'
      ] },
      { id: 'architecture', imageIndex: 1, eyebrow: '02 · النسيج المبني', title: 'من الأنسجة التاريخية إلى الأشكال الحضرية المعاصرة', paragraphs: [
        'توثق اليونسكو الأسوار والمعالم والدور الكبيرة والحدائق التي تشكل تراث مراكش. ويميز المكتب الوطني المغربي للسياحة أيضاً بين المدينة العتيقة والفضاءات الأكثر حداثة في كليز والحي الشتوي.',
        'يدعو هذا التجاور إلى وصف العقار بدقة؛ فالمنزل في النسيج القديم والشقة والفيلا لا تُقرأ بالطريقة نفسها. وينبغي فحص المواد والتوزيع والمساحة والصيانة، دون تحويل اسم الحي إلى ضمان للجودة أو للمردودية.'
      ] },
      { id: 'market', imageIndex: 2, eyebrow: '03 · السوق', title: 'التمييز بين السياق الحضري والدليل العقاري', paragraphs: [
        'يعتمد مؤشر أسعار الأصول العقارية لبنك المغرب والوكالة الوطنية للمحافظة العقارية على المعاملات المسجلة ومنهجية المبيعات المتكررة. يصف المؤشر تطوراً، ولا يمثل شبكة أسعار لجميع مساكن الحي.',
        'تصف الإعلانات أسعاراً مطلوبة وعرضاً ظاهراً، ولا تثبت المبالغ المتفاوض عليها فعلياً. تُعدّ MaisonDeLUX الخدمات المحلية لمراكش، ولا تعرض أي أسعار وسيطة أو ترتيب للأحياء أو تنبؤات قبل التحقق من البيانات والخدمة المخصصة.'
      ] },
    ],
    neighborhoodsTitle: 'أحياء ومعالم من الإطار الحضري',
    neighborhoodsIntro: 'قراءة للمجال دون ترتيب للأسعار. تُميز المعالم التراثية والأحياء عن المقاطعات الإدارية، ولا يُستنتج الربط بينها من تشابه الأسماء.',
    neighborhoods: [
      { name: 'المدينة العتيقة', description: 'يتجاور السكن القديم والأنشطة اليومية في النسيج التاريخي الذي تصفه اليونسكو.' },
      { name: 'كليز', description: 'معلم من المدينة المعاصرة يذكره المكتب الوطني المغربي للسياحة، ويجب فهمه على مستوى العقار وعنوانه.' },
      { name: 'الحي الشتوي', description: 'إطار معاصر آخر تحدده المؤسسة نفسها. ولا يشكل اسمه سعراً مرجعياً أو وعداً بالمردودية.' },
      { name: 'أكدال · معلم تراثي', description: 'ترد حدائق أكدال في الملف التراثي، ولا تحدد هذه الإشارة حدود حي سكني.' },
      { name: 'المنارة · معلم من المشهد الطبيعي', description: 'تشكل حدائق المنارة وجناحها معالم تراثية، وهي متميزة عن الحدود الإدارية للمقاطعة التي تحمل الاسم نفسه.' },
    ],
    factorsTitle: 'الاستعداد لقراءة عقارية مسؤولة',
    factorsIntro: 'تساعد هذه المعالم على وصف العقار قبل تحليله محلياً. ستُوضح المعلومات المطلوبة لخدمة التقييم المقبلة عند إطلاقها.',
    factors: [
      { name: 'نوع العقار', description: 'تحديد الاستخدام والنوع الفعلي للعقار قبل اختيار المراجع القابلة للمقارنة.' },
      { name: 'العنوان والمحيط', description: 'تحديد موقع المسكن ومداخله، دون استنتاج المقاطعة من اسم مجرد.' },
      { name: 'المساحة', description: 'التحقق من القياس المصرح به والتمييز بين الفضاءات التي يشملها.' },
      { name: 'التنظيم الداخلي', description: 'وصف الغرف والتوزيع الفعلي بدلاً من الاكتفاء بتسمية تجارية.' },
      { name: 'الحالة والصيانة', description: 'توثيق حالة المبنى والأشغال المحتملة، وعدم الاكتفاء بالصورة.' },
      { name: 'الوثائق والاستخدام', description: 'فحص الوضعية القانونية والوثائق التقنية والاستخدام المقصود للعقار.' },
    ],
    methodologyNote: 'لا تتوفر خدمة تقييم لمراكش حالياً. ستحدد الخدمة المقبلة المعلومات المقبولة وحدودها بعد التحقق. ولا يُستخدم نموذج مدينة أخرى بديلاً عنها.',
    conclusionTitle: 'السياق المحلي قبل الرقم',
    conclusionBody: 'تقدم تجربة مراكش اليوم قراءة حضرية ومعالم منهجية. وسيستلزم التحليل الرقمي توثيق بيانات الإعلانات وتغطيتها. وتظل المعاينة ووثائق العقار وشروط التفاوض ضرورية.',
    sourcesTitle: 'المصادر التحريرية',
    sourcesIntro: 'مصادر مؤسساتية للتراث وتباين الأطر الحضرية ومنهجية المؤشرات. لا تُنقل منها أي أرقام للسوق المحلية.',
    sources: [
      { title: 'مدينة مراكش', organization: 'اليونسكو — مركز التراث العالمي', href: 'https://whc.unesco.org/fr/list/331/', note: 'الإدراج سنة 1985 والسكن القديم والمعالم والحدائق؛ المجال التراثي متميز عن المقاطعات.' },
      { title: 'Modernité et tradition au Maroc', organization: 'المكتب الوطني المغربي للسياحة', href: 'https://www.visitmorocco.com/fr/decouvrir-le-maroc/maroc-moderne', note: 'الحداثة والتقاليد في المغرب: التمييز بين المدينة العتيقة وكليز والحي الشتوي. مرجع للسياق الحضري، دون ادعاءات عن الأسعار أو المردودية. حُفظ عنوان المصدر الفرنسي كما نشرته المؤسسة.' },
      { title: 'مؤشر أسعار الأصول العقارية — مذكرة تقنية', organization: 'المحافظة العقارية وبنك المغرب', href: 'https://www.ancfcc.gov.ma/media/32591/ipai-t1-2021.pdf#page=4', note: 'المذكرة التقنية لنشرة الربع الأول من 2021: المعاملات والمبيعات المتكررة. لا تُستخدم الأرقام التاريخية بياناتٍ راهنة.' },
    ],
    captions: ['تراث مبني وفضاءات مفتوحة في مشهد مراكش.', 'تستدعي تفاصيل المباني التاريخية قراءة دقيقة.', 'ساحة جامع الفنا، فضاء للحياة الحضرية عند الغروب.'],
  },
};
