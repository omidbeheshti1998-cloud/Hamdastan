/** تبدیل ارقام فارسی/عربی به لاتین تا مقدارِ ذخیره‌شده همیشه ASCII بماند. */
export function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

/**
 * ورودی کاربر را به شکل استاندارد `09xxxxxxxxx` نرمال می‌کند.
 * فرم‌های `+98…` و `0098…` و `9…` هم پذیرفته می‌شوند، اما فقط وقتی
 * تعداد ارقام کامل شده باشد تا تایپ کردن وسط کار پرش نکند.
 */
export function normalizeMobile(raw: string): string {
  let digits = toLatinDigits(raw).replace(/\D/g, "");

  if (digits.startsWith("0098")) digits = digits.slice(4);
  else if (digits.startsWith("98") && digits.length > 10) digits = digits.slice(2);

  if (digits.length === 10 && digits.startsWith("9")) digits = `0${digits}`;

  return digits.slice(0, 11);
}

export function isValidMobile(mobile: string): boolean {
  return /^09\d{9}$/.test(mobile);
}

/** `09123456789` → `0912 *** 6789` */
export function maskMobile(mobile: string): string {
  return `${mobile.slice(0, 4)} *** ${mobile.slice(-4)}`;
}
