"use client";

import { isValidMobile } from "@/lib/auth/mobile";
import { PrimaryButton, StepHeader, TextField } from "../_components/ui";

export function MobileStep({
  mobile,
  onChange,
  onSubmit,
  loading,
  error,
}: {
  mobile: string;
  onChange: (mobile: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error?: string;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <StepHeader
        title="ورود به حساب کاربری"
        description="برای ادامه، شماره موبایل خود را وارد کنید."
      />

      <TextField
        id="mobile"
        label="شماره موبایل"
        placeholder="مثلاً 09123456789"
        value={mobile}
        onChange={(event) => onChange(event.target.value)}
        error={error}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        enterKeyHint="go"
        // عمداً maxLength ندارد: مرورگر قبل از رسیدن مقدار به onChange می‌بُرید و
        // paste کردن فرم‌های `+98…`/`0098…` را خراب می‌کرد. سقف ۱۱ رقم را
        // `normalizeMobile` اعمال می‌کند.
        autoFocus
        disabled={loading}
        // Chrome خودش `type="tel"` را LTR می‌کند؛ این کلاس همان رفتار را در
        // بقیهٔ مرورگرها هم قطعی می‌کند تا ارقام همه‌جا یکسان رندر شوند.
        className="ltr"
      />

      <PrimaryButton
        type="submit"
        className="mt-6"
        disabled={!isValidMobile(mobile)}
        loading={loading}
        loadingLabel="در حال بررسی..."
      >
        ادامه
      </PrimaryButton>
    </form>
  );
}
