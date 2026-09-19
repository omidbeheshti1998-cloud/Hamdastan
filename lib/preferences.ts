/**
 * سؤال‌های مرحلهٔ ترجیحات رفتاری.
 *
 * این یک تست شخصیت نیست؛ فقط چند انتخاب کوتاه برای شخصی‌تر کردن تجربه.
 *
 * `id` هر سؤال نام همان محور (dimension) است و **فقط برای بک‌اند** است —
 * هیچ‌وقت در UI رندر نمی‌شود. کاربر فقط موقعیت و گزینه‌های طبیعی را می‌بیند.
 */

/** ‎-1 = گرایش به گزینهٔ اول، 0 = میانه، +1 = گرایش به گزینهٔ دوم. */
export type PreferenceAnswer = -1 | 0 | 1;

export type PreferenceQuestion = {
  id: string;
  question: string;
  choices: { label: string; value: PreferenceAnswer }[];
};

/** نگاشت `شناسهٔ محور → پاسخ`. */
export type PreferenceAnswers = Record<string, PreferenceAnswer>;

export const PREFERENCE_QUESTIONS: PreferenceQuestion[] = [
  {
    id: "introversion-extroversion",
    question: "بعد از یه روز شلوغ، برای شارژ شدن بیشتر ترجیح می‌دی...",
    choices: [
      { label: "یه کم با خودم باشم", value: -1 },
      { label: "با بقیه وقت بگذرونم", value: 1 },
      { label: "بستگی داره", value: 0 },
    ],
  },
  {
    id: "logic-feeling",
    question: "وقتی باید یه تصمیم مهم بگیری، بیشتر...",
    choices: [
      { label: "واقعیت‌ها و منطق رو می‌سنجم", value: -1 },
      { label: "حس خودم و آدم‌ها رو هم در نظر می‌گیرم", value: 1 },
      { label: "هر دو برام مهمه", value: 0 },
    ],
  },
  {
    id: "planning-spontaneity",
    question: "برای آخر هفته معمولاً...",
    choices: [
      { label: "از قبل برنامه می‌چینم", value: -1 },
      { label: "همون موقع تصمیم می‌گیرم", value: 1 },
      { label: "بستگی داره", value: 0 },
    ],
  },
  {
    id: "competition-collaboration",
    question: "توی کار گروهی، بیشتر با چی انگیزه می‌گیری؟",
    choices: [
      { label: "رقابت و بهتر شدن", value: -1 },
      { label: "همکاری و رسیدن به نتیجه مشترک", value: 1 },
      { label: "هر دو", value: 0 },
    ],
  },
  {
    id: "caution-risk-taking",
    question: "وقتی یه چیز جدید رو شروع می‌کنی...",
    choices: [
      { label: "اول مطمئن می‌شم شرایطش مناسبه", value: -1 },
      { label: "دوست دارم امتحانش کنم و جلو برم", value: 1 },
      { label: "بستگی داره", value: 0 },
    ],
  },
  {
    id: "detail-big-picture",
    question: "وقتی یه موضوع جدید رو بررسی می‌کنی، اول...",
    choices: [
      { label: "جزئیاتش توجهم رو می‌گیره", value: -1 },
      { label: "اول تصویر کلیش رو می‌گیرم", value: 1 },
      { label: "هر دو", value: 0 },
    ],
  },
  {
    id: "realistic-imaginative",
    question: "وقتی به آینده فکر می‌کنی، بیشتر...",
    choices: [
      { label: "روی چیزهای عملی و شدنی تمرکز می‌کنم", value: -1 },
      { label: "ایده‌ها و امکان‌های جدید به ذهنم میاد", value: 1 },
      { label: "هر دو", value: 0 },
    ],
  },
];
