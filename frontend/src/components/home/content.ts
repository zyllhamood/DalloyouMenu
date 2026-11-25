/**
 * Copy that only the home page uses. The storefront is Arabic-only, so these
 * live beside the sections rather than in the shared locale files. Everything
 * the earlier home page already said (hero lines, statement, pillars,
 * branches) is reused from i18n as is.
 */

export const COPY = {
  hero: {
    eyebrow: 'Pâtisserie · Chocolaterie · Occasions',
    sub: 'كيك وشوكولاتة وموالح لكل مناسبة، تُصنع يدوياً وتُحضّر طازجة كل يوم.',
    carousel: 'من فترينة داليو',
    orderPiece: 'اطلب هذه القطعة',
  },
  collections: {
    marker: 'تشكيلاتنا',
    title: 'لكل لحظة ما يليق بها',
    sub: 'اختر التشكيلة، واكتشف ما صُنع لأجلها.',
  },
  occasions: {
    marker: 'مناسباتكم',
    title: 'مناسبتك، بتوقيع داليو',
    sub: 'من ليلة الملكة لاجتماع الشركة، نجهّز لكم الكيك والشوكولاتة والضيافة على ذوقكم.',
    cta: 'اطلب لمناسبتك',
    message: (occasion: string) => `السلام عليكم، أرغب بالطلب لمناسبة: ${occasion}`,
    items: [
      {
        key: 'wedding',
        title: 'الزواج والملكة',
        text: 'صواني شوكولاتة، وكيك فاخر، وتوزيعات مغلّفة بعناية لفرحة العمر.',
        image: '/brand/occasions/01-wedding',
      },
      {
        key: 'birthday',
        title: 'أعياد الميلاد',
        text: 'اختر النكهة والحجم، من كيكة لشخص لين كيكة تكفي الجمعة، ونكتب عليها اللي تبغاه.',
        image: '/brand/occasions/02-birthday',
      },
      {
        key: 'graduation',
        title: 'التخرج والنجاح',
        text: 'مولود جديد، تخرّج، ترقية، أو بيت جديد… بوكسات شوكولاتة جاهزة للإهداء.',
        image: '/brand/occasions/03-gifts',
      },
      {
        key: 'seasons',
        title: 'الأعياد والمواسم',
        text: 'معمول العيد، وحلا رمضان، ودفا الشتاء… لكل موسم شي من داليو.',
        image: '/brand/occasions/04-seasons-winter',
      },
      {
        key: 'hospitality',
        title: 'الضيافة والشركات',
        text: 'موالح بالقطعة حسب عدد ضيوفك، وبوكسات حلويات للاجتماعات والعزايم.',
        image: '/brand/occasions/05-corporate',
      },
    ],
  },
  story: {
    marker: 'حكايتنا',
    gold: ['الحرفة', 'الفرنسية', 'الضيافة', 'السعودية.', 'يدوياً', 'طازجة'],
  },
  gallery: {
    marker: 'من عالم داليو',
  },
  visit: {
    marker: 'زورونا',
    title: 'بانتظاركم',
  },
} as const;
