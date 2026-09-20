import type { Locale } from '@/lib/i18n/config';

export interface EditorialSection {
  id: string;
  eyebrow: string;
  title: string;
  paragraphs: readonly string[];
}

export interface EditorialNeighborhood { name: string; description: string }
export interface EditorialFactor { name: string; description: string }
export interface EditorialSource { title: string; organization: string; href: string; note: string }

export interface CasablancaEditorialCopy {
  kicker: string;
  dek: string;
  regionalFact: { value: string; label: string; context: string };
  sections: readonly EditorialSection[];
  neighborhoodsTitle: string;
  neighborhoodsIntro: string;
  neighborhoods: readonly EditorialNeighborhood[];
  factorsTitle: string;
  factorsIntro: string;
  factors: readonly EditorialFactor[];
  methodologyNote: string;
  conclusionTitle: string;
  conclusionBody: string;
  sourcesTitle: string;
  sourcesIntro: string;
  sources: readonly EditorialSource[];
  captions: readonly string[];
}

export const CASABLANCA_EDITORIAL: Record<Locale, CasablancaEditorialCopy> = {
  fr: {
    kicker: 'Regards immobiliers sur Casablanca',
    dek: 'Une lecture de la métropole par son littoral, son architecture, ses quartiers et les données nécessaires à une estimation responsable.',
    regionalFact: { value: '7,69 M', label: 'habitants dans la région en 2024', context: 'Donnée régionale Casablanca-Settat — HCP, RGPH 2024. Elle ne désigne pas la seule ville de Casablanca.' },
    sections: [
      {
        id: 'metropole', eyebrow: '01 · Territoire', title: 'Casablanca, une métropole aux multiples visages',
        paragraphs: [
          'Casablanca se lit d’abord dans sa relation à l’Atlantique. Le littoral, le port, les grands axes et les extensions successives composent une géographie métropolitaine qui ne se résume ni à son centre historique ni à un seul quartier d’affaires.',
          'Le rapport régional 2025 du Haut-Commissariat au Plan situe cette réalité dans un ensemble plus vaste : Casablanca-Settat comptait près de 7,69 millions d’habitants en 2024 et concentrait 24,4 % de la population urbaine nationale. Ces chiffres concernent la région, non la ville seule, mais ils éclairent la pression exercée sur le logement, la mobilité et l’aménagement.'
        ],
      },
      {
        id: 'architecture', eyebrow: '02 · Cadre bâti', title: 'Une architecture entre héritage et modernité',
        paragraphs: [
          'Le paysage casablancais juxtapose médina, compositions néo-mauresques, immeubles Art déco, modernisme du XXe siècle et programmes résidentiels contemporains. Le portail officiel de la ville retrace notamment le passage des expressions décoratives des années 1920 à une architecture plus dépouillée dans les années 1930, puis l’affirmation du modernisme dans les décennies suivantes.',
          'Cette superposition influence directement la lecture d’un bien : époque constructive, distribution intérieure, qualité des parties communes, rapport à la rue et état d’entretien ne racontent pas la même chose d’un immeuble à l’autre.'
        ],
      },
      {
        id: 'market', eyebrow: '03 · Marché', title: 'Comprendre le marché immobilier casablancais',
        paragraphs: [
          'Deux familles d’information doivent être distinguées. L’Indice des prix des actifs immobiliers, publié par Bank Al-Maghrib et l’ANCFCC, repose sur les données de transactions foncières et une méthode de ventes répétées. Il mesure une évolution indicielle ; il ne fournit pas un prix universel au mètre carré pour toute la ville.',
          'Les annonces en ligne décrivent, elles, des prix demandés. Elles renseignent sur l’offre visible mais ne prouvent pas le montant finalement signé. Le modèle MaisonDeLUX travaille sur des données d’annonces : son résultat doit donc être lu comme un repère statistique indicatif, jamais comme un prix de transaction garanti.'
        ],
      },
    ],
    neighborhoodsTitle: 'Les quartiers et leurs caractéristiques',
    neighborhoodsIntro: 'Ces repères décrivent des formes urbaines et résidentielles. Ils ne constituent ni un classement ni une grille de prix.',
    neighborhoods: [
      { name: 'Centre-ville & Mers Sultan', description: 'Tissu dense, immeubles de périodes variées, commerces et forte présence du patrimoine du XXe siècle.' },
      { name: 'Maârif, Racine & Gauthier', description: 'Quartiers centraux où habitat collectif, bureaux, commerces et transformations d’immeubles se côtoient.' },
      { name: 'Anfa & Aïn Diab', description: 'Secteurs occidentaux marqués par le littoral, des parcelles résidentielles plus amples et des typologies hétérogènes.' },
      { name: 'Oasis & Californie', description: 'Environnements résidentiels où villas, résidences fermées et immeubles plus récents forment un paysage discontinu.' },
      { name: 'Casablanca Finance City', description: 'Nouveau pôle métropolitain mêlant bureaux, logements collectifs et connexions aux grands axes.' },
    ],
    factorsTitle: 'Quels facteurs interviennent dans une estimation ?',
    factorsIntro: 'Le formulaire public reprend uniquement les variables du contrat d’inférence Casablanca v1.',
    factors: [
      { name: 'Type de bien', description: 'Appartement ou villa, selon les seules catégories actuellement admises.' },
      { name: 'Localisation', description: 'Quartier choisi dans le vocabulaire vérifié du modèle Casablanca.' },
      { name: 'Surface', description: 'Surface déclarée, transformée par l’adaptateur conformément au manifeste validé.' },
      { name: 'Distribution', description: 'Nombre de pièces, chambres et salles de bain.' },
      { name: 'Étage', description: 'Niveau déclaré du logement, avec le traitement défini dans le contrat.' },
      { name: 'État et ancienneté', description: 'État actuel et tranche d’âge, facultatifs lorsque l’information n’est pas connue.' },
    ],
    methodologyNote: 'Le modèle ne reçoit ni vue mer, ni parking, ni rendement locatif, ni proximité déclarative d’un équipement. Ces éléments ne sont donc pas présentés comme facteurs de calcul.',
    conclusionTitle: 'Une estimation indicative, fondée sur les données',
    conclusionBody: 'L’estimation MaisonDeLUX fournit un ordre de grandeur statistique issu du modèle local. Une visite, l’état juridique du bien, les documents techniques et les conditions réelles de négociation restent indispensables à une décision immobilière.',
    sourcesTitle: 'Sources éditoriales',
    sourcesIntro: 'Sources institutionnelles consultées pour les éléments de contexte. Les données régionales sont identifiées comme telles.',
    sources: [
      { title: 'Rapport régional Casablanca-Settat 2025', organization: 'Haut-Commissariat au Plan', href: 'https://www.hcp.ma/file/245559/', note: 'Démographie, urbanisation et contexte régional — données 2024.' },
      { title: 'Patrimoine architectural de Casablanca', organization: 'Ville de Casablanca', href: 'https://www.casablancacity.ma/fr/categorie/104', note: 'Repères sur les périodes architecturales de la ville.' },
      { title: 'Indice des prix des actifs immobiliers', organization: 'ANCFCC & Bank Al-Maghrib', href: 'https://www.ancfcc.gov.ma/IndicePrixImmobiliers/', note: 'Publications trimestrielles et note méthodologique.' },
    ],
    captions: ['Casablanca entre tissu urbain dense et façade atlantique.', 'La ville nocturne révèle la continuité de ses grands axes.', 'Le front de mer, interface entre patrimoine, habitat et métropole.'],
  },
  ar: {
    kicker: 'نظرات عقارية على الدار البيضاء',
    dek: 'قراءة للحاضرة من خلال ساحلها وعمارتها وأحيائها والبيانات اللازمة لتقييم مسؤول.',
    regionalFact: { value: '7.69 مليون', label: 'نسمة في الجهة سنة 2024', context: 'معطى خاص بجهة الدار البيضاء-سطات — المندوبية السامية للتخطيط، الإحصاء العام 2024. ولا يخص مدينة الدار البيضاء وحدها.' },
    sections: [
      {
        id: 'metropole', eyebrow: '01 · المجال', title: 'الدار البيضاء، حاضرة متعددة الوجوه',
        paragraphs: [
          'تُقرأ الدار البيضاء أولاً من خلال علاقتها بالمحيط الأطلسي. فالساحل والميناء والمحاور الكبرى والامتدادات المتعاقبة تشكل جغرافيا حضرية لا تختزل في المركز التاريخي ولا في حي أعمال واحد.',
          'يضع تقرير المندوبية السامية للتخطيط لسنة 2025 هذه الحقيقة ضمن نطاق أوسع: فقد بلغ عدد سكان جهة الدار البيضاء-سطات نحو 7.69 مليون نسمة سنة 2024، وكانت تضم 24.4٪ من السكان الحضريين في المغرب. تخص هذه الأرقام الجهة لا المدينة وحدها، لكنها توضح حجم الضغط على السكن والتنقل والتخطيط.'
        ],
      },
      {
        id: 'architecture', eyebrow: '02 · النسيج المبني', title: 'عمارة بين الإرث والحداثة',
        paragraphs: [
          'يجمع المشهد العمراني بين المدينة القديمة والتكوينات النيو-مغاربية وعمارات الآرت ديكو وحداثة القرن العشرين والمشاريع السكنية المعاصرة. ويوثق الموقع الرسمي للمدينة الانتقال من الزخرفة المعمارية في عشرينيات القرن الماضي إلى تعبير أكثر تجرداً في الثلاثينيات، ثم ترسخ العمارة الحديثة لاحقاً.',
          'يؤثر هذا التراكم مباشرة في قراءة العقار؛ فحقبة البناء والتوزيع الداخلي وجودة الأجزاء المشتركة والعلاقة بالشارع وحالة الصيانة تختلف من مبنى إلى آخر.'
        ],
      },
      {
        id: 'market', eyebrow: '03 · السوق', title: 'فهم السوق العقارية في الدار البيضاء',
        paragraphs: [
          'ينبغي التمييز بين نوعين من المعلومات. يعتمد مؤشر أسعار الأصول العقارية، الذي ينشره بنك المغرب والوكالة الوطنية للمحافظة العقارية، على بيانات المعاملات العقارية ومنهجية المبيعات المتكررة. وهو يقيس تطوراً مؤشرياً ولا يقدم سعراً موحداً للمتر المربع في المدينة كلها.',
          'أما الإعلانات الرقمية فتعرض أسعاراً مطلوبة، وهي تصف العرض الظاهر لكنها لا تثبت السعر الموقع فعلياً. يعتمد نموذج MaisonDeLUX على بيانات الإعلانات، لذلك يجب فهم نتيجته كمرجع إحصائي استرشادي لا كسعر معاملة مضمون.'
        ],
      },
    ],
    neighborhoodsTitle: 'الأحياء وخصائصها',
    neighborhoodsIntro: 'تصف هذه المعالم أشكالاً حضرية وسكنية، ولا تمثل ترتيباً للأحياء أو شبكة للأسعار.',
    neighborhoods: [
      { name: 'وسط المدينة ومرس السلطان', description: 'نسيج كثيف وعمارات من فترات مختلفة ومحلات تجارية وحضور واضح لتراث القرن العشرين.' },
      { name: 'المعاريف وراسين وغوتييه', description: 'أحياء مركزية تتجاور فيها العمارات السكنية والمكاتب والتجارة وتحولات المباني.' },
      { name: 'أنفا وعين الذئاب', description: 'مجالات غربية يميزها الساحل وقطع سكنية أوسع وأنماط عقارية متنوعة.' },
      { name: 'الوازيس وكاليفورنيا', description: 'بيئات سكنية تجمع الفيلات والإقامات المغلقة وعمارات أحدث ضمن نسيج متقطع.' },
      { name: 'القطب المالي للدار البيضاء', description: 'قطب حضري جديد يجمع المكاتب والسكن الجماعي والاتصال بالمحاور الكبرى.' },
    ],
    factorsTitle: 'ما العوامل التي تدخل في التقييم؟',
    factorsIntro: 'تعتمد الاستمارة العمومية حصراً على متغيرات عقد الاستدلال الخاص بالدار البيضاء، الإصدار الأول.',
    factors: [
      { name: 'نوع العقار', description: 'شقة أو فيلا، وهما الفئتان المقبولتان حالياً.' },
      { name: 'الموقع', description: 'حي مختار من المعجم المتحقق منه في نموذج الدار البيضاء.' },
      { name: 'المساحة', description: 'المساحة المصرح بها، ويعالجها المحول وفق البيان التقني المعتمد.' },
      { name: 'التوزيع', description: 'عدد الغرف وغرف النوم والحمامات.' },
      { name: 'الطابق', description: 'المستوى المصرح به للعقار، وفق المعالجة المحددة في العقد.' },
      { name: 'الحالة والعمر', description: 'حالة العقار وفئته العمرية، وهما اختياريان عند غياب المعلومة.' },
    ],
    methodologyNote: 'لا يستقبل النموذج متغيرات إطلالة البحر أو موقف السيارات أو المردودية الإيجارية أو القرب المصرح به من المرافق؛ لذلك لا نقدمها كعوامل تدخل في الحساب.',
    conclusionTitle: 'تقدير استرشادي مبني على البيانات',
    conclusionBody: 'يوفر تقدير MaisonDeLUX نطاقاً إرشادياً إحصائياً صادراً عن النموذج المحلي. وتظل المعاينة والوضعية القانونية والوثائق التقنية وشروط التفاوض الفعلية ضرورية لأي قرار عقاري.',
    sourcesTitle: 'المصادر التحريرية',
    sourcesIntro: 'مصادر مؤسساتية استُخدمت لبناء السياق، مع تمييز المعطيات الجهوية بوضوح.',
    sources: [
      { title: 'التقرير الجهوي للدار البيضاء-سطات 2025', organization: 'المندوبية السامية للتخطيط', href: 'https://www.hcp.ma/file/245559/', note: 'الديموغرافيا والتحضر والسياق الجهوي — معطيات 2024.' },
      { title: 'التراث المعماري للدار البيضاء', organization: 'مدينة الدار البيضاء', href: 'https://www.casablancacity.ma/backoffice/categorie/104/patrimoine-architectural', note: 'معالم حول الحقب المعمارية للمدينة.' },
      { title: 'مؤشر أسعار الأصول العقارية', organization: 'المحافظة العقارية وبنك المغرب', href: 'https://www.ancfcc.gov.ma/IndicePrixImmobilierAr/', note: 'النشرات الفصلية والمذكرة المنهجية.' },
    ],
    captions: ['الدار البيضاء بين النسيج الحضري الكثيف والواجهة الأطلسية.', 'تكشف المدينة ليلاً امتداد محاورها الكبرى.', 'الواجهة البحرية، نقطة التقاء التراث والسكن والحاضرة.'],
  },
};

export function getCasablancaEditorial(locale: string): CasablancaEditorialCopy {
  return CASABLANCA_EDITORIAL[locale === 'ar' ? 'ar' : 'fr'];
}
