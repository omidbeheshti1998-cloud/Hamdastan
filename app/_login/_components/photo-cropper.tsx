"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

/** اندازهٔ کادر برش روی صفحه (px). ثابت است تا ریاضیِ برش به اندازه‌گیری DOM نیاز نداشته باشد. */
const BOX_SIZE = 256;

/** اندازهٔ خروجی نهایی (px). برای یک آواتار کافی است. */
const OUTPUT_SIZE = 512;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * برش ساده ۱:۱ — فقط جابه‌جایی با درگ و بزرگ‌نمایی. عمداً ادیتور کامل نیست.
 * به‌جای Modal، درجا جای بخش آواتار می‌نشیند.
 *
 * موقعیت به‌صورت «نقطهٔ مرکزِ کادر، در مختصات نسبیِ خود تصویر (۰ تا ۱)» نگه
 * داشته می‌شود، نه پیکسل. این باعث می‌شود بزرگ‌نمایی حول همان نقطه بماند و
 * محاسبهٔ پیکسلی کاملاً از روی state مشتق شود — بدون هیچ effect همگام‌کننده.
 */
export function PhotoCropper({
  src,
  onCancel,
  onDone,
}: {
  src: string;
  onCancel: () => void;
  onDone: (blob: Blob) => void;
}) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragStart = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);

  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: 0.5, y: 0.5 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      setNatural({ w: image.naturalWidth, h: image.naturalHeight });
    };
    image.src = src;
  }, [src]);

  // «cover»: کوچک‌ترین بزرگ‌نمایی که تصویر کل کادر مربع را بپوشاند.
  const scale = natural ? (BOX_SIZE / Math.min(natural.w, natural.h)) * zoom : 1;
  const width = natural ? natural.w * scale : 0;
  const height = natural ? natural.h * scale : 0;

  /** مرکز را طوری محدود می‌کند که هیچ لبهٔ خالی داخل کادر نیفتد. */
  const limit = (size: number) => (size ? BOX_SIZE / (2 * size) : 0);
  const cx = clamp(center.x, limit(width), 1 - limit(width));
  const cy = clamp(center.y, limit(height), 1 - limit(height));

  const left = BOX_SIZE / 2 - cx * width;
  const top = BOX_SIZE / 2 - cy * height;

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!natural) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { x: event.clientX, y: event.clientY, cx, cy };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const start = dragStart.current;
    if (!start) return;
    setCenter({
      x: start.cx - (event.clientX - start.x) / width,
      y: start.cy - (event.clientY - start.y) / height,
    });
  }

  function endDrag() {
    dragStart.current = null;
  }

  function confirm() {
    const image = imageRef.current;
    if (!image || saving) return;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const context = canvas.getContext("2d");
    if (!context) return;

    setSaving(true);
    // تبدیل مختصات نمایش به مختصات پیکسلی خودِ تصویر
    const source = BOX_SIZE / scale;
    context.drawImage(image, -left / scale, -top / scale, source, source, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    canvas.toBlob(
      (blob) => {
        setSaving(false);
        if (blob) onDone(blob);
      },
      "image/jpeg",
      0.9,
    );
  }

  return (
    <div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ width: BOX_SIZE, height: BOX_SIZE }}
        className="relative mx-auto touch-none overflow-hidden rounded-full bg-zinc-100 select-none dark:bg-zinc-800"
      >
        {natural ? (
          // آدرس blob است و ابعادش در زمان اجرا معلوم می‌شود؛ next/image اینجا کاربرد ندارد.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            draggable={false}
            className="absolute max-w-none"
            style={{ width, height, left, top }}
          />
        ) : null}
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-xs text-zinc-500">بزرگ‌نمایی</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="w-full accent-accent"
          aria-label="بزرگ‌نمایی عکس"
        />
      </label>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={confirm}
          disabled={!natural || saving}
          className="h-12 flex-1 rounded-xl bg-zinc-900 text-sm font-semibold text-white shadow-xs transition enabled:hover:bg-zinc-800 enabled:active:scale-[0.97] disabled:opacity-40 disabled:shadow-none motion-reduce:enabled:active:scale-100 dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-none dark:enabled:hover:bg-white"
        >
          تأیید
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-12 flex-1 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 transition hover:border-zinc-400 active:scale-[0.97] motion-reduce:active:scale-100 dark:border-zinc-800 dark:text-zinc-300"
        >
          انصراف
        </button>
      </div>
    </div>
  );
}
