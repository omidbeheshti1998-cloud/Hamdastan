"use client";

import { useId, useState } from "react";
import {
  INTEREST_CATEGORIES,
  MIN_INTEREST_CATEGORIES,
  type InterestCategory,
  type InterestSelection,
} from "@/lib/interests";
import { CheckIcon, ChevronDownIcon, CloseIcon } from "../_components/icons";
import { PrimaryButton, StepHeader } from "../_components/ui";

export function InterestsStep({
  selection,
  onChange,
  onSubmit,
  onSkip,
  loading,
  error,
}: {
  selection: InterestSelection;
  onChange: (selection: InterestSelection) => void;
  onSubmit: () => void;
  onSkip: () => void;
  loading: boolean;
  error?: string;
}) {
  // فقط یک دسته در یک لحظه باز است؛ انتخاب‌ها مستقل از باز/بسته بودن می‌مانند.
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const selectedCount = Object.keys(selection).length;
  const canSubmit = selectedCount >= MIN_INTEREST_CATEGORIES;

  function toggleCategory(category: InterestCategory) {
    if (selection[category.id]) {
      // دستهٔ انتخاب‌شده: فقط باز/بسته می‌شود و انتخاب‌هایش حفظ می‌ماند.
      setExpandedId(expandedId === category.id ? null : category.id);
      return;
    }
    onChange({ ...selection, [category.id]: [] });
    setExpandedId(category.id);
  }

  function removeCategory(category: InterestCategory) {
    const next = { ...selection };
    delete next[category.id];
    onChange(next);
    if (expandedId === category.id) setExpandedId(null);
  }

  function toggleSubInterest(category: InterestCategory, subId: string) {
    const current = selection[category.id] ?? [];
    const next = current.includes(subId)
      ? current.filter((id) => id !== subId)
      : [...current, subId];
    onChange({ ...selection, [category.id]: next });
  }

  return (
    <div>
      <StepHeader
        title="به چه چیزهایی علاقه داری؟"
        description={
          <>
            چند مورد رو انتخاب کن تا چیزهایی که بیشتر دوست داری بهت نشون بدیم.
            <span className="mt-1 block text-zinc-400">
              بعداً هم می‌تونی انتخاب‌هات رو تغییر بدی.
            </span>
          </>
        }
      />

      <ul className="flex flex-col gap-2">
        {INTEREST_CATEGORIES.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            selected={selection[category.id] !== undefined}
            selectedSubIds={selection[category.id] ?? []}
            expanded={expandedId === category.id}
            disabled={loading}
            onToggle={() => toggleCategory(category)}
            onRemove={() => removeCategory(category)}
            onToggleSub={(subId) => toggleSubInterest(category, subId)}
          />
        ))}
      </ul>

      <div className="sticky bottom-0 mt-6 border-t border-zinc-200 bg-zinc-50 pt-4 pb-6 dark:border-zinc-800 dark:bg-black sm:bg-white sm:dark:bg-zinc-950">
        <p
          className={`mb-3 text-center text-sm ${
            canSubmit ? "text-emerald-600" : "text-zinc-500"
          }`}
        >
          {canSubmit
            ? "عالیه! هرچقدر دوست داری می‌تونی ادامه بدی."
            : "حداقل ۳ علاقه رو انتخاب کن."}
        </p>

        {error ? (
          <p role="alert" className="mb-3 text-center text-sm text-red-600">
            {error}
          </p>
        ) : null}

        <PrimaryButton
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          loading={loading}
          loadingLabel="در حال ذخیره..."
        >
          {canSubmit ? "ادامه" : "حداقل ۳ مورد انتخاب کن"}
        </PrimaryButton>

        <button
          type="button"
          onClick={onSkip}
          disabled={loading}
          className="mx-auto mt-3 block h-11 px-3 text-sm text-zinc-400 transition hover:text-zinc-600 disabled:opacity-40 dark:hover:text-zinc-300 active:scale-95 motion-reduce:active:scale-100"
        >
          فعلاً رد کردن
        </button>
      </div>
    </div>
  );
}

function CategoryCard({
  category,
  selected,
  selectedSubIds,
  expanded,
  disabled,
  onToggle,
  onRemove,
  onToggleSub,
}: {
  category: InterestCategory;
  selected: boolean;
  selectedSubIds: string[];
  expanded: boolean;
  disabled: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onToggleSub: (subId: string) => void;
}) {
  const panelId = `${useId()}-panel`;

  return (
    <li
      className={`overflow-hidden rounded-xl border transition-colors ${
        selected
          ? "border-accent bg-white dark:bg-zinc-900"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <div className="flex items-center">
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="flex h-16 flex-1 items-center gap-3 px-4 text-start disabled:opacity-60"
        >
          <span
            aria-hidden="true"
            // فقط دور دایره نارنجی می‌شود، نه داخلش: دایرهٔ توپُر وزن بصری
            // زیادی داشت و با دکمهٔ اصلی رقابت می‌کرد.
            className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
              selected
                ? "border-accent text-accent"
                : "border-zinc-300 dark:border-zinc-600"
            }`}
          >
            {selected ? <CheckIcon className="size-4" /> : null}
          </span>

          <span className="flex-1 font-medium text-zinc-900 dark:text-zinc-50">
            {category.label}
          </span>

          {selected && !expanded && selectedSubIds.length > 0 ? (
            <span className="shrink-0 text-xs text-zinc-500">
              {selectedSubIds.length} انتخاب
            </span>
          ) : null}

          <ChevronDownIcon
            className={`size-4 shrink-0 text-zinc-400 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>

        {selected ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            aria-label={`حذف ${category.label}`}
            className="flex size-12 shrink-0 items-center justify-center text-zinc-400 transition hover:text-zinc-900 disabled:opacity-40 dark:hover:text-zinc-100"
          >
            <CloseIcon className="size-4" />
          </button>
        ) : null}
      </div>

      {/* ترفند grid-rows 0fr↔1fr: باز و بسته شدن را بدون اندازه‌گیری با JS انیمیت می‌کند. */}
      <div
        id={panelId}
        inert={!expanded}
        className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-wrap gap-2 px-4 pb-4">
            {category.subInterests.map((sub) => {
              const active = selectedSubIds.includes(sub.id);
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onToggleSub(sub.id)}
                  disabled={disabled}
                  aria-pressed={active}
                  className={`h-11 rounded-full border px-4 text-sm transition active:scale-95 disabled:opacity-60 motion-reduce:active:scale-100 ${
                    active
                      ? "border-accent bg-accent-soft text-zinc-900 dark:text-zinc-50"
                      : "border-zinc-200 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </li>
  );
}
