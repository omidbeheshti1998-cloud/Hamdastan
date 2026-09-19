"use client";

import { addTransitionType, startTransition, ViewTransition, useState } from "react";
import {
  authErrorMessage,
  checkMobile,
  register,
  saveInterests,
  savePreferences,
  saveProfile,
  sendOtp,
  UsernameTakenError,
  verifyOtp,
} from "@/lib/auth/client";
import { isValidMobile, normalizeMobile } from "@/lib/auth/mobile";
import type { InterestSelection } from "@/lib/interests";
import type { PreferenceAnswers } from "@/lib/preferences";
import { randomAvatarId, type ProfileIdentity } from "@/lib/profile";
import { DoneStep } from "./_steps/done-step";
import { InterestsStep } from "./_steps/interests-step";
import { MobileStep } from "./_steps/mobile-step";
import { OtpStep } from "./_steps/otp-step";
import { IdentityStep } from "./_steps/identity-step";
import { PreferencesStep } from "./_steps/preferences-step";
import { ProfileStep, type Profile } from "./_steps/profile-step";

type Step =
  | "mobile"
  | "profile"
  | "interests"
  | "preferences"
  | "identity"
  | "otp"
  | "onboarded"
  | "loggedIn";

/**
 * ترتیب مراحل فقط برای تشخیص جهت حرکت است، نه برای کنترل فلو.
 * با این ترتیب لازم نیست هر جابه‌جایی دستی «جلو» یا «عقب» برچسب بخورد.
 */
const STEP_ORDER: Step[] = [
  "mobile",
  "profile",
  "otp",
  "interests",
  "preferences",
  "identity",
  "onboarded",
];

export function LoginFlow() {
  const [step, setStep] = useState<Step>("mobile");
  // ورودی‌ها در سطح فلو نگه داشته می‌شوند تا «بازگشت» داده‌های قبلی را حفظ کند.
  const [mobile, setMobile] = useState("");
  const [profile, setProfile] = useState<Profile>({ firstName: "", lastName: "" });
  const [interests, setInterests] = useState<InterestSelection>({});
  const [preferences, setPreferences] = useState<PreferenceAnswers>({});
  const [identity, setIdentity] = useState<ProfileIdentity>({
    username: "",
    avatar: null,
    bio: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  // مرحلهٔ OTP در هر دو مسیر یکی است؛ فقط کاری که با کد تأییدشده می‌شود فرق دارد.
  const [otpPurpose, setOtpPurpose] = useState<"login" | "signup">("login");

  /**
   * تنها راه عوض کردن مرحله. دو کار می‌کند:
   * ۱) جهت را از ترتیب مراحل درمی‌آورد و به‌عنوان «نوع ترنزیشن» ثبت می‌کند.
   * ۲) تغییر را داخل `startTransition` می‌گذارد — بدون این، `<ViewTransition>`
   *    اصلاً فعال نمی‌شود چون setState معمولی ترنزیشن به حساب نمی‌آید.
   * نوع ترنزیشن عمداً به‌جای prop استفاده شده: عنصری که دارد خارج می‌شود
   * props رندر قبلی‌اش را دارد، پس جهت روی آن کهنه می‌ماند.
   */
  function go(next: Step) {
    const from = STEP_ORDER.indexOf(step);
    const to = STEP_ORDER.indexOf(next);
    const back = from !== -1 && to !== -1 && to < from;

    startTransition(() => {
      addTransitionType(back ? "step-back" : "step-forward");
      setStep(next);
    });
  }

  async function handleMobileSubmit() {
    if (loading || !isValidMobile(mobile)) return;
    setLoading(true);
    setError(undefined);
    try {
      const { registered } = await checkMobile(mobile);
      if (registered) {
        // کاربر موجود: کد تأیید پیش از نمایش مرحلهٔ بعد ارسال می‌شود.
        await sendOtp(mobile);
        setOtpPurpose("login");
        go("otp");
      } else {
        go("profile");
      }
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }

  /**
   * نام گرفته شد؛ حالا نوبت تأیید شماره است. حساب همین‌جا ساخته نمی‌شود —
   * ساختنش با `register` و هم‌زمان با تأیید کد انجام می‌شود تا شماره‌ای که
   * تأیید نشده حسابی در دیتابیس نداشته باشد. نام تا آن لحظه در همین state می‌ماند.
   */
  async function handleProfileSubmit() {
    const firstName = profile.firstName.trim();
    const lastName = profile.lastName.trim();
    if (loading || !firstName || !lastName) return;

    setLoading(true);
    setError(undefined);
    try {
      await sendOtp(mobile);
      setOtpPurpose("signup");
      go("otp");
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }

  /**
   * تنها تفاوت دو مسیر: در ورود فقط کد بررسی می‌شود، در ثبت‌نام همان کد حساب را
   * هم می‌سازد. خطای شبکه عمداً گرفته نمی‌شود تا `OtpStep` پیام خودش را نشان دهد.
   */
  async function handleOtpVerify(code: string): Promise<{ ok: boolean }> {
    if (otpPurpose === "login") {
      const result = await verifyOtp(mobile, code);
      if (result.ok) go("loggedIn");
      return result;
    }

    const result = await register(
      mobile,
      code,
      profile.firstName.trim(),
      profile.lastName.trim(),
    );
    if (result.ok) go("interests");
    return result;
  }

  async function handleInterestsSubmit() {
    if (loading) return;
    setLoading(true);
    setError(undefined);
    try {
      await saveInterests(interests);
      go("preferences");
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }

  async function handlePreferencesFinish() {
    if (loading) return;
    setLoading(true);
    setError(undefined);
    try {
      await savePreferences(preferences);
      goToIdentity();
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }

  /**
   * ورود به مرحلهٔ آخر. اگر هنوز آواتاری انتخاب نشده، یکی تصادفی برایش
   * برمی‌داریم تا پروفایل از همان اول خالی نباشد.
   * انتخاب تصادفی عمداً اینجا (در event handler) انجام می‌شود و نه هنگام
   * مقداردهی اولیهٔ state، وگرنه سرور و کلاینت دو مقدار متفاوت رندر می‌کردند.
   */
  function goToIdentity() {
    setIdentity((current) =>
      current.avatar
        ? current
        : { ...current, avatar: { kind: "preset", id: randomAvatarId() } },
    );
    go("identity");
  }

  async function handleIdentitySubmit() {
    if (loading) return;
    setLoading(true);
    setError(undefined);
    try {
      await saveProfile(identity);
      go("onboarded");
    } catch (cause) {
      // بین بررسی حین تایپ و ذخیره، ممکن است کسی همان نام کاربری را گرفته باشد.
      setError(
        cause instanceof UsernameTakenError
          ? "این نام کاربری قبلاً گرفته شده. یکی دیگر انتخاب کن."
          : authErrorMessage(cause),
      );
    } finally {
      setLoading(false);
    }
  }

  function backToMobile() {
    setError(undefined);
    go("mobile");
  }

  // `key={step}` باعث می‌شود React مرحلهٔ قبل و بعد را جفتِ خروج/ورود ببیند،
  // نه یک به‌روزرسانی درجا. کلاس‌ها از روی نوع ترنزیشنی که `go` ثبت کرده
  // انتخاب می‌شوند؛ `default: "none"` جلوی انیمیت شدن در ترنزیشن‌های نامربوط
  // (مثل رفرش یا back مرورگر) را می‌گیرد.
  const direction = {
    "step-forward": "step-forward",
    "step-back": "step-back",
    default: "none",
  } as const;

  return (
    <ViewTransition key={step} enter={direction} exit={direction} default="none">
      {step === "mobile" ? (
        <MobileStep
          mobile={mobile}
          onChange={(value) => {
            setMobile(normalizeMobile(value));
            setError(undefined);
          }}
          onSubmit={handleMobileSubmit}
          loading={loading}
          error={error}
        />
      ) : step === "profile" ? (
        <ProfileStep
          profile={profile}
          onChange={setProfile}
          onSubmit={handleProfileSubmit}
          onBack={backToMobile}
          loading={loading}
          error={error}
        />
      ) : step === "otp" ? (
        <OtpStep
          mobile={mobile}
          onEditMobile={backToMobile}
          onVerify={handleOtpVerify}
        />
      ) : step === "interests" ? (
        <InterestsStep
          selection={interests}
          onChange={setInterests}
          onSubmit={handleInterestsSubmit}
          onSkip={() => go("preferences")}
          loading={loading}
          error={error}
        />
      ) : step === "preferences" ? (
        <PreferencesStep
          answers={preferences}
          onChange={setPreferences}
          onFinish={handlePreferencesFinish}
          onSkip={goToIdentity}
          loading={loading}
          error={error}
        />
      ) : step === "identity" ? (
        <IdentityStep
          identity={identity}
          onChange={setIdentity}
          onSubmit={handleIdentitySubmit}
          loading={loading}
          error={error}
        />
      ) : step === "onboarded" ? (
        <DoneStep
          title="همه‌چیز آماده‌ست"
          description="حساب شما ساخته شد. مرحلهٔ بعدی به‌زودی اینجا اضافه می‌شود."
        />
      ) : (
        <DoneStep title="خوش برگشتی" description="با موفقیت وارد حساب خود شدید." />
      )}
    </ViewTransition>
  );
}
