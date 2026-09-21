-------------------------------------------------
-- DATABASE: airline_booking
-------------------------------------------------


-------------------------------------------------
-- ENUM TYPES
-------------------------------------------------

CREATE TYPE user_role AS ENUM
(
    'CUSTOMER',
    'STAFF',
    'ADMIN'
);


CREATE TYPE booking_status AS ENUM
(
    'PENDING',
    'CONFIRMED',
    'CANCELLED'
);


CREATE TYPE payment_status AS ENUM
(
    'PENDING',
    'SUCCESS',
    'FAILED',
    'REFUNDED'
);


CREATE TYPE seat_class AS ENUM
(
    'ECONOMY',
    'BUSINESS',
    'FIRST'
);



-------------------------------------------------
-- USERS
-------------------------------------------------

CREATE TABLE users
(
    id SERIAL PRIMARY KEY,

    full_name VARCHAR(100) NOT NULL,

    email VARCHAR(150) UNIQUE NOT NULL,

    password_hash TEXT NOT NULL,

    phone VARCHAR(20),

    role user_role DEFAULT 'CUSTOMER',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-------------------------------------------------
-- AIRLINES
-------------------------------------------------

CREATE TABLE airlines
(
    id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    code VARCHAR(10) UNIQUE NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-------------------------------------------------
-- AIRPORTS
-------------------------------------------------

CREATE TABLE airports
(
    id SERIAL PRIMARY KEY,

    code VARCHAR(10) UNIQUE NOT NULL,

    name VARCHAR(150) NOT NULL,

    city VARCHAR(100),

    country VARCHAR(100)
);



-------------------------------------------------
-- AIRPLANES
-------------------------------------------------

CREATE TABLE airplanes
(
    id SERIAL PRIMARY KEY,

    airline_id INTEGER NOT NULL,

    model VARCHAR(100) NOT NULL,

    seat_capacity INTEGER NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY (airline_id)
    REFERENCES airlines(id)
);



-------------------------------------------------
-- SEATS
-------------------------------------------------

CREATE TABLE seats
(
    id SERIAL PRIMARY KEY,

    airplane_id INTEGER NOT NULL,

    seat_number VARCHAR(10) NOT NULL,

    class seat_class NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY (airplane_id)
    REFERENCES airplanes(id)
    ON DELETE CASCADE
);



-------------------------------------------------
-- FLIGHTS
-------------------------------------------------

CREATE TABLE flights
(
    id SERIAL PRIMARY KEY,


    flight_number VARCHAR(20)
    UNIQUE NOT NULL,


    airline_id INTEGER NOT NULL,


    airplane_id INTEGER NOT NULL,


    departure_airport_id INTEGER NOT NULL,


    arrival_airport_id INTEGER NOT NULL,


    departure_time TIMESTAMP NOT NULL,


    arrival_time TIMESTAMP NOT NULL,


    status VARCHAR(30)
    DEFAULT 'SCHEDULED',


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY (airline_id)
    REFERENCES airlines(id),


    FOREIGN KEY (airplane_id)
    REFERENCES airplanes(id),


    FOREIGN KEY (departure_airport_id)
    REFERENCES airports(id),


    FOREIGN KEY (arrival_airport_id)
    REFERENCES airports(id)

);



-------------------------------------------------
-- BOOKINGS
-------------------------------------------------

CREATE TABLE bookings
(
    id SERIAL PRIMARY KEY,


    user_id INTEGER NOT NULL,


    booking_code VARCHAR(20)
    UNIQUE NOT NULL,


    total_price NUMERIC(12,2)
    DEFAULT 0,


    status booking_status
    DEFAULT 'PENDING',


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY (user_id)
    REFERENCES users(id)

);



-------------------------------------------------
-- PASSENGERS
-------------------------------------------------

CREATE TABLE passengers
(
    id SERIAL PRIMARY KEY,


    booking_id INTEGER NOT NULL,


    full_name VARCHAR(100)
    NOT NULL,


    passport VARCHAR(50),


    birthday DATE,


    gender VARCHAR(10),



    FOREIGN KEY (booking_id)
    REFERENCES bookings(id)
    ON DELETE CASCADE

);



-------------------------------------------------
-- TICKETS
-------------------------------------------------

CREATE TABLE tickets
(
    id SERIAL PRIMARY KEY,


    booking_id INTEGER NOT NULL,


    flight_id INTEGER NOT NULL,


    passenger_id INTEGER NOT NULL,


    seat_id INTEGER NOT NULL,


    ticket_number VARCHAR(50)
    UNIQUE NOT NULL,


    price NUMERIC(12,2)
    NOT NULL,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY (booking_id)
    REFERENCES bookings(id),


    FOREIGN KEY (flight_id)
    REFERENCES flights(id),


    FOREIGN KEY (passenger_id)
    REFERENCES passengers(id),


    FOREIGN KEY (seat_id)
    REFERENCES seats(id)

);



-------------------------------------------------
-- PAYMENTS
-------------------------------------------------

CREATE TABLE payments
(
    id SERIAL PRIMARY KEY,


    booking_id INTEGER NOT NULL,


    method VARCHAR(50)
    NOT NULL,


    amount NUMERIC(12,2)
    NOT NULL,


    status payment_status
    DEFAULT 'PENDING',


    transaction_id VARCHAR(100),


    payment_date TIMESTAMP,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY (booking_id)
    REFERENCES bookings(id)

);



-------------------------------------------------
-- NOTIFICATIONS
-------------------------------------------------

CREATE TABLE notifications
(
    id SERIAL PRIMARY KEY,


    user_id INTEGER NOT NULL,


    title VARCHAR(200),


    message TEXT,


    is_read BOOLEAN DEFAULT FALSE,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY (user_id)
    REFERENCES users(id)

);



-------------------------------------------------
-- INDEX
-------------------------------------------------

CREATE INDEX idx_users_email
ON users(email);



CREATE INDEX idx_flights_route
ON flights
(
    departure_airport_id,
    arrival_airport_id
);



CREATE INDEX idx_flights_departure_time
ON flights(departure_time);



CREATE INDEX idx_booking_user
ON bookings(user_id);



CREATE INDEX idx_ticket_flight
ON tickets(flight_id);



CREATE INDEX idx_ticket_booking
ON tickets(booking_id);



-------------------------------------------------
-- SAMPLE DATA
-------------------------------------------------


INSERT INTO airlines
(name,code)
VALUES
('Vietnam Airlines','VN'),
('Vietjet Air','VJ'),
('Bamboo Airways','QH');



INSERT INTO airports
(code,name,city,country)
VALUES

('SGN',
'Tan Son Nhat Airport',
'Ho Chi Minh',
'Vietnam'),


('HAN',
'Noi Bai Airport',
'Hanoi',
'Vietnam'),


('DAD',
'Da Nang Airport',
'Da Nang',
'Vietnam');



INSERT INTO users
(
full_name,
email,
password_hash,
phone,
role
)
VALUES
(
'Admin',
'admin@gmail.com',
'123456',
'0900000000',
'ADMIN'
);
CREATE TABLE password_resets
(
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL,

    reset_code VARCHAR(10) NOT NULL,

    expires_at TIMESTAMP NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT fk_user_reset
    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS airlines
(
    id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    code VARCHAR(10) UNIQUE NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS airports
(
    id SERIAL PRIMARY KEY,

    code VARCHAR(10) UNIQUE NOT NULL,

    name VARCHAR(100) NOT NULL,

    city VARCHAR(100),

    country VARCHAR(100)
);
CREATE TABLE IF NOT EXISTS airplanes
(
    id SERIAL PRIMARY KEY,

    airline_id INTEGER REFERENCES airlines(id),

    model VARCHAR(100),

    seat_capacity INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS flights
(
    id SERIAL PRIMARY KEY,


    flight_number VARCHAR(20),


    airline_id INTEGER 
    REFERENCES airlines(id),


    airplane_id INTEGER
    REFERENCES airplanes(id),


    departure_airport_id INTEGER
    REFERENCES airports(id),


    arrival_airport_id INTEGER
    REFERENCES airports(id),


    departure_time TIMESTAMP,


    arrival_time TIMESTAMP,


    price NUMERIC(12,2),


    status VARCHAR(50),


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO flights
(
flight_number,

airline_id,

airplane_id,

departure_airport_id,

arrival_airport_id,

departure_time,

arrival_time,

price,

status
)

VALUES


(
'VN123',

1,

1,

2,

1,

'2026-10-20 08:00:00',

'2026-10-20 10:15:00',

1500000,

'AVAILABLE'
),



(
'VJ456',

2,

3,

1,

3,

'2026-10-21 09:00:00',

'2026-10-21 10:20:00',

600000,

'AVAILABLE'
),



(
'VN789',

1,

2,

1,

3,

'2026-10-22 22:00:00',

'2026-10-23 06:30:00',

5500000,

'AVAILABLE'
),



(
'VN310',

1,

2,

1,

4,

'2026-10-25 23:00:00',

'2026-10-26 07:00:00',

5500000,

'AVAILABLE'
);
SELECT

f.flight_number,

a1.city AS from_city,

a2.city AS to_city,

al.name AS airline,

f.departure_time,

f.arrival_time,

f.price


FROM flights f


JOIN airports a1

ON f.departure_airport_id = a1.id



JOIN airports a2

ON f.arrival_airport_id = a2.id



JOIN airlines al

ON f.airline_id = al.id



WHERE

a1.code='HAN'

AND

a2.code='SGN';