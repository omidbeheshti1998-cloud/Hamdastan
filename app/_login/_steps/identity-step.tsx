"use client";

import { startTransition, ViewTransition, useEffect, useRef, useState } from "react";
import { checkUsername } from "@/lib/auth/client";
import {
  AVATARS,
  BIO_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  isValidUsername,
  sanitizeUsername,
  type AvatarChoice,
  type ProfileIdentity,
} from "@/lib/profile";
import { AvatarArt } from "../_components/avatar-art";
import { PhotoCropper } from "../_components/photo-cropper";
import { PrimaryButton, Spinner, StepHeader } from "../_components/ui";

/** فاصلهٔ بین آخرین تایپ و بررسی نام کاربری. */
const USERNAME_DEBOUNCE_MS = 500;

type UsernameStatus = "idle" | "short" | "checking" | "available" | "taken" | "failed";

type CheckOutcome = { available: boolean; suggestions: string[] } | "failed";

export function IdentityStep({
  identity,
  onChange,
  onSubmit,
  loading,
  error,
}: {
  identity: ProfileIdentity;
  onChange: (identity: ProfileIdentity) => void;
  onSubmit: () => void;
  loading: boolean;
  error?: string;
}) {
  const { username, avatar, bio } = identity;

  // فقط نتیجهٔ ناهمگام در state می‌نشیند؛ بقیهٔ وضعیت‌ها از روی همین مشتق می‌شوند
  // تا setState همگام داخل effect لازم نشود.
  const [check, setCheck] = useState<{ username: string; outcome: CheckOutcome } | null>(null);
  const [picker, setPicker] = useState<"none" | "avatars" | "crop">("none");
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = (patch: Partial<ProfileIdentity>) => onChange({ ...identity, ...patch });

  // بررسی آزاد بودن نام کاربری، با debounce و محافظت در برابر پاسخ‌های کهنه.
  useEffect(() => {
    if (!isValidUsername(username)) return;
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const outcome = await checkUsername(username);
        if (!cancelled) setCheck({ username, outcome });
      } catch {
        if (!cancelled) setCheck({ username, outcome: "failed" });
      }
    }, USERNAME_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username]);

  // نتیجه فقط وقتی معتبر است که مربوط به همین مقدار فعلی باشد.
  const outcome = check?.username === username ? check.outcome : null;

  const status: UsernameStatus = !username
    ? "idle"
    : !isValidUsername(username)
      ? "short"
      : outcome === null
        ? "checking"
        : outcome === "failed"
          ? "failed"
          : outcome.available
            ? "available"
            : "taken";

  const suggestions =
    outcome && outcome !== "failed" && !outcome.available ? outcome.suggestions : [];

  function replaceAvatar(next: AvatarChoice) {
    // آدرس blob قبلی آزاد می‌شود تا نشت حافظه نداشته باشیم.
    if (avatar?.kind === "photo") URL.revokeObjectURL(avatar.url);
    // بدون `startTransition` عوض شدن آواتار یک پرش ناگهانی است؛
    // `<ViewTransition>` فقط داخل ترنزیشن فعال می‌شود.
    startTransition(() => set({ avatar: next }));
  }

  function onPhotoPicked(file: File | undefined) {
    if (!file) return;
    setPendingPhoto(URL.createObjectURL(file));
    setPicker("crop");
  }

  function closeCropper() {
    if (pendingPhoto) URL.revokeObjectURL(pendingPhoto);
    setPendingPhoto(null);
    setPicker("none");
    if (fileInput.current) fileInput.current.value = "";
  }

  const canSubmit = status === "available";
  const bioCloseToLimit = bio.length > BIO_MAX_LENGTH * 0.8;

  return (
    <div>
      <StepHeader
        title="دوست داری چطور دیده بشی؟"
        description="یه نام کاربری، عکس و معرفی کوتاه برای پروفایلت انتخاب کن."
      />

      {/* ۱ — نام کاربری */}
      <section>
        <label
          htmlFor="username"
          className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          نام کاربری
        </label>
        <div
          dir="ltr"
          className={`flex h-14 items-center rounded-xl border bg-white ps-4 transition focus-within:ring-4 dark:bg-zinc-900 ${
            status === "taken"
              ? "border-red-400 focus-within:border-red-500 focus-within:ring-red-500/15"
              : "border-zinc-200 focus-within:border-accent focus-within:ring-accent/14 dark:border-zinc-800"
          }`}
        >
          <span aria-hidden="true" className="text-base text-zinc-400">
            @
          </span>
          <input
            id="username"
            value={username}
            onChange={(event) => set({ username: sanitizeUsername(event.target.value) })}
            placeholder="مثلاً mahdish"
            disabled={loading}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={status === "taken" || undefined}
            aria-describedby="username-status"
            // وقتی کیبورد باز می‌شود، مرورگر فیلد را بالاتر از CTA چسبیده نگه می‌دارد.
            className="h-full w-full scroll-mb-40 bg-transparent px-1 text-base text-zinc-900 outline-none placeholder:text-zinc-400 disabled:opacity-60 dark:text-zinc-50"
          />
        </div>

        <p id="username-status" role="status" className="mt-2 min-h-5 text-sm">
          {status === "checking" ? (
            <span className="flex items-center gap-2 text-zinc-500">
              <Spinner />
              در حال بررسی...
            </span>
          ) : status === "available" ? (
            <span className="text-emerald-600">این نام کاربری آزاده.</span>
          ) : status === "taken" ? (
            <span className="text-red-600">این نام کاربری قبلاً گرفته شده.</span>
          ) : status === "short" ? (
            <span className="text-zinc-500">
              نام کاربری باید حداقل {USERNAME_MIN_LENGTH} کاراکتر باشه.
            </span>
          ) : status === "failed" ? (
            <span className="text-red-600">بررسی نشد. دوباره امتحان کن.</span>
          ) : (
            <span className="text-zinc-500">بقیه با این نام پیدات می‌کنن.</span>
          )}
        </p>

        {status === "taken" && suggestions.length > 0 ? (
          <div dir="ltr" className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => set({ username: suggestion })}
                disabled={loading}
                className="h-10 rounded-full border border-zinc-200 px-3 text-sm text-zinc-700 transition hover:border-zinc-400 active:scale-95 disabled:opacity-40 motion-reduce:active:scale-100 dark:border-zinc-700 dark:text-zinc-300"
              >
                @{suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {/* ۲ — آواتار */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          عکست رو انتخاب کن
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          می‌تونی یه آواتار انتخاب کنی یا عکس خودت رو بذاری.
        </p>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => onPhotoPicked(event.target.files?.[0])}
        />

        {picker === "crop" && pendingPhoto ? (
          <div className="mt-4">
            <PhotoCropper
              src={pendingPhoto}
              onCancel={closeCropper}
              onDone={(blob) => {
                replaceAvatar({ kind: "photo", url: URL.createObjectURL(blob), blob });
                closeCropper();
              }}
            />
          </div>
        ) : (
          <>
            <div className="mt-4 flex flex-col items-center">
              <ViewTransition key={avatarKey(avatar)} enter="avatar-swap" exit="avatar-swap" default="none">
                <CurrentAvatar avatar={avatar} />
              </ViewTransition>
              <div className="mt-4 flex gap-2">
                <SecondaryAction
                  onClick={() => setPicker(picker === "avatars" ? "none" : "avatars")}
                  disabled={loading}
                  active={picker === "avatars"}
                >
                  انتخاب آواتار
                </SecondaryAction>
                <SecondaryAction
                  onClick={() => fileInput.current?.click()}
                  disabled={loading}
                >
                  {avatar?.kind === "photo" ? "تغییر عکس" : "آپلود عکس"}
                </SecondaryAction>
              </div>
            </div>

            {picker === "avatars" ? (
              <ul className="mt-5 grid grid-cols-4 gap-3">
                {AVATARS.map((item) => {
                  const selected = avatar?.kind === "preset" && avatar.id === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => replaceAvatar({ kind: "preset", id: item.id })}
                        disabled={loading}
                        aria-pressed={selected}
                        aria-label={item.label}
                        className={`flex aspect-square w-full items-center justify-center rounded-xl border-2 p-1.5 transition active:scale-95 disabled:opacity-60 motion-reduce:active:scale-100 ${
                          selected
                            ? "border-accent bg-accent-soft"
                            : "border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                        }`}
                      >
                        <AvatarArt id={item.id} className="size-full" alive={selected} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </>
        )}
      </section>

      {/* ۳ — درباره من */}
      <section className="mt-8">
        <div className="mb-2 flex items-center gap-2">
          <label htmlFor="bio" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            درباره من
          </label>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
            اختیاری
          </span>
        </div>
        <textarea
          id="bio"
          value={bio}
          onChange={(event) => set({ bio: event.target.value.slice(0, BIO_MAX_LENGTH) })}
          placeholder="یه جمله کوتاه درباره خودت بنویس..."
          rows={3}
          maxLength={BIO_MAX_LENGTH}
          disabled={loading}
          className="max-h-40 min-h-24 w-full scroll-mb-40 resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base leading-8 text-zinc-900 outline-none transition field-sizing-content placeholder:text-zinc-400 focus:border-accent focus:ring-4 focus:ring-accent/14 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <p
          dir="ltr"
          className={`mt-2 text-end text-xs transition-colors ${
            bioCloseToLimit ? "text-zinc-600 dark:text-zinc-300" : "text-zinc-400"
          }`}
        >
          {bio.length} / {BIO_MAX_LENGTH}
        </p>
      </section>

      {/* ۴ — CTA */}
      <div className="sticky bottom-0 mt-8 border-t border-zinc-200 bg-zinc-50 pt-4 pb-6 sm:bg-white dark:border-zinc-800 dark:bg-black sm:dark:bg-zinc-950">
        {error ? (
          <div className="mb-3 text-center">
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
            <button
              type="button"
              onClick={onSubmit}
              className="mt-1 h-9 text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100 active:scale-95 motion-reduce:active:scale-100"
            >
              تلاش دوباره
            </button>
          </div>
        ) : null}
        <PrimaryButton
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          loading={loading}
          loadingLabel="داریم آماده‌اش می‌کنیم..."
        >
          بزن بریم
        </PrimaryButton>
      </div>
    </div>
  );
}

/** شناسهٔ پایدار آواتار فعلی — فقط برای تشخیص «عوض شد» توسط ViewTransition. */
function avatarKey(avatar: AvatarChoice): string {
  if (!avatar) return "none";
  return avatar.kind === "photo" ? avatar.url : avatar.id;
}

function CurrentAvatar({ avatar }: { avatar: AvatarChoice }) {
  if (avatar?.kind === "photo") {
    return (
      // آدرس blob است؛ next/image اینجا کاربرد ندارد.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar.url}
        alt="عکس پروفایل"
        className="size-24 rounded-full object-cover"
      />
    );
  }
  return (
    <AvatarArt
      id={avatar?.kind === "preset" ? avatar.id : AVATARS[0].id}
      className="size-24 rounded-full"
      alive
    />
  );
}

function SecondaryAction({
  onClick,
  disabled,
  active,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-11 rounded-full border px-4 text-sm font-medium transition active:scale-95 disabled:opacity-40 motion-reduce:active:scale-100 ${
        active
          ? "border-accent bg-accent-soft text-zinc-900 dark:text-zinc-50"
          : "border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}
