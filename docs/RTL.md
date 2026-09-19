# راهنمای کامل پیاده‌سازی RTL اصولی
## Modern RTL Implementation Guide for React + Tailwind + shadcn/ui

این مستند راهنمای جامع و گام‌به‌گام پیاده‌سازی پشتیبانی از راست‌به‌چپ (RTL) به روش مدرن و اصولی است که بر اساس استانداردهای 2025 و بهترین شیوه‌ها (Best Practices) تهیه شده است.

> **بخش ۰ را حتماً اول بخوانید.** متن اصلی راهنما برای استک Vite + Tailwind 3 نوشته شده؛ بخش ۰ مشخص می‌کند در این پروژه (Next.js App Router + Tailwind v4) کدام مراحل عوض می‌شوند.

---

## 📋 فهرست مطالب

0. [تطبیق با این پروژه (بخوانید!)](#-۰-تطبیق-با-این-پروژه-nextjs--tailwind-v4)
1. [مقدمه و مفاهیم پایه](#-مقدمه-و-مفاهیم-پایه)
2. [مزایای روش مدرن](#-مزایای-روش-مدرن)
3. [پیش‌نیازها](#-پیشنیازها)
4. [مراحل پیاده‌سازی](#-مراحل-پیادهسازی)
5. [Best Practices](#-best-practices)
6. [رفع مشکلات متداول](#-رفع-مشکلات-متداول)
7. [مقایسه با روش‌های قدیمی](#-مقایسه-با-روشهای-قدیمی)

---

## 🧭 ۰. تطبیق با این پروژه (Next.js + Tailwind v4)

استک واقعی این ریپو:

| مورد | این پروژه | فرض راهنمای اصلی |
|---|---|---|
| فریم‌ورک | Next.js 16.3.5 — App Router (`app/`) | Vite + React Router |
| React | 19.2 (Server Components به‌صورت پیش‌فرض) | React 18 (همه‌چیز client) |
| Tailwind | v4.3 با `@tailwindcss/postcss` — پیکربندی CSS-first، بدون `tailwind.config.ts` | v3 با `tailwind.config.ts` |
| فونت | Kalameh (FaNum) در `/font` — با `next/font/local` | Yekan Bakh با `@font-face` |
| UI kit | هنوز shadcn/Radix نصب نیست | shadcn/ui نصب‌شده |
| CSS ورودی | `app/globals.css` | `src/style.css` + `rtl-fixes.css` |

### تفاوت‌های عملی با متن اصلی

**۱) مرحلهٔ ۲ راهنما (افزودن پلاگین `addVariant` برای rtl/ltr) در این پروژه لازم نیست.**
Tailwind v4 واریانت‌های `rtl:` و `ltr:` را به‌صورت داخلی دارد و بر پایهٔ `:dir()` پیاده شده. خروجی کامپایل‌شده در همین پروژه:

```css
.rtl\:rotate-180:where(:dir(rtl), [dir="rtl"], [dir="rtl"] *) { rotate: 180deg; }
.ltr\:ml-2:where(:dir(ltr), [dir="ltr"], [dir="ltr"] *)      { margin-left: … }
```

پس `tailwind.config.ts` نساز. اگر واریانت سفارشی لازم شد، در CSS بنویس:

```css
/* app/globals.css */
@custom-variant rtl (&:where(:dir(rtl), [dir="rtl"], [dir="rtl"] *));
```

**۲) مرحلهٔ ۳.۱ راهنما (`index.html`) → در App Router معادلش `app/layout.tsx` است:**

```tsx
// app/layout.tsx
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className={`${kalameh.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

**۳) مرحلهٔ ۱ راهنما (`DirectionProvider` در `main.tsx`) فقط وقتی معنا دارد که Radix/shadcn اضافه شود.**
`DirectionProvider` یک React Context است، پس **باید داخل Client Component باشد**؛ نمی‌شود مستقیم در `layout.tsx` سرور گذاشت:

```tsx
// app/providers.tsx
"use client";
import { DirectionProvider } from "@radix-ui/react-direction";

export function Providers({ children }: { children: React.ReactNode }) {
  return <DirectionProvider dir="rtl">{children}</DirectionProvider>;
}
```

```tsx
// app/layout.tsx
import { Providers } from "./providers";
// ...
<body className="min-h-full flex flex-col">
  <Providers>{children}</Providers>
</body>
```

نکته: `dir="rtl"` روی `<html>` برای خودِ CSS کافی است؛ `DirectionProvider` برای منطق جاوااسکریپتیِ Radix (جهت باز شدن منوها، کیبورد navigation) لازم است. هر دو را با هم نگه دار.

**۴) فونت فارسی: به‌جای `@font-face` دستی، از `next/font/local` استفاده کن** (فایل‌های Kalameh در `font/` هستند):

```tsx
// app/layout.tsx
import localFont from "next/font/local";

const kalameh = localFont({
  src: [
    { path: "../font/Kalameh(FaNum)-Regular.ttf",  weight: "400", style: "normal" },
    { path: "../font/Kalameh(FaNum)-Medium.ttf",   weight: "500", style: "normal" },
    { path: "../font/Kalameh(FaNum)-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../font/Kalameh(FaNum)-Bold.ttf",     weight: "700", style: "normal" },
  ],
  variable: "--font-kalameh",
  display: "swap",
});
```

و اتصالش به توکن‌های Tailwind v4 در `app/globals.css`:

```css
@theme inline {
  --font-sans: var(--font-kalameh);
}
```

بعد از این، کلاس `font-sans` (و فونت پیش‌فرض بدنه) فارسی می‌شود — نیازی به `font-family` دستی در `body` نیست.
توصیه: فایل‌های `.ttf` را به `.woff2` تبدیل کن (حجم به‌مراتب کمتر) و نسخه‌های تکراری `… 2.ttf` / `… 3.ttf` را حذف کن.

**۵) مرحلهٔ ۳.۲ راهنما → معادلش `app/globals.css` است.** چون `dir="rtl"` روی `<html>` نشسته، `direction: rtl` دستی در `:root` و `body` زائد است. فقط این‌ها را نگه دار:

```css
/* app/globals.css */
@layer base {
  input, textarea, select { text-align: start; }

  /* محتوای ذاتاً LTR: کد، ایمیل، URL، شماره */
  .ltr {
    direction: ltr;
    unicode-bidi: isolate;
    text-align: start;
  }
}
```

⚠️ **`unicode-bidi: isolate` را حذف نکن.** طبق CSS، `direction` روی یک inline box
(مثل `<span>`) بدون `unicode-bidi` هیچ اثری ندارد. بدون آن، عددی که وسط جملهٔ
فارسی می‌آید به‌هم می‌ریزد — مثلاً `اعتبار کد: 01:59` به شکل معکوس رندر می‌شود.
روی بلاک‌ها (مثل `<input>`) بی‌ضرر است، پس همیشه نگهش دار.

**نکتهٔ مکمل:** برای عدد کوتاهی که کنار متن فارسی می‌نشیند، به‌جای فاصلهٔ متنی
(`{" "}` یا `ms-1`) از `flex … gap-1` استفاده کن؛ هر آیتم flex یک باکس مستقل
می‌شود و درگیری bidi از بین می‌رود. نمونهٔ واقعی: تایمر در
`app/_login/_steps/otp-step.tsx`.

**۶) نام کلاس‌های positioning در Tailwind v4.3:**
نام‌های رسمی `inset-s-*` و `inset-e-*` هستند. `start-*` / `end-*` هنوز کامپایل می‌شوند (هر دو در همین نسخه تست شد) ولی در کد جدید `inset-s-*` / `inset-e-*` را ترجیح بده.

**۷) `rtl-fixes.css` فعلاً نساز.** تا وقتی shadcn/Radix وارد پروژه نشده، هیچ override ای لازم نیست. اگر بعداً sidebar/sonner اضافه شد، سراغ [مرحلهٔ ۶](#مرحله-6-سادهسازی-rtl-fixescss) برو.

### چک‌لیست کوتاه شروع در این پروژه

- [x] `app/layout.tsx`: `lang="fa" dir="rtl"`
- [x] فونت Kalameh با `next/font/local` + `--font-sans` در `@theme inline`
- [x] پاک‌سازی `font-family: Arial…` از `body` در `globals.css`
- [x] همهٔ کلاس‌های spacing به‌صورت logical (`ms-`, `me-`, `ps-`, `pe-`, `text-start`)
- [ ] (وقت نصب shadcn) `@radix-ui/react-direction` + `app/providers.tsx`

> پایهٔ RTL انجام شده است. اولین فیچری که روی آن سوار شد فلو احراز هویت است —
> [`docs/AUTH.md`](./AUTH.md).

### استثنای عمدی: ورودی کد تأیید (OTP)

کل صفحه RTL است، اما کانتینر خانه‌های OTP عمداً `dir="ltr"` دارد
(`app/_login/_components/otp-input.tsx`). دلیل: کد تأیید یک «عدد» است و عدد همیشه
چپ‌به‌راست خوانده می‌شود؛ پس خانهٔ اول باید سمت چپ باشد و فوکوس به راست حرکت کند.
همین منطق برای فیلد شماره موبایل هم با کلاس `.ltr` اعمال شده است.

---

## 🎯 مقدمه و مفاهیم پایه

### سه رکن اصلی RTL مدرن:

#### 1. CSS Logical Properties
به جای استفاده از direction های فیزیکی (`left`, `right`), از direction های منطقی استفاده می‌کنیم:

```css
/* ❌ روش قدیمی (Physical) */
margin-left: 1rem;
margin-right: 2rem;
padding-left: 0.5rem;

/* ✅ روش مدرن (Logical) */
margin-inline-start: 1rem;
margin-inline-end: 2rem;
padding-inline-start: 0.5rem;
```

**در Tailwind CSS:**
```tsx
// ❌ Physical classes
<div className="ml-4 mr-2 pl-3" />

// ✅ Logical classes
<div className="ms-4 me-2 ps-3" />
```

**نقشه تبدیل:**
- `ml-*` → `ms-*` (margin-start)
- `mr-*` → `me-*` (margin-end)
- `pl-*` → `ps-*` (padding-start)
- `pr-*` → `pe-*` (padding-end)
- `left-*` → `inset-s-*` (در Tailwind v3: `start-*`)
- `right-*` → `inset-e-*` (در Tailwind v3: `end-*`)
- `text-left` → `text-start`
- `text-right` → `text-end`

#### 2. @radix-ui/react-direction
کتابخانه رسمی Radix UI برای مدیریت direction در سطح application:

```tsx
import { DirectionProvider } from '@radix-ui/react-direction';

<DirectionProvider dir="rtl">
  <App />
</DirectionProvider>
```

این کار باعث می‌شود تمام کامپوننت‌های Radix (و در نتیجه shadcn/ui) به صورت خودکار از RTL پشتیبانی کنند.

#### 3. Tailwind RTL Variants
امکان استفاده از استایل‌های شرطی بر اساس direction:

```tsx
// چرخش آیکون فقط در RTL
<ChevronIcon className="rtl:rotate-180" />

// استایل متفاوت برای LTR و RTL
<div className="ltr:bg-blue-500 rtl:bg-red-500" />
```

---

## ✨ مزایای روش مدرن

### 🚀 Performance
- کد کمتر (80% کاهش در CSS override ها)
- بهینه‌سازی توسط مرورگر
- حذف `!important` و specificity جنگ‌ها

### 🎨 Code Quality
- استاندارد W3C
- کد تمیزتر و قابل نگهداری
- سازگار با future standards

### 🔧 Maintainability
- نیاز به override های دستی کمتر
- پشتیبانی native از کامپوننت‌ها
- امکان پشتیبانی همزمان از LTR و RTL

### 🌍 Scalability
- آماده برای multi-language
- قابل توسعه به سایر زبان‌های RTL (عربی، عبری)
- مستقل از کتابخانه‌های third-party

---

## 📦 پیش‌نیازها

### Stack مورد نیاز:
- ✅ React 18+
- ✅ Tailwind CSS 4.x
- ✅ shadcn/ui (based on Radix UI)
- ✅ Node.js 18+

### نصب پکیج‌های ضروری:
```bash
npm install @radix-ui/react-direction
```

---

## 🔨 مراحل پیاده‌سازی

### مرحله 1: نصب و پیکربندی DirectionProvider

> 🧭 **در این پروژه:** [بند ۳ بخش ۰](#-۰-تطبیق-با-این-پروژه-nextjs--tailwind-v4) — به‌جای `main.tsx` یک `app/providers.tsx` با `"use client"`.

**1.1. نصب پکیج:**
```bash
npm install @radix-ui/react-direction
```

**1.2. اضافه کردن به main.tsx:**
```tsx
import { DirectionProvider } from '@radix-ui/react-direction';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DirectionProvider dir="rtl">
      <ThemeProvider>
        <BrowserRouter>
          {/* ... */}
        </BrowserRouter>
      </ThemeProvider>
    </DirectionProvider>
  </React.StrictMode>
);
```

**نکته مهم:** DirectionProvider باید در بالاترین سطح (wrap کننده همه چیز) قرار بگیرد.

---

### مرحله 2: فعال‌سازی RTL Variants در Tailwind

> 🧭 **در این پروژه لازم نیست** — Tailwind v4 واریانت‌های `rtl:`/`ltr:` را داخلی دارد. [بند ۱ بخش ۰](#-۰-تطبیق-با-این-پروژه-nextjs--tailwind-v4).

**2.1. ویرایش tailwind.config.ts (فقط Tailwind v3):**
```typescript
import type { Config } from "tailwindcss"

export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Yekan Bakh', 'sans-serif'], // فونت فارسی
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // فعال‌سازی RTL/LTR variants
    function({ addVariant }: any) {
      addVariant('rtl', '[dir="rtl"] &')
      addVariant('ltr', '[dir="ltr"] &')
    }
  ],
} satisfies Config
```

---

### مرحله 3: تنظیمات HTML و CSS پایه

> 🧭 **در این پروژه:** بندهای ۲، ۴ و ۵ بخش ۰ — `app/layout.tsx` و `app/globals.css`.

**3.1. ویرایش index.html:**
```html
<!doctype html>
<html lang="fa" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>عنوان برنامه</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

**3.2. تنظیمات CSS پایه (style.css):**
```css
:root {
  font-family: 'Yekan Bakh', sans-serif;
  direction: rtl;
}

@layer base {
  body {
    @apply bg-background text-foreground;
    font-family: 'Yekan Bakh', sans-serif;
    direction: rtl;
  }

  /* RTL برای input ها */
  input, textarea, select {
    direction: rtl;
    text-align: start;
  }

  /* کلاس utility برای محتوای LTR */
  .ltr {
    direction: ltr !important;
    text-align: start !important;
  }
}
```

---

### مرحله 4: تبدیل کامپوننت‌ها به Logical Properties

این مهمترین بخش است. باید تمام استفاده‌های physical properties را پیدا و تبدیل کنیم.

#### 4.1. پیدا کردن فایل‌های نیازمند تغییر:
```bash
# جستجوی تمام استفاده‌های physical classes
grep -rnE '\b(ml-|mr-|pl-|pr-|text-left|text-right)' --include="*.tsx" --include="*.ts" app/
```

#### 4.2. الگوی تبدیل:

**مثال 1: Spacing Classes**
```tsx
// ❌ قبل
<div className="ml-4 mr-2 pl-3 pr-1">

// ✅ بعد
<div className="ms-4 me-2 ps-3 pe-1">
```

**مثال 2: Positioning**
```tsx
// ❌ قبل
<div className="absolute left-0 right-auto">

// ✅ بعد (Tailwind v4)
<div className="absolute inset-s-0 inset-e-auto">
```

**مثال 3: Text Alignment**
```tsx
// ❌ قبل
<p className="text-left">

// ✅ بعد
<p className="text-start">
```

**مثال 4: Icons با RTL Variant**
```tsx
// ❌ قبل
<ChevronRightIcon className="ml-auto" />

// ✅ بعد
<ChevronRightIcon className="ms-auto rtl:rotate-180" />
```

#### 4.3. کامپوننت‌های shadcn/ui که نیاز به تبدیل دارند:

**لیست اولویت‌دار:**
1. ✅ **dropdown-menu.tsx** - menu items, shortcuts, checkboxes
2. ✅ **menubar.tsx** - menu structure
3. ✅ **context-menu.tsx** - context menu items
4. ✅ **select.tsx** - select items, indicators
5. ✅ **dialog.tsx** - close button, header alignment
6. ✅ **sheet.tsx** - side positioning
7. ✅ **sidebar.tsx** - ⚠️ **نیاز به دقت ویژه** (توضیحات در ادامه)
8. ✅ **input-group.tsx** - addon positioning
9. ✅ **pagination.tsx** - prev/next buttons
10. ✅ **carousel.tsx** - navigation buttons
11. ✅ **navigation-menu.tsx** - menu indicators

---

### مرحله 5: مدیریت Sidebar (نکته مهم)

⚠️ **هشدار:** Sidebar یک استثناست!

**چرا؟**
- Positioning در CSS یک مفهوم **فیزیکی** است نه منطقی
- `side="right"` یعنی "سمت راست فیزیکی" صفحه
- استفاده از `start`/`end` برای positioning باعث می‌شود sidebar به جای اشتباه برود

**راه‌حل صحیح:**
```tsx
// ✅ برای Positioning از Physical Properties استفاده کنید
<div className={cn(
  "fixed inset-y-0",
  side === "left"
    ? "left-0"      // Physical positioning
    : "right-0"     // Physical positioning
)} />

// ✅ اما برای Spacing از Logical Properties استفاده کنید
<div className="ps-4 pe-2" />
```

**قانون طلایی:**
- 🎯 **Positioning** (`left-*`, `right-*`, `top-*`, `bottom-*`) → Physical
- 📦 **Spacing** (`ml-*`, `mr-*`, `pl-*`, `pr-*`) → Logical

**مثال کامل Sidebar:**
```tsx
// صحیح ✅
<div className={cn(
  "fixed inset-y-0 z-10",
  side === "left"
    ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
    : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
  "group-data-[side=left]:border-e group-data-[side=right]:border-s", // Logical for borders
)} />
```

---

### مرحله 6: ساده‌سازی rtl-fixes.css

> 🧭 **در این پروژه:** تا نصب‌نشدن shadcn اصلاً این فایل را نساز — [بند ۷ بخش ۰](#-۰-تطبیق-با-این-پروژه-nextjs--tailwind-v4).

با استفاده از روش مدرن، دیگر نیازی به CSS override های سنگین نیست.

**قبل: ~250 خط**
**بعد: ~50 خط**

**محتوای نهایی rtl-fixes.css:**
```css
/* Modern RTL Support - Minimal Override File */

/* ==================== Sidebar Overrides ==================== */
[data-sidebar="sidebar"] {
  inset-inline-end: 0;
  inset-inline-start: auto;
  border-inline-start: 1px solid hsl(var(--sidebar-border));
  border-inline-end: none;
}

[data-sidebar="sidebar"][data-state="collapsed"] {
  inset-inline-end: calc(var(--sidebar-width-icon) * -1);
  inset-inline-start: auto;
}

[data-sidebar="sidebar-inset"] {
  padding-inline-end: var(--sidebar-width);
  padding-inline-start: 0;
}

[data-sidebar="sidebar-inset"][data-state="collapsed"] {
  padding-inline-end: var(--sidebar-width-icon);
  padding-inline-start: 0;
}

/* ==================== Toast RTL ==================== */
[data-sonner-toast] {
  direction: rtl;
  text-align: start;
}

[data-sonner-toast] [data-icon] {
  margin-inline-start: 0.75rem;
  margin-inline-end: 0;
}
```

---

## 🎓 Best Practices

### 1. استفاده از useDirection Hook
```tsx
import { useDirection } from '@radix-ui/react-direction';

function MyComponent() {
  const direction = useDirection();

  return (
    <div>
      {direction === 'rtl' ? 'راست به چپ' : 'چپ به راست'}
    </div>
  );
}
```
> 🧭 در App Router این hook فقط داخل Client Component (`"use client"`) کار می‌کند.

### 2. مدیریت محتوای LTR در برنامه RTL
```tsx
// برای کد، لینک، ایمیل و ...
<code className="ltr">const name = "value";</code>
<a href="..." className="ltr">https://example.com</a>
<span className="ltr">user@example.com</span>
```

### 3. Flexbox Direction
```tsx
// ❌ نادرست
<div className="flex flex-row-reverse">

// ✅ درست - به صورت خودکار در RTL برعکس می‌شود
<div className="flex">
```

### 4. Grid و Auto Layout
```css
/* ✅ از auto-placement استفاده کنید */
.grid {
  grid-auto-flow: dense;
}
```

### 5. تست در هر دو Direction
```tsx
// اضافه کردن قابلیت toggle برای تست
<button onClick={() => setDir(dir === 'rtl' ? 'ltr' : 'rtl')}>
  Toggle Direction
</button>
```

---

## 🐛 رفع مشکلات متداول

### مشکل 1: Sidebar به جای اشتباه می‌رود
**علت:** استفاده از logical properties برای positioning

**راه‌حل:**
```tsx
// ❌ اشتباه
side === "right" ? "inset-e-0" : "inset-s-0"

// ✅ صحیح
side === "right" ? "right-0" : "left-0"
```

### مشکل 2: آیکون‌های جهت‌دار درست نمایش داده نمی‌شوند
**راه‌حل:** استفاده از RTL variant
```tsx
<ChevronRightIcon className="rtl:rotate-180" />
<ArrowLeftIcon className="rtl:scale-x-[-1]" />
```

### مشکل 3: Dropdown Menu به سمت اشتباه باز می‌شود
**راه‌حل:** Radix UI به صورت خودکار direction را مدیریت می‌کند. فقط مطمئن شوید DirectionProvider فعال است.

### مشکل 4: Input های number و email LTR نمی‌شوند
**راه‌حل:**
```tsx
<input
  type="number"
  className="ltr"
  dir="ltr"
/>
```

### مشکل 5: Animation ها در RTL درست کار نمی‌کنند
**راه‌حل:** به‌جای جهت فیزیکی، انیمیشن را با واریانت شرطی بنویس:
```tsx
// ❌ اشتباه
className="slide-in-from-left"

// ✅ صحیح
className="ltr:slide-in-from-left rtl:slide-in-from-right"
```

### مشکل 6: Box Shadow در RTL برعکس است
**راه‌حل:**
```tsx
<div className="shadow-[2px_2px_8px_rgba(0,0,0,0.1)] rtl:shadow-[-2px_2px_8px_rgba(0,0,0,0.1)]" />
```

---

## 📊 مقایسه با روش‌های قدیمی

### روش 1: استفاده از `tailwindcss-rtl` Plugin
```bash
# ❌ نیاز به plugin اضافی
npm install tailwindcss-rtl

# ❌ افزایش bundle size
# ❌ وابستگی اضافی
# ❌ ممکن است با updates سازگار نباشد
```

**مشکلات:**
- ⛔ Overhead اضافی
- ⛔ Generation time بیشتر
- ⛔ تولید کلاس‌های اضافی

### روش 2: CSS دستی با `!important`
```css
/* ❌ روش قدیمی */
.sidebar {
  right: 0 !important;
  left: auto !important;
}

/* ❌ نگهداری سخت */
/* ❌ Specificity جنگ */
/* ❌ مقیاس‌پذیری ضعیف */
```

### روش 3: JavaScript برای تغییر className
```tsx
// ❌ روش قدیمی
const marginClass = isRTL ? 'mr-4' : 'ml-4';
<div className={marginClass} />

// ❌ کد پیچیده
// ❌ Runtime overhead
// ❌ نیاز به state management
```

### ✅ روش مدرن (توصیه شده)
```tsx
// ✅ تمیز و ساده
<div className="ms-4" />

// ✅ بدون overhead
// ✅ استاندارد
// ✅ آینده‌محور
```

---

## 📈 نتایج و آمار

### قبل از بهینه‌سازی:
- 📄 `rtl-fixes.css`: **246 خط**
- 🐛 **85+ استفاده** از physical classes
- ⚠️ **نیاز به override با `!important`**
- ❌ مشکلات سازگاری

### بعد از بهینه‌سازی:
- 📄 `rtl-fixes.css`: **48 خط** (80% کاهش)
- ✅ **0 استفاده** از physical classes در کامپوننت‌ها
- ✅ **0 استفاده** از `!important`
- ✅ سازگاری کامل

---

## 🔍 چک‌لیست نهایی

قبل از production، موارد زیر را بررسی کنید:

- [ ] `<html lang="fa" dir="rtl">` در `app/layout.tsx` تنظیم شده
- [ ] (در صورت نصب shadcn) DirectionProvider در یک Client Component فعال است
- [ ] RTL variants کار می‌کند (در Tailwind v4 داخلی است؛ در v3 پلاگین لازم است)
- [ ] تمام physical classes به logical تبدیل شده‌اند
- [ ] Sidebar positioning با `left`/`right` فیزیکی است
- [ ] آیکون‌های جهت‌دار `rtl:rotate-180` دارند
- [ ] rtl-fixes.css ساده‌سازی شده (< 50 خط) یا اصلاً وجود ندارد
- [ ] TypeScript errors رفع شده
- [ ] Build موفق است (`npm run build`)
- [ ] تمام صفحات در RTL تست شده‌اند
- [ ] Input های LTR (email, url, number) کلاس `ltr` دارند
- [ ] فونت فارسی به درستی لود می‌شود

---

## 📚 منابع و لینک‌های مفید

### مستندات رسمی:
- [Tailwind CSS Logical Properties](https://tailwindcss.com/docs/padding#logical-properties)
- [Radix UI Direction](https://www.radix-ui.com/primitives/docs/utilities/direction-provider)
- [MDN CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties)
- [shadcn/ui Components](https://ui.shadcn.com)
- مستندات همین نسخهٔ Next.js: `node_modules/next/dist/docs/01-app/`

### مقالات پیشنهادی:
- [CSS Logical Properties: The Future of RTL](https://web.dev/learn/css/logical-properties/)
- [Building Truly Bidirectional Web Apps](https://www.w3.org/International/articles/inline-bidi-markup/)

### ابزارهای مفید:
- [RTL CSS Validator](https://rtlcss.com/)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

---

## 🎉 جمع‌بندی

با پیروی از این راهنما، شما می‌توانید:

✅ یک سیستم RTL مدرن و استاندارد پیاده‌سازی کنید
✅ از best practices سال 2025 استفاده کنید
✅ کد تمیز و قابل نگهداری داشته باشید
✅ به راحتی از LTR به RTL و بالعکس سوئیچ کنید
✅ در پروژه‌های بعدی سریع‌تر عمل کنید

---

## 📞 پشتیبانی

در صورت بروز مشکل:
1. ابتدا [چک‌لیست نهایی](#-چکلیست-نهایی) را بررسی کنید
2. [مشکلات متداول](#-رفع-مشکلات-متداول) را مطالعه کنید
3. Build را دوباره انجام دهید: `npm run build`
4. Cache را پاک کنید: `rm -rf .next`

---

**تهیه شده در:** اکتبر 2025
**نسخه:** 1.1 (تطبیق‌یافته با Next.js 16 + Tailwind v4 — ۲۰۲۶/۰۹/۱۹)
**مجوز:** این مستند برای استفاده در تمام پروژه‌های شخصی و تجاری آزاد است.
