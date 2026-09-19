# دیتابیس

PostgreSQL روی [Prisma Postgres](https://www.prisma.io/postgres) (pooled). آدرس
اتصال در `DATABASE_URL` است و در گیت نیست.

- ORM: Prisma `7.10.0` (پین‌شده — تگ `latest` روی npm فعلاً یک RC است)
- وضعیت: migration اول (`20260919204714_init`) اجرا شده؛ هر هفت جدول ساخته‌اند
- اسکیما: [`prisma/schema.prisma`](../prisma/schema.prisma)
- کلاینت تولیدشده: `lib/generated/prisma` (در `.gitignore`؛ با `postinstall` ساخته می‌شود)
- نقطهٔ دسترسی: [`lib/db.ts`](../lib/db.ts)

## قاعدهٔ اجرای migration

**عامل‌ها (agent) هرگز روی دیتابیس چیزی اجرا نمی‌کنند.** هر تغییر اسکیما این
مسیر را می‌رود:

1. `prisma/schema.prisma` ویرایش می‌شود.
2. SQL با `prisma migrate diff` تولید می‌شود — این دستور فقط می‌خواند و به
   دیتابیس دست نمی‌زند:
   ```bash
   npx prisma migrate diff \
     --from-migrations prisma/migrations \
     --to-schema prisma/schema.prisma \
     --script
   ```
3. خروجی در `prisma/migrations/<timestamp>_<name>/migration.sql` ذخیره می‌شود.
4. **صاحب پروژه** فایل را اجرا می‌کند و بعد تاریخچه را baseline می‌کند:
   ```bash
   psql "$DATABASE_URL" -f prisma/migrations/<timestamp>_<name>/migration.sql
   npx prisma migrate resolve --applied <timestamp>_<name>
   ```

قدم ۴ لازم است وگرنه Prisma فکر می‌کند دیتابیس عقب است و همان migration را
دوباره می‌سازد.

SQL دست‌نویس نمی‌نویسیم؛ همیشه از `migrate diff` می‌آید. اگر دست‌نویس با schema
یک مو اختلاف داشته باشد، Prisma آن اختلاف را drift می‌بیند.

## جدول‌ها

| جدول | کار |
|---|---|
| `users` | کاربر. ردیف بعد از تأیید OTP ساخته می‌شود، پس نام تا پایان onboarding خالی است. |
| `otp_codes` | کد تأیید (هش‌شده)، انقضا، تعداد تلاش |
| `sessions` | نشست؛ دیتابیس فقط هش توکن را دارد، کوکی مقدار خام را |
| `user_interest_categories` | دستهٔ علاقهٔ انتخاب‌شده |
| `user_interest_subs` | زیرعلاقه، با کلید خارجی مرکب به دستهٔ خودش |
| `user_preferences` | پاسخ هر محور، به شکل کلید-مقدار |
| `user_avatars` | عکس پروفایل به‌صورت `bytea` |

چند تصمیم که از روی schema پیدا نیست:

- **`users.onboarded_at` مرز «ثبت‌نامش تمام شد» است.** کاربری که وسط onboarding
  رها کرده ردیف دارد ولی `onboarded_at` ندارد و دفعهٔ بعد از همان‌جا ادامه می‌دهد.
- **کد و توکن نشست هش‌شده ذخیره می‌شوند**، مثل رمز عبور.
- **OTP در جدول است نه در حافظه**، چون build این پروژه `standalone` است و در
  کانتینر اجرا می‌شود؛ حافظهٔ in-process با ری‌استارت پاک می‌شود و با بیش از یک
  instance اصلاً کار نمی‌کند.
- **Rate limit جدول جدا ندارد** — شمردن ردیف‌های یک شماره در چند دقیقهٔ اخیر از
  ایندکس `(mobile, created_at DESC)` جواب می‌گیرد.
- **Interest Score ذخیره نمی‌شود.** فرمولش `min(5 + تعداد زیرعلاقه, 10)` است و
  مستقیم از دو جدول علایق درمی‌آید ([`ONBOARDING.md`](./ONBOARDING.md#interest-score--فقط-بکاند)).
- **ترجیحات کلید-مقدار است نه ستون‌های ثابت**، چون سؤال‌های `lib/preferences.ts`
  قرار است عوض شوند و اضافه‌شدن یک سؤال نباید migration بخواهد.
- **آواتار جدول جداست** تا هر `SELECT` روی کاربر چند صد کیلوبایت بایت را با
  خودش نکشد. سقف ۲ مگابایت و نوع فایل با CHECK در خود دیتابیس اعمال می‌شوند.
  هر بار نمایش آواتار یک کوئری به دیتابیس ریموت است؛ اندپوینت نمایش وقتی نوشته
  شد باید `ETag` و `Cache-Control` داشته باشد.
- **نشست و کد منقضی خودکار پاک نمی‌شوند.** فعلاً حجمشان ناچیز است و یک job
  زمان‌بندی‌شده ارزشش را ندارد؛ اگر جدول‌ها بزرگ شدند، یک `DELETE` دوره‌ای روی
  `expires_at` و `created_at` کافی است.
- **CHECK constraint ها و ایندکس `lower(username)` در Prisma قابل بیان نیستند**
  و دستی در انتهای `migration.sql` نوشته شده‌اند. `migrate diff` نه می‌بیندشان و
  نه حذفشان می‌کند.

## نکته‌های Prisma 7

دو رفتار که با نسخه‌های قبلی فرق دارد:

- **`.env` دیگر خودکار خوانده نمی‌شود.** CLI آن را از `prisma.config.ts` با
  `process.loadEnvFile()` می‌خواند. اپ Next خودش `.env` را لود می‌کند.
- **`url` از `datasource` حذف شده.** آدرس برای CLI در `prisma.config.ts` است و
  برای runtime از driver adapter (`@prisma/adapter-pg`) در `lib/db.ts` می‌آید.
