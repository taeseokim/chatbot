'use client';

import React, { useState, useEffect } from 'react';
import AppleNavbar from '@/components/AppleNavbar';
import ProblemGuide from '@/components/ProblemGuide';
import CodeEditor, { DEFAULT_PYTHON_TEMPLATE } from '@/components/CodeEditor';
import JudgeModal from '@/components/JudgeModal';
import TeacherAuthModal from '@/components/TeacherAuthModal';
import { Submission } from '@/lib/types';
import { Sparkles, Code2, Award, Laptop } from 'lucide-react';
import { runPythonInBrowser, runJudgeInBrowser } from '@/lib/pyodide';

export default function StudentJudgePage() {
  const [code, setCode] = useState(DEFAULT_PYTHON_TEMPLATE);
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');

  const [isRunning, setIsRunning] = useState(false);
  const [runOutput, setRunOutput] = useState('');
  const [runError, setRunError] = useState<string | undefined>();

  const [isJudging, setIsJudging] = useState(false);
  const [latestSubmission, setLatestSubmission] = useState<Submission | null>(null);
  const [isJudgeModalOpen, setIsJudgeModalOpen] = useState(false);

  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);

  // 로컬 스토리지에서 학번/이름 불러오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('induk_student_id');
      const savedName = localStorage.getItem('induk_student_name');
      const savedCode = localStorage.getItem('induk_student_code');
      if (savedId) setStudentId(savedId);
      if (savedName) setStudentName(savedName);
      if (savedCode) setCode(savedCode);
    }
  }, []);

  // 학번/이름/코드 변경 시 자동 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (studentId) localStorage.setItem('induk_student_id', studentId);
      if (studentName) localStorage.setItem('induk_student_name', studentName);
      if (code) localStorage.setItem('induk_student_code', code);
    }
  }, [studentId, studentName, code]);

  // 단일 실행 핸들러 (브라우저 WebAssembly 파이썬으로 0.05초 만에 실행)
  const handleRunSingle = async (height: number, weight: number) => {
    setIsRunning(true);
    setRunOutput('🐍 파이썬 엔진 준비 중...');
    setRunError(undefined);

    try {
      const stdinText = `${height}\n${weight}\n`;
      const res = await runPythonInBrowser(code, stdinText, (statusMsg) => {
        setRunOutput(`⏳ ${statusMsg}`);
      });

      if (res.error) {
        setRunError(res.stderr || res.error);
        setRunOutput(res.stdout || '');
      } else {
        setRunOutput(res.stdout || '(출력된 내용이 없습니다)');
      }
    } catch (err: any) {
      setRunError(err?.message || '파이썬 실행 중 오류가 발생했습니다.');
    } finally {
      setIsRunning(false);
    }
  };

  // 최종 채점 핸들러 (브라우저 파이썬 채점 후 결과만 Supabase에 안전 저장)
  const handleSubmitJudge = async () => {
    if (!studentId.trim()) {
      alert('학번을 먼저 입력해주세요 (예: 20101)');
      return;
    }
    if (!studentName.trim()) {
      alert('이름을 먼저 입력해주세요 (예: 홍길동)');
      return;
    }

    setIsJudging(true);
    try {
      // 1. 브라우저 WebAssembly 파이썬으로 5개 테스트케이스 채점
      const clientJudgeResult = await runJudgeInBrowser(code);

      // 2. 채점 결과와 학생 코드를 서버로 전송하여 Supabase DB에 영구 저장
      const res = await fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentId.trim(),
          studentName: studentName.trim(),
          code,
          clientJudgeResult,
        }),
      });
      const data = await res.json();

      if (data.success && data.submission) {
        setLatestSubmission(data.submission);
        setIsJudgeModalOpen(true);
      } else {
        alert(data.error || '채점 결과 저장 중 오류가 발생했습니다.');
      }
    } catch (err: any) {
      alert('채점 처리 중 오류가 발생했습니다: ' + (err?.message || '네트워크를 확인하세요.'));
    } finally {
      setIsJudging(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans selection:bg-[#0071e3]/20">
      {/* 1. 애플 스타일 상단 글로벌 내비게이션 바 */}
      <AppleNavbar onOpenTeacherAuth={() => setIsTeacherModalOpen(true)} />

      {/* 2. 메인 컨테이너 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* 서브 히어로 섹션 */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-neutral-200/60 dark:border-neutral-800">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#0071e3] dark:text-[#2997ff] uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Induk Science & Technology High School</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              파이썬 프로그래밍 온라인 저지
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              2학년 수행평가: 키와 몸무게를 입력받아 조건문에 따라 4단계로 분류하는 프로그램을 완성하세요.
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start sm:self-auto">
            <div className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 text-xs font-medium flex items-center space-x-1.5 shadow-sm">
              <Laptop className="w-3.5 h-3.5 text-neutral-500" />
              <span>Python 3.14 채점 엔진</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/50 text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center space-x-1.5 shadow-sm">
              <Award className="w-3.5 h-3.5" />
              <span>배점 100점</span>
            </div>
          </div>
        </div>

        {/* 3. 듀얼 패널 레이아웃 (좌: 문제 안내서 / 우: 코드 에디터 & 터미널) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 좌측 패널 (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <ProblemGuide />
          </div>

          {/* 우측 패널 (7 cols) */}
          <div className="lg:col-span-7">
            <CodeEditor
              code={code}
              setCode={setCode}
              studentId={studentId}
              setStudentId={setStudentId}
              studentName={studentName}
              setStudentName={setStudentName}
              onRunSingle={handleRunSingle}
              onSubmitJudge={handleSubmitJudge}
              isRunning={isRunning}
              isJudging={isJudging}
              runOutput={runOutput}
              runError={runError}
            />
          </div>
        </div>
      </main>

      {/* 4. 채점 결과 모달 */}
      <JudgeModal
        isOpen={isJudgeModalOpen}
        onClose={() => setIsJudgeModalOpen(false)}
        submission={latestSubmission}
      />

      {/* 5. 교사 인증 모달 */}
      <TeacherAuthModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
      />

      {/* 하단 푸터 (애플 스타일 정갈한 각주) */}
      <footer className="mt-auto border-t border-neutral-200/80 dark:border-neutral-900 py-6 text-center text-xs text-neutral-500 dark:text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 인덕과학기술고등학교 정보과. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span className="hover:underline cursor-pointer" onClick={() => setIsTeacherModalOpen(true)}>
              교사용 관리자 페이지
            </span>
            <span>·</span>
            <span>Python 3.14 Online Judge</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
