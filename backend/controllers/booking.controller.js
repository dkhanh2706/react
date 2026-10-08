const pool = require("../config/database");

const HOLD_MINUTES = 15;

// =====================================================
// LẤY USER ID TỪ JWT
// =====================================================

function getUserId(req) {
  return req.user?.id || req.user?.user_id || req.user?.userId || null;
}

// =====================================================
// DỌN HOLD HẾT HẠN
// =====================================================

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

// =====================================================
// NHẢ HOLD CŨ KHI USER ĐỔI GHẾ
// =====================================================

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

// =====================================================
// GIỮ GHẾ
// POST /api/bookings/hold-seat
// =====================================================

exports.holdSeat = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = getUserId(req);

    const { flight_id, seat_id, seat_class } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Không xác định được tài khoản đăng nhập",
      });
    }

    if (!flight_id || !seat_id || !seat_class) {
      return res.status(400).json({
        message: "Thiếu thông tin giữ ghế",
      });
    }

    await client.query("BEGIN");

    // Dọn hold hết hạn
    await cleanupExpiredHolds(client);

    // Khóa logic ghế
    await client.query(
      `
        SELECT pg_advisory_xact_lock(
          $1::int,
          $2::int
        )
      `,
      [flight_id, seat_id],
    );

    // Kiểm tra ghế
    const checkResult = await client.query(
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

    if (checkResult.rows.length > 0) {
      const currentSeat = checkResult.rows[0];

      if (currentSeat.seat_status === "BOOKED") {
        await client.query("ROLLBACK");

        return res.status(409).json({
          message: "Ghế này đã có người đặt",
        });
      }

      if (Number(currentSeat.user_id) === Number(userId)) {
        await client.query("COMMIT");

        return res.json({
          message: "Bạn đang giữ ghế này",
          booking_id: currentSeat.booking_id,
          detail: currentSeat,
          hold_expires_at: currentSeat.hold_expires_at,
        });
      }

      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "Ghế đang được người khác giữ",
        hold_expires_at: currentSeat.hold_expires_at,
      });
    }

    // Nhả ghế cũ nếu user đổi ghế
    await releaseOtherHolds(client, userId, flight_id, seat_id);

    // Tạo booking tạm
    const bookingCode = `TMP${Date.now()}_${userId}_${seat_id}`;

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
      [userId, bookingCode],
    );

    const booking = bookingResult.rows[0];

    // Tạo detail HOLD
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
          NOW() + ($5 * INTERVAL '1 minute')
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
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("ROLLBACK holdSeat error:", rollbackError);
    }

    console.error("holdSeat error:", error);

    return res.status(500).json({
      message: error.message,
    });
  } finally {
    client.release();
  }
};

// =====================================================
// TẠO BOOKING TỪ HOLD
// POST /api/bookings
// =====================================================

exports.createBooking = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = getUserId(req);

    const {
      flight_id,
      seat_id,
      seat_class,
      price,

      flight_date,
      departure_place,
      arrival_place,
      departure_time,
      arrival_time,
      airline,
      flight_number,
      seat_number,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Không xác định được tài khoản đăng nhập",
      });
    }

    if (!flight_id || !seat_id || !seat_class || price == null) {
      return res.status(400).json({
        message: "Thiếu thông tin booking",
      });
    }

    await client.query("BEGIN");

    await cleanupExpiredHolds(client);

    await client.query(
      `
        SELECT pg_advisory_xact_lock(
          $1::int,
          $2::int
        )
      `,
      [flight_id, seat_id],
    );

    // Kiểm tra ghế đã BOOKED
    const bookedResult = await client.query(
      `
        SELECT id
        FROM booking_details
        WHERE flight_id = $1
          AND seat_id = $2
          AND seat_status = 'BOOKED'
        LIMIT 1
      `,
      [flight_id, seat_id],
    );

    if (bookedResult.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "Ghế này đã có người đặt",
      });
    }

    // Tìm HOLD của user
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
      [flight_id, seat_id, userId],
    );

    if (holdResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message:
          "Thời gian giữ ghế đã hết hoặc ghế không thuộc lượt giữ của bạn",
      });
    }

    const hold = holdResult.rows[0];

    const bookingCode = "BK" + Date.now();

    // Update booking tạm
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
          status = 'PENDING',

          flight_date = $3,
          departure_place = $4,
          arrival_place = $5,
          departure_time_text = $6,
          arrival_time_text = $7,
          airline_name = $8,
          flight_number_snapshot = $9,
          seat_number_snapshot = $10

        WHERE id = $11

        RETURNING *
      `,
      [
        bookingCode,
        price,
        flight_date || null,
        departure_place || null,
        arrival_place || null,
        departure_time || null,
        arrival_time || null,
        airline || null,
        flight_number || null,
        seat_number || null,
        hold.booking_id,
      ],
    );

    const booking = bookingResult.rows[0];

    // Update booking detail
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
        "Tạo booking thành công. Ghế vẫn được giữ cho tới khi xác nhận thanh toán.",
      booking,
      detail: detailResult.rows[0],
      hold_expires_at: hold.hold_expires_at,
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("ROLLBACK createBooking error:", rollbackError);
    }

    console.error("createBooking error:", error);

    return res.status(500).json({
      message: error.message,
    });
  } finally {
    client.release();
  }
};

// =====================================================
// XÁC NHẬN THANH TOÁN GIẢ LẬP
// POST /api/bookings/:bookingId/pay
//
// BẤM NÚT => HOÀN THÀNH ĐƠN
// =====================================================

exports.confirmPayment = async (req, res) => {
  const client = await pool.connect();

  try {
    const bookingId = Number(req.params.bookingId);

    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Không xác định được tài khoản đăng nhập",
      });
    }

    if (!bookingId) {
      return res.status(400).json({
        message: "Booking không hợp lệ",
      });
    }

    await client.query("BEGIN");

    // =================================================
    // LẤY BOOKING
    // =================================================

    const bookingResult = await client.query(
      `
        SELECT *
        FROM bookings
        WHERE id = $1
          AND user_id = $2
        FOR UPDATE
      `,
      [bookingId, userId],
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Không tìm thấy booking",
      });
    }

    const booking = bookingResult.rows[0];

    // =================================================
    // NẾU ĐÃ CONFIRMED
    // =================================================

    if (booking.status === "CONFIRMED") {
      await client.query("COMMIT");

      return res.json({
        message: "Đơn đặt vé đã hoàn thành trước đó",
        booking,
      });
    }

    // =================================================
    // LẤY CHI TIẾT GHẾ
    // =================================================

    const detailResult = await client.query(
      `
        SELECT *
        FROM booking_details
        WHERE booking_id = $1
        ORDER BY id DESC
        LIMIT 1
        FOR UPDATE
      `,
      [bookingId],
    );

    if (detailResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Không tìm thấy thông tin ghế",
      });
    }

    const detail = detailResult.rows[0];

    // =================================================
    // HOLD HẾT HẠN
    // =================================================

    if (
      detail.seat_status === "HOLD" &&
      detail.hold_expires_at &&
      new Date(detail.hold_expires_at) <= new Date()
    ) {
      await client.query(
        `
          UPDATE booking_details
          SET
            seat_status = 'EXPIRED',
            hold_expires_at = NULL
          WHERE id = $1
        `,
        [detail.id],
      );

      await client.query("COMMIT");

      return res.status(409).json({
        message: "Thời gian giữ ghế đã hết",
      });
    }

    if (detail.seat_status !== "HOLD" && detail.seat_status !== "BOOKED") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "Ghế hiện không còn được giữ",
      });
    }

    // =================================================
    // UPDATE BOOKING -> CONFIRMED
    // =================================================

    const confirmedBookingResult = await client.query(
      `
        UPDATE bookings
        SET status = 'CONFIRMED'
        WHERE id = $1
        RETURNING *
      `,
      [bookingId],
    );

    // =================================================
    // UPDATE GHẾ -> BOOKED
    // =================================================

    await client.query(
      `
        UPDATE booking_details
        SET
          seat_status = 'BOOKED',
          hold_expires_at = NULL
        WHERE booking_id = $1
      `,
      [bookingId],
    );

    // =================================================
    // KIỂM TRA PAYMENT CŨ
    // =================================================

    const oldPaymentResult = await client.query(
      `
        SELECT *
        FROM payments
        WHERE booking_id = $1
        ORDER BY id DESC
        LIMIT 1
      `,
      [bookingId],
    );

    let payment;

    // =================================================
    // CÓ PAYMENT -> UPDATE
    // =================================================

    if (oldPaymentResult.rows.length > 0) {
      const paymentResult = await client.query(
        `
          UPDATE payments
          SET
            method = 'MOCK',
            amount = $1,
            status = 'SUCCESS',
            paid_at = NOW()
          WHERE id = $2
          RETURNING *
        `,
        [booking.total_price, oldPaymentResult.rows[0].id],
      );

      payment = paymentResult.rows[0];
    } else {
      // =================================================
      // CHƯA CÓ -> INSERT PAYMENT GIẢ LẬP
      // =================================================

      const paymentResult = await client.query(
        `
          INSERT INTO payments
          (
            booking_id,
            method,
            amount,
            status,
            paid_at
          )
          VALUES
          (
            $1,
            'MOCK',
            $2,
            'SUCCESS',
            NOW()
          )
          RETURNING *
        `,
        [bookingId, booking.total_price],
      );

      payment = paymentResult.rows[0];
    }

    await client.query("COMMIT");

    return res.json({
      message: "Đặt vé thành công",
      booking: confirmedBookingResult.rows[0],
      payment,
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("ROLLBACK confirmPayment error:", rollbackError);
    }

    console.error("confirmPayment error:", error);

    return res.status(500).json({
      message: error.message,
    });
  } finally {
    client.release();
  }
};

// =====================================================
// LẤY DANH SÁCH VÉ ĐÃ MUA
// GET /api/bookings/my-tickets
// =====================================================

exports.getMyTickets = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Không xác định được tài khoản đăng nhập",
      });
    }

    const result = await pool.query(
      `
        SELECT

          b.id,
          b.booking_code,
          b.total_price,
          b.status,
          b.created_at,

          b.flight_date,
          b.departure_place,
          b.arrival_place,
          b.departure_time_text,
          b.arrival_time_text,
          b.airline_name,
          b.flight_number_snapshot,
          b.seat_number_snapshot,

          bd.id AS booking_detail_id,
          bd.flight_id,
          bd.seat_id,
          bd.seat_class,
          bd.price,
          bd.seat_status,

          p.status AS payment_status,
          p.method AS payment_method,
          p.amount AS payment_amount,
          p.paid_at

        FROM bookings b

        JOIN booking_details bd
          ON bd.booking_id = b.id

        LEFT JOIN LATERAL
        (
          SELECT
            status,
            method,
            amount,
            paid_at

          FROM payments

          WHERE booking_id = b.id

          ORDER BY id DESC

          LIMIT 1
        ) p
        ON TRUE

        WHERE b.user_id = $1
          AND b.status = 'CONFIRMED'
          AND bd.seat_status = 'BOOKED'

        ORDER BY
          COALESCE(
            p.paid_at,
            b.created_at
          ) DESC
      `,
      [userId],
    );

    return res.json({
      message: "Lấy danh sách vé thành công",
      data: result.rows,
    });
  } catch (error) {
    console.error("getMyTickets error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};
