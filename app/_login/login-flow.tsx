"use client";

import { useState } from "react";
import {
  checkMobile,
  register,
  saveInterests,
  savePreferences,
  saveProfile,
  sendOtp,
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

const NETWORK_ERROR = "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.";

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

  async function handleMobileSubmit() {
    if (loading || !isValidMobile(mobile)) return;
    setLoading(true);
    setError(undefined);
    try {
      const { registered } = await checkMobile(mobile);
      if (registered) {
        // کاربر موجود: کد تأیید پیش از نمایش مرحلهٔ بعد ارسال می‌شود.
        await sendOtp(mobile);
        setStep("otp");
      } else {
        setStep("profile");
      }
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileSubmit() {
    const firstName = profile.firstName.trim();
    const lastName = profile.lastName.trim();
    if (loading || !firstName || !lastName) return;

    setLoading(true);
    setError(undefined);
    try {
      await register(mobile, firstName, lastName);
      setStep("interests");
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  }

  async function handleInterestsSubmit() {
    if (loading) return;
    setLoading(true);
    setError(undefined);
    try {
      await saveInterests(mobile, interests);
      setStep("preferences");
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  }

  async function handlePreferencesFinish() {
    if (loading) return;
    setLoading(true);
    setError(undefined);
    try {
      await savePreferences(mobile, preferences);
      goToIdentity();
    } catch {
      setError(NETWORK_ERROR);
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
    setStep("identity");
  }

  async function handleIdentitySubmit() {
    if (loading) return;
    setLoading(true);
    setError(undefined);
    try {
      await saveProfile(mobile, identity);
      setStep("onboarded");
    } catch {
      setError("ذخیره نشد. دوباره امتحان کن.");
    } finally {
      setLoading(false);
    }
  }

  function backToMobile() {
    setError(undefined);
    setStep("mobile");
  }

  return (
    <div key={step} className="animate-step-in">
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
          onVerified={() => setStep("loggedIn")}
        />
      ) : step === "interests" ? (
        <InterestsStep
          selection={interests}
          onChange={setInterests}
          onSubmit={handleInterestsSubmit}
          onSkip={() => setStep("preferences")}
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
    </div>
  );
}
