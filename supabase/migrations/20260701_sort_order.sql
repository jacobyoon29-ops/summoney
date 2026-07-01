-- articles 테이블에 sort_order 컬럼 추가
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS sort_order integer;
