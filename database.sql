CREATE TYPE user_role AS ENUM
(
    'CUSTOMER',
    'STAFF',
    'ADMIN'
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