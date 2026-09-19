'use client';

import { TestCase, TestCaseResult, BmiCategory } from './types';
import { TEST_CASES, checkCodeSecurity, analyzeOutput, formatErrorMessage } from './evaluator';

declare global {
  interface Window {
    loadPyodide?: (config?: any) => Promise<any>;
  }
}

let pyodideInstance: any = null;
let pyodideLoadingPromise: Promise<any> | null = null;

// Pyodide CDN 스크립트 동적 로드
function loadPyodideScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('브라우저 환경이 아닙니다.'));
  }
  if (window.loadPyodide) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.getElementById('pyodide-cdn-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (err) => reject(err));
      return;
    }

    const script = document.createElement('script');
    script.id = 'pyodide-cdn-script';
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('파이썬 엔진(Pyodide) CDN 로드에 실패했습니다. 인터넷 연결을 확인하세요.'));
    document.head.appendChild(script);
  });
}

// Pyodide 싱글톤 인스턴스 반환
export async function getPyodide(onProgress?: (msg: string) => void): Promise<any> {
  if (pyodideInstance) {
    return pyodideInstance;
  }
  if (pyodideLoadingPromise) {
    return pyodideLoadingPromise;
  }

  pyodideLoadingPromise = (async () => {
    if (onProgress) onProgress('파이썬 웹 엔진 다운로드 중...');
    await loadPyodideScript();

    if (onProgress) onProgress('파이썬 웹 엔진 초기화 중...');
    if (!window.loadPyodide) {
      throw new Error('Pyodide 초기화 함수를 찾을 수 없습니다.');
    }

    const pyodide = await window.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
    });

    pyodideInstance = pyodide;
    return pyodide;
  })();

  return pyodideLoadingPromise;
}

// 1. 단일 실행 (인터랙티브 콘솔용)
export async function runPythonInBrowser(
  code: string,
  stdinText: string = '',
  onProgress?: (msg: string) => void
): Promise<{ stdout: string; stderr: string; executionTimeMs: number; error?: string }> {
  // 보안 검사
  const security = checkCodeSecurity(code);
  if (!security.safe) {
    return {
      stdout: '',
      stderr: security.reason || '보안상 실행할 수 없는 코드입니다.',
      executionTimeMs: 0,
      error: security.reason,
    };
  }

  const startTime = performance.now();

  try {
    const pyodide = await getPyodide(onProgress);

    // 파이썬 표준 입출력(stdin, stdout, stderr) 가로채기 래퍼
    const runnerCode = `
import sys
import io

_sys_stdin = sys.stdin
_sys_stdout = sys.stdout
_sys_stderr = sys.stderr

sys.stdin = io.StringIO(${JSON.stringify(stdinText)})
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()

_err = None
try:
    _user_ns = {}
    exec(${JSON.stringify(code)}, _user_ns)
except Exception as e:
    import traceback
    _err = traceback.format_exc()

_out = sys.stdout.getvalue()
_err_out = sys.stderr.getvalue()
if _err:
    _err_out += ("\\n" if _err_out else "") + _err

sys.stdin = _sys_stdin
sys.stdout = _sys_stdout
sys.stderr = _sys_stderr

(_out, _err_out)
`;

    const result = await pyodide.runPythonAsync(runnerCode);
    const stdout = result.get(0) || '';
    const stderr = result.get(1) || '';
    result.destroy();

    const executionTimeMs = Math.round(performance.now() - startTime);

    if (stderr && stderr.trim().length > 0) {
      const friendly = formatErrorMessage(stderr);
      return {
        stdout,
        stderr: `${stderr}\n\n💡 안내: ${friendly}`,
        executionTimeMs,
        error: friendly,
      };
    }

    return {
      stdout,
      stderr: '',
      executionTimeMs,
    };
  } catch (err: any) {
    const executionTimeMs = Math.round(performance.now() - startTime);
    const msg = err?.message || '파이썬 실행 중 오류가 발생했습니다.';
    return {
      stdout: '',
      stderr: msg,
      executionTimeMs,
      error: msg,
    };
  }
}

// 2. 5대 테스트케이스 브라우저 전체 채점
export async function runJudgeInBrowser(
  code: string,
  onProgress?: (current: number, total: number) => void
): Promise<{
  passedCount: number;
  totalCount: number;
  score: number;
  totalScore: number;
  results: TestCaseResult[];
}> {
  const security = checkCodeSecurity(code);
  if (!security.safe) {
    const failResults: TestCaseResult[] = TEST_CASES.map((tc) => ({
      testCaseId: tc.id,
      title: tc.title,
      passed: false,
      input: { height: tc.height, weight: tc.weight },
      expectedCategory: tc.expectedCategory,
      expectedBmi: tc.expectedBmi,
      actualOutput: '',
      error: security.reason,
      executionTimeMs: 0,
      score: 0,
      maxScore: tc.score,
    }));

    return {
      passedCount: 0,
      totalCount: TEST_CASES.length,
      score: 0,
      totalScore: 100,
      results: failResults,
    };
  }

  const results: TestCaseResult[] = [];
  let passedCount = 0;
  let totalScoreAchieved = 0;

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    if (onProgress) {
      onProgress(i + 1, TEST_CASES.length);
    }

    const stdinText = `${tc.height}\n${tc.weight}\n`;
    const runRes = await runPythonInBrowser(code, stdinText);

    if (runRes.error || runRes.stderr) {
      results.push({
        testCaseId: tc.id,
        title: tc.title,
        passed: false,
        input: { height: tc.height, weight: tc.weight },
        expectedCategory: tc.expectedCategory,
        expectedBmi: tc.expectedBmi,
        actualOutput: runRes.stdout || runRes.stderr,
        error: runRes.error || '런타임 오류가 발생했습니다.',
        executionTimeMs: runRes.executionTimeMs,
        score: 0,
        maxScore: tc.score,
      });
      continue;
    }

    const evalResult = analyzeOutput(runRes.stdout, tc.expectedCategory);
    const score = evalResult.passed ? tc.score : 0;
    if (evalResult.passed) {
      passedCount++;
      totalScoreAchieved += score;
    }

    results.push({
      testCaseId: tc.id,
      title: tc.title,
      passed: evalResult.passed,
      input: { height: tc.height, weight: tc.weight },
      expectedCategory: tc.expectedCategory,
      detectedCategory: evalResult.detectedCategory,
      detectedBmi: evalResult.detectedBmi,
      expectedBmi: tc.expectedBmi,
      actualOutput: runRes.stdout,
      error: evalResult.reason,
      executionTimeMs: runRes.executionTimeMs,
      score,
      maxScore: tc.score,
    });
  }

  return {
    passedCount,
    totalCount: TEST_CASES.length,
    score: totalScoreAchieved,
    totalScore: 100,
    results,
  };
}
