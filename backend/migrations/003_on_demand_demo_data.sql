-- Data-only setup approved for the classroom demo. No tables are dropped or added.
DO $setup$
DECLARE
    demo_airline integer;
    demo_plane integer;
    model_name text;
    n integer;
    legacy_temp_flights integer[] := ARRAY[]::integer[];
BEGIN
    PERFORM pg_advisory_xact_lock(7241031);
    LOCK TABLE public.flights IN SHARE ROW EXCLUSIVE MODE;
    SELECT id INTO STRICT demo_airline FROM public.airlines WHERE code='VN';

    -- Fill only missing country values; never overwrite existing classifications.
    UPDATE public.airports a SET country=m.country
    FROM (VALUES ('SGN','Vietnam'),('HAN','Vietnam'),('DAD','Vietnam'),('PQC','Vietnam'),
        ('CXR','Vietnam'),('DLI','Vietnam'),('HUI','Vietnam'),('VCA','Vietnam'),
        ('NRT','Japan'),('HND','Japan'),('SIN','Singapore')) AS m(code,country)
    WHERE a.code=m.code AND (a.country IS NULL OR btrim(a.country)='');

    -- User authorized removing the unused flights from the previous bulk seed.
    -- Every linked booking/detail/temp/ticket is protected, irrespective of status.
    -- Compatible before and after migration 004 removes the unused temp table.
    IF to_regclass('public.booking_temp') IS NOT NULL THEN
        EXECUTE 'SELECT coalesce(array_agg(DISTINCT flight_id), ARRAY[]::integer[]) FROM public.booking_temp'
            INTO legacy_temp_flights;
    END IF;
    DELETE FROM public.flights f
    WHERE f.demo_key IS NOT NULL AND f.flight_number ~ '^DM[0-9]{8}-'
        AND NOT EXISTS(SELECT FROM public.booking_details d WHERE d.flight_id=f.id)
        AND NOT EXISTS(SELECT FROM public.bookings b WHERE b.flight_number_snapshot=f.flight_number)
        AND f.id <> ALL(legacy_temp_flights)
        AND NOT EXISTS(SELECT FROM public.tickets t WHERE t.flight_id=f.id);

    FOR n IN 1..12 LOOP
        model_name := 'DEMO-A320-' || lpad(n::text,2,'0');
        IF (SELECT count(*) FROM public.airplanes WHERE model=model_name) > 1 THEN
            RAISE EXCEPTION 'Ambiguous demo airplane: %', model_name;
        END IF;
        SELECT id INTO demo_plane FROM public.airplanes WHERE model=model_name;
        IF demo_plane IS NULL THEN
            INSERT INTO public.airplanes(airline_id,model,seat_capacity)
            VALUES(demo_airline,model_name,20) RETURNING id INTO demo_plane;
        ELSIF NOT EXISTS(SELECT FROM public.airplanes WHERE id=demo_plane AND airline_id=demo_airline AND seat_capacity=20) THEN
            RAISE EXCEPTION 'Existing demo airplane has unexpected configuration: %',model_name;
        END IF;
        IF NOT EXISTS(SELECT FROM public.seats WHERE airplane_id=demo_plane) THEN
            INSERT INTO public.seats(airplane_id,seat_number,class)
            SELECT demo_plane, row_no::text || col_name,
                CASE WHEN row_no<=4 THEN 'ECONOMY'::seat_class
                    WHEN col_name='D' THEN 'FIRST'::seat_class ELSE 'BUSINESS'::seat_class END
            FROM generate_series(1,5) row_no CROSS JOIN (VALUES('A'),('B'),('C'),('D')) cols(col_name);
        END IF;
        IF (SELECT count(*) FROM public.seats WHERE airplane_id=demo_plane) <> 20 THEN
            RAISE EXCEPTION 'Unexpected seat count for %; leaving existing data intact', model_name;
        END IF;
    END LOOP;
END;
$setup$;
