BEGIN;

CREATE TABLE IF NOT EXISTS public.decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL,
  front text NOT NULL,
  back text NOT NULL,
  sr_state text NOT NULL DEFAULT 'nuova',
  next_review_date date NULL,
  ease_factor numeric NOT NULL DEFAULT 2.5,
  interval integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL,
  name text NOT NULL,
  start_year integer NOT NULL,
  start_month integer NULL,
  start_day integer NULL,
  end_year integer NULL,
  end_month integer NULL,
  end_day integer NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decks_chapter_id ON public.decks (chapter_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id ON public.flashcards (deck_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_chapter_id ON public.timeline_events (chapter_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chapters') THEN
    ALTER TABLE public.decks
      ADD CONSTRAINT IF NOT EXISTS fk_decks_chapters FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'decks') THEN
    ALTER TABLE public.flashcards
      ADD CONSTRAINT IF NOT EXISTS fk_flashcards_decks FOREIGN KEY (deck_id) REFERENCES public.decks(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chapters') THEN
    ALTER TABLE public.timeline_events
      ADD CONSTRAINT IF NOT EXISTS fk_timeline_events_chapters FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY decks_select_for_owner ON public.decks FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.chapters c
    JOIN public.subjects s ON s.id = c.subject_id
    WHERE c.id = decks.chapter_id AND s.owner_id = auth.uid()
  )
);

CREATE POLICY decks_insert_for_owner ON public.decks FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.chapters c
    JOIN public.subjects s ON s.id = c.subject_id
    WHERE c.id = NEW.chapter_id AND s.owner_id = auth.uid()
  )
);

CREATE POLICY decks_update_for_owner ON public.decks FOR UPDATE USING (
  EXISTS (
    SELECT 1
    FROM public.chapters c
    JOIN public.subjects s ON s.id = c.subject_id
    WHERE c.id = decks.chapter_id AND s.owner_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.chapters c
    JOIN public.subjects s ON s.id = c.subject_id
    WHERE c.id = NEW.chapter_id AND s.owner_id = auth.uid()
  )
);

CREATE POLICY decks_delete_for_owner ON public.decks FOR DELETE USING (
  EXISTS (
    SELECT 1
    FROM public.chapters c
    JOIN public.subjects s ON s.id = c.subject_id
    WHERE c.id = decks.chapter_id AND s.owner_id = auth.uid()
  )
);

CREATE POLICY flashcards_select_for_owner ON public.flashcards FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.decks d
    JOIN public.chapters c ON c.id = d.chapter_id
    JOIN public.subjects s ON s.id = c.subject_id
    WHERE d.id = flashcards.deck_id AND s.owner_id = auth.uid()
  )
);

CREATE POLICY flashcards_insert_for_owner ON public.flashcards FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.decks d
    JOIN public.chapters c ON c.id = d.chapter_id
    JOIN public.subjects s ON s.id = c.subject_id
    WHERE d.id = NEW.deck_id AND s.owner_id = auth.uid()
  )
);

CREATE POLICY flashcards_update_for_owner ON public.flashcards FOR UPDATE USING (
  EXISTS (
    SELECT 1
    FROM public.decks d
    JOIN public.chapters c ON c.id = d.chapter_id
    JOIN public.subjects s ON s.id = c.subject_id
    WHERE d.id = flashcards.deck_id AND s.owner_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.decks d
    JOIN public.chapters c ON c.id = d.chapter_id
    JOIN public.subjects s ON s.id = c.subject_id
    WHERE d.id = NEW.deck_id AND s.owner_id = auth.uid()
  )
);

CREATE POLICY flashcards_delete_for_owner ON public.flashcards FOR DELETE USING (
  EXISTS (
    SELECT 1
    FROM public.decks d
    JOIN public.chapters c ON c.id = d.chapter_id
    JOIN public.subjects s ON s.id = c.subject_id
    WHERE d.id = flashcards.deck_id AND s.owner_id = auth.uid()
  )
);

CREATE POLICY timeline_events_select_for_owner ON public.timeline_events FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.chapters c
    JOIN public.subjects s ON s.id = c.subject_id
    WHERE c.id = timeline_events.chapter_id AND s.owner_id = auth.uid()
  )
);

CREATE POLICY timeline_events_insert_for_owner ON public.timeline_events FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.chapters c
    JOIN public.subjects s ON s.id = c.subject_id
    WHERE c.id = NEW.chapter_id AND s.owner_id = auth.uid()
  )
);

CREATE POLICY timeline_events_update_for_owner ON public.timeline_events FOR UPDATE USING (
  EXISTS (
    SELECT 1
    FROM public.chapters c
    JOIN public.subjects s ON s.id = c.subject_id
    WHERE c.id = timeline_events.chapter_id AND s.owner_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.chapters c
    JOIN public.subjects s ON s.id = c.subject_id
    WHERE c.id = NEW.chapter_id AND s.owner_id = auth.uid()
  )
);

CREATE POLICY timeline_events_delete_for_owner ON public.timeline_events FOR DELETE USING (
  EXISTS (
    SELECT 1
    FROM public.chapters c
    JOIN public.subjects s ON s.id = c.subject_id
    WHERE c.id = timeline_events.chapter_id AND s.owner_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS decks_set_updated_at ON public.decks;
CREATE TRIGGER decks_set_updated_at BEFORE UPDATE ON public.decks
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS flashcards_set_updated_at ON public.flashcards;
CREATE TRIGGER flashcards_set_updated_at BEFORE UPDATE ON public.flashcards
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS timeline_events_set_updated_at ON public.timeline_events;
CREATE TRIGGER timeline_events_set_updated_at BEFORE UPDATE ON public.timeline_events
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

COMMIT;
