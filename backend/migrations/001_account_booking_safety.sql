-- Run as the owner of the public tables (postgres), before starting the new backend.
-- No tables, columns, or historical booking/payment rows are removed.
-- Commit enum additions before using their values in later transactions.
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'EXPIRED';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'PAYMENT_REVIEW';

BEGIN;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS token_version integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_primary_admin boolean NOT NULL DEFAULT false;

-- The reviewed database has exactly one ADMIN. Stop rather than guess if that changes.
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM public.users WHERE is_primary_admin) THEN
        IF (SELECT count(*) FROM public.users WHERE role = 'ADMIN') <> 1 THEN
            RAISE EXCEPTION 'Expected exactly one ADMIN; select the primary administrator explicitly.';
        END IF;
        UPDATE public.users SET is_primary_admin = true WHERE role = 'ADMIN';
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS users_one_primary_admin
    ON public.users (is_primary_admin) WHERE is_primary_admin;

CREATE TABLE IF NOT EXISTS public.password_challenges (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id integer NOT NULL REFERENCES public.users(id),
    purpose varchar(20) NOT NULL CHECK (purpose IN ('forgot', 'change')),
    code_hash text NOT NULL,
    attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    consumed_at timestamptz
);
CREATE INDEX IF NOT EXISTS password_challenges_user_time
    ON public.password_challenges (user_id, created_at DESC);

ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS momo_order_id text,
    ADD COLUMN IF NOT EXISTS momo_request_id text,
    ADD COLUMN IF NOT EXISTS provider_result_code integer,
    ADD COLUMN IF NOT EXISTS provider_message text,
    ADD COLUMN IF NOT EXISTS pay_url text;

CREATE UNIQUE INDEX IF NOT EXISTS payments_momo_order_unique
    ON public.payments (momo_order_id) WHERE momo_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS payments_momo_request_unique
    ON public.payments (momo_request_id) WHERE momo_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS payments_booking_created
    ON public.payments (booking_id, id DESC);

CREATE TABLE IF NOT EXISTS public.payment_review_cases (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    payment_id integer NOT NULL UNIQUE REFERENCES public.payments(id),
    booking_id integer NOT NULL REFERENCES public.bookings(id),
    reason text NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'OPEN'
        CHECK (status IN ('OPEN', 'REFUNDED')),
    resolution_note text,
    refund_reference text,
    resolved_by integer REFERENCES public.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    resolved_at timestamptz
);

ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
    ADD COLUMN IF NOT EXISTS cancellation_reason text;

-- Reuse the existing unique_active_flight_seat index. Historical rows are retained.
CREATE INDEX IF NOT EXISTS booking_details_booking
    ON public.booking_details (booking_id);

-- Keep localdb's existing privilege boundary. No ownership or role changes.
GRANT SELECT, INSERT, UPDATE ON public.password_challenges,
    public.payment_review_cases TO codex_user;
GRANT USAGE, SELECT ON SEQUENCE public.password_challenges_id_seq,
    public.payment_review_cases_id_seq TO codex_user;

COMMIT;
