'use client';

import React, { useState } from 'react';
import { BookOpen, HelpCircle, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Sparkles, Scale } from 'lucide-react';

export default function ProblemGuide() {
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="bg-white/80 dark:bg-[#141416]/80 backdrop-blur-md rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-5 sm:p-6 shadow-sm space-y-6">
      {/* 헤더 배지 & 타이틀 */}
      <div>
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#0071e3]/10 text-[#0071e3] dark:text-[#2997ff] text-xs font-semibold mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          <span>수행평가 과제 #01</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          체질량지수(BMI) 판정 프로그램
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
          인덕과학기술고등학교 2학년 정보 · 파이썬 조건문(`if-elif-else`)을 활용하여 키와 몸무게에 따른 비만도 4단계를 정확하게 판정하세요.
        </p>
      </div>

      {/* 공식 카드 */}
      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/70 dark:border-neutral-800 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          <Scale className="w-4 h-4 text-[#0071e3] dark:text-[#2997ff]" />
          <span>BMI 계산 공식</span>
        </div>
        <div className="flex flex-col items-center justify-center py-3 px-4 bg-white dark:bg-black/50 rounded-lg border border-neutral-200/50 dark:border-neutral-800 font-mono text-neutral-800 dark:text-neutral-200 space-y-1">
          <div className="text-sm sm:text-base font-bold text-[#0071e3] dark:text-[#2997ff]">
            BMI = 체중(kg) ÷ (키(m))²
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
            bmi = weight / ((height / 100) ** 2)
          </div>
        </div>
        <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
          * 키는 <strong>cm</strong> 단위로 입력되므로, 공식에 대입할 때는 <strong>100으로 나누어 미터(m) 단위</strong>로 환산해야 합니다.
        </p>
      </div>

      {/* 4단계 판정 기준표 */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            📊 4단계 판정 기준표 (고교 교과서 기준)
          </span>
          <span className="text-[11px] text-neutral-400">각 20점 × 5케이스 = 100점</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-neutral-200/80 dark:border-neutral-800 text-xs">
          <table className="w-full text-left border-collapse">
            <thead className="bg-neutral-100/70 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 font-semibold">
              <tr>
                <th className="py-2 px-3">단계</th>
                <th className="py-2 px-3">BMI 수치 범위</th>
                <th className="py-2 px-3">출력 키워드</th>
                <th className="py-2 px-3 text-right">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60 text-neutral-700 dark:text-neutral-300">
              <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                <td className="py-2.5 px-3 font-medium">1단계</td>
                <td className="py-2.5 px-3 font-mono">BMI &lt; 18.5</td>
                <td className="py-2.5 px-3 font-bold text-sky-600 dark:text-sky-400">저체중</td>
                <td className="py-2.5 px-3 text-right"><span className="px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/50 text-[10px]">체중 부족</span></td>
              </tr>
              <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                <td className="py-2.5 px-3 font-medium">2단계</td>
                <td className="py-2.5 px-3 font-mono">18.5 &le; BMI &lt; 23.0</td>
                <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">정상 (정상체중)</td>
                <td className="py-2.5 px-3 text-right"><span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 text-[10px]">적정</span></td>
              </tr>
              <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                <td className="py-2.5 px-3 font-medium">3단계</td>
                <td className="py-2.5 px-3 font-mono">23.0 &le; BMI &lt; 25.0</td>
                <td className="py-2.5 px-3 font-bold text-amber-600 dark:text-amber-400">과체중</td>
                <td className="py-2.5 px-3 text-right"><span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 text-[10px]">주의</span></td>
              </tr>
              <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                <td className="py-2.5 px-3 font-medium">4단계</td>
                <td className="py-2.5 px-3 font-mono">BMI &ge; 25.0</td>
                <td className="py-2.5 px-3 font-bold text-rose-600 dark:text-rose-400">비만</td>
                <td className="py-2.5 px-3 text-right"><span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 text-[10px]">관리 필요</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 입출력 형식 예시 */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          💡 입출력 형식 요구사항
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-neutral-100/80 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800">
            <div className="font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              <span>입력 (Standard Input)</span>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-[11px] mb-2">
              두 줄에 걸쳐 키와 몸무게가 순서대로 주어집니다.
            </p>
            <pre className="p-2 rounded-lg bg-white dark:bg-black font-mono text-neutral-800 dark:text-neutral-200 border border-neutral-200/50 dark:border-neutral-800">
              175.0{"\n"}72.0
            </pre>
          </div>

          <div className="p-3 rounded-xl bg-neutral-100/80 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800">
            <div className="font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>출력 예시 (Standard Output)</span>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-[11px] mb-2">
              출력문 안에 올바른 단계 단어가 포함되어야 합니다.
            </p>
            <pre className="p-2 rounded-lg bg-white dark:bg-black font-mono text-neutral-800 dark:text-neutral-200 border border-neutral-200/50 dark:border-neutral-800">
              과체중{"\n"}# 또는: BMI: 23.51, 과체중
            </pre>
          </div>
        </div>
      </div>

      {/* 힌트 접이식 영역 */}
      <div className="border-t border-neutral-200/60 dark:border-neutral-800 pt-3">
        <button
          type="button"
          onClick={() => setShowHint(!showHint)}
          className="w-full flex items-center justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors py-1 cursor-pointer"
        >
          <span className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>선생님의 파이썬 힌트 열어보기</span>
          </span>
          {showHint ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showHint && (
          <div className="mt-3 p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-xs space-y-2 text-neutral-700 dark:text-neutral-300">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p><strong>1. 입력값 실수형 변환:</strong> <code>input()</code>으로 받은 값은 문자열이므로 반드시 <code>float()</code>으로 감싸주세요.</p>
                <p><strong>2. 단위 환산 주의:</strong> 입력받은 키(cm)를 100으로 나누어 미터 단위로 변환한 후 제곱해야 합니다.</p>
                <p><strong>3. 조건문 구조:</strong> <code>if bmi &lt; 18.5:</code>부터 순서대로 <code>elif</code>를 사용하면 간결하게 4단계를 구분할 수 있습니다.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
