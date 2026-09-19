import { TestCase, BmiCategory, TestCaseResult } from './types';

// 수행평가 5대 공식 테스트케이스
export const TEST_CASES: TestCase[] = [
  {
    id: 1,
    title: '테스트 1: 저체중 판정 케이스',
    description: '키 170cm, 몸무게 48kg (BMI 약 16.61)',
    height: 170,
    weight: 48,
    expectedBmi: 16.61,
    expectedCategory: '저체중',
    score: 20,
    isHidden: false,
  },
  {
    id: 2,
    title: '테스트 2: 정상체중 판정 케이스',
    description: '키 160cm, 몸무게 52kg (BMI 약 20.31)',
    height: 160,
    weight: 52,
    expectedBmi: 20.31,
    expectedCategory: '정상체중',
    score: 20,
    isHidden: false,
  },
  {
    id: 3,
    title: '테스트 3: 과체중 판정 케이스',
    description: '키 175cm, 몸무게 72kg (BMI 약 23.51)',
    height: 175,
    weight: 72,
    expectedBmi: 23.51,
    expectedCategory: '과체중',
    score: 20,
    isHidden: false,
  },
  {
    id: 4,
    title: '테스트 4: 비만 판정 케이스',
    description: '키 180cm, 몸무게 85kg (BMI 약 26.23)',
    height: 180,
    weight: 85,
    expectedBmi: 26.23,
    expectedCategory: '비만',
    score: 20,
    isHidden: false,
  },
  {
    id: 5,
    title: '테스트 5: 경계값 정밀 검증 (비만 경계 25.0)',
    description: '키 150cm, 몸무게 56.25kg (BMI 정확히 25.00 -> 비만)',
    height: 150,
    weight: 56.25,
    expectedBmi: 25.0,
    expectedCategory: '비만',
    score: 20,
    isHidden: true,
  },
];

// 위험 시스템 접근 패턴 차단
export function checkCodeSecurity(code: string): { safe: boolean; reason?: string } {
  const dangerousPatterns = [
    /import\s+os/i,
    /import\s+subprocess/i,
    /import\s+shutil/i,
    /from\s+os\s+import/i,
    /from\s+subprocess\s+import/i,
    /__import__\s*\(/i,
    /open\s*\(\s*['"].*?['"]\s*,\s*['"][wa\+]/i,
    /exec\s*\(/i,
    /eval\s*\(/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      return {
        safe: false,
        reason: '보안 정책상 시스템 접근(os, subprocess, exec, 파일 쓰기 등) 코드는 실행할 수 없습니다.',
      };
    }
  }
  return { safe: true };
}

// 지능형 출력 판정
export function analyzeOutput(output: string, expected: BmiCategory): {
  passed: boolean;
  detectedCategory?: string;
  detectedBmi?: number;
  reason?: string;
} {
  // 1. BMI 숫자 추출
  const bmiMatch = output.match(/bmi\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  let detectedBmi: number | undefined;
  if (bmiMatch) {
    detectedBmi = parseFloat(bmiMatch[1]);
  }

  // 2. 4단계 카테고리 키워드 추출
  const cleaned = output.replace(/\s+/g, ' ');
  const keywords = ['저체중', '정상체중', '과체중', '고도비만', '비만', '정상'];
  const occurrences: { keyword: string; index: number }[] = [];

  for (const kw of keywords) {
    const pos = cleaned.lastIndexOf(kw);
    if (pos !== -1) {
      occurrences.push({ keyword: kw, index: pos });
    }
  }

  if (occurrences.length === 0) {
    return {
      passed: false,
      detectedBmi,
      reason: '출력문에서 판정 결과(저체중, 정상, 과체중, 비만)를 찾을 수 없습니다.',
    };
  }

  // 가장 마지막에 나온 키워드 선택
  occurrences.sort((a, b) => b.index - a.index);
  const detected = occurrences[0].keyword;

  // '정상'과 '정상체중'은 동일하게 취급
  const normalizedDetected: BmiCategory | string =
    detected === '정상' ? '정상체중' : (detected === '고도비만' ? '비만' : detected);

  const normalizedExpected: BmiCategory | string = expected;
  const passed = normalizedDetected === normalizedExpected;

  return {
    passed,
    detectedCategory: normalizedDetected,
    detectedBmi,
    reason: passed
      ? undefined
      : `기대 판정: '${normalizedExpected}', 학생 판정: '${normalizedDetected}'`,
  };
}

// 에러 메시지 한글 친절 번역
export function formatErrorMessage(stderr: string): string {
  if (stderr.includes('SyntaxError')) {
    return '문법 오류(SyntaxError): 괄호나 따옴표, 콜론(:)이 빠지지 않았는지 확인하세요.';
  }
  if (stderr.includes('IndentationError')) {
    return '들여쓰기 오류(IndentationError): if문이나 함수 아래 4칸 들여쓰기(Tab)를 맞췄는지 확인하세요.';
  }
  if (stderr.includes('ValueError')) {
    return '값 오류(ValueError): float(input())에 올바른 숫자가 입력되었는지 확인하세요.';
  }
  if (stderr.includes('ZeroDivisionError')) {
    return '0으로 나누기 오류(ZeroDivisionError): 키가 0이 아니어야 합니다.';
  }
  if (stderr.includes('NameError')) {
    return '이름 오류(NameError): 정의되지 않은 변수나 오타가 있는지 확인하세요.';
  }
  return stderr.split('\n').filter((l) => l.trim()).slice(-2).join(' ') || '실행 오류가 발생했습니다.';
}
