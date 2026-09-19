import type { ComponentProps, ReactNode } from "react";

export function StepHeader({
  progress,
  title,
  description,
}: {
  progress?: string;
  title: string;
  description: ReactNode;
}) {
  return (
    <header className="mb-8">
      {progress ? (
        <p className="mb-3 text-xs font-medium text-zinc-400">{progress}</p>
      ) : null}
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
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
            : "border-zinc-200 focus:border-zinc-900 focus:ring-zinc-900/10 dark:border-zinc-800 dark:focus:border-zinc-300 dark:focus:ring-zinc-100/10"
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
      className={`flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 text-base font-semibold text-white transition enabled:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:enabled:hover:bg-white ${className}`}
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

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`size-4 animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
