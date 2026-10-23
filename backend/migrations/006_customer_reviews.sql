-- Additive migration. Run as database owner after reviewing this file.
-- Existing bookings/payments/seats are preserved. No reviews are seeded.
BEGIN;
ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS customer_reviewed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.customer_reviews (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL CHECK (char_length(btrim(comment)) BETWEEN 1 AND 1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS customer_reviews_newest_idx
    ON public.customer_reviews(created_at DESC, id DESC);
GRANT SELECT, INSERT, DELETE ON public.customer_reviews TO codex_user;
GRANT USAGE, SELECT ON SEQUENCE public.customer_reviews_id_seq TO codex_user;
COMMIT;
