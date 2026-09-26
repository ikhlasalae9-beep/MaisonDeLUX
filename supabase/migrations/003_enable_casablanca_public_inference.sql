BEGIN;

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.cities
      WHERE LOWER(slug) = 'casablanca' OR LOWER(name) = 'casablanca') <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one Casablanca city record';
  END IF;

  IF (SELECT COUNT(*)
      FROM public.model_versions mv
      JOIN public.cities c ON c.id = mv.city_id
      WHERE (LOWER(c.slug) = 'casablanca' OR LOWER(c.name) = 'casablanca')
        AND mv.version = 'casablanca-catboost-v1') <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one Casablanca casablanca-catboost-v1 record';
  END IF;
END $$;

UPDATE public.cities
SET public_enabled = true
WHERE LOWER(slug) = 'casablanca' OR LOWER(name) = 'casablanca';

UPDATE public.model_versions mv
SET public_inference_enabled = true
FROM public.cities c
WHERE mv.city_id = c.id
  AND (LOWER(c.slug) = 'casablanca' OR LOWER(c.name) = 'casablanca')
  AND mv.version = 'casablanca-catboost-v1';

COMMIT;
