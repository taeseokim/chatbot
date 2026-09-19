-- ============================================================
-- 인덕과학기술고등학교 2학년 파이썬 수행평가 테이블 스키마
-- Supabase 대시보드의 'SQL Editor'에 붙여넣고 [Run]을 누르세요.
-- ============================================================

-- 1. submissions 테이블 생성
CREATE TABLE IF NOT EXISTS public.submissions (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  code TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 100,
  passed_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'PARTIAL',
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. 검색 및 정렬 성능 향상을 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON public.submissions (student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_score ON public.submissions (score DESC);

-- 3. Row Level Security (RLS) 설정
-- 학교 수행평가 온라인 저지이므로 익명 클라이언트도 제출(INSERT) 및 조회(SELECT) 가능하도록 허용
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있다면 충돌 방지를 위해 삭제 후 재생성
DROP POLICY IF EXISTS "모든 사용자 제출 및 조회 허용" ON public.submissions;
CREATE POLICY "모든 사용자 제출 및 조회 허용"
  ON public.submissions
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.submissions IS '인덕과학기술고등학교 파이썬 온라인 저지 학생 제출 기록';

