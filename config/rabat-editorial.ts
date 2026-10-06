import type { Locale } from '@/lib/i18n/config';
import type { CityEditorialCopy } from './city-editorial';

/** Institutional sources checked on 2026-10-06. No Rabat market/model claims. */
export const RABAT_EDITORIAL: Record<Locale, CityEditorialCopy> = {
  fr: {
    kicker: 'Regards immobiliers sur Rabat',
    dek: 'Lire la capitale à travers ses fronts d’eau, ses héritages urbains et ses quartiers, avant d’interpréter les données d’un bien.',
    regionalFact: { value: '2012', label: 'inscription au patrimoine mondial', context: 'UNESCO — Rabat, capitale moderne et ville historique : un patrimoine en partage. Un repère patrimonial, pas un indicateur immobilier.' },
    sections: [
      { id: 'territoire', imageIndex: 1, eyebrow: '01 · Territoire', title: 'Rabat, une capitale entre Atlantique et Bouregreg', paragraphs: [
        'Rabat occupe la rive sud du Bouregreg, face à Salé, au contact de l’Atlantique. Le dossier géographique du CNES décrit une capitale administrative dont les fonctions publiques ont marqué l’organisation urbaine.',
        'Le fleuve relie visuellement les deux villes sans effacer leurs identités. Pour MaisonDeLUX, ce contexte invite à situer précisément un bien : une vue sur l’agglomération ne suffit pas à identifier sa ville, son quartier ou son environnement immédiat.'
      ] },
      { id: 'architecture', imageIndex: 0, eyebrow: '02 · Cadre bâti', title: 'Un patrimoine partagé entre ville historique et ville moderne', paragraphs: [
        'L’UNESCO présente Rabat comme un ensemble où les tissus anciens dialoguent avec la ville nouvelle du début du XXe siècle. Son dossier associe notamment les ensembles résidentiels, les espaces administratifs, les jardins et les monuments historiques.',
        'Cette diversité appelle une lecture attentive du logement : époque de construction, distribution intérieure, entretien et rapport à l’espace public. Un patrimoine reconnu ne constitue pas, à lui seul, une mesure de la valeur d’un bien.'
      ] },
      { id: 'market', imageIndex: 2, eyebrow: '03 · Marché', title: 'Comprendre l’information immobilière à Rabat', paragraphs: [
        'L’Indice des prix des actifs immobiliers de Bank Al-Maghrib et de l’ANCFCC décrit l’évolution des prix à partir des transactions enregistrées et de la méthode des ventes répétées. Il ne donne pas une grille universelle de prix au mètre carré pour chaque quartier.',
        'Les annonces expriment des prix demandés ; elles ne prouvent pas le montant finalement négocié. MaisonDeLUX ne publie encore ni statistiques locales ni estimation pour Rabat. Une analyse locale devra reposer sur un jeu d’annonces approuvé, une couverture documentée et un service d’estimation propre à la ville.'
      ] },
    ],
    neighborhoodsTitle: 'Les quartiers et leurs caractéristiques',
    neighborhoodsIntro: 'Des repères urbains issus des sources citées, sans classement de prix. Les noms de quartiers ne constituent pas une correspondance avec les limites des arrondissements.',
    neighborhoods: [
      { name: 'Médina & Oudayas', description: 'Les tissus anciens et la kasbah font partie de la lecture patrimoniale présentée par l’UNESCO.' },
      { name: 'Hassan', description: 'Le dossier du CNES éclaire son rôle dans la construction des centralités de la capitale.' },
      { name: 'Agdal', description: 'Un quartier décrit par le CNES dans l’évolution des fonctions urbaines, universitaires et administratives.' },
      { name: 'Hay Riad & Souissi', description: 'Le CNES les situe dans les extensions résidentielles et les déplacements de centralité de Rabat.' },
      { name: 'L’Océan & Akkari', description: 'Le dossier du CNES les décrit dans les transformations des quartiers du littoral.' },
    ],
    factorsTitle: 'Comment préparer une estimation responsable ?',
    factorsIntro: 'Ces points guident la lecture d’un bien. Ils ne constituent pas les variables d’un modèle Rabat déjà disponible : le périmètre du futur service reste à valider.',
    factors: [
      { name: 'Type de bien', description: 'Identifier la typologie réelle du logement avant toute comparaison.' },
      { name: 'Localisation', description: 'Distinguer la ville, le quartier et l’adresse du bien, sans déduire un arrondissement d’un nom ressemblant.' },
      { name: 'Surface', description: 'Vérifier la surface déclarée et la nature de la mesure utilisée.' },
      { name: 'Distribution', description: 'Décrire l’organisation des espaces et les pièces du logement.' },
      { name: 'État du bâti', description: 'Documenter l’entretien et les travaux nécessaires, au-delà de la seule photographie.' },
      { name: 'Documents du bien', description: 'Compléter la description par les documents techniques et la situation juridique.' },
    ],
    methodologyNote: 'Aucune prédiction n’est disponible pour Rabat. Les variables acceptées et les limites d’usage seront précisées lors de la validation du service local. Les modèles des autres villes ne servent pas de substitution.',
    conclusionTitle: 'Une lecture locale, avant toute estimation',
    conclusionBody: 'L’expérience Rabat présente aujourd’hui le territoire et les principes d’une analyse responsable. Les futurs repères statistiques resteront distincts des transactions confirmées. Une visite, les documents du bien et les conditions de négociation demeurent essentiels à une décision immobilière.',
    sourcesTitle: 'Sources éditoriales',
    sourcesIntro: 'Sources publiques utilisées pour le contexte urbain, patrimonial et méthodologique. Aucune statistique de marché Rabat n’en est déduite.',
    sources: [
      { title: 'Rabat, capitale moderne et ville historique : un patrimoine en partage', organization: 'UNESCO — Centre du patrimoine mondial', href: 'https://whc.unesco.org/en/list/1401/', note: 'Inscription en 2012 et coexistence des tissus historiques et modernes.' },
      { title: 'Rabat-Salé : la métropole-capitale du Maroc', organization: 'CNES — Geoimage', href: 'https://cnes.fr/geoimage/rabat-sale-metropole-capitale-maroc', note: 'Atlantique, Bouregreg, fonctions administratives et évolution des quartiers ; lecture géographique, pas données actuelles de prix.' },
      { title: 'Indice des prix des actifs immobiliers — note technique', organization: 'ANCFCC & Bank Al-Maghrib', href: 'https://www.ancfcc.gov.ma/media/32591/ipai-t1-2021.pdf#page=4', note: 'Note technique du bulletin T1 2021 : transactions et ventes répétées. Citée pour la méthode, sans reprendre ses chiffres historiques.' },
    ],
    captions: ['Les rives du Bouregreg, un contexte partagé par Rabat et Salé.', 'La tour Hassan, un repère du paysage patrimonial de Rabat.', 'Paysage des rives du Bouregreg, distinct d’un périmètre de quartier.'],
  },
  ar: {
    kicker: 'نظرات عقارية على الرباط',
    dek: 'قراءة للعاصمة من خلال واجهاتها المائية وإرثها الحضري وأحيائها، قبل تفسير بيانات العقار.',
    regionalFact: { value: '2012', label: 'الإدراج في قائمة التراث العالمي', context: 'اليونسكو — الرباط، العاصمة الحديثة والمدينة التاريخية: تراث مشترك. معلم تراثي وليس مؤشراً عقارياً.' },
    sections: [
      { id: 'territoire', imageIndex: 1, eyebrow: '01 · المجال', title: 'الرباط، عاصمة بين الأطلسي وأبي رقراق', paragraphs: [
        'تقع الرباط على الضفة الجنوبية لأبي رقراق، مقابل سلا وعند المحيط الأطلسي. ويصف الملف الجغرافي للمركز الوطني للدراسات الفضائية عاصمة إدارية أثرت الوظائف العمومية في تنظيمها الحضري.',
        'يربط النهر المشهد البصري للمدينتين من دون أن يلغي خصوصية كل منهما. يدعو هذا السياق MaisonDeLUX إلى تحديد موقع العقار بدقة؛ فمشهد عام للتجمع الحضري لا يكفي لتحديد مدينته أو حيه أو محيطه المباشر.'
      ] },
      { id: 'architecture', imageIndex: 0, eyebrow: '02 · النسيج المبني', title: 'تراث يجمع المدينة التاريخية والمدينة الحديثة', paragraphs: [
        'تقدم اليونسكو الرباط بوصفها مجالاً تتجاور فيه الأنسجة القديمة مع المدينة الجديدة التي نشأت في مطلع القرن العشرين. ويجمع ملفها بين الأحياء السكنية والفضاءات الإدارية والحدائق والمعالم التاريخية.',
        'يستدعي هذا التنوع قراءة دقيقة للمسكن: فترة البناء وتوزيعه الداخلي وصيانته وعلاقته بالفضاء العام. فالاعتراف بالقيمة التراثية لا يشكل وحده مقياساً لقيمة العقار.'
      ] },
      { id: 'market', imageIndex: 2, eyebrow: '03 · السوق', title: 'فهم المعلومات العقارية في الرباط', paragraphs: [
        'يصف مؤشر أسعار الأصول العقارية لبنك المغرب والوكالة الوطنية للمحافظة العقارية تطور الأسعار انطلاقاً من المعاملات المسجلة ومنهجية المبيعات المتكررة. ولا يقدم شبكة موحدة لسعر المتر المربع في كل حي.',
        'تعبر الإعلانات عن أسعار مطلوبة، ولا تثبت المبلغ المتفاوض عليه فعلياً. لا تنشر MaisonDeLUX حالياً إحصاءات محلية أو تقديرات للرباط. وسيتطلب التحليل المحلي بيانات إعلانات معتمدة وتغطية موثقة وخدمة تقييم خاصة بالمدينة.'
      ] },
    ],
    neighborhoodsTitle: 'الأحياء وخصائصها',
    neighborhoodsIntro: 'معالم حضرية مستندة إلى المصادر المذكورة، وليست ترتيباً للأسعار. ولا تشكل أسماء الأحياء خريطة لانتمائها إلى المقاطعات الإدارية.',
    neighborhoods: [
      { name: 'المدينة العتيقة والأوداية', description: 'تندرج الأنسجة القديمة والقصبة ضمن القراءة التراثية التي تقدمها اليونسكو.' },
      { name: 'حسان', description: 'يوضح ملف المركز الوطني للدراسات الفضائية دوره في تشكل مراكز العاصمة.' },
      { name: 'أكدال', description: 'يصفه الملف الجغرافي ضمن تطور الوظائف الحضرية والجامعية والإدارية.' },
      { name: 'حي الرياض والسويسي', description: 'يضعهما الملف في سياق الامتدادات السكنية وتحولات المركزية في الرباط.' },
      { name: 'المحيط وعكاري', description: 'يصفهما الملف الجغرافي ضمن التحولات التي تعرفها الأحياء الساحلية.' },
    ],
    factorsTitle: 'كيف نستعد لتقييم مسؤول؟',
    factorsIntro: 'توجه هذه النقاط قراءة العقار، ولا تمثل متغيرات نموذج متاح للرباط. ما زال نطاق الخدمة المقبلة في انتظار التحقق.',
    factors: [
      { name: 'نوع العقار', description: 'تحديد النوع الفعلي للمسكن قبل إجراء أي مقارنة.' },
      { name: 'الموقع', description: 'التمييز بين المدينة والحي والعنوان، من دون استنتاج المقاطعة من تشابه الأسماء.' },
      { name: 'المساحة', description: 'التحقق من المساحة المصرح بها وطبيعة القياس المستخدم.' },
      { name: 'التوزيع', description: 'وصف تنظيم الفضاءات وغرف المسكن.' },
      { name: 'حالة المبنى', description: 'توثيق الصيانة والأشغال اللازمة، وعدم الاكتفاء بالصورة.' },
      { name: 'وثائق العقار', description: 'استكمال الوصف بالوثائق التقنية والوضعية القانونية.' },
    ],
    methodologyNote: 'لا تتوفر أي تنبؤات عقارية للرباط حالياً. ستُحدد المتغيرات المقبولة وحدود الاستخدام عند التحقق من الخدمة المحلية. ولا تُستخدم نماذج المدن الأخرى بديلاً عنها.',
    conclusionTitle: 'قراءة محلية تسبق التقييم',
    conclusionBody: 'تقدم تجربة الرباط اليوم المجال الحضري ومبادئ التحليل المسؤول. وستظل المراجع الإحصائية المقبلة متميزة عن أسعار المعاملات المؤكدة. وتبقى المعاينة ووثائق العقار وشروط التفاوض ضرورية لاتخاذ قرار عقاري.',
    sourcesTitle: 'المصادر التحريرية',
    sourcesIntro: 'مصادر عمومية للسياق الحضري والتراثي والمنهجي. لا تُستنتج منها أي إحصاءات لسوق الرباط.',
    sources: [
      { title: 'الرباط، العاصمة الحديثة والمدينة التاريخية: تراث مشترك', organization: 'اليونسكو — مركز التراث العالمي', href: 'https://whc.unesco.org/en/list/1401/', note: 'الإدراج سنة 2012 وتجاور الأنسجة التاريخية والحديثة.' },
      { title: 'الرباط وسلا: الحاضرة العاصمة في المغرب', organization: 'المركز الوطني للدراسات الفضائية — Geoimage', href: 'https://cnes.fr/geoimage/rabat-sale-metropole-capitale-maroc', note: 'الأطلسي وأبو رقراق والوظائف الإدارية وتطور الأحياء؛ قراءة جغرافية وليست بيانات راهنة للأسعار.' },
      { title: 'مؤشر أسعار الأصول العقارية — مذكرة تقنية', organization: 'المحافظة العقارية وبنك المغرب', href: 'https://www.ancfcc.gov.ma/media/32591/ipai-t1-2021.pdf#page=4', note: 'المذكرة التقنية لنشرة الربع الأول من 2021: المعاملات والمبيعات المتكررة. مرجع للمنهجية دون استخدام أرقامه التاريخية.' },
    ],
    captions: ['ضفتا أبي رقراق، سياق يجمع الرباط وسلا.', 'صومعة حسان، معلم من المشهد التراثي للرباط.', 'مشهد من ضفاف أبي رقراق، وليس حدوداً لحي سكني.'],
  },
};
