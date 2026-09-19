'use client';

import React, { useState } from 'react';
import { Sparkles, X, Bot, RefreshCw, Copy, Check, Lightbulb, BookOpen } from 'lucide-react';

interface AiTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  explanation: string;
  loading: boolean;
  onRetry: () => void;
}

export default function AiTutorModal({
  isOpen,
  onClose,
  code,
  explanation,
  loading,
  onRetry,
}: AiTutorModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-[#1c1c1e] rounded-3xl shadow-2xl border border-neutral-200/80 dark:border-neutral-800 flex flex-col overflow-hidden text-neutral-900 dark:text-neutral-100">
        {/* 상단 macOS 스타일 헤더 */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800/80 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#0071e3] to-[#5856d6] text-white shadow-md shadow-[#0071e3]/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="text-sm sm:text-base font-bold">
                  AI 파이썬 코드 해석 튜터
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0071e3]/10 text-[#0071e3] dark:text-[#2997ff]">
                  Gemini 3.6 Flash
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                인덕과학기술고등학교 2학년 학생 맞춤형 코드 해설
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {explanation && !loading && (
              <button
                type="button"
                onClick={handleCopy}
                className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="해설 복사"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={onRetry}
              disabled={loading}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40"
              title="다시 해석하기"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 본문 콘텐츠 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-[#0071e3]/10 flex items-center justify-center text-[#0071e3] animate-pulse">
                  <Sparkles className="w-7 h-7 animate-spin duration-1000" />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  학생의 파이썬 코드를 한 줄씩 분석하고 있습니다...
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  변수, 연산자, 조건문(if-elif-else)을 알기 쉽게 풀어서 설명해 드려요!
                </p>
              </div>
            </div>
          ) : explanation ? (
            <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-3 whitespace-pre-wrap font-sans">
              {explanation}
            </div>
          ) : (
            <div className="py-12 text-center text-neutral-400 text-xs">
              해석할 내용이 없습니다. 코드를 작성한 후 다시 시도해 주세요.
            </div>
          )}
        </div>

        {/* 하단 닫기 바 */}
        <div className="px-6 py-3.5 border-t border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs text-neutral-500">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>AI는 생각을 돕는 도우미입니다. 스스로 코드를 수정해 보세요!</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-xs font-semibold transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
