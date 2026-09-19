/**
 * آیکون‌های رابط کاربری.
 *
 * همه یک هندسهٔ مشترک دارند: viewBox ۲۴، بدون fill، قلم ۲ با سر و گوشهٔ گرد.
 * قبلاً همین چند آیکون با ضخامت‌های ۲.۵ و ۳ در فایل‌های مختلف تکرار شده بودند
 * و ست بودنشان به هم می‌خورد.
 *
 * تصویرسازی آواتارها (`avatar-art.tsx`) عمداً از این قاعده پیروی نمی‌کند؛
 * آن‌ها گرافیک‌اند نه آیکون، و ضخامت قلمشان بخشی از طراحی هر شکل است.
 */

import type { SVGProps } from "react";

const BASE = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;

export function CheckIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/**
 * نشانگر بارگذاری. کمان ۹۰ درجه روی یک حلقهٔ کم‌رنگ می‌چرخد.
 * `animate-spin` عمداً اینجا نیست تا صدازننده بتواند اندازه و حاشیه بدهد.
 */
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg {...BASE} className={`size-4 animate-spin ${className}`}>
      <circle className="opacity-25" cx="12" cy="12" r="10" />
      <path className="opacity-90" d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
