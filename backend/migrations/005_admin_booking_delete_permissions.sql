-- Run manually as postgres in airline_booking if the app role lacks DELETE permissions.
-- Permission changes only. No schema changes and no data is deleted by this migration.
BEGIN;
GRANT DELETE ON public.bookings, public.booking_details, public.passengers,
    public.tickets, public.payments, public.payment_review_cases TO codex_user;
COMMIT;
