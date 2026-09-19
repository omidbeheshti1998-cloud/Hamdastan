import type { ReactNode } from "react";
import { CheckIcon } from "../_components/icons";

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
        <CheckIcon className="size-7" />
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-7 text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}
