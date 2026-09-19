-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mobile" VARCHAR(11) NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "username" VARCHAR(20),
    "bio" VARCHAR(200),
    "avatar_kind" TEXT,
    "avatar_preset_id" TEXT,
    "onboarded_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mobile" VARCHAR(11) NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "consumed_at" TIMESTAMPTZ(3),
    "attempts" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_interest_categories" (
    "user_id" UUID NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_interest_categories_pkey" PRIMARY KEY ("user_id","category_id")
);

-- CreateTable
CREATE TABLE "user_interest_subs" (
    "user_id" UUID NOT NULL,
    "category_id" TEXT NOT NULL,
    "sub_id" TEXT NOT NULL,

    CONSTRAINT "user_interest_subs_pkey" PRIMARY KEY ("user_id","category_id","sub_id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "user_id" UUID NOT NULL,
    "dimension" TEXT NOT NULL,
    "answer" SMALLINT NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id","dimension")
);

-- CreateTable
CREATE TABLE "user_avatars" (
    "user_id" UUID NOT NULL,
    "mime_type" TEXT NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_avatars_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_mobile_key" ON "users"("mobile");

-- CreateIndex
CREATE INDEX "otp_codes_mobile_created_at_idx" ON "otp_codes"("mobile", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_interest_categories" ADD CONSTRAINT "user_interest_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_interest_subs" ADD CONSTRAINT "user_interest_subs_user_id_category_id_fkey" FOREIGN KEY ("user_id", "category_id") REFERENCES "user_interest_categories"("user_id", "category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_avatars" ADD CONSTRAINT "user_avatars_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ─────────────────────────────────────────────────────────────────────────────
-- موارد زیر در Prisma schema قابل بیان نیستند (CHECK constraint و ایندکس روی
-- expression) و دستی اضافه شده‌اند. `migrate diff` نه می‌بیندشان و نه حذفشان
-- می‌کند، پس با migration های بعدی از بین نمی‌روند.
-- ─────────────────────────────────────────────────────────────────────────────

-- شمارهٔ موبایل همیشه نرمال‌شده ذخیره می‌شود؛ این آخرین خط دفاع پشت normalizeMobile.
ALTER TABLE "users" ADD CONSTRAINT "users_mobile_format"
    CHECK ("mobile" ~ '^09[0-9]{9}$');

ALTER TABLE "users" ADD CONSTRAINT "users_avatar_kind_valid"
    CHECK ("avatar_kind" IS NULL OR "avatar_kind" IN ('preset', 'photo'));

-- شناسهٔ آواتار آماده دقیقاً وقتی معنا دارد که نوع آواتار 'preset' باشد.
ALTER TABLE "users" ADD CONSTRAINT "users_avatar_preset_pair"
    CHECK (
        ("avatar_kind" IS DISTINCT FROM 'preset' AND "avatar_preset_id" IS NULL)
        OR ("avatar_kind" = 'preset' AND "avatar_preset_id" IS NOT NULL)
    );

-- یکتایی نام کاربری بدون حساسیت به بزرگی/کوچکی حروف (docs/PROFILE.md).
CREATE UNIQUE INDEX "users_username_lower_key" ON "users" (lower("username"));

ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_answer_range"
    CHECK ("answer" BETWEEN -1 AND 1);

ALTER TABLE "user_avatars" ADD CONSTRAINT "user_avatars_mime_valid"
    CHECK ("mime_type" IN ('image/jpeg', 'image/png', 'image/webp'));

-- سقف ۲ مگابایت برای آواتار، در خود دیتابیس و نه فقط در کد.
ALTER TABLE "user_avatars" ADD CONSTRAINT "user_avatars_size_limit"
    CHECK ("byte_size" > 0 AND "byte_size" <= 2097152);
