"use client";

import { PrimaryButton, StepHeader, TextField } from "../_components/ui";

export type Profile = { firstName: string; lastName: string };

export function ProfileStep({
  profile,
  onChange,
  onSubmit,
  onBack,
  loading,
  error,
}: {
  profile: Profile;
  onChange: (profile: Profile) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
  error?: string;
}) {
  const firstName = profile.firstName.trim();
  const lastName = profile.lastName.trim();
  const canSubmit = firstName.length > 0 && lastName.length > 0;

  const set = (field: keyof Profile) => (value: string) =>
    onChange({ ...profile, [field]: value });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <StepHeader
        title="خوش اومدی 👋"
        description="برای ساخت حساب، فقط نامت رو به ما بگو."
      />

      <div className="flex flex-col gap-5">
        <TextField
          id="first-name"
          label="نام"
          placeholder="نام خود را وارد کنید"
          value={profile.firstName}
          onChange={(event) => set("firstName")(event.target.value)}
          // فاصله‌های ابتدا و انتها خودکار حذف می‌شوند.
          onBlur={() => set("firstName")(firstName)}
          autoComplete="given-name"
          enterKeyHint="next"
          autoFocus
          disabled={loading}
        />

        <TextField
          id="last-name"
          label="نام خانوادگی"
          placeholder="نام خانوادگی خود را وارد کنید"
          value={profile.lastName}
          onChange={(event) => set("lastName")(event.target.value)}
          onBlur={() => set("lastName")(lastName)}
          error={error}
          autoComplete="family-name"
          // Enter/Done روی آخرین فیلد = دکمهٔ «ادامه»
          enterKeyHint="done"
          disabled={loading}
        />
      </div>

      <PrimaryButton
        type="submit"
        className="mt-7"
        disabled={!canSubmit}
        loading={loading}
        loadingLabel="در حال ثبت..."
      >
        ادامه
      </PrimaryButton>

      <button
        type="button"
        onClick={onBack}
        disabled={loading}
        className="mx-auto mt-4 block h-11 px-3 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 disabled:opacity-40 dark:hover:text-zinc-100 active:scale-95 motion-reduce:active:scale-100"
      >
        بازگشت
      </button>
    </form>
  );
}
