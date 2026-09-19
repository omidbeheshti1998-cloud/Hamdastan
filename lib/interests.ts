/**
 * دسته‌های علایق و زیرعلاقه‌های هر کدام.
 *
 * `id` ها پایدارند و همان چیزی هستند که به بک‌اند می‌روند؛ برچسب فارسی فقط
 * برای نمایش است و تغییرش نباید قرارداد داده را بشکند. `id` زیرعلاقه‌ها فقط
 * داخل دستهٔ خودش یکتاست (مثلاً `other` در همهٔ دسته‌ها تکرار می‌شود).
 */
export type Interest = { id: string; label: string };
export type InterestCategory = Interest & { subInterests: Interest[] };

/** نگاشت `شناسهٔ دسته → شناسهٔ زیرعلاقه‌های انتخاب‌شده`. حضور کلید یعنی دسته انتخاب شده. */
export type InterestSelection = Record<string, string[]>;

/** کاربر برای ادامه باید دست‌کم این تعداد دسته انتخاب کند. */
export const MIN_INTEREST_CATEGORIES = 3;

const sub = (...pairs: [string, string][]): Interest[] =>
  pairs.map(([id, label]) => ({ id, label }));

export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: "sports",
    label: "ورزش",
    subInterests: sub(
      ["football", "فوتبال"],
      ["bodybuilding", "بدنسازی"],
      ["running", "دویدن"],
      ["swimming", "شنا"],
      ["mountaineering", "کوهنوردی"],
      ["basketball", "بسکتبال"],
      ["volleyball", "والیبال"],
      ["tennis", "تنیس"],
      ["martial-arts", "ورزش‌های رزمی"],
      ["cycling", "دوچرخه‌سواری"],
      ["other", "سایر"],
    ),
  },
  {
    id: "reading",
    label: "مطالعه",
    subInterests: sub(
      ["novel", "رمان"],
      ["psychology", "روانشناسی"],
      ["history", "تاریخ"],
      ["philosophy", "فلسفه"],
      ["science", "علمی"],
      ["self-development", "توسعه فردی"],
      ["business", "کسب‌وکار"],
      ["biography", "زندگینامه"],
      ["poetry", "شعر و ادبیات"],
      ["other", "سایر"],
    ),
  },
  {
    id: "movies",
    label: "فیلم و سریال",
    subInterests: sub(
      ["action", "اکشن"],
      ["comedy", "کمدی"],
      ["drama", "درام"],
      ["sci-fi", "علمی‌تخیلی"],
      ["crime", "جنایی"],
      ["mystery", "معمایی"],
      ["documentary", "مستند"],
      ["animation", "انیمیشن"],
      ["historical", "تاریخی"],
      ["fantasy", "فانتزی"],
      ["other", "سایر"],
    ),
  },
  {
    id: "travel",
    label: "سفر",
    subInterests: sub(
      ["domestic", "سفر داخلی"],
      ["international", "سفر خارجی"],
      ["city", "شهرگردی"],
      ["road-trip", "سفر جاده‌ای"],
      ["luxury", "سفر لوکس"],
      ["budget", "سفر اقتصادی"],
      ["culture", "تجربه فرهنگی"],
      ["adventure", "ماجراجویی"],
      ["other", "سایر"],
    ),
  },
  {
    id: "nature",
    label: "طبیعت‌گردی",
    subInterests: sub(
      ["forest", "جنگل"],
      ["mountain", "کوه"],
      ["sea", "دریا"],
      ["camping", "کمپینگ"],
      ["desert", "کویر"],
      ["hiking", "پیاده‌روی"],
      ["offroad", "آفرود"],
      ["wildlife", "حیات وحش"],
      ["other", "سایر"],
    ),
  },
  {
    id: "animals",
    label: "حیوانات",
    subInterests: sub(
      ["dog", "سگ"],
      ["cat", "گربه"],
      ["birds", "پرندگان"],
      ["fish", "ماهی"],
      ["pets", "حیوانات خانگی"],
      ["wildlife", "حیات وحش"],
      ["pet-care", "نگهداری حیوانات"],
      ["other", "سایر"],
    ),
  },
  {
    id: "food",
    label: "غذا و آشپزی",
    subInterests: sub(
      ["persian", "غذای ایرانی"],
      ["fast-food", "فست‌فود"],
      ["cafe", "کافه"],
      ["dessert", "شیرینی و دسر"],
      ["cooking", "آشپزی"],
      ["healthy", "غذای سالم"],
      ["international", "غذای بین‌المللی"],
      ["drinks", "نوشیدنی"],
      ["restaurants", "رستوران‌گردی"],
      ["other", "سایر"],
    ),
  },
  {
    id: "gaming",
    label: "بازی",
    subInterests: sub(
      ["mobile", "بازی موبایل"],
      ["pc", "PC"],
      ["playstation", "PlayStation"],
      ["xbox", "Xbox"],
      ["online", "بازی آنلاین"],
      ["story", "بازی داستانی"],
      ["sports", "بازی ورزشی"],
      ["strategy", "بازی استراتژی"],
      ["board", "Board Game"],
      ["other", "سایر"],
    ),
  },
  {
    id: "fashion",
    label: "لباس و مد",
    subInterests: sub(
      ["casual", "استایل روزمره"],
      ["formal", "استایل رسمی"],
      ["streetwear", "Streetwear"],
      ["shoes", "کفش"],
      ["accessories", "اکسسوری"],
      ["watches", "ساعت"],
      ["brands", "برندها"],
      ["trends", "ترندهای مد"],
      ["other", "سایر"],
    ),
  },
  {
    id: "music",
    label: "موسیقی",
    subInterests: sub(
      ["pop", "پاپ"],
      ["rock", "راک"],
      ["rap", "رپ"],
      ["classical", "کلاسیک"],
      ["traditional", "سنتی"],
      ["electronic", "الکترونیک"],
      ["jazz", "جاز"],
      ["instrumental", "موسیقی بی‌کلام"],
      ["concert", "کنسرت"],
      ["other", "سایر"],
    ),
  },
  {
    id: "photography",
    label: "عکاسی",
    subInterests: sub(
      ["mobile", "عکاسی موبایل"],
      ["portrait", "پرتره"],
      ["nature", "طبیعت"],
      ["street", "خیابانی"],
      ["architecture", "معماری"],
      ["travel", "سفر"],
      ["professional", "عکاسی حرفه‌ای"],
      ["editing", "ویرایش عکس"],
      ["other", "سایر"],
    ),
  },
  {
    id: "visual-arts",
    label: "هنرهای تجسمی",
    subInterests: sub(
      ["painting", "نقاشی"],
      ["drawing", "طراحی"],
      ["graphic", "گرافیک"],
      ["illustration", "تصویرسازی"],
      ["sculpture", "مجسمه‌سازی"],
      ["architecture", "معماری"],
      ["digital", "هنر دیجیتال"],
      ["industrial", "طراحی صنعتی"],
      ["other", "سایر"],
    ),
  },
  {
    id: "technology",
    label: "تکنولوژی",
    subInterests: sub(
      ["mobile", "موبایل"],
      ["computer", "کامپیوتر"],
      ["ai", "هوش مصنوعی"],
      ["gadgets", "گجت"],
      ["programming", "برنامه‌نویسی"],
      ["cars", "خودرو"],
      ["trends", "تکنولوژی روز"],
      ["startup", "استارتاپ"],
      ["security", "امنیت"],
      ["other", "سایر"],
    ),
  },
  {
    id: "business",
    label: "کسب‌وکار",
    subInterests: sub(
      ["entrepreneurship", "کارآفرینی"],
      ["investment", "سرمایه‌گذاری"],
      ["management", "مدیریت"],
      ["marketing", "بازاریابی"],
      ["sales", "فروش"],
      ["startup", "استارتاپ"],
      ["economy", "اقتصاد"],
      ["markets", "بازارهای مالی"],
      ["self-development", "توسعه فردی"],
      ["business-tech", "تکنولوژی کسب‌وکار"],
      ["other", "سایر"],
    ),
  },
];
