import type { ReactNode } from "react";

export function DoneStep({
  title,
  description,
}: {
  title: string;
  description: ReactNode;
}) {
  return (
    <div className="text-center">
      <div
        aria-hidden="true"
        className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-7"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 13 4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-7 text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}
