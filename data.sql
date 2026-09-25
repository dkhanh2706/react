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



    FOREIGN KEY( airline_id )

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



    FOREIGN KEY(airplane_id)

    REFERENCES airplanes(id)

    ON DELETE CASCADE

);



-------------------------------------------------
-- FLIGHTS
-- THÔNG TIN CHUYẾN BAY
-------------------------------------------------

CREATE TABLE flights
(
    id SERIAL PRIMARY KEY,


    flight_number VARCHAR(20)

    UNIQUE NOT NULL,



    airline_id INTEGER NOT NULL,



    airplane_id INTEGER NOT NULL,



    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY(airline_id)

    REFERENCES airlines(id),



    FOREIGN KEY(airplane_id)

    REFERENCES airplanes(id)

);



-------------------------------------------------
-- FLIGHT SCHEDULES
-- LỊCH BAY
-------------------------------------------------

CREATE TABLE flight_schedules
(
    id SERIAL PRIMARY KEY,


    flight_id INTEGER NOT NULL,


    departure_airport_id INTEGER NOT NULL,


    arrival_airport_id INTEGER NOT NULL,


    departure_time TIME NOT NULL,


    arrival_time TIME NOT NULL,


    price NUMERIC(12,2) NOT NULL,


    operating_days VARCHAR(100),


    status VARCHAR(30)

    DEFAULT 'AVAILABLE',



    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY(flight_id)

    REFERENCES flights(id)

    ON DELETE CASCADE,



    FOREIGN KEY(departure_airport_id)

    REFERENCES airports(id),



    FOREIGN KEY(arrival_airport_id)

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



    FOREIGN KEY(user_id)

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



    FOREIGN KEY(booking_id)

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



    FOREIGN KEY(booking_id)

    REFERENCES bookings(id),



    FOREIGN KEY(flight_id)

    REFERENCES flights(id),



    FOREIGN KEY(passenger_id)

    REFERENCES passengers(id),



    FOREIGN KEY(seat_id)

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



    FOREIGN KEY(booking_id)

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



    FOREIGN KEY(user_id)

    REFERENCES users(id)

);



-------------------------------------------------
-- PASSWORD RESET
-------------------------------------------------

CREATE TABLE password_resets
(
    id SERIAL PRIMARY KEY,


    user_id INTEGER NOT NULL,


    reset_code VARCHAR(10) NOT NULL,


    expires_at TIMESTAMP NOT NULL,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY(user_id)

    REFERENCES users(id)

    ON DELETE CASCADE

);




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
'Vietnam'),



('HND',
'Haneda Airport',
'Tokyo',
'Japan'),



('SIN',
'Changi Airport',
'Singapore',
'Singapore');





INSERT INTO airplanes
(
airline_id,
model,
seat_capacity
)

VALUES

(1,'Airbus A321',200),

(2,'Airbus A320',180),

(3,'Boeing 787',250);





INSERT INTO flights
(
flight_number,
airline_id,
airplane_id
)

VALUES


(
'VN123',
1,
1
),


(
'VJ456',
2,
2
),


(
'QH789',
3,
3
);






-------------------------------------------------
-- FLIGHT SCHEDULES DATA
-------------------------------------------------



INSERT INTO flight_schedules
(
flight_id,
departure_airport_id,
arrival_airport_id,
departure_time,
arrival_time,
price,
operating_days
)

VALUES



(
1,
2,
1,
'08:00',
'10:15',
1500000,
'MON,TUE,WED,THU,FRI,SAT,SUN'
),



(
2,
2,
3,
'09:00',
'10:20',
700000,
'MON,WED,FRI'
),



(
3,
1,
4,
'22:00',
'06:30',
5500000,
'TUE,THU,SAT'
);



-------------------------------------------------
-- INDEX SEARCH
-------------------------------------------------

CREATE INDEX idx_schedule_route

ON flight_schedules
(
departure_airport_id,
arrival_airport_id
);



CREATE INDEX idx_flight_number

ON flights(flight_number);



CREATE INDEX idx_airport_code

ON airports(code);