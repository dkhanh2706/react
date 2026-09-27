const pool = require("../config/database");

// =====================================
// TẠO BOOKING + CHỐT GHẾ BOOKED
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

    // kiểm tra ghế

    const checkSeat = await client.query(
      `
            SELECT *
            FROM booking_details
            WHERE flight_id=$1
            AND seat_id=$2
            AND seat_status='BOOKED'
            `,

      [flight_id, seat_id],
    );

    if (checkSeat.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Ghế này đã có người đặt",
      });
    }

    // tạo booking

    const bookingCode = "BK" + Date.now();

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

            (

                $1,

                $2,

                $3,

                'PENDING'

            )


            RETURNING *

            `,

      [user_id, bookingCode, price],
    );

    const booking = bookingResult.rows[0];

    // đổi HOLD thành BOOKED

    const updateDetail = await client.query(
      `
            UPDATE booking_details

            SET

                booking_id=$1,

                price=$2,

                seat_status='BOOKED'


            WHERE

                flight_id=$3

            AND

                seat_id=$4


            RETURNING *

            `,

      [booking.id, price, flight_id, seat_id],
    );

    // nếu chưa HOLD thì tạo mới

    if (updateDetail.rows.length === 0) {
      await client.query(
        `

                INSERT INTO booking_details

                (

                    booking_id,

                    flight_id,

                    seat_id,

                    seat_class,

                    price,

                    seat_status

                )


                VALUES

                (

                    $1,

                    $2,

                    $3,

                    $4,

                    $5,

                    'BOOKED'

                )

                `,

        [booking.id, flight_id, seat_id, seat_class, price],
      );
    }

    await client.query("COMMIT");

    res.json({
      message: "Đặt vé thành công",

      booking,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  } finally {
    client.release();
  }
};

// =====================================
// GIỮ GHẾ
// POST /api/bookings/hold-seat
// =====================================

exports.holdSeat = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      flight_id,

      seat_id,

      seat_class,
    } = req.body;

    await client.query("BEGIN");

    // kiểm tra ghế đã HOLD hoặc BOOKED chưa

    const check = await client.query(
      `

            SELECT *

            FROM booking_details

            WHERE flight_id=$1

            AND seat_id=$2

            AND seat_status IN ('HOLD','BOOKED')


            `,

      [flight_id, seat_id],
    );

    if (check.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Ghế này đã có người chọn",
      });
    }

    // tạo booking tạm

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

            (

                1,

                $1,

                0,

                'PENDING'

            )


            RETURNING *

            `,

      ["TMP" + Date.now()],
    );

    const booking = bookingResult.rows[0];

    // lưu ghế HOLD

    const detail = await client.query(
      `

            INSERT INTO booking_details

            (

                booking_id,

                flight_id,

                seat_id,

                seat_class,

                price,

                seat_status

            )


            VALUES

            (

                $1,

                $2,

                $3,

                $4,

                0,

                'HOLD'

            )


            RETURNING *

            `,

      [booking.id, flight_id, seat_id, seat_class],
    );

    await client.query("COMMIT");

    res.json({
      message: "Giữ ghế thành công",

      booking_id: booking.id,

      detail: detail.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  } finally {
    client.release();
  }
};
