-- Run the whole file as postgres after deploying the updated backend code.
-- Remove only replaced legacy tables. Keep passengers, tickets and notifications.
BEGIN;
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(7241031);

DO $guard$
DECLARE
    contains_data boolean;
BEGIN
    IF to_regclass('public.booking_temp') IS NOT NULL THEN
        EXECUTE 'LOCK TABLE public.booking_temp IN ACCESS EXCLUSIVE MODE';
        EXECUTE 'SELECT EXISTS(SELECT FROM public.booking_temp)' INTO contains_data;
        IF contains_data THEN
            RAISE EXCEPTION 'booking_temp is not empty. Review/migrate these reservations before removing the table.';
        END IF;
    END IF;
    IF to_regclass('public.password_resets') IS NOT NULL THEN
        EXECUTE 'LOCK TABLE public.password_resets IN ACCESS EXCLUSIVE MODE';
        EXECUTE 'SELECT EXISTS(SELECT FROM public.password_resets WHERE expires_at > LOCALTIMESTAMP)' INTO contains_data;
        IF contains_data THEN
            RAISE EXCEPTION 'password_resets still has unexpired legacy codes. Wait for expiration before removing the table.';
        END IF;
    END IF;
END;
$guard$;

-- RESTRICT stops if an unexpected view, foreign key or other object depends on them.
-- Table-local constraints and indexes are removed with their table.
DROP TABLE IF EXISTS public.booking_temp RESTRICT;
DROP TABLE IF EXISTS public.password_resets RESTRICT;

-- These standalone legacy sequences may remain after their tables are removed.
-- RESTRICT also protects any unexpected shared sequence dependency.
DROP SEQUENCE IF EXISTS public.booking_temp_id_seq RESTRICT;
DROP SEQUENCE IF EXISTS public.password_resets_id_seq RESTRICT;

COMMIT;
