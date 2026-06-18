-- articles 테이블 컬럼 추가 (한 번만 실행)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS scheduled_at timestamptz NULL;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tags        text[]     NULL;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS related_ids uuid[]     NULL;

-- 예약 발행 인덱스
CREATE INDEX IF NOT EXISTS articles_scheduled_at_idx
  ON articles (scheduled_at)
  WHERE is_published = false AND scheduled_at IS NOT NULL;
