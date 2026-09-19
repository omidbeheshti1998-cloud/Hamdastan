import type { ComponentProps, ReactNode } from "react";
import { Spinner } from "./icons";

// اسپینر از `icons` می‌آید؛ اینجا دوباره صادر می‌شود چون بیشتر مصرف‌کننده‌ها
// آن را کنار بقیهٔ عناصر فرم از همین ماژول می‌گیرند.
export { Spinner };

export function StepHeader({
  title,
  description,
}: {
  title: string;
  description: ReactNode;
}) {
  return (
    <header className="mb-8">
      {/* بدون `tracking-tight`: فشرده‌کردن حروف از تایپوگرافی لاتین می‌آید و
          روی خط فارسی که حروفش به هم متصل‌اند، اتصال‌ها را خراب می‌کند. */}
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-7 text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
    </header>
  );
}

export function TextField({
  label,
  error,
  hint,
  id,
  className = "",
  ...props
}: ComponentProps<"input"> & { label: string; error?: string; hint?: string }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      <input
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`h-14 w-full rounded-xl border bg-white px-4 text-base text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:ring-4 disabled:opacity-60 dark:bg-zinc-900 dark:text-zinc-50 ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
            : "border-zinc-200 focus:border-accent focus:ring-accent/14 dark:border-zinc-800"
        } ${className}`}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-2 text-sm text-zinc-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function PrimaryButton({
  loading,
  loadingLabel,
  children,
  className = "",
  disabled,
  ...props
}: ComponentProps<"button"> & { loading?: boolean; loadingLabel?: string }) {
  return (
    <button
      {...props}
      // جلوگیری از Double Submit: در حالت Loading دکمه غیرفعال است.
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      // `active:scale` فقط روی دکمهٔ فعال: فشرده‌شدن دکمهٔ غیرفعال پیام اشتباه می‌دهد.
      className={`flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 text-base font-semibold text-white shadow-xs transition enabled:hover:bg-zinc-800 enabled:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none motion-reduce:enabled:active:scale-100 dark:bg-zinc-50 dark:text-zinc-900 dark:shadow-none dark:enabled:hover:bg-white ${className}`}
    >
      {loading ? (
        <>
          <Spinner />
          {loadingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
