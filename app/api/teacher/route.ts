import { NextRequest, NextResponse } from 'next/server';
import { getAllSubmissions, deleteSubmission, resetSubmissions, seedSampleSubmissions } from '@/lib/storage';

const TEACHER_PIN = process.env.TEACHER_PIN || 'induk2026';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get('pin');

    if (pin !== TEACHER_PIN) {
      return NextResponse.json({ success: false, error: '교사 인증 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    let submissions = await getAllSubmissions();
    // 만약 데이터가 아예 비어있으면 보기 좋게 샘플 데이터 3건을 자동 시딩
    if (submissions.length === 0) {
      submissions = await seedSampleSubmissions();
    }

    // 통계 계산
    const totalSubmissions = submissions.length;
    // 학생별 최신 제출만 집계한 고유 학생 수
    const uniqueStudents = new Map<string, typeof submissions[0]>();
    for (const sub of submissions) {
      if (!uniqueStudents.has(sub.studentId)) {
        uniqueStudents.set(sub.studentId, sub);
      }
    }
    const studentCount = uniqueStudents.size;
    const latestList = Array.from(uniqueStudents.values());

    const perfectScoreCount = latestList.filter((s) => s.score === 100).length;
    const averageScore = studentCount > 0
      ? Math.round((latestList.reduce((acc, s) => acc + s.score, 0) / studentCount) * 10) / 10
      : 0;

    const passRate = studentCount > 0
      ? Math.round((perfectScoreCount / studentCount) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalSubmissions,
        studentCount,
        perfectScoreCount,
        averageScore,
        passRate,
      },
      submissions,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '데이터 조회 중 오류가 발생했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin, action, submissionId } = body;

    if (pin !== TEACHER_PIN) {
      return NextResponse.json({ success: false, error: '교사 인증 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    if (action === 'seed') {
      const seeded = await seedSampleSubmissions();
      return NextResponse.json({ success: true, message: '샘플 데이터가 생성되었습니다.', submissions: seeded });
    }

    if (action === 'reset') {
      await resetSubmissions();
      return NextResponse.json({ success: true, message: '모든 제출 기록이 초기화되었습니다.', submissions: [] });
    }

    if (action === 'delete') {
      if (!submissionId) {
        return NextResponse.json({ success: false, error: '삭제할 제출 ID가 필요합니다.' }, { status: 400 });
      }
      await deleteSubmission(submissionId);
      const updated = await getAllSubmissions();
      return NextResponse.json({ success: true, message: '삭제되었습니다.', submissions: updated });
    }

    return NextResponse.json({ success: false, error: '알 수 없는 요청입니다.' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '요청 처리 중 오류가 발생했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

