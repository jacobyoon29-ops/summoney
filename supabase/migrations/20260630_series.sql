-- 시리즈 테이블 생성
CREATE TABLE IF NOT EXISTS series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  cover_image text,
  created_at timestamptz DEFAULT now()
);

-- articles 테이블에 series_id 컬럼 추가
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS series_id uuid REFERENCES series(id) ON DELETE SET NULL;
