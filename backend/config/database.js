const { Pool, types } = require("pg");
require("dotenv").config();

// Existing TIMESTAMP WITHOUT TIME ZONE values represent Vietnam local time.
types.setTypeParser(1114, (value) => `${value.replace(" ", "T")}+07:00`);
types.setTypeParser(1082, (value) => value);

const pool = new Pool({
  host: process.env.DB_HOST,

  port: process.env.DB_PORT,

  database: process.env.DB_NAME,

  user: process.env.DB_USER,

  password: process.env.DB_PASSWORD,
  options: "-c timezone=Asia/Ho_Chi_Minh",
});

module.exports = pool;
