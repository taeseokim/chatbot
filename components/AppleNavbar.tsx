'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, ShieldCheck, Terminal, Award } from 'lucide-react';

interface AppleNavbarProps {
  onOpenTeacherAuth?: () => void;
}

export default function AppleNavbar({ onOpenTeacherAuth }: AppleNavbarProps) {
  const pathname = usePathname();
  const isTeacher = pathname.startsWith('/teacher');

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/75 dark:bg-[#000000]/75 border-b border-black/[0.08] dark:border-white/[0.12] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* 학교 로고 및 제목 */}
        <Link href="/" className="flex items-center space-x-3 group cursor-pointer">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#42a5f5] flex items-center justify-center text-white shadow-sm shadow-[#0071e3]/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-neutral-100">
                인덕과학기술고등학교
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200/50 dark:border-neutral-700/50">
                Python Judge
              </span>
            </div>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 hidden sm:inline">
              2학년 정보과 수행평가 · 체질량지수(BMI) 판정
            </span>
          </div>
        </Link>

        {/* 내비게이션 탭 (애플 세그먼트 컨트롤 스타일) */}
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-full bg-neutral-100/90 dark:bg-neutral-800/90 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center shadow-inner">
            <Link
              href="/"
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all flex items-center space-x-1.5 ${
                !isTeacher
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>학생 제출</span>
            </Link>

            {isTeacher ? (
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-white dark:bg-neutral-900 text-[#0071e3] dark:text-[#2997ff] shadow-sm flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>교사 대시보드</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={onOpenTeacherAuth}
                className="px-3 py-1 text-xs font-medium rounded-full text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>교사 모드</span>
              </button>
            )}
          </div>

          <div className="hidden md:flex items-center pl-2 text-xs text-neutral-500 dark:text-neutral-400 border-l border-neutral-200 dark:border-neutral-800 space-x-1">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>배점 100점</span>
          </div>
        </div>
      </div>
    </header>
  );
}

