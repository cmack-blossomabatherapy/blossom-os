
-- Auto-ingest training & HR resource content into knowledge_chunks via DB triggers.
-- This guarantees the AI assistant always sees up-to-date content regardless of how it was created.

-- Helper: upsert a single knowledge_chunk row for a given source.
CREATE OR REPLACE FUNCTION public.upsert_knowledge_chunk(
  _source_type text,
  _source_id uuid,
  _source_title text,
  _source_url text,
  _content text,
  _metadata jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove any prior chunks for this source
  DELETE FROM public.knowledge_chunks
   WHERE source_type = _source_type AND source_id = _source_id;

  IF _content IS NULL OR length(btrim(_content)) = 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.knowledge_chunks (source_type, source_id, source_title, source_url, chunk_index, content, metadata)
  VALUES (_source_type, _source_id, COALESCE(_source_title, _source_type), _source_url, 0, _content, COALESCE(_metadata, '{}'::jsonb));
END;
$$;

-- ───── training_courses ─────
CREATE OR REPLACE FUNCTION public.trg_ingest_training_course()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _content text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.knowledge_chunks WHERE source_type = 'training_course' AND source_id = OLD.id;
    RETURN OLD;
  END IF;

  _content := concat_ws(E'\n\n',
    NEW.title,
    NEW.description,
    CASE WHEN NEW.training_type IS NOT NULL THEN 'Type: ' || NEW.training_type END,
    CASE WHEN NEW.difficulty IS NOT NULL THEN 'Difficulty: ' || NEW.difficulty END,
    CASE WHEN array_length(NEW.role_visibility, 1) > 0 THEN 'For roles: ' || array_to_string(NEW.role_visibility, ', ') END
  );

  PERFORM public.upsert_knowledge_chunk(
    'training_course', NEW.id, NEW.title, NEW.external_url, _content,
    jsonb_build_object('training_type', NEW.training_type, 'difficulty', NEW.difficulty, 'is_active', NEW.is_active)
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_training_course_ingest ON public.training_courses;
CREATE TRIGGER trg_training_course_ingest
AFTER INSERT OR UPDATE OR DELETE ON public.training_courses
FOR EACH ROW EXECUTE FUNCTION public.trg_ingest_training_course();

-- ───── training_lessons ─────
CREATE OR REPLACE FUNCTION public.trg_ingest_training_lesson()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _course_title text;
  _content text;
  _url text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.knowledge_chunks WHERE source_type = 'training_lesson' AND source_id = OLD.id;
    RETURN OLD;
  END IF;

  SELECT title INTO _course_title FROM public.training_courses WHERE id = NEW.course_id;
  _url := COALESCE(NEW.resource_url, NEW.video_url, NEW.tango_url);

  _content := concat_ws(E'\n\n',
    'Course: ' || COALESCE(_course_title, ''),
    'Lesson: ' || NEW.title,
    NEW.description,
    NEW.content,
    CASE WHEN _url IS NOT NULL THEN 'Resource: ' || _url END
  );

  PERFORM public.upsert_knowledge_chunk(
    'training_lesson', NEW.id,
    concat(COALESCE(_course_title, ''), ' — ', NEW.title),
    _url, _content,
    jsonb_build_object('course_id', NEW.course_id, 'lesson_type', NEW.lesson_type)
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_training_lesson_ingest ON public.training_lessons;
CREATE TRIGGER trg_training_lesson_ingest
AFTER INSERT OR UPDATE OR DELETE ON public.training_lessons
FOR EACH ROW EXECUTE FUNCTION public.trg_ingest_training_lesson();

-- ───── training_quizzes (aggregate questions on quiz change) ─────
CREATE OR REPLACE FUNCTION public.refresh_quiz_knowledge(_quiz_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _quiz record;
  _course_title text;
  _qtext text;
  _content text;
BEGIN
  SELECT * INTO _quiz FROM public.training_quizzes WHERE id = _quiz_id;
  IF NOT FOUND THEN
    DELETE FROM public.knowledge_chunks WHERE source_type = 'training_quiz' AND source_id = _quiz_id;
    RETURN;
  END IF;

  SELECT title INTO _course_title FROM public.training_courses WHERE id = _quiz.course_id;

  SELECT string_agg(
    'Q: ' || question ||
    CASE WHEN correct_answer IS NOT NULL AND length(correct_answer) > 0 THEN E'\nA: ' || correct_answer ELSE '' END,
    E'\n\n' ORDER BY sort_order
  )
  INTO _qtext
  FROM public.training_quiz_questions WHERE quiz_id = _quiz_id;

  _content := concat_ws(E'\n\n',
    'Course: ' || COALESCE(_course_title, ''),
    'Quiz: ' || _quiz.title,
    _qtext
  );

  PERFORM public.upsert_knowledge_chunk(
    'training_quiz', _quiz_id,
    concat(COALESCE(_course_title, ''), ' — ', _quiz.title),
    NULL, _content,
    jsonb_build_object('course_id', _quiz.course_id)
  );
END $$;

CREATE OR REPLACE FUNCTION public.trg_ingest_training_quiz()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.knowledge_chunks WHERE source_type = 'training_quiz' AND source_id = OLD.id;
    RETURN OLD;
  END IF;
  PERFORM public.refresh_quiz_knowledge(NEW.id);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_training_quiz_ingest ON public.training_quizzes;
CREATE TRIGGER trg_training_quiz_ingest
AFTER INSERT OR UPDATE OR DELETE ON public.training_quizzes
FOR EACH ROW EXECUTE FUNCTION public.trg_ingest_training_quiz();

CREATE OR REPLACE FUNCTION public.trg_ingest_training_quiz_question()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_quiz_knowledge(OLD.quiz_id);
    RETURN OLD;
  END IF;
  PERFORM public.refresh_quiz_knowledge(NEW.quiz_id);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_training_quiz_question_ingest ON public.training_quiz_questions;
CREATE TRIGGER trg_training_quiz_question_ingest
AFTER INSERT OR UPDATE OR DELETE ON public.training_quiz_questions
FOR EACH ROW EXECUTE FUNCTION public.trg_ingest_training_quiz_question();

-- ───── hr_resources ─────
CREATE OR REPLACE FUNCTION public.trg_ingest_hr_resource()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _content text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.knowledge_chunks WHERE source_type = 'hr_resource' AND source_id = OLD.id;
    RETURN OLD;
  END IF;

  _content := concat_ws(E'\n\n',
    NEW.title,
    NEW.description,
    CASE WHEN NEW.kind IS NOT NULL THEN 'Kind: ' || NEW.kind::text END,
    CASE WHEN NEW.category IS NOT NULL THEN 'Category: ' || NEW.category::text END,
    CASE WHEN array_length(NEW.visibility_roles, 1) > 0 THEN 'For roles: ' || array_to_string(NEW.visibility_roles, ', ') END,
    CASE WHEN NEW.url IS NOT NULL THEN 'Link: ' || NEW.url END
  );

  -- Skip if this resource already has multi-chunk content from PDF extractor (chunk_index>0 rows present)
  IF EXISTS (SELECT 1 FROM public.knowledge_chunks WHERE source_type = 'hr_resource' AND source_id = NEW.id AND chunk_index > 0) THEN
    -- Just refresh the metadata chunk
    DELETE FROM public.knowledge_chunks WHERE source_type = 'hr_resource' AND source_id = NEW.id AND chunk_index = 0;
    INSERT INTO public.knowledge_chunks (source_type, source_id, source_title, source_url, chunk_index, content, metadata)
    VALUES ('hr_resource', NEW.id, NEW.title, NEW.url, 0, _content, jsonb_build_object('kind', NEW.kind::text, 'category', NEW.category::text));
    RETURN NEW;
  END IF;

  PERFORM public.upsert_knowledge_chunk(
    'hr_resource', NEW.id, NEW.title, NEW.url, _content,
    jsonb_build_object('kind', NEW.kind::text, 'category', NEW.category::text)
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_hr_resource_ingest ON public.hr_resources;
CREATE TRIGGER trg_hr_resource_ingest
AFTER INSERT OR UPDATE OR DELETE ON public.hr_resources
FOR EACH ROW EXECUTE FUNCTION public.trg_ingest_hr_resource();

-- ───── Backfill existing rows ─────
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.training_courses LOOP
    UPDATE public.training_courses SET updated_at = updated_at WHERE id = r.id;
  END LOOP;
  FOR r IN SELECT id FROM public.training_lessons LOOP
    UPDATE public.training_lessons SET updated_at = updated_at WHERE id = r.id;
  END LOOP;
  FOR r IN SELECT id FROM public.training_quizzes LOOP
    PERFORM public.refresh_quiz_knowledge(r.id);
  END LOOP;
  FOR r IN SELECT id FROM public.hr_resources LOOP
    UPDATE public.hr_resources SET updated_at = updated_at WHERE id = r.id;
  END LOOP;
END $$;
