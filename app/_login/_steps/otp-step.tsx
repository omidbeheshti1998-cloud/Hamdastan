"use client";

import { useEffect, useRef, useState } from "react";
import { authErrorMessage, sendOtp } from "@/lib/auth/client";
import { maskMobile } from "@/lib/auth/mobile";
import { OTP_LENGTH, OtpInput } from "../_components/otp-input";
import { Spinner, StepHeader } from "../_components/ui";

/** کد تأیید ۲ دقیقه اعتبار دارد. */
const OTP_TTL_MS = 2 * 60 * 1000;

/**
 * `failed` پیامش را با خودش می‌آورد، چون دلیلِ شکست یکی نیست: ۵۰۰ سرور، نشست
 * منقضی و قطعی شبکه سه چیز متفاوت‌اند و سه اقدام متفاوت می‌خواهند. پیش‌تر هر
 * سه یک پیام ثابتِ «ارتباط با سرور برقرار نشد» می‌گرفتند و همین باعث شد یک
 * متغیر محیطیِ ست‌نشده در production، شبیه قطعی اینترنت دیده شود.
 */
type OtpError =
  | { kind: "invalid" }
  | { kind: "expired" }
  | { kind: "failed"; message: string };

const INVALID_CODE: OtpError = { kind: "invalid" };
const EXPIRED_CODE: OtpError = { kind: "expired" };

function errorMessage(error: OtpError): string {
  switch (error.kind) {
    case "invalid":
      return "کد واردشده صحیح نیست.";
    case "expired":
      return "اعتبار این کد تمام شده است. کد جدید دریافت کنید.";
    case "failed":
      return error.message;
  }
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * این کامپوننت نمی‌داند ثبت‌نام است یا ورود. تأیید کد از بیرون تزریق می‌شود
 * (`onVerify`) چون در مسیر ورود فقط کد بررسی می‌شود و در مسیر ثبت‌نام همان کد
 * حساب را هم می‌سازد. جابه‌جایی به مرحلهٔ بعد وظیفهٔ صدازننده است.
 */
export function OtpStep({
  mobile,
  onEditMobile,
  onVerify,
}: {
  mobile: string;
  onEditMobile: () => void;
  onVerify: (code: string) => Promise<{ ok: boolean }>;
}) {
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState(() => Date.now() + OTP_TTL_MS);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<OtpError | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resentNotice, setResentNotice] = useState(false);

  // با مرجع زمانی مطلق کار می‌کنیم تا تب پس‌زمینه تایمر را منحرف نکند.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // پیام «کد جدید ارسال شد.» گذراست تا جای تایمر اعتبار را اشغال نکند.
  useEffect(() => {
    if (!resentNotice) return;
    const id = setTimeout(() => setResentNotice(false), 4000);
    return () => clearTimeout(id);
  }, [resentNotice]);

  const secondsLeft = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const expired = secondsLeft === 0;
  const busy = verifying || resending;

  // انقضا بر هر خطای قبلی مقدم است: اگر کد وسط نمایشِ «کد اشتباه» منقضی شود،
  // آن پیام دیگر درست نیست و تنها اقدام معنادار، گرفتن کد جدید است.
  const shownError = expired ? EXPIRED_CODE : error;

  // جلوگیری از Double Submit وقتی auto-verify و کلیک هم‌زمان می‌شوند.
  const inFlight = useRef(false);

  async function verify(value: string) {
    if (inFlight.current) return;
    if (Date.now() >= expiresAt) {
      setError(EXPIRED_CODE);
      return;
    }

    inFlight.current = true;
    setVerifying(true);
    setError(null);
    try {
      const { ok } = await onVerify(value);
      if (!ok) setError(INVALID_CODE);
    } catch (cause) {
      setError({ kind: "failed", message: authErrorMessage(cause) });
    } finally {
      inFlight.current = false;
      setVerifying(false);
    }
  }

  function handleCodeChange(value: string) {
    setCode(value);
    setResentNotice(false);
    if (error) setError(null);
    // پس از وارد شدن رقم ششم، تأیید خودکار انجام می‌شود.
    if (value.length === OTP_LENGTH) void verify(value);
  }

  async function handleResend() {
    if (inFlight.current) return;
    inFlight.current = true;
    setResending(true);
    setError(null);
    try {
      await sendOtp(mobile);
      // کد قبلی از همین لحظه بی‌اعتبار است و تایمر از ۰۲:۰۰ شروع می‌شود.
      setCode("");
      setExpiresAt(Date.now() + OTP_TTL_MS);
      setNow(Date.now());
      setResentNotice(true);
    } catch (cause) {
      setError({ kind: "failed", message: authErrorMessage(cause) });
    } finally {
      inFlight.current = false;
      setResending(false);
    }
  }

  return (
    <div>
      <StepHeader
        title="کد تأیید را وارد کنید"
        description="کد ۶ رقمی ارسال‌شده به شماره زیر را وارد کنید."
      />

      <div className="mb-6 flex items-center justify-between gap-3 rounded-xl bg-zinc-100 px-4 py-3 dark:bg-zinc-900">
        <span className="ltr text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {maskMobile(mobile)}
        </span>
        <button
          type="button"
          onClick={onEditMobile}
          disabled={busy}
          className="text-sm font-medium text-zinc-500 underline underline-offset-4 transition hover:text-zinc-900 active:scale-95 disabled:opacity-40 motion-reduce:active:scale-100 dark:hover:text-zinc-100"
        >
          ویرایش شماره
        </button>
      </div>

      <OtpInput
        // ارسال مجدد کد، ورودی را ریست و فوکوس را به خانهٔ اول برمی‌گرداند.
        key={expiresAt}
        value={code}
        onChange={handleCodeChange}
        disabled={busy}
        invalid={shownError?.kind === "invalid"}
      />

      <div className="mt-5 min-h-16 text-sm">
        {verifying ? (
          <p className="flex items-center gap-2 text-zinc-500">
            <Spinner />
            در حال بررسی کد...
          </p>
        ) : shownError ? (
          <p
            role="alert"
            className={expired ? "text-zinc-500" : "text-red-600"}
          >
            {errorMessage(shownError)}
          </p>
        ) : resentNotice ? (
          <p role="status" className="text-emerald-600">
            کد جدید ارسال شد.
          </p>
        ) : (
          <p className="flex items-center gap-1 text-zinc-500">
            اعتبار کد:
            <span className="ltr">{formatCountdown(secondsLeft)}</span>
          </p>
        )}

        <div className="mt-2">
          {expired ? (
            <button
              type="button"
              onClick={() => void handleResend()}
              disabled={busy}
              className="flex h-11 items-center gap-2 font-medium text-zinc-900 underline underline-offset-4 disabled:opacity-40 dark:text-zinc-100 active:scale-95 motion-reduce:active:scale-100"
            >
              {resending ? <Spinner /> : null}
              ارسال مجدد کد
            </button>
          ) : error?.kind === "failed" ? (
            <button
              type="button"
              onClick={() => void verify(code)}
              disabled={busy || code.length !== OTP_LENGTH}
              className="h-11 font-medium text-zinc-900 underline underline-offset-4 disabled:opacity-40 dark:text-zinc-100 active:scale-95 motion-reduce:active:scale-100"
            >
              تلاش مجدد
            </button>
          ) : (
            <p className="flex h-11 items-center gap-1 text-zinc-400">
              ارسال مجدد کد تا
              <span className="ltr">{formatCountdown(secondsLeft)}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
