import { NextRequest, NextResponse } from 'next/server';
import { runJudge, checkCodeSecurity } from '@/lib/judge';
import { saveSubmission } from '@/lib/storage';
import { Submission } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, studentName, code } = body;

    if (!studentId || !studentId.trim()) {
      return NextResponse.json({ success: false, error: '학번을 입력해주세요.' }, { status: 400 });
    }
    if (!studentName || !studentName.trim()) {
      return NextResponse.json({ success: false, error: '이름을 입력해주세요.' }, { status: 400 });
    }
    if (!code || !code.trim()) {
      return NextResponse.json({ success: false, error: '제출할 파이썬 코드를 작성해주세요.' }, { status: 400 });
    }

    // 보안 검사
    const securityCheck = checkCodeSecurity(code);
    if (!securityCheck.safe) {
      return NextResponse.json({ success: false, error: securityCheck.reason }, { status: 400 });
    }

    // 채점 실행
    const judgeResult = await runJudge(code);

    let status: 'PASS' | 'FAIL' | 'PARTIAL' = 'PARTIAL';
    if (judgeResult.passedCount === judgeResult.totalCount) {
      status = 'PASS';
    } else if (judgeResult.passedCount === 0) {
      status = 'FAIL';
    }

    const submission: Submission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      studentId: studentId.trim(),
      studentName: studentName.trim(),
      code,
      score: judgeResult.score,
      totalScore: judgeResult.totalScore,
      passedCount: judgeResult.passedCount,
      totalCount: judgeResult.totalCount,
      status,
      results: judgeResult.results,
      createdAt: new Date().toISOString(),
    };

    // 데이터베이스 저장 (Supabase 또는 로컬 폴백)
    await saveSubmission(submission);

    return NextResponse.json({
      success: true,
      submission,
    });
  } catch (error: unknown) {
    console.error('Judge API Error:', error);
    const message = error instanceof Error ? error.message : '채점 중 오류가 발생했습니다.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

