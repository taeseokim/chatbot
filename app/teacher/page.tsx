'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AppleNavbar from '@/components/AppleNavbar';
import { Submission, TestCaseResult } from '@/lib/types';
import {
  ShieldCheck,
  Users,
  Trophy,
  BarChart3,
  Percent,
  Search,
  Download,
  Trash2,
  Code,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  Lock,
  Copy,
  Check
} from 'lucide-react';

function TeacherDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [pin, setPin] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    studentCount: 0,
    perfectScoreCount: 0,
    averageScore: 0,
    passRate: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState<'ALL' | 'PERFECT' | 'PARTIAL' | 'FAIL'>('ALL');
  const [sortField, setSortField] = useState<'studentId' | 'score' | 'createdAt'>('studentId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 모달 상태
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [copied, setCopied] = useState(false);

  // 초기 인증 확인
  useEffect(() => {
    let initialPin = searchParams.get('pin');
    if (!initialPin && typeof window !== 'undefined') {
      initialPin = sessionStorage.getItem('induk_teacher_pin');
    }

    if (initialPin) {
      setPin(initialPin);
      fetchData(initialPin);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const fetchData = async (targetPin: string) => {
    setLoading(true);
    setAuthError('');
    try {
      const res = await fetch(`/api/teacher?pin=${encodeURIComponent(targetPin)}`);
      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
        setSubmissions(data.submissions || []);
        if (data.stats) setStats(data.stats);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('induk_teacher_pin', targetPin);
        }
      } else {
        setIsAuthenticated(false);
        setAuthError(data.error || '비밀번호가 올바르지 않습니다.');
      }
    } catch {
      setAuthError('데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim()) {
      fetchData(pin.trim());
    }
  };

  const handleAction = async (action: 'seed' | 'reset' | 'delete', submissionId?: string) => {
    if (action === 'reset' && !window.confirm('정말로 모든 학생의 제출 데이터를 초기화하시겠습니까?')) {
      return;
    }
    if (action === 'delete' && !window.confirm('해당 제출 기록을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const res = await fetch('/api/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, action, submissionId }),
      });
      const data = await res.json();
      if (data.success) {
        if (action === 'delete' && selectedSubmission?.id === submissionId) {
          setSelectedSubmission(null);
        }
        fetchData(pin);
      } else {
        alert(data.error || '작업 실패');
      }
    } catch {
      alert('서버 요청 오류가 발생했습니다.');
    }
  };

  // CSV 다운로드 (나이스 NEIS 성적 입력용)
  const downloadCsv = () => {
    if (submissions.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }

    const headers = ['학번', '이름', '점수', '만점', '통과테스트수', '총테스트수', '상태', '제출일시'];
    const rows = submissions.map((s) => [
      s.studentId,
      s.studentName,
      s.score,
      s.totalScore,
      s.passedCount,
      s.totalCount,
      s.status,
      new Date(s.createdAt).toLocaleString('ko-KR'),
    ]);

    // 한글 깨짐 방지를 위한 UTF-8 BOM 추가 (\uFEFF)
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `인덕과기고_2학년_파이썬수행평가_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 코드 클립보드 복사
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 필터링 및 정렬
  const filteredList = useMemo(() => {
    return submissions.filter((s) => {
      const matchesSearch =
        s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.studentName.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (scoreFilter === 'PERFECT') return s.score === 100;
      if (scoreFilter === 'PARTIAL') return s.score > 0 && s.score < 100;
      if (scoreFilter === 'FAIL') return s.score === 0;
      return true;
    }).sort((a, b) => {
      let comp = 0;
      if (sortField === 'studentId') {
        comp = a.studentId.localeCompare(b.studentId, undefined, { numeric: true });
      } else if (sortField === 'score') {
        comp = a.score - b.score;
      } else if (sortField === 'createdAt') {
        comp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [submissions, searchTerm, scoreFilter, sortField, sortOrder]);

  // 로그인 화면
  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans">
        <AppleNavbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#1c1c1e] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xl p-8 text-center space-y-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#0071e3]/10 text-[#0071e3] dark:text-[#2997ff] flex items-center justify-center">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">교사 인증이 필요합니다</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                인덕과학기술고등학교 2학년 수행평가 성적 관리 대시보드
              </p>
            </div>

            <form onSubmit={handleManualLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1.5">
                  교사 인증 비밀번호
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="기본 비밀번호: induk2026"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                    autoFocus
                  />
                </div>
                {authError && (
                  <p className="mt-1.5 text-xs text-rose-500 font-medium">{authError}</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs sm:text-sm font-semibold shadow-md shadow-[#0071e3]/30 transition-all cursor-pointer"
              >
                대시보드 로그인
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans selection:bg-[#0071e3]/20">
      <AppleNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* 히어로 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/80 dark:border-neutral-800">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#0071e3]/10 text-[#0071e3] dark:text-[#2997ff] text-xs font-semibold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>교사 전용 평가 관리관</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              2학년 파이썬 수행평가 성적 대시보드
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              인덕과학기술고등학교 학생들의 BMI 판정 프로그램 제출 내역과 채점 결과를 실시간으로 모니터링합니다.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={downloadCsv}
              className="px-3.5 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-[#0071e3]/20 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>나이스 성적 CSV 다운로드</span>
            </button>

            <button
              type="button"
              onClick={() => handleAction('seed')}
              title="테스트 시연용 샘플 데이터 생성"
              className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">샘플 데이터</span>
            </button>

            <button
              type="button"
              onClick={() => handleAction('reset')}
              title="모든 제출 기록 초기화"
              className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-900 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 애플 스타일 통계 카드 4종 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#141416]/80 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-neutral-500 text-xs">
              <span>응시 학생 수</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">{stats.studentCount}</span>
              <span className="text-xs text-neutral-400">명 ({stats.totalSubmissions}건 제출)</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#141416]/80 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-neutral-500 text-xs">
              <span>만점(100점) 학생</span>
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
                {stats.perfectScoreCount}
              </span>
              <span className="text-xs text-neutral-400">명</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#141416]/80 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-neutral-500 text-xs">
              <span>학급 평균 점수</span>
              <BarChart3 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">{stats.averageScore}</span>
              <span className="text-xs text-neutral-400">/ 100점</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#141416]/80 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-neutral-500 text-xs">
              <span>만점 달성률</span>
              <Percent className="w-4 h-4 text-purple-500" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-purple-600 dark:text-purple-400">
                {stats.passRate}%
              </span>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 컨트롤 바 */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#141416]/80 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          {/* 검색 인풋 */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="학번 또는 이름 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-700/70 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
            />
          </div>

          {/* 세그먼트 필터 & 정렬 */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <div className="p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center text-xs">
              <button
                type="button"
                onClick={() => setScoreFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  scoreFilter === 'ALL'
                    ? 'bg-white dark:bg-neutral-800 font-semibold shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => setScoreFilter('PERFECT')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  scoreFilter === 'PERFECT'
                    ? 'bg-white dark:bg-neutral-800 font-semibold text-emerald-600 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                만점 (100)
              </button>
              <button
                type="button"
                onClick={() => setScoreFilter('PARTIAL')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  scoreFilter === 'PARTIAL'
                    ? 'bg-white dark:bg-neutral-800 font-semibold text-amber-600 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                부분점수
              </button>
            </div>

            {/* 정렬 버튼 */}
            <button
              type="button"
              onClick={() => {
                if (sortField === 'studentId') setSortField('score');
                else if (sortField === 'score') setSortField('createdAt');
                else setSortField('studentId');
              }}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-400 flex items-center space-x-1 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>
                정렬: {sortField === 'studentId' ? '학번순' : sortField === 'score' ? '점수순' : '제출순'}
              </span>
            </button>
          </div>
        </div>

        {/* 학생 제출 테이블 */}
        <div className="bg-white/80 dark:bg-[#141416]/80 backdrop-blur-md rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-100/70 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">학번</th>
                  <th className="py-3 px-4">이름</th>
                  <th className="py-3 px-4">점수</th>
                  <th className="py-3 px-4">테스트케이스 통과율</th>
                  <th className="py-3 px-4">제출 일시</th>
                  <th className="py-3 px-4 text-right">코드 확인</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60 text-neutral-800 dark:text-neutral-200">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-400 italic">
                      제출된 학생 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((sub) => (
                    <tr
                      key={sub.id}
                      className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                        {sub.studentId}
                      </td>
                      <td className="py-3 px-4 font-medium">{sub.studentName}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            sub.score === 100
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : sub.score >= 60
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {sub.score} / {sub.totalScore}점
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                sub.passedCount === sub.totalCount ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${(sub.passedCount / sub.totalCount) * 100}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-neutral-500 font-mono">
                            {sub.passedCount}/{sub.totalCount}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-neutral-500 text-[11px]">
                        {new Date(sub.createdAt).toLocaleString('ko-KR', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedSubmission(sub)}
                          className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium transition-colors inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <Code className="w-3.5 h-3.5" />
                          <span>상세보기</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 학생 코드 & 채점 상세 모달 */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-3xl bg-white dark:bg-[#1c1c1e] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* 모달 헤더 */}
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {selectedSubmission.studentId} {selectedSubmission.studentName} 학생 제출 코드
                </h3>
                <p className="text-xs text-neutral-500">
                  최종 점수: <strong>{selectedSubmission.score}점</strong> · 제출: {new Date(selectedSubmission.createdAt).toLocaleString('ko-KR')}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleCopyCode(selectedSubmission.code)}
                  className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 flex items-center space-x-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '복사됨' : '코드 복사'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('delete', selectedSubmission.id)}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  title="이 제출 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-800 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 모달 바디 */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* 소스 코드 영역 */}
              <div>
                <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 block">
                  작성한 파이썬 소스 코드 (solution.py)
                </span>
                <pre className="p-4 rounded-xl bg-[#1e1e1e] text-neutral-100 font-mono text-xs overflow-x-auto leading-relaxed border border-neutral-800">
                  {selectedSubmission.code}
                </pre>
              </div>

              {/* 5개 테스트케이스 채점 리포트 */}
              <div>
                <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2 block">
                  테스트케이스 실행 및 판정 상세
                </span>
                <div className="space-y-2.5">
                  {selectedSubmission.results.map((res: TestCaseResult, idx: number) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs ${
                        res.passed
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200/60 dark:border-emerald-900/40'
                          : 'bg-rose-50/40 dark:bg-rose-950/10 border-rose-200/60 dark:border-rose-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          {res.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500" />
                          )}
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">{res.title}</span>
                        </div>
                        <span className="font-bold text-neutral-600 dark:text-neutral-400">
                          {res.score} / {res.maxScore}점 ({res.executionTimeMs}ms)
                        </span>
                      </div>
                      <div className="mt-2 text-neutral-600 dark:text-neutral-400 grid grid-cols-2 gap-2 text-[11px]">
                        <div>입력: 키 {res.input.height}cm, 몸무게 {res.input.weight}kg</div>
                        <div>기대 판정: {res.expectedCategory} (학생 판정: {res.detectedCategory || '없음'})</div>
                      </div>
                      {res.error && (
                        <div className="mt-1 text-rose-500 text-[11px]">
                          <strong>원인:</strong> {res.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141416] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeacherPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">로딩 중...</div>}>
      <TeacherDashboardContent />
    </Suspense>
  );
}

