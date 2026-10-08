# Hướng dẫn chạy dự án

Hướng dẫn chạy chức năng đăng ký và đăng nhập trên máy local sau khi clone dự án.

## Yêu cầu

- Git
- Node.js 20.19+ hoặc 22.12+
- PostgreSQL

## 1. Clone dự án

## 2. thư viện cần cài cần 2 terminal

terminal 1

- npm install

## 3.Frontend React + Vite

terminal 2:

- npm install

## 4. Kết nối Backend với PostgreSQL

- npm install pg

## 4. lệnh database trong postgresql

Mở pgadmin4
tạo file sql : airline_booking
cấu trúc như sau:
PostgreSQL 18
│
├── Database
│ │
│ └── airline_booking ( file cần tạo )
│ │
│ ├── Schemas
│ ├── Tables
│ ├── Types (ENUM)
│ ├── Functions
│ └── Triggers
│
└── postgres

chuột phải vào airline_booking chọn Query Tool rồi chạy từng table 1

CREATE TYPE user_role AS ENUM
(
'CUSTOMER',
'STAFF',
'ADMIN'
);

---

## -- USERS

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

---

## -- PASSWORD RESET

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

chạy xong xong 2 terminal như sau:
terminal1:

- cd frontend
- npm run dev
  terminal2:
- cd backend
- node server.js

=> mở port: http://localhost:5173/
Chạy nội bộ: npm run dev -- --host 0.0.0.0
