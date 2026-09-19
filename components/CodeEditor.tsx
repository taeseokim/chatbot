'use client';

import React, { useState, useRef } from 'react';
import { Play, Send, RotateCcw, User, Hash, Terminal as TerminalIcon, Sparkles } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  studentId: string;
  setStudentId: (id: string) => void;
  studentName: string;
  setStudentName: (name: string) => void;
  onRunSingle: (height: number, weight: number) => Promise<void>;
  onSubmitJudge: () => Promise<void>;
  isRunning: boolean;
  isJudging: boolean;
  runOutput: string;
  runError?: string;
}

const DEFAULT_PYTHON_TEMPLATE = `# [인덕과학기술고등학교] 2학년 정보 파이썬 수행평가
# 문제: 키(cm)와 몸무게(kg)를 입력받아 BMI를 계산하고 4단계를 판정하세요.

# 1. 키와 몸무게 입력 (단위: cm, kg)
height = float(input("키(cm)를 입력하세요: "))
weight = float(input("몸무게(kg)를 입력하세요: "))

# 2. 키(cm)를 미터(m)로 변환하여 BMI 계산
height_m = height / 100
bmi = weight / (height_m * height_m)

# 3. 계산된 BMI 출력
print(f"당신의 BMI는 {bmi:.2f}입니다.")

# 4. 조건문(if-elif-else)을 이용한 4단계 판정
# (저체중, 정상체중, 과체중, 비만)
if bmi < 18.5:
    print("저체중")
elif bmi < 23.0:
    print("정상체중")
elif bmi < 25.0:
    print("과체중")
else:
    print("비만")
`;

export default function CodeEditor({
  code,
  setCode,
  studentId,
  setStudentId,
  studentName,
  setStudentName,
  onRunSingle,
  onSubmitJudge,
  isRunning,
  isJudging,
  runOutput,
  runError,
}: CodeEditorProps) {
  const [testHeight, setTestHeight] = useState('175');
  const [testWeight, setTestWeight] = useState('72');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 줄 번호 생성
  const lines = code.split('\n');
  const lineCount = Math.max(lines.length, 18);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  // 탭 키 및 엔터 키 자동 인덴트 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = '    '; // 4칸 공백
      const newCode = code.substring(0, start) + spaces + code.substring(end);
      setCode(newCode);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    } else if (e.key === 'Enter') {
      // 자동 들여쓰기 (현재 라인의 공백 추출)
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const currentLine = code.substring(0, start).split('\n').pop() || '';
      const match = currentLine.match(/^(\s+)/);
      let indent = match ? match[1] : '';

      // 끝에 콜론(:)이 있으면 들여쓰기 4칸 추가
      if (currentLine.trim().endsWith(':')) {
        indent += '    ';
      }

      if (indent.length > 0) {
        e.preventDefault();
        const newCode = code.substring(0, start) + '\n' + indent + code.substring(start);
        setCode(newCode);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length;
        }, 0);
      }
    }
  };

  const handleReset = () => {
    if (window.confirm('기본 파이썬 템플릿 코드로 되돌리시겠습니까?')) {
      setCode(DEFAULT_PYTHON_TEMPLATE);
    }
  };

  const handleRun = () => {
    const h = parseFloat(testHeight);
    const w = parseFloat(testWeight);
    if (isNaN(h) || isNaN(w)) {
      alert('올바른 키와 몸무게를 입력해주세요.');
      return;
    }
    onRunSingle(h, w);
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden transition-all duration-200">
      {/* 1. macOS 스타일 타이틀바 & 학생 정보 입력 */}
      <div className="bg-[#2d2d30] px-4 py-2.5 flex flex-wrap items-center justify-between border-b border-neutral-800 gap-2">
        {/* 신호등 버튼 + 타이틀 */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
          </div>
          <span className="text-xs font-mono font-medium text-neutral-300">
            solution.py <span className="text-neutral-500">(Python 3.14)</span>
          </span>
        </div>

        {/* 학생 정보 입력 필드 */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-[#1a1a1c] px-2.5 py-1 rounded-lg border border-neutral-700/60 text-xs">
            <Hash className="w-3 h-3 text-neutral-400" />
            <input
              type="text"
              placeholder="학번 (예: 20101)"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="bg-transparent border-none text-white focus:outline-none w-24 text-xs font-mono"
            />
          </div>

          <div className="flex items-center space-x-1 bg-[#1a1a1c] px-2.5 py-1 rounded-lg border border-neutral-700/60 text-xs">
            <User className="w-3 h-3 text-neutral-400" />
            <input
              type="text"
              placeholder="이름 (예: 홍길동)"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="bg-transparent border-none text-white focus:outline-none w-20 text-xs"
            />
          </div>

          <button
            type="button"
            onClick={handleReset}
            title="기본 코드로 초기화"
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-700/50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. 코드 에디터 영역 (줄번호 + 텍스트 영역) */}
      <div className="relative flex flex-1 min-h-[380px] max-h-[460px] overflow-hidden bg-[#1e1e1e] font-mono text-[13px] leading-relaxed">
        {/* 줄 번호 */}
        <div className="select-none py-3 px-3 text-right text-neutral-600 bg-[#1e1e1e] border-r border-neutral-800 font-mono text-xs w-12 shrink-0">
          {lineNumbers.map((num) => (
            <div key={num}>{num}</div>
          ))}
        </div>

        {/* 텍스트 입력창 */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 p-3 bg-transparent text-neutral-100 resize-none focus:outline-none font-mono text-[13px] leading-relaxed whitespace-pre overflow-auto selection:bg-[#264f78]"
          placeholder="# 여기에 파이썬 코드를 작성하세요..."
        />
      </div>

      {/* 3. 하단 인터랙티브 실행 & 콘솔 터미널 */}
      <div className="bg-[#18181b] border-t border-neutral-800 p-3 sm:p-4 space-y-3">
        {/* 단일 테스트 입력 & 실행 버튼들 */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* 테스트 입력값 (키, 몸무게) */}
          <div className="flex items-center space-x-2 text-xs text-neutral-300">
            <span className="text-neutral-400 font-medium hidden sm:inline">실행 테스트 입력:</span>
            <div className="flex items-center space-x-1 bg-[#27272a] px-2 py-1 rounded-md border border-neutral-700">
              <span className="text-[11px] text-neutral-400">키:</span>
              <input
                type="text"
                value={testHeight}
                onChange={(e) => setTestHeight(e.target.value)}
                className="w-10 bg-transparent text-white font-mono text-xs focus:outline-none text-right"
              />
              <span className="text-[11px] text-neutral-400">cm</span>
            </div>
            <div className="flex items-center space-x-1 bg-[#27272a] px-2 py-1 rounded-md border border-neutral-700">
              <span className="text-[11px] text-neutral-400">몸무게:</span>
              <input
                type="text"
                value={testWeight}
                onChange={(e) => setTestWeight(e.target.value)}
                className="w-10 bg-transparent text-white font-mono text-xs focus:outline-none text-right"
              />
              <span className="text-[11px] text-neutral-400">kg</span>
            </div>

            <button
              type="button"
              onClick={handleRun}
              disabled={isRunning}
              className="px-3 py-1.5 rounded-lg bg-neutral-700 hover:bg-neutral-600 active:scale-95 text-white font-medium text-xs flex items-center space-x-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? '실행 중...' : '코드 실행'}</span>
            </button>
          </div>

          {/* 최종 채점 및 제출 버튼 (애플 블루 버튼) */}
          <button
            type="button"
            onClick={onSubmitJudge}
            disabled={isJudging}
            className="px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] active:scale-95 text-white font-semibold text-xs sm:text-sm flex items-center space-x-2 transition-all shadow-md shadow-[#0071e3]/30 disabled:opacity-50 cursor-pointer ml-auto"
          >
            {isJudging ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>채점 중...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>제출 및 자동 채점하기</span>
              </>
            )}
          </button>
        </div>

        {/* 터미널 출력 결과 창 */}
        <div className="rounded-xl bg-black/90 p-3 border border-neutral-800 text-xs font-mono">
          <div className="flex items-center justify-between text-neutral-500 pb-1.5 mb-1.5 border-b border-neutral-800/80 text-[11px]">
            <span className="flex items-center space-x-1">
              <TerminalIcon className="w-3 h-3 text-neutral-400" />
              <span>실행 콘솔 (Output Console)</span>
            </span>
            <span className="text-neutral-500">Standard Output</span>
          </div>

          <div className="min-h-[60px] max-h-[100px] overflow-y-auto">
            {runError ? (
              <div className="text-rose-400 whitespace-pre-wrap">{runError}</div>
            ) : runOutput ? (
              <div className="text-emerald-400 whitespace-pre-wrap">{runOutput}</div>
            ) : (
              <div className="text-neutral-500 italic">
                위 &apos;코드 실행&apos; 버튼을 누르면 이 곳에 파이썬 실행 결과가 나타납니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export { DEFAULT_PYTHON_TEMPLATE };

