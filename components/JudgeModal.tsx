'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Submission, TestCaseResult } from '@/lib/types';
import { CheckCircle2, XCircle, Trophy, Sparkles, Clock, X, ChevronRight, AlertTriangle } from 'lucide-react';

interface JudgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission | null;
}

export default function JudgeModal({ isOpen, onClose, submission }: JudgeModalProps) {
  useEffect(() => {
    if (isOpen && submission && submission.score === 100) {
      // 100점 만점일 경우 애플 스타일 축하 폭죽 발사!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0071e3', '#2997ff', '#34c759', '#ffd60a'],
      });
    }
  }, [isOpen, submission]);

  if (!isOpen || !submission) return null;

  const isPerfect = submission.score === 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1c1c1e] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* 상단 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 히어로 점수 배너 */}
        <div className={`p-6 sm:p-8 text-center text-white relative overflow-hidden ${
          isPerfect
            ? 'bg-gradient-to-b from-[#0071e3] to-[#0051a8]'
            : submission.score >= 60
            ? 'bg-gradient-to-b from-amber-600 to-amber-800'
            : 'bg-gradient-to-b from-neutral-800 to-neutral-950'
        }`}>
          {/* 장식용 은은한 빛 */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3">
            {isPerfect ? (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>수행평가 만점 달성!</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>채점 완료 (일부 케이스 확인 필요)</span>
              </>
            )}
          </div>

          <div className="flex items-baseline justify-center space-x-2">
            <span className="text-5xl sm:text-6xl font-black tracking-tight">{submission.score}</span>
            <span className="text-xl sm:text-2xl font-light text-white/80">/ {submission.totalScore}점</span>
          </div>

          <p className="mt-2 text-sm text-white/90">
            <strong>{submission.studentId} {submission.studentName}</strong> 학생의 채점 결과입니다. (통과: {submission.passedCount} / {submission.totalCount})
          </p>
        </div>

        {/* 테스트케이스 상세 목록 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            <span>테스트케이스 채점 상세 리포트</span>
            <span>총 {submission.results.length}개 케이스</span>
          </div>

          {submission.results.map((res: TestCaseResult, idx: number) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${
                res.passed
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/50'
                  : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2">
                  {res.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {res.title}
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      입력: 키 {res.input.height}cm, 몸무게 {res.input.weight}kg (기대 BMI: 약 {res.expectedBmi})
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                    res.passed
                      ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                  }`}>
                    {res.score} / {res.maxScore}점
                  </span>
                  <div className="text-[10px] text-neutral-400 flex items-center justify-end space-x-0.5 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{res.executionTimeMs}ms</span>
                  </div>
                </div>
              </div>

              {/* 판정 비교 바 */}
              <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/50 dark:border-neutral-800">
                  <span className="text-neutral-400 text-[10px] block">기대 판정</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{res.expectedCategory}</span>
                </div>
                <div className="p-2 rounded-lg bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/50 dark:border-neutral-800">
                  <span className="text-neutral-400 text-[10px] block">학생 코드 판정</span>
                  <span className={`font-semibold ${res.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {res.detectedCategory || '(판정 불가)'}
                  </span>
                </div>
              </div>

              {/* 학생 코드 실제 출력값 */}
              <div className="mt-2 text-xs">
                <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">실제 출력 (Standard Output):</span>
                <pre className="mt-1 p-2 rounded-lg bg-white dark:bg-black/70 font-mono text-neutral-700 dark:text-neutral-300 text-[11px] overflow-x-auto border border-neutral-200/50 dark:border-neutral-800">
                  {res.actualOutput || '(출력 없음)'}
                </pre>
              </div>

              {/* 에러 또는 감점 원인 */}
              {res.error && (
                <div className="mt-2 p-2 rounded-lg bg-rose-100/60 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs">
                  <strong>피드백:</strong> {res.error}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 하단 확인 버튼 바 */}
        <div className="p-4 sm:p-5 bg-neutral-50 dark:bg-[#141416] border-t border-neutral-200 dark:border-neutral-800 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs sm:text-sm font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}

