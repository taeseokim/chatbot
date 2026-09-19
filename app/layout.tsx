import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "인덕과학기술고등학교 2학년 파이썬 수행평가 | Online Judge",
  description: "인덕과학기술고등학교 2학년 정보과 파이썬 수행평가 - 체질량지수(BMI) 4단계 판정 온라인 저지 및 교사용 평가 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#f5f5f7] dark:bg-black text-neutral-900 dark:text-neutral-100">{children}</body>
    </html>
  );
}
