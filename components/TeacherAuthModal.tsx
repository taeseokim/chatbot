'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, X, ArrowRight, KeyRound } from 'lucide-react';

interface TeacherAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TeacherAuthModal({ isOpen, onClose }: TeacherAuthModalProps) {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('교사 인증 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 서버 검증
      const res = await fetch(`/api/teacher?pin=${encodeURIComponent(pin.trim())}`);
      const data = await res.json();

      if (data.success) {
        // 인증 성공 시 세션스토리지에 저장하고 이동
        sessionStorage.setItem('induk_teacher_pin', pin.trim());
        onClose();
        router.push(`/teacher?pin=${encodeURIComponent(pin.trim())}`);
      } else {
        setError(data.error || '비밀번호가 올바르지 않습니다.');
      }
    } catch {
      setError('인증 확인 중 네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#1c1c1e] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 sm:p-7 overflow-hidden">
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#0071e3]/10 text-[#0071e3] dark:text-[#2997ff] flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            교사 전용 대시보드 인증
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            인덕과학기술고등학교 정보과 교사용 관리 페이지입니다.<br />
            보안 비밀번호를 입력해주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              교사 인증 비밀번호
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="비밀번호 입력 (기본: induk2026)"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                autoFocus
              />
            </div>
            {error && (
              <p className="mt-1.5 text-xs text-rose-500 font-medium">
                {error}
              </p>
            )}
            <div className="mt-2 p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800/60 text-[11px] text-neutral-500 flex items-center space-x-1">
              <KeyRound className="w-3 h-3 text-[#0071e3]" />
              <span>초기 기본 비밀번호는 <strong>induk2026</strong> 입니다.</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] active:scale-98 text-white text-xs sm:text-sm font-semibold flex items-center justify-center space-x-1.5 shadow-md shadow-[#0071e3]/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? '인증 확인 중...' : '대시보드 입장'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

