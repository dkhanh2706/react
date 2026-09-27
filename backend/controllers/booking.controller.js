const pool = require("../config/database");

// =====================================
// TẠO BOOKING
// POST /api/bookings
// =====================================

exports.createBooking = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      user_id,

      flight_id,

      seat_id,

      seat_class,

      price,
    } = req.body;

    await client.query("BEGIN");

    // tạo mã booking

    const bookingCode = "BK" + Date.now();

    // tạo booking

    const bookingResult = await client.query(
      `
            INSERT INTO bookings
            (
                user_id,
                booking_code,
                total_price,
                status
            )

            VALUES

            ($1,$2,$3,'PENDING')

            RETURNING *
            `,

      [user_id, bookingCode, price],
    );

    const booking = bookingResult.rows[0];

    // tạo booking detail

    const detailResult = await client.query(
      `
            INSERT INTO booking_details
            (
                booking_id,
                flight_id,
                seat_id,
                seat_class,
                price
            )

            VALUES

            ($1,$2,$3,$4,$5)


            RETURNING *

            `,

      [booking.id, flight_id, seat_id, seat_class, price],
    );

    await client.query("COMMIT");

    res.json({
      message: "Tạo booking thành công",

      booking: booking,

      detail: detailResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.log(error);

    res.status(500).json({
      message: "Lỗi tạo booking",

      error: error.message,
    });
  } finally {
    client.release();
  }
};
