import type { ReactNode } from "react";

/**
 * ست آواتار پروژه — SVG تخت با یک زبان بصری مشترک (بدون stroke، دو-سه رنگ،
 * همان هندسهٔ صورت برای حیوان‌ها) تا کنار هم یکدست دیده شوند.
 *
 * عمداً از ایموجی سیستم‌عامل استفاده نشده: ایموجی در هر پلتفرم شکل متفاوتی
 * دارد و ست را ناهماهنگ می‌کند.
 */

type Art = { bg: string; body: ReactNode };

const eyes = (color = "#3B2415", cx = 7, cy = 32, r = 2.6) => (
  <>
    <circle className="avatar-eye" cx={32 - cx} cy={cy} r={r} fill={color} />
    <circle className="avatar-eye" cx={32 + cx} cy={cy} r={r} fill={color} />
  </>
);

const ray = (angle: number, color: string) => (
  <rect
    key={angle}
    x="30.5"
    y="6"
    width="3"
    height="8"
    rx="1.5"
    fill={color}
    transform={`rotate(${angle} 32 32)`}
  />
);

const petal = (angle: number, color: string) => (
  <ellipse
    key={angle}
    cx="32"
    cy="20"
    rx="7"
    ry="10"
    fill={color}
    transform={`rotate(${angle} 32 32)`}
  />
);

const ART: Record<string, Art> = {
  fox: {
    bg: "#FFEBD9",
    body: (
      <>
        <path d="M17 27 15 13l12 7z" fill="#D9631F" />
        <path d="M47 27 49 13l-12 7z" fill="#D9631F" />
        <path d="M32 17c11 0 17 8 17 17s-8 16-17 16-17-7-17-16 6-17 17-17z" fill="#F2843A" />
        <ellipse cx="32" cy="42" rx="11" ry="8" fill="#FFF7F0" />
        {eyes()}
        <ellipse cx="32" cy="39" rx="3.2" ry="2.4" fill="#3B2415" />
      </>
    ),
  },
  panda: {
    bg: "#F1F1F4",
    body: (
      <>
        <circle cx="18" cy="19" r="7" fill="#2E2E33" />
        <circle cx="46" cy="19" r="7" fill="#2E2E33" />
        <circle cx="32" cy="34" r="17" fill="#FFFFFF" />
        <ellipse cx="25" cy="31" rx="5" ry="6" fill="#2E2E33" transform="rotate(-15 25 31)" />
        <ellipse cx="39" cy="31" rx="5" ry="6" fill="#2E2E33" transform="rotate(15 39 31)" />
        {eyes("#FFFFFF", 7, 31, 1.8)}
        <ellipse cx="32" cy="40" rx="3.4" ry="2.4" fill="#2E2E33" />
      </>
    ),
  },
  lion: {
    bg: "#FFF1D6",
    body: (
      <>
        {Array.from({ length: 10 }, (_, index) => {
          const angle = (index * 36 * Math.PI) / 180;
          return (
            <circle
              key={index}
              cx={32 + Math.cos(angle) * 15}
              cy={32 + Math.sin(angle) * 15}
              r="7.5"
              fill="#C97F1E"
            />
          );
        })}
        <circle cx="32" cy="32" r="15" fill="#D9922E" />
        <circle cx="32" cy="33" r="12.5" fill="#F5C168" />
        <circle className="avatar-eye" cx="27" cy="30" r="2.3" fill="#4A2E0B" />
        <circle className="avatar-eye" cx="37" cy="30" r="2.3" fill="#4A2E0B" />
        <path d="M32 34.5 35 37.5 32 40 29 37.5z" fill="#4A2E0B" />
        <path d="M28 40c2 2.2 6 2.2 8 0" stroke="#4A2E0B" strokeWidth="2" strokeLinecap="round" fill="none" />
      </>
    ),
  },
  tiger: {
    bg: "#FFE7D2",
    body: (
      <>
        <circle cx="20" cy="20" r="6" fill="#D9631F" />
        <circle cx="44" cy="20" r="6" fill="#D9631F" />
        <circle cx="32" cy="34" r="17" fill="#F2843A" />
        <rect x="30.5" y="18" width="3" height="8" rx="1.5" fill="#43281A" />
        <rect x="21" y="21" width="3" height="7" rx="1.5" fill="#43281A" transform="rotate(-28 22 24)" />
        <rect x="40" y="21" width="3" height="7" rx="1.5" fill="#43281A" transform="rotate(28 42 24)" />
        <ellipse cx="32" cy="42" rx="10" ry="7" fill="#FFF7F0" />
        {eyes("#43281A")}
        <ellipse cx="32" cy="39" rx="3.2" ry="2.4" fill="#43281A" />
      </>
    ),
  },
  bear: {
    bg: "#F0E4DA",
    body: (
      <>
        <circle cx="19" cy="20" r="7" fill="#8A5A3B" />
        <circle cx="45" cy="20" r="7" fill="#8A5A3B" />
        <circle cx="19" cy="20" r="3.5" fill="#C89B7B" />
        <circle cx="45" cy="20" r="3.5" fill="#C89B7B" />
        <circle cx="32" cy="34" r="17" fill="#A06B45" />
        <ellipse cx="32" cy="41" rx="10" ry="8" fill="#E8CDB6" />
        {eyes("#3B2415")}
        <ellipse cx="32" cy="38" rx="3.4" ry="2.6" fill="#3B2415" />
      </>
    ),
  },
  unicorn: {
    bg: "#F3E9FF",
    body: (
      <>
        <path d="M32 6 36 19h-8z" fill="#F0B429" />
        <path d="M18 24c-3-6 2-10 7-8l-2 12z" fill="#E86FA8" />
        <circle cx="33" cy="35" r="16" fill="#FFFFFF" />
        <path d="M46 24c4-4 9 0 8 5l-9 4z" fill="#E86FA8" />
        <circle className="avatar-eye" cx="27" cy="33" r="2.6" fill="#4A2A5E" />
        <circle className="avatar-eye" cx="39" cy="33" r="2.6" fill="#4A2A5E" />
        <ellipse cx="33" cy="43" rx="6" ry="4" fill="#FFE2EF" />
      </>
    ),
  },
  dolphin: {
    bg: "#DDF1FA",
    body: (
      <>
        <path d="M32 10c2.5 0 4.6 2.4 5.6 6.8h-11.2C27.4 12.4 29.5 10 32 10z" fill="#2E7FB4" />
        <circle cx="32" cy="33" r="17" fill="#4BA3DC" />
        <ellipse cx="32" cy="43" rx="9.5" ry="7" fill="#EAF6FD" />
        <circle className="avatar-eye" cx="25" cy="30" r="2.6" fill="#123A55" />
        <circle className="avatar-eye" cx="39" cy="30" r="2.6" fill="#123A55" />
        <path d="M28 43.5c2 2.2 6 2.2 8 0" stroke="#3E9BD6" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </>
    ),
  },
  butterfly: {
    bg: "#FFE6F1",
    body: (
      <>
        {/* چپ/راست اینجا مختصات داخلی SVG است و با `dir` صفحه عوض نمی‌شود. */}
        <g className="avatar-wing-left">
          <ellipse cx="21" cy="26" rx="11" ry="9" fill="#E8619A" transform="rotate(-20 21 26)" />
          <ellipse cx="23" cy="41" rx="8" ry="7" fill="#F49AC1" transform="rotate(-15 23 41)" />
        </g>
        <g className="avatar-wing-right">
          <ellipse cx="43" cy="26" rx="11" ry="9" fill="#E8619A" transform="rotate(20 43 26)" />
          <ellipse cx="41" cy="41" rx="8" ry="7" fill="#F49AC1" transform="rotate(15 41 41)" />
        </g>
        <rect x="30.5" y="20" width="3" height="26" rx="1.5" fill="#5B3A50" />
        <path d="M32 21c-2-4-5-6-8-6M32 21c2-4 5-6 8-6" stroke="#5B3A50" strokeWidth="2" strokeLinecap="round" fill="none" />
      </>
    ),
  },
  sun: {
    bg: "#FFF4D6",
    body: (
      <>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => ray(a, "#F0B429"))}
        <circle cx="32" cy="32" r="14" fill="#FFC93C" />
        {eyes("#8A5A00", 5, 30, 2.2)}
        <path d="M27 37c2 3 8 3 10 0" stroke="#8A5A00" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      </>
    ),
  },
  moon: {
    bg: "#E7EAF7",
    body: (
      <>
        <g className="avatar-float">
          {/* هلال = دایرهٔ بزرگ منهای دایرهٔ جابه‌جاشده، با fill-rule=evenodd */}
          <path
            fillRule="evenodd"
            fill="#8E97D6"
            d="M9 33a21 21 0 1 0 42 0 21 21 0 1 0-42 0zM27 26a19 19 0 1 0 38 0 19 19 0 1 0-38 0z"
          />
          <circle cx="18" cy="30" r="3.2" fill="#7A83C4" />
          <circle cx="24" cy="44" r="2.4" fill="#7A83C4" />
        </g>
      </>
    ),
  },
  flower: {
    bg: "#E8F6E4",
    body: (
      <>
        <g className="avatar-sway">
          {[0, 72, 144, 216, 288].map((a) => petal(a, "#EF7C8E"))}
          <circle cx="32" cy="32" r="8" fill="#FFC93C" />
        </g>
      </>
    ),
  },
  star: {
    bg: "#FFF8DB",
    body: (
      <>
        <path
          d="m32 8 7.4 15.4L56 25.6 44 37.4l2.9 16.6L32 46.2 17.1 54 20 37.4 8 25.6l16.6-2.2z"
          fill="#F5B921"
        />
        {eyes("#8A5A00", 5, 30, 2.2)}
        <path d="M28 36c2 2.5 6 2.5 8 0" stroke="#8A5A00" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      </>
    ),
  },
};

export function AvatarArt({
  id,
  className = "",
  alive = false,
}: {
  /** شناسهٔ آواتار از `AVATARS`. */
  id: string;
  className?: string;
  /** آواتار انتخاب‌شده پلک می‌زند؛ بقیه ساکن می‌مانند. */
  alive?: boolean;
}) {
  const art = ART[id];

  return (
    <svg
      viewBox="0 0 64 64"
      className={`${alive ? "avatar-alive" : ""} ${className}`}
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="32" fill={art?.bg ?? "#E7E7EA"} />
      {art?.body}
    </svg>
  );
}
