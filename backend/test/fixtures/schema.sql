-- Isolated integration-test schema, exported from the inspected database structure.
-- No production rows or credentials are included. Run only in airline_booking_test.
-- Historical legacy tables are intentional: tests apply migration 004 and verify removal.
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='codex_user') THEN
        CREATE ROLE codex_user;
    END IF;
END $$;
CREATE TYPE user_role AS ENUM ('CUSTOMER','STAFF','ADMIN');
CREATE TYPE seat_class AS ENUM ('ECONOMY','BUSINESS','FIRST');
CREATE TYPE booking_status AS ENUM ('PENDING','CONFIRMED','CANCELLED');
CREATE TYPE payment_status AS ENUM ('PENDING','SUCCESS','FAILED','REFUNDED');

CREATE SEQUENCE "public"."airlines_id_seq"
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    NO CYCLE;

CREATE SEQUENCE "public"."airplanes_id_seq"
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    NO CYCLE;

CREATE SEQUENCE "public"."airports_id_seq"
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    NO CYCLE;

CREATE SEQUENCE "public"."booking_details_id_seq"
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    NO CYCLE;

CREATE SEQUENCE "public"."booking_temp_id_seq"
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    NO CYCLE;

CREATE SEQUENCE "public"."bookings_id_seq"
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    NO CYCLE;

CREATE SEQUENCE "public"."flights_id_seq"
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    NO CYCLE;

CREATE SEQUENCE "public"."notifications_id_seq"
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    NO CYCLE;

CREATE SEQUENCE "public"."passengers_id_seq"
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    NO CYCLE;

CREATE SEQUENCE "public"."password_resets_id_seq"
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    NO CYCLE;

CREATE SEQUENCE "public"."payments_id_seq"
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    NO CYCLE;

CREATE SEQUENCE "public"."seats_id_seq"
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    NO CYCLE;

CREATE SEQUENCE "public"."tickets_id_seq"
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    NO CYCLE;

CREATE SEQUENCE "public"."users_id_seq"
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    NO CYCLE;

CREATE TABLE "public"."users" (
    id integer DEFAULT nextval('users_id_seq'::regclass) NOT NULL,
    full_name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash text NOT NULL,
    phone character varying(20),
    role user_role DEFAULT 'CUSTOMER'::user_role,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    birth_date date,
    gender character varying(20),
    is_locked boolean DEFAULT false,
    avatar_url text,
    CONSTRAINT users_id_not_null NOT NULL id,
    CONSTRAINT users_full_name_not_null NOT NULL full_name,
    CONSTRAINT users_email_not_null NOT NULL email,
    CONSTRAINT users_password_hash_not_null NOT NULL password_hash,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email)
);

CREATE TABLE "public"."airlines" (
    id integer DEFAULT nextval('airlines_id_seq'::regclass) NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(10) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT airlines_id_not_null NOT NULL id,
    CONSTRAINT airlines_name_not_null NOT NULL name,
    CONSTRAINT airlines_code_not_null NOT NULL code,
    CONSTRAINT airlines_pkey PRIMARY KEY (id),
    CONSTRAINT airlines_code_key UNIQUE (code)
);

CREATE TABLE "public"."airports" (
    id integer DEFAULT nextval('airports_id_seq'::regclass) NOT NULL,
    code character varying(10) NOT NULL,
    name character varying(150) NOT NULL,
    city character varying(100),
    country character varying(100),
    CONSTRAINT airports_id_not_null NOT NULL id,
    CONSTRAINT airports_code_not_null NOT NULL code,
    CONSTRAINT airports_name_not_null NOT NULL name,
    CONSTRAINT airports_pkey PRIMARY KEY (id),
    CONSTRAINT airports_code_key UNIQUE (code)
);

CREATE TABLE "public"."airplanes" (
    id integer DEFAULT nextval('airplanes_id_seq'::regclass) NOT NULL,
    airline_id integer NOT NULL,
    model character varying(100) NOT NULL,
    seat_capacity integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT airplanes_airline_id_fkey FOREIGN KEY (airline_id) REFERENCES airlines(id),
    CONSTRAINT airplanes_id_not_null NOT NULL id,
    CONSTRAINT airplanes_airline_id_not_null NOT NULL airline_id,
    CONSTRAINT airplanes_model_not_null NOT NULL model,
    CONSTRAINT airplanes_seat_capacity_not_null NOT NULL seat_capacity,
    CONSTRAINT airplanes_pkey PRIMARY KEY (id)
);

CREATE TABLE "public"."seats" (
    id integer DEFAULT nextval('seats_id_seq'::regclass) NOT NULL,
    airplane_id integer NOT NULL,
    seat_number character varying(10) NOT NULL,
    class seat_class NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT seats_airplane_id_fkey FOREIGN KEY (airplane_id) REFERENCES airplanes(id) ON DELETE CASCADE,
    CONSTRAINT seats_id_not_null NOT NULL id,
    CONSTRAINT seats_airplane_id_not_null NOT NULL airplane_id,
    CONSTRAINT seats_seat_number_not_null NOT NULL seat_number,
    CONSTRAINT seats_class_not_null NOT NULL class,
    CONSTRAINT seats_pkey PRIMARY KEY (id)
);

CREATE TABLE "public"."flights" (
    id integer DEFAULT nextval('flights_id_seq'::regclass) NOT NULL,
    flight_number character varying(20) NOT NULL,
    airline_id integer NOT NULL,
    airplane_id integer NOT NULL,
    departure_airport_id integer NOT NULL,
    arrival_airport_id integer NOT NULL,
    departure_time timestamp without time zone NOT NULL,
    arrival_time timestamp without time zone NOT NULL,
    status character varying(30) DEFAULT 'SCHEDULED'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    price numeric(12,2),
    CONSTRAINT flights_arrival_airport_id_fkey FOREIGN KEY (arrival_airport_id) REFERENCES airports(id),
    CONSTRAINT flights_departure_airport_id_fkey FOREIGN KEY (departure_airport_id) REFERENCES airports(id),
    CONSTRAINT flights_airline_id_fkey FOREIGN KEY (airline_id) REFERENCES airlines(id),
    CONSTRAINT flights_airplane_id_fkey FOREIGN KEY (airplane_id) REFERENCES airplanes(id),
    CONSTRAINT flights_departure_airport_id_not_null NOT NULL departure_airport_id,
    CONSTRAINT flights_arrival_airport_id_not_null NOT NULL arrival_airport_id,
    CONSTRAINT flights_departure_time_not_null NOT NULL departure_time,
    CONSTRAINT flights_id_not_null NOT NULL id,
    CONSTRAINT flights_arrival_time_not_null NOT NULL arrival_time,
    CONSTRAINT flights_flight_number_not_null NOT NULL flight_number,
    CONSTRAINT flights_airline_id_not_null NOT NULL airline_id,
    CONSTRAINT flights_airplane_id_not_null NOT NULL airplane_id,
    CONSTRAINT flights_pkey PRIMARY KEY (id),
    CONSTRAINT flights_flight_number_key UNIQUE (flight_number)
);

CREATE TABLE "public"."bookings" (
    id integer DEFAULT nextval('bookings_id_seq'::regclass) NOT NULL,
    user_id integer NOT NULL,
    booking_code character varying(50) NOT NULL,
    total_price numeric(12,2) DEFAULT 0,
    status booking_status DEFAULT 'PENDING'::booking_status,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    flight_date date,
    departure_place character varying(150),
    arrival_place character varying(150),
    departure_time_text character varying(20),
    arrival_time_text character varying(20),
    airline_name character varying(150),
    flight_number_snapshot character varying(50),
    seat_number_snapshot character varying(20),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT bookings_id_not_null NOT NULL id,
    CONSTRAINT bookings_user_id_not_null NOT NULL user_id,
    CONSTRAINT bookings_booking_code_not_null NOT NULL booking_code,
    CONSTRAINT bookings_pkey PRIMARY KEY (id),
    CONSTRAINT bookings_booking_code_key UNIQUE (booking_code)
);

CREATE TABLE "public"."booking_details" (
    id integer DEFAULT nextval('booking_details_id_seq'::regclass) NOT NULL,
    booking_id integer NOT NULL,
    flight_id integer NOT NULL,
    seat_id integer NOT NULL,
    passenger_name character varying(100),
    email character varying(100),
    phone character varying(20),
    seat_class seat_class NOT NULL,
    price numeric(12,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    seat_status character varying(20) DEFAULT 'HOLD'::character varying,
    hold_expires_at timestamp without time zone,
    gender character varying(10),
    date_of_birth date,
    document_type character varying(20),
    document_number character varying(50),
    baggage_weight integer DEFAULT 0,
    baggage_price numeric(12,2) DEFAULT 0,
    meal_type character varying(100),
    meal_price numeric(12,2) DEFAULT 0,
    insurance boolean DEFAULT false,
    insurance_price numeric(12,2) DEFAULT 0,
    CONSTRAINT booking_details_flight_id_fkey FOREIGN KEY (flight_id) REFERENCES flights(id),
    CONSTRAINT booking_details_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT booking_details_seat_id_fkey FOREIGN KEY (seat_id) REFERENCES seats(id),
    CONSTRAINT booking_details_id_not_null NOT NULL id,
    CONSTRAINT booking_details_price_not_null NOT NULL price,
    CONSTRAINT booking_details_seat_class_not_null NOT NULL seat_class,
    CONSTRAINT booking_details_seat_id_not_null NOT NULL seat_id,
    CONSTRAINT booking_details_booking_id_not_null NOT NULL booking_id,
    CONSTRAINT booking_details_flight_id_not_null NOT NULL flight_id,
    CONSTRAINT booking_details_pkey PRIMARY KEY (id)
);

CREATE TABLE "public"."booking_temp" (
    id integer DEFAULT nextval('booking_temp_id_seq'::regclass) NOT NULL,
    user_id integer NOT NULL,
    flight_id integer NOT NULL,
    seat_id integer NOT NULL,
    passenger_name character varying(100),
    email character varying(100),
    phone character varying(20),
    seat_class seat_class NOT NULL,
    price numeric(12,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expired_at timestamp without time zone NOT NULL,
    CONSTRAINT booking_temp_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT booking_temp_seat_id_fkey FOREIGN KEY (seat_id) REFERENCES seats(id),
    CONSTRAINT booking_temp_flight_id_fkey FOREIGN KEY (flight_id) REFERENCES flights(id),
    CONSTRAINT booking_temp_price_not_null NOT NULL price,
    CONSTRAINT booking_temp_seat_class_not_null NOT NULL seat_class,
    CONSTRAINT booking_temp_seat_id_not_null NOT NULL seat_id,
    CONSTRAINT booking_temp_user_id_not_null NOT NULL user_id,
    CONSTRAINT booking_temp_flight_id_not_null NOT NULL flight_id,
    CONSTRAINT booking_temp_id_not_null NOT NULL id,
    CONSTRAINT booking_temp_expired_at_not_null NOT NULL expired_at,
    CONSTRAINT booking_temp_pkey PRIMARY KEY (id)
);

CREATE TABLE "public"."notifications" (
    id integer DEFAULT nextval('notifications_id_seq'::regclass) NOT NULL,
    user_id integer NOT NULL,
    title character varying(200),
    message text,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT notifications_id_not_null NOT NULL id,
    CONSTRAINT notifications_user_id_not_null NOT NULL user_id,
    CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

CREATE TABLE "public"."passengers" (
    id integer DEFAULT nextval('passengers_id_seq'::regclass) NOT NULL,
    booking_id integer NOT NULL,
    full_name character varying(100) NOT NULL,
    passport character varying(50),
    birthday date,
    gender character varying(10),
    CONSTRAINT passengers_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT passengers_id_not_null NOT NULL id,
    CONSTRAINT passengers_booking_id_not_null NOT NULL booking_id,
    CONSTRAINT passengers_full_name_not_null NOT NULL full_name,
    CONSTRAINT passengers_pkey PRIMARY KEY (id)
);

CREATE TABLE "public"."tickets" (
    id integer DEFAULT nextval('tickets_id_seq'::regclass) NOT NULL,
    booking_id integer NOT NULL,
    flight_id integer NOT NULL,
    passenger_id integer NOT NULL,
    seat_id integer NOT NULL,
    ticket_number character varying(50) NOT NULL,
    price numeric(12,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tickets_seat_id_fkey FOREIGN KEY (seat_id) REFERENCES seats(id),
    CONSTRAINT tickets_passenger_id_fkey FOREIGN KEY (passenger_id) REFERENCES passengers(id),
    CONSTRAINT tickets_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT tickets_flight_id_fkey FOREIGN KEY (flight_id) REFERENCES flights(id),
    CONSTRAINT tickets_seat_id_not_null NOT NULL seat_id,
    CONSTRAINT tickets_ticket_number_not_null NOT NULL ticket_number,
    CONSTRAINT tickets_id_not_null NOT NULL id,
    CONSTRAINT tickets_price_not_null NOT NULL price,
    CONSTRAINT tickets_booking_id_not_null NOT NULL booking_id,
    CONSTRAINT tickets_flight_id_not_null NOT NULL flight_id,
    CONSTRAINT tickets_passenger_id_not_null NOT NULL passenger_id,
    CONSTRAINT tickets_pkey PRIMARY KEY (id),
    CONSTRAINT tickets_ticket_number_key UNIQUE (ticket_number)
);

CREATE TABLE "public"."password_resets" (
    id integer DEFAULT nextval('password_resets_id_seq'::regclass) NOT NULL,
    user_id integer NOT NULL,
    reset_code character varying(10) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_reset FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT password_resets_expires_at_not_null NOT NULL expires_at,
    CONSTRAINT password_resets_id_not_null NOT NULL id,
    CONSTRAINT password_resets_reset_code_not_null NOT NULL reset_code,
    CONSTRAINT password_resets_user_id_not_null NOT NULL user_id,
    CONSTRAINT password_resets_pkey PRIMARY KEY (id)
);

CREATE TABLE "public"."payments" (
    id integer DEFAULT nextval('payments_id_seq'::regclass) NOT NULL,
    booking_id integer NOT NULL,
    method character varying(50) NOT NULL,
    amount numeric(12,2) NOT NULL,
    status payment_status DEFAULT 'PENDING'::payment_status,
    transaction_id character varying(100),
    payment_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    paid_at timestamp without time zone,
    CONSTRAINT payments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT payments_id_not_null NOT NULL id,
    CONSTRAINT payments_booking_id_not_null NOT NULL booking_id,
    CONSTRAINT payments_method_not_null NOT NULL method,
    CONSTRAINT payments_amount_not_null NOT NULL amount,
    CONSTRAINT payments_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS users_pkey ON public.users USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON public.users USING btree (email);
CREATE UNIQUE INDEX IF NOT EXISTS airlines_pkey ON public.airlines USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS airlines_code_key ON public.airlines USING btree (code);
CREATE UNIQUE INDEX IF NOT EXISTS airports_pkey ON public.airports USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS airports_code_key ON public.airports USING btree (code);
CREATE UNIQUE INDEX IF NOT EXISTS airplanes_pkey ON public.airplanes USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS seats_pkey ON public.seats USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS flights_pkey ON public.flights USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS flights_flight_number_key ON public.flights USING btree (flight_number);
CREATE UNIQUE INDEX IF NOT EXISTS bookings_pkey ON public.bookings USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS passengers_pkey ON public.passengers USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS tickets_pkey ON public.tickets USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS tickets_ticket_number_key ON public.tickets USING btree (ticket_number);
CREATE UNIQUE INDEX IF NOT EXISTS payments_pkey ON public.payments USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS notifications_pkey ON public.notifications USING btree (id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users USING btree (email);
CREATE INDEX IF NOT EXISTS idx_flights_route ON public.flights USING btree (departure_airport_id, arrival_airport_id);
CREATE INDEX IF NOT EXISTS idx_flights_departure_time ON public.flights USING btree (departure_time);
CREATE INDEX IF NOT EXISTS idx_booking_user ON public.bookings USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_flight ON public.tickets USING btree (flight_id);
CREATE INDEX IF NOT EXISTS idx_ticket_booking ON public.tickets USING btree (booking_id);
CREATE UNIQUE INDEX IF NOT EXISTS password_resets_pkey ON public.password_resets USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS booking_temp_pkey ON public.booking_temp USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS booking_details_pkey ON public.booking_details USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS bookings_booking_code_key ON public.bookings USING btree (booking_code);
CREATE INDEX IF NOT EXISTS idx_booking_details_hold ON public.booking_details USING btree (flight_id, seat_id, seat_status, hold_expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_flight_seat ON public.booking_details USING btree (flight_id, seat_id) WHERE ((seat_status)::text = ANY ((ARRAY['HOLD'::character varying, 'BOOKED'::character varying])::text[]));

