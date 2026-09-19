"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { toLatinDigits } from "@/lib/auth/mobile";

export const OTP_LENGTH = 6;

const digitsOnly = (value: string) =>
  toLatinDigits(value).replace(/\D/g, "").slice(0, OTP_LENGTH);

/**
 * ورودی کد تأیید ۶ رقمی.
 * جهت کانتینر عمداً LTR است تا ارقام از چپ به راست — همان‌طور که عدد خوانده
 * می‌شود — پر شوند؛ بقیهٔ صفحه RTL باقی می‌ماند.
 */
export function OtpInput({
  value,
  onChange,
  disabled,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const focusAt = (index: number) =>
    inputs.current[Math.min(Math.max(index, 0), OTP_LENGTH - 1)]?.focus();

  const handleChange = (index: number, raw: string) => {
    const incoming = digitsOnly(raw);

    if (!incoming) {
      onChange(value.slice(0, index));
      return;
    }

    // AutoFill سیستم‌عامل کل کد را داخل یک خانه می‌ریزد.
    if (incoming.length > 1) {
      const next = (value.slice(0, index) + incoming).slice(0, OTP_LENGTH);
      onChange(next);
      focusAt(next.length);
      return;
    }

    const next = (
      value.slice(0, index) +
      incoming +
      value.slice(index + 1)
    ).slice(0, OTP_LENGTH);
    onChange(next);
    focusAt(index + 1);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !value[index]) {
      event.preventDefault();
      onChange(value.slice(0, Math.max(index - 1, 0)));
      focusAt(index - 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusAt(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const pasted = digitsOnly(event.clipboardData.getData("text"));
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted);
    focusAt(pasted.length);
  };

  return (
    <div
      dir="ltr"
      onPaste={handlePaste}
      className="flex justify-between gap-2"
      role="group"
      aria-label="کد تأیید ۶ رقمی"
    >
      {Array.from({ length: OTP_LENGTH }, (_, index) => (
        <input
          key={index}
          ref={(node) => {
            inputs.current[index] = node;
          }}
          value={value[index] ?? ""}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onFocus={(event) => event.target.select()}
          disabled={disabled}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          autoFocus={index === 0}
          aria-label={`رقم ${index + 1}`}
          aria-invalid={invalid || undefined}
          className={`size-12 rounded-xl border bg-white text-center text-xl font-semibold text-zinc-900 outline-none transition focus:ring-4 disabled:opacity-60 dark:bg-zinc-900 dark:text-zinc-50 ${
            invalid
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
              : "border-zinc-200 focus:border-zinc-900 focus:ring-zinc-900/10 dark:border-zinc-800 dark:focus:border-zinc-300 dark:focus:ring-zinc-100/10"
          }`}
        />
      ))}
    </div>
  );
}
