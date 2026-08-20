-- idempotent migration: create chapters table and RLS policies
BEGIN;

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL,
  name text NOT NULL,
  "order" integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'da_iniziare',
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure subject_id index for performance
CREATE INDEX IF NOT EXISTS idx_chapters_subject_id ON public.chapters (subject_id);

-- Foreign key constraint to subjects if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subjects') THEN
    ALTER TABLE public.chapters
    ADD CONSTRAINT IF NOT EXISTS fk_chapters_subjects FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
  END IF;
END$$;

-- Enable RLS
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- Policy: allow SELECT only when the chapter belongs to a subject owned by the current user
CREATE POLICY select_chapters_for_owner ON public.chapters FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.subjects s WHERE s.id = chapters.subject_id AND s.owner_id::text = auth.uid()
  )
);

-- Policy: allow INSERT only when the referenced subject is owned by the current user
CREATE POLICY insert_chapters_for_owner ON public.chapters FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.subjects s WHERE s.id = NEW.subject_id AND s.owner_id::text = auth.uid()
  )
);

-- Policy: allow UPDATE only when the chapter belongs to a subject owned by the current user
CREATE POLICY update_chapters_for_owner ON public.chapters FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.subjects s WHERE s.id = chapters.subject_id AND s.owner_id::text = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.subjects s WHERE s.id = NEW.subject_id AND s.owner_id::text = auth.uid()
  )
);

-- Policy: allow DELETE only when the chapter belongs to a subject owned by the current user
CREATE POLICY delete_chapters_for_owner ON public.chapters FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.subjects s WHERE s.id = chapters.subject_id AND s.owner_id::text = auth.uid()
  )
);

-- Trigger to keep updated_at current on modification
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS chapters_set_updated_at ON public.chapters;
CREATE TRIGGER chapters_set_updated_at BEFORE UPDATE ON public.chapters
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

COMMIT;
