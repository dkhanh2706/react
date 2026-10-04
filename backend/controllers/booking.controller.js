const pool = require("../config/database");

const HOLD_MINUTES = 15;

// =====================================
// DỌN HOLD ĐÃ HẾT HẠN
// =====================================
async function cleanupExpiredHolds(client) {
  await client.query(`
    UPDATE booking_details
    SET
      seat_status = 'EXPIRED',
      hold_expires_at = NULL
    WHERE seat_status = 'HOLD'
      AND hold_expires_at IS NOT NULL
      AND hold_expires_at <= NOW()
  `);
}

// =====================================
// NHẢ GHẾ CŨ KHI USER ĐỔI GHẾ
// =====================================
async function releaseOtherHolds(client, userId, flightId, seatId) {
  await client.query(
    `
      UPDATE booking_details bd
      SET
        seat_status = 'EXPIRED',
        hold_expires_at = NULL
      FROM bookings b
      WHERE bd.booking_id = b.id
        AND b.user_id = $1
        AND bd.flight_id = $2
        AND bd.seat_id <> $3
        AND bd.seat_status = 'HOLD'
        AND bd.hold_expires_at > NOW()
    `,
    [userId, flightId, seatId],
  );
}

// =====================================
// TẠO BOOKING TRƯỚC KHI THANH TOÁN
// POST /api/bookings
//
// CHƯA BOOKED Ở ĐÂY.
// Ghế vẫn HOLD cho tới khi thanh toán thành công.
// =====================================
exports.createBooking = async (req, res) => {
  const client = await pool.connect();

  try {
    const { user_id, flight_id, seat_id, seat_class, price } = req.body;

    if (!user_id || !flight_id || !seat_id || !seat_class || price == null) {
      return res.status(400).json({
        message: "Thiếu thông tin booking",
      });
    }

    await client.query("BEGIN");

    // Dọn HOLD hết hạn
    await cleanupExpiredHolds(client);

    // =====================================
    // KHÓA LOGIC GHẾ
    // 2 máy cùng chọn 1 ghế sẽ phải chờ nhau
    // =====================================
    await client.query(
      `
      SELECT pg_advisory_xact_lock(
        $1::int,
        $2::int
      )
      `,
      [flight_id, seat_id],
    );

    // =====================================
    // KIỂM TRA GHẾ ĐÃ BOOKED CHƯA
    // =====================================
    const bookedSeat = await client.query(
      `
        SELECT bd.id
        FROM booking_details bd
        WHERE bd.flight_id = $1
          AND bd.seat_id = $2
          AND bd.seat_status = 'BOOKED'
        LIMIT 1
      `,
      [flight_id, seat_id],
    );

    if (bookedSeat.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "Ghế này đã có người đặt",
      });
    }

    // =====================================
    // KIỂM TRA HOLD CÓ PHẢI CỦA USER NÀY KHÔNG
    // =====================================
    const holdResult = await client.query(
      `
        SELECT
          bd.*,
          b.user_id,
          b.booking_code,
          b.status AS booking_status
        FROM booking_details bd

        JOIN bookings b
          ON b.id = bd.booking_id

        WHERE bd.flight_id = $1
          AND bd.seat_id = $2

          AND bd.seat_status = 'HOLD'

          AND bd.hold_expires_at > NOW()

          AND b.user_id = $3

          AND b.status = 'PENDING'

        ORDER BY bd.id DESC

        LIMIT 1

        FOR UPDATE OF bd, b
      `,
      [flight_id, seat_id, user_id],
    );

    if (holdResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message:
          "Thời gian giữ ghế đã hết hoặc ghế không thuộc lượt giữ của bạn",
      });
    }

    const hold = holdResult.rows[0];

    // =====================================
    // KHÔNG TẠO BOOKING MỚI
    //
    // Dùng chính booking TMP đã tạo lúc HOLD
    // =====================================
    const bookingCode = "BK" + Date.now();

    const bookingResult = await client.query(
      `
        UPDATE bookings

        SET
          booking_code =
            CASE
              WHEN booking_code LIKE 'TMP%'
              THEN $1

              ELSE booking_code
            END,

          total_price = $2,

          status = 'PENDING'

        WHERE id = $3

        RETURNING *
      `,
      [bookingCode, price, hold.booking_id],
    );

    const booking = bookingResult.rows[0];

    // =====================================
    // CẬP NHẬT GIÁ
    //
    // NHƯNG VẪN GIỮ HOLD
    // KHÔNG BOOKED Ở ĐÂY
    // =====================================
    const detailResult = await client.query(
      `
          UPDATE booking_details

          SET
            seat_class = $1,
            price = $2

          WHERE id = $3

          RETURNING *
        `,
      [seat_class, price, hold.id],
    );

    await client.query("COMMIT");

    return res.json({
      message:
        "Tạo booking thành công. Ghế vẫn được giữ đến khi thanh toán hoặc hết thời gian.",

      booking,

      detail: detailResult.rows[0],

      hold_expires_at: hold.hold_expires_at,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("createBooking error:", error);

    return res.status(500).json({
      message: error.message,
    });
  } finally {
    client.release();
  }
};

// =====================================
// GIỮ GHẾ 15 PHÚT
// POST /api/bookings/hold-seat
// =====================================
exports.holdSeat = async (req, res) => {
  const client = await pool.connect();

  try {
    const { user_id, flight_id, seat_id, seat_class } = req.body;

    if (!user_id || !flight_id || !seat_id || !seat_class) {
      return res.status(400).json({
        message: "Thiếu thông tin giữ ghế",
      });
    }

    await client.query("BEGIN");

    // =====================================
    // 1. DỌN HOLD ĐÃ HẾT HẠN
    // =====================================
    await cleanupExpiredHolds(client);

    // =====================================
    // 2. KHÓA GHẾ
    //
    // Acc 1 và Acc 2 cùng bấm một lúc
    // chỉ một request được xử lý trước
    // =====================================
    await client.query(
      `
      SELECT pg_advisory_xact_lock(
        $1::int,
        $2::int
      )
      `,
      [flight_id, seat_id],
    );

    // =====================================
    // 3. KIỂM TRA TRẠNG THÁI GHẾ
    // =====================================
    const check = await client.query(
      `
          SELECT
            bd.*,
            b.user_id

          FROM booking_details bd

          JOIN bookings b
            ON b.id = bd.booking_id

          WHERE bd.flight_id = $1

            AND bd.seat_id = $2

            AND (
              bd.seat_status = 'BOOKED'

              OR (

                bd.seat_status = 'HOLD'

                AND bd.hold_expires_at > NOW()
              )
            )

          ORDER BY bd.id DESC

          LIMIT 1
        `,
      [flight_id, seat_id],
    );

    // =====================================
    // GHẾ ĐANG BẬN
    // =====================================
    if (check.rows.length > 0) {
      const currentSeat = check.rows[0];

      // =====================================
      // ĐÃ BOOKED
      // =====================================
      if (currentSeat.seat_status === "BOOKED") {
        await client.query("ROLLBACK");

        return res.status(409).json({
          message: "Ghế này đã có người đặt",
        });
      }

      // =====================================
      // CHÍNH USER NÀY ĐANG HOLD
      //
      // Không tạo HOLD trùng
      // =====================================
      if (Number(currentSeat.user_id) === Number(user_id)) {
        await client.query("COMMIT");

        return res.json({
          message: "Bạn đang giữ ghế này",

          booking_id: currentSeat.booking_id,

          detail: currentSeat,

          hold_expires_at: currentSeat.hold_expires_at,
        });
      }

      // =====================================
      // USER KHÁC ĐANG HOLD
      // =====================================
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "Ghế đang được người khác giữ",

        hold_expires_at: currentSeat.hold_expires_at,
      });
    }

    // =====================================
    // 4. USER ĐỔI GHẾ
    //
    // Thả ghế trước đó trên cùng chuyến
    // =====================================
    await releaseOtherHolds(client, user_id, flight_id, seat_id);

    // =====================================
    // 5. TẠO BOOKING TẠM
    // =====================================
    const bookingCode = `TMP${Date.now()}_${user_id}_${seat_id}`;

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
            0,
            'PENDING'
          )

          RETURNING *
        `,
      [user_id, bookingCode],
    );

    const booking = bookingResult.rows[0];

    // =====================================
    // 6. HOLD GHẾ 15 PHÚT
    // =====================================
    const detailResult = await client.query(
      `
          INSERT INTO booking_details
          (
            booking_id,
            flight_id,
            seat_id,
            seat_class,
            price,
            seat_status,
            hold_expires_at
          )

          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            0,
            'HOLD',

            NOW() +
            ($5 * INTERVAL '1 minute')
          )

          RETURNING *
        `,
      [booking.id, flight_id, seat_id, seat_class, HOLD_MINUTES],
    );

    await client.query("COMMIT");

    return res.json({
      message: `Giữ ghế thành công trong ${HOLD_MINUTES} phút`,

      booking_id: booking.id,

      detail: detailResult.rows[0],

      hold_expires_at: detailResult.rows[0].hold_expires_at,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("holdSeat error:", error);

    return res.status(500).json({
      message: error.message,
    });
  } finally {
    client.release();
  }
};
