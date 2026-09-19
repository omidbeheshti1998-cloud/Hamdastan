import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const kalameh = localFont({
  src: [
    { path: "../font/Kalameh(FaNum)-Regular.ttf", weight: "400", style: "normal" },
    { path: "../font/Kalameh(FaNum)-Medium.ttf", weight: "500", style: "normal" },
    { path: "../font/Kalameh(FaNum)-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../font/Kalameh(FaNum)-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-kalameh",
  display: "swap",
});

export const metadata: Metadata = {
  title: "همدستان",
  description: "ورود به حساب کاربری همدستان",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${kalameh.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
