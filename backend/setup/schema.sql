-- Base schema for a NEW, EMPTY classroom database (before migrations 001-007).
-- Applied only by scripts/setupDemoDatabase.js after checking the database name/schema.
CREATE TYPE user_role AS ENUM ('CUSTOMER','STAFF','ADMIN');
CREATE TYPE seat_class AS ENUM ('ECONOMY','BUSINESS','FIRST');
CREATE TYPE booking_status AS ENUM ('PENDING','CONFIRMED','CANCELLED');
CREATE TYPE payment_status AS ENUM ('PENDING','SUCCESS','FAILED','REFUNDED');
CREATE TABLE users (
  id SERIAL PRIMARY KEY, full_name VARCHAR(100) NOT NULL, email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, phone VARCHAR(20), role user_role DEFAULT 'CUSTOMER',
  birth_date DATE, gender VARCHAR(20), is_locked BOOLEAN DEFAULT false, avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE airlines (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, code VARCHAR(10) UNIQUE NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE airports (id SERIAL PRIMARY KEY, code VARCHAR(10) UNIQUE NOT NULL, name VARCHAR(150) NOT NULL, city VARCHAR(100), country VARCHAR(100));
CREATE TABLE airplanes (id SERIAL PRIMARY KEY, airline_id INTEGER NOT NULL REFERENCES airlines(id), model VARCHAR(100) NOT NULL, seat_capacity INTEGER NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE seats (id SERIAL PRIMARY KEY, airplane_id INTEGER NOT NULL REFERENCES airplanes(id) ON DELETE CASCADE, seat_number VARCHAR(10) NOT NULL, class seat_class NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE flights (
  id SERIAL PRIMARY KEY, flight_number VARCHAR(20) UNIQUE NOT NULL, airline_id INTEGER NOT NULL REFERENCES airlines(id),
  airplane_id INTEGER NOT NULL REFERENCES airplanes(id), departure_airport_id INTEGER NOT NULL REFERENCES airports(id),
  arrival_airport_id INTEGER NOT NULL REFERENCES airports(id), departure_time TIMESTAMP NOT NULL, arrival_time TIMESTAMP NOT NULL,
  status VARCHAR(30) DEFAULT 'SCHEDULED', price NUMERIC(12,2), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), booking_code VARCHAR(50) UNIQUE NOT NULL,
  total_price NUMERIC(12,2) DEFAULT 0, status booking_status DEFAULT 'PENDING', flight_date DATE,
  departure_place VARCHAR(150), arrival_place VARCHAR(150), departure_time_text VARCHAR(20), arrival_time_text VARCHAR(20),
  airline_name VARCHAR(150), flight_number_snapshot VARCHAR(50), seat_number_snapshot VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE booking_details (
  id SERIAL PRIMARY KEY, booking_id INTEGER NOT NULL REFERENCES bookings(id), flight_id INTEGER NOT NULL REFERENCES flights(id),
  seat_id INTEGER NOT NULL REFERENCES seats(id), passenger_name VARCHAR(100), email VARCHAR(100), phone VARCHAR(20),
  seat_class seat_class NOT NULL, price NUMERIC(12,2) NOT NULL, seat_status VARCHAR(20) DEFAULT 'HOLD', hold_expires_at TIMESTAMP,
  gender VARCHAR(10), date_of_birth DATE, document_type VARCHAR(20), document_number VARCHAR(50),
  baggage_weight INTEGER DEFAULT 0, baggage_price NUMERIC(12,2) DEFAULT 0, meal_type VARCHAR(100), meal_price NUMERIC(12,2) DEFAULT 0,
  insurance BOOLEAN DEFAULT false, insurance_price NUMERIC(12,2) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE payments (
  id SERIAL PRIMARY KEY, booking_id INTEGER NOT NULL REFERENCES bookings(id), method VARCHAR(50) NOT NULL,
  amount NUMERIC(12,2) NOT NULL, status payment_status DEFAULT 'PENDING', transaction_id VARCHAR(100),
  payment_date TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, paid_at TIMESTAMP
);
-- Retained for compatibility with account guards and legacy ticket history.
CREATE TABLE passengers (id SERIAL PRIMARY KEY, booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE, full_name VARCHAR(100) NOT NULL, passport VARCHAR(50), birthday DATE, gender VARCHAR(10));
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY, booking_id INTEGER NOT NULL REFERENCES bookings(id), flight_id INTEGER NOT NULL REFERENCES flights(id),
  passenger_id INTEGER NOT NULL REFERENCES passengers(id), seat_id INTEGER NOT NULL REFERENCES seats(id),
  ticket_number VARCHAR(50) UNIQUE NOT NULL, price NUMERIC(12,2) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE notifications (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), title VARCHAR(200), message TEXT, is_read BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE UNIQUE INDEX unique_active_flight_seat ON booking_details(flight_id,seat_id) WHERE seat_status IN ('HOLD','BOOKED');
CREATE INDEX idx_booking_user ON bookings(user_id);
CREATE INDEX idx_booking_details_hold ON booking_details(flight_id,seat_id,seat_status,hold_expires_at);
CREATE INDEX idx_ticket_booking ON tickets(booking_id);
