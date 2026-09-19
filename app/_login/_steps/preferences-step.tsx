"use client";

import { useEffect, useRef, useState } from "react";
import {
  PREFERENCE_QUESTIONS,
  type PreferenceAnswer,
  type PreferenceAnswers,
} from "@/lib/preferences";
import { PrimaryButton, StepHeader } from "../_components/ui";

/** فاصلهٔ بین انتخاب گزینه و باز شدن سؤال بعد — به‌اندازه‌ای که Selected State دیده شود. */
const AUTO_ADVANCE_MS = 250;

type Phase = "intro" | "quiz" | "done";

export function PreferencesStep({
  answers,
  onChange,
  onFinish,
  onSkip,
  loading,
  error,
}: {
  answers: PreferenceAnswers;
  onChange: (answers: PreferenceAnswers) => void;
  onFinish: () => void;
  onSkip: () => void;
  loading: boolean;
  error?: string;
}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  // در فاصلهٔ auto-advance ورودی قفل می‌شود تا تپ دوم سؤال بعد را رد نکند.
  const [advancing, setAdvancing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const question = PREFERENCE_QUESTIONS[index];
  const total = PREFERENCE_QUESTIONS.length;

  function choose(value: PreferenceAnswer) {
    if (advancing) return;
    onChange({ ...answers, [question.id]: value });
    setAdvancing(true);
    timer.current = setTimeout(() => {
      setAdvancing(false);
      if (index === total - 1) setPhase("done");
      else setIndex((i) => i + 1);
    }, AUTO_ADVANCE_MS);
  }

  function goBack() {
    if (advancing) return;
    if (index === 0) setPhase("intro");
    else setIndex((i) => i - 1);
  }

  if (phase === "intro") {
    return (
      <div className="animate-step-in">
        <StepHeader
          title="یکم بیشتر بشناسیمت"
          description={
            <>
              چند انتخاب کوتاهه و جواب درست یا غلطی هم وجود نداره.
              <span className="mt-1 block text-zinc-400">
                هر چیزی که بیشتر شبیه خودته انتخاب کن.
              </span>
            </>
          }
        />
        <PrimaryButton type="button" onClick={() => setPhase("quiz")}>
          شروع کنیم
        </PrimaryButton>
        <SkipAction onSkip={onSkip} disabled={loading} />
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="animate-step-in">
        <StepHeader
          title="عالیه، یکم بهتر شناختیمت"
          description="از این انتخاب‌ها برای شخصی‌تر کردن تجربه‌ات استفاده می‌کنیم."
        />
        {error ? (
          <p role="alert" className="mb-3 text-sm text-red-600">
            {error}
          </p>
        ) : null}
        <PrimaryButton
          type="button"
          onClick={onFinish}
          loading={loading}
          loadingLabel="در حال ذخیره..."
        >
          بزن بریم
        </PrimaryButton>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <p className="mb-2 text-xs font-medium text-zinc-400">
          {index + 1} از {total}
        </p>
        <div
          className="h-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={total}
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200 ease-out"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* key باعث می‌شود هر سؤال با همان ترنزیشن کوتاه مراحل دیگر باز شود. */}
      <div key={question.id} className="animate-step-in">
        <h1 className="mb-6 text-xl leading-9 font-bold text-zinc-900 dark:text-zinc-50">
          {question.question}
        </h1>

        <div className="flex flex-col gap-3">
          {question.choices.map((choice) => {
            const selected = answers[question.id] === choice.value;
            return (
              <button
                key={choice.label}
                type="button"
                onClick={() => choose(choice.value)}
                aria-pressed={selected}
                // حالت انتخاب عمداً پُرِ مشکی نیست: تنها عنصر مشکی صفحه باید
                // دکمهٔ اصلی بماند، وگرنه گزینه‌ها با آن رقابت بصری می‌کنند.
                className={`min-h-18 w-full rounded-xl border px-5 py-4 text-start text-base leading-8 transition active:scale-[0.99] motion-reduce:active:scale-100 ${
                  selected
                    ? "border-accent bg-accent-soft text-zinc-900 dark:text-zinc-50"
                    : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                }`}
              >
                {choice.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          className="h-11 px-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100 active:scale-95 motion-reduce:active:scale-100"
        >
          قبلی
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="h-11 px-2 text-sm text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300 active:scale-95 motion-reduce:active:scale-100"
        >
          فعلاً رد کردن
        </button>
      </div>
    </div>
  );
}

function SkipAction({ onSkip, disabled }: { onSkip: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onSkip}
      disabled={disabled}
      className="mx-auto mt-3 block h-11 px-3 text-sm text-zinc-400 transition hover:text-zinc-600 disabled:opacity-40 dark:hover:text-zinc-300 active:scale-95 motion-reduce:active:scale-100"
    >
      فعلاً رد کردن
    </button>
  );
}
