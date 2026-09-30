const pool = require("../config/database");

// ===============================
// GET ALL FLIGHTS
// ===============================

exports.getAllFlights = async () => {
  const result = await pool.query(
    `
        SELECT 
            f.id,
            f.flight_number,

            f.airline_id,
            a.name AS airline,

            f.airplane_id,

            f.departure_airport_id,
            da.code AS departure_airport,

            f.arrival_airport_id,
            aa.code AS arrival_airport,

            f.departure_time,
            f.arrival_time,

            f.status,
            f.price

        FROM flights f


        JOIN airlines a
        ON f.airline_id = a.id


        JOIN airports da
        ON f.departure_airport_id = da.id


        JOIN airports aa
        ON f.arrival_airport_id = aa.id


        ORDER BY f.id DESC
        `,
  );

  return result.rows;
};

// ===============================
// CREATE FLIGHT
// ===============================

exports.createFlight = async (data) => {
  const {
    flight_number,

    airline_id,

    airplane_id,

    departure_airport_id,

    arrival_airport_id,

    departure_time,

    arrival_time,

    price,

    status,
  } = data;

  const result = await pool.query(
    `
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
            $1,$2,$3,
            $4,$5,
            $6,$7,
            $8,$9
        )


        RETURNING *

        `,

    [
      flight_number,

      airline_id,

      airplane_id,

      departure_airport_id,

      arrival_airport_id,

      departure_time,

      arrival_time,

      price,

      status || "AVAILABLE",
    ],
  );

  return result.rows[0];
};

// ===============================
// UPDATE FLIGHT
// ===============================

exports.updateFlight = async (id, data) => {
  const {
    flight_number,

    airline_id,

    airplane_id,

    departure_airport_id,

    arrival_airport_id,

    departure_time,

    arrival_time,

    price,

    status,
  } = data;

  const result = await pool.query(
    `
        UPDATE flights

        SET

            flight_number=$1,

            airline_id=$2,

            airplane_id=$3,

            departure_airport_id=$4,

            arrival_airport_id=$5,

            departure_time=$6,

            arrival_time=$7,

            price=$8,

            status=$9


        WHERE id=$10


        RETURNING *

        `,

    [
      flight_number,

      airline_id,

      airplane_id,

      departure_airport_id,

      arrival_airport_id,

      departure_time,

      arrival_time,

      price,

      status,

      id,
    ],
  );

  return result.rows[0];
};

// ===============================
// DELETE FLIGHT
// ===============================

exports.deleteFlight = async (id) => {
  await pool.query(
    `
        DELETE FROM flights

        WHERE id=$1
        `,

    [id],
  );

  return true;
};
