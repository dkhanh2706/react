-- Run once as postgres. Additive only: no tables or historical rows are removed.
BEGIN;

ALTER TABLE public.flights ADD COLUMN IF NOT EXISTS demo_key text;

-- One generated flight per original route and Vietnam departure date.
-- The key stays unchanged when admin edits/cancels the flight.
CREATE UNIQUE INDEX IF NOT EXISTS flights_demo_key_unique
    ON public.flights (demo_key) WHERE demo_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS flights_route_departure
    ON public.flights (departure_airport_id, arrival_airport_id, departure_time);
CREATE INDEX IF NOT EXISTS flights_airplane_departure
    ON public.flights (airplane_id, departure_time);

COMMIT;
