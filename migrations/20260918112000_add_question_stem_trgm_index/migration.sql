-- Lets the import-time duplicate check narrow ~9,000+ existing question
-- stems down to a small candidate list via an index, instead of loading
-- every stem into Node and comparing in JS one by one (see
-- importQuestionsFromText in src/admin/dashboards/questions/operations.ts).
-- This is a pre-filter ONLY: the actual duplicate/not-duplicate decision
-- still runs through the existing, unchanged bigram-similarity check in
-- importParsing.ts against whatever small candidate set this returns --
-- nothing about what counts as a duplicate changes, only how the candidate
-- list is found.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Mirrors normalizeStem() in importParsing.ts (lowercase, strip
-- punctuation, collapse whitespace) so the indexed/queried text matches
-- what the JS side already normalizes and compares.
CREATE OR REPLACE FUNCTION question_normalized_stem(stem text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT regexp_replace(regexp_replace(lower(stem), '[^a-z0-9\s]', '', 'g'), '\s+', ' ', 'g')
$$;

CREATE INDEX IF NOT EXISTS "Question_normalized_stem_trgm_idx"
  ON "Question"
  USING GIN (question_normalized_stem(stem) gin_trgm_ops);
