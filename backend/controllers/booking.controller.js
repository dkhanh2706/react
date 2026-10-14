const pool = require("../config/database");

const HOLD_MINUTES = 15;

// =====================================================
// GIÁ DỊCH VỤ - BACKEND TỰ QUYẾT ĐỊNH
// Không tin giá frontend gửi lên
// =====================================================

const BAGGAGE_PRICES = {
  0: 0,
  10: 150000,
  20: 250000,
  30: 350000,
};

const MEAL_PRICES = {
  NONE: 0,
  CHICKEN_RICE: 80000,
  BEEF_RICE: 100000,
  NOODLES: 70000,
};

const INSURANCE_PRICE = 50000;

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
// NHẢ HOLD KHÁC CỦA USER TRÊN CÙNG CHUYẾN
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
// HOLD GHẾ
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

    await cleanupExpiredHolds(client);

    // lock theo flight + seat
    await client.query(
      `
        SELECT pg_advisory_xact_lock(
          $1::int,
          $2::int
        )
      `,
      [flight_id, seat_id],
    );

    const seatRecordResult = await client.query(
      `
        SELECT
          bd.*,
          b.user_id,
          b.status AS booking_status,
          b.booking_code
        FROM booking_details bd
        LEFT JOIN bookings b
          ON b.id = bd.booking_id
        WHERE bd.flight_id = $1
          AND bd.seat_id = $2
        LIMIT 1
        FOR UPDATE OF bd
      `,
      [flight_id, seat_id],
    );

    const existingSeat =
      seatRecordResult.rows.length > 0 ? seatRecordResult.rows[0] : null;

    // đã booked
    if (existingSeat && existingSeat.seat_status === "BOOKED") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "Ghế này đã có người đặt",
      });
    }

    // đang hold
    if (
      existingSeat &&
      existingSeat.seat_status === "HOLD" &&
      existingSeat.hold_expires_at &&
      new Date(existingSeat.hold_expires_at) > new Date()
    ) {
      // chính user đang giữ
      if (Number(existingSeat.user_id) === Number(userId)) {
        await client.query("COMMIT");

        return res.status(200).json({
          message: "Bạn đang giữ ghế này",
          booking_id: existingSeat.booking_id,
          detail: existingSeat,
          hold_expires_at: existingSeat.hold_expires_at,
        });
      }

      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "Ghế đang được người khác giữ",
        hold_expires_at: existingSeat.hold_expires_at,
      });
    }

    await releaseOtherHolds(client, userId, flight_id, seat_id);

    // booking tạm
    const bookingCode = `TMP${Date.now()}_${userId}_${flight_id}_${seat_id}`;

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

    let detail;

    // record seat cũ tồn tại thì reuse
    if (existingSeat) {
      const updateResult = await client.query(
        `
          UPDATE booking_details
          SET
            booking_id = $1,
            seat_class = $2,
            price = 0,
            seat_status = 'HOLD',
            hold_expires_at =
              NOW() + ($3 * INTERVAL '1 minute')
          WHERE id = $4
          RETURNING *
        `,
        [booking.id, seat_class, HOLD_MINUTES, existingSeat.id],
      );

      detail = updateResult.rows[0];
    } else {
      const insertResult = await client.query(
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

      detail = insertResult.rows[0];
    }

    await client.query("COMMIT");

    return res.status(200).json({
      message: `Giữ ghế thành công trong ${HOLD_MINUTES} phút`,
      booking_id: booking.id,
      detail,
      hold_expires_at: detail.hold_expires_at,
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("ROLLBACK holdSeat error:", rollbackError);
    }

    console.error("holdSeat error:", error);

    if (error.code === "23505" && error.constraint === "unique_flight_seat") {
      return res.status(409).json({
        message: "Ghế vừa được người khác chọn. Vui lòng chọn ghế khác.",
      });
    }

    return res.status(500).json({
      message: error.message,
      code: error.code || null,
    });
  } finally {
    client.release();
  }
};

// =====================================================
// CREATE BOOKING THẬT
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

      flight_date,
      departure_place,
      arrival_place,
      departure_time,
      arrival_time,
      airline,
      flight_number,
      seat_number,

      passenger,
      services,
    } = req.body;

    // =================================================
    // VALIDATE USER
    // =================================================

    if (!userId) {
      return res.status(401).json({
        message: "Không xác định được tài khoản đăng nhập",
      });
    }

    // =================================================
    // VALIDATE BASIC
    // =================================================

    if (!flight_id || !seat_id || !seat_class) {
      return res.status(400).json({
        message: "Thiếu thông tin booking",
      });
    }

    if (!passenger) {
      return res.status(400).json({
        message: "Thiếu thông tin hành khách",
      });
    }

    // =================================================
    // NORMALIZE PASSENGER
    // =================================================

    const passengerName = String(passenger.full_name || "").trim();

    const passengerGender = String(passenger.gender || "")
      .trim()
      .toUpperCase();

    const passengerBirthDate = passenger.date_of_birth || null;

    const documentType = String(passenger.document_type || "")
      .trim()
      .toUpperCase();

    const documentNumber = String(passenger.document_number || "").trim();

    const passengerPhone = String(passenger.phone || "").trim();

    const passengerEmail = String(passenger.email || "")
      .trim()
      .toLowerCase();

    if (!passengerName) {
      return res.status(400).json({
        message: "Vui lòng nhập họ tên hành khách",
      });
    }

    if (!["MALE", "FEMALE", "OTHER"].includes(passengerGender)) {
      return res.status(400).json({
        message: "Giới tính không hợp lệ",
      });
    }

    if (!passengerBirthDate) {
      return res.status(400).json({
        message: "Ngày sinh không hợp lệ",
      });
    }

    if (!["CCCD", "PASSPORT"].includes(documentType)) {
      return res.status(400).json({
        message: "Loại giấy tờ không hợp lệ",
      });
    }

    if (!documentNumber) {
      return res.status(400).json({
        message: "Thiếu số giấy tờ",
      });
    }

    if (!passengerPhone) {
      return res.status(400).json({
        message: "Thiếu số điện thoại",
      });
    }

    if (!passengerEmail) {
      return res.status(400).json({
        message: "Thiếu email",
      });
    }

    // =================================================
    // SERVICES - BACKEND TỰ TÍNH GIÁ
    // =================================================

    const baggageWeight = Number(services?.baggage_weight || 0);

    if (!Object.prototype.hasOwnProperty.call(BAGGAGE_PRICES, baggageWeight)) {
      return res.status(400).json({
        message: "Mức hành lý không hợp lệ",
      });
    }

    const baggagePrice = BAGGAGE_PRICES[baggageWeight];

    const mealType = String(services?.meal_type || "NONE")
      .trim()
      .toUpperCase();

    if (!Object.prototype.hasOwnProperty.call(MEAL_PRICES, mealType)) {
      return res.status(400).json({
        message: "Suất ăn không hợp lệ",
      });
    }

    const mealPrice = MEAL_PRICES[mealType];

    const insurance =
      services?.insurance === true || services?.insurance === "true";

    const insurancePrice = insurance ? INSURANCE_PRICE : 0;

    // =================================================
    // BEGIN
    // =================================================

    await client.query("BEGIN");

    await cleanupExpiredHolds(client);

    // lock ghế
    await client.query(
      `
        SELECT pg_advisory_xact_lock(
          $1::int,
          $2::int
        )
      `,
      [flight_id, seat_id],
    );

    // =================================================
    // LẤY GIÁ FLIGHT TỪ DB
    // =================================================

    const flightResult = await client.query(
      `
        SELECT
          id,
          price
        FROM flights
        WHERE id = $1
        LIMIT 1
      `,
      [flight_id],
    );

    if (flightResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Không tìm thấy chuyến bay",
      });
    }

    const basePrice = Number(flightResult.rows[0].price || 0);

    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Giá chuyến bay không hợp lệ",
      });
    }

    // =================================================
    // SEAT CLASS PRICE
    // =================================================

    const normalizedSeatClass = String(seat_class).trim().toUpperCase();

    let seatFare = basePrice;

    if (normalizedSeatClass === "BUSINESS") {
      seatFare = basePrice * 1.5;
    }

    const seatSurcharge = seatFare - basePrice;

    // =================================================
    // TOTAL
    // =================================================

    const totalPrice = seatFare + baggagePrice + mealPrice + insurancePrice;

    // =================================================
    // CHECK BOOKED
    // =================================================

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

    // =================================================
    // TÌM HOLD CỦA USER
    // =================================================

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

    // =================================================
    // BOOKING CODE THẬT
    // =================================================

    const bookingCode = `BK${Date.now()}_${userId}`;

    // =================================================
    // UPDATE BOOKING
    // =================================================

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
          seat_number_snapshot = $10,

          updated_at = NOW()

        WHERE id = $11

        RETURNING *
      `,
      [
        bookingCode,
        totalPrice,

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

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Không tìm thấy booking tạm",
      });
    }

    const booking = bookingResult.rows[0];

    // =================================================
    // UPDATE BOOKING DETAIL
    // =================================================

    const detailResult = await client.query(
      `
        UPDATE booking_details
        SET
          seat_class = $1,
          price = $2,

          passenger_name = $3,
          email = $4,
          phone = $5,

          gender = $6,
          date_of_birth = $7,
          document_type = $8,
          document_number = $9,

          baggage_weight = $10,
          baggage_price = $11,

          meal_type = $12,
          meal_price = $13,

          insurance = $14,
          insurance_price = $15

        WHERE id = $16

        RETURNING *
      `,
      [
        normalizedSeatClass,
        totalPrice,

        passengerName,
        passengerEmail,
        passengerPhone,

        passengerGender,
        passengerBirthDate,
        documentType,
        documentNumber,

        baggageWeight,
        baggagePrice,

        mealType,
        mealPrice,

        insurance,
        insurancePrice,

        hold.id,
      ],
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message:
        "Tạo booking thành công. Ghế vẫn được giữ cho tới khi xác nhận thanh toán.",

      booking,

      detail: detailResult.rows[0],

      passenger: {
        full_name: passengerName,
        gender: passengerGender,
        date_of_birth: passengerBirthDate,
        document_type: documentType,
        document_number: documentNumber,
        phone: passengerPhone,
        email: passengerEmail,
      },

      services: {
        baggage_weight: baggageWeight,
        baggage_price: baggagePrice,
        meal_type: mealType,
        meal_price: mealPrice,
        insurance,
        insurance_price: insurancePrice,
      },

      pricing: {
        base_price: basePrice,
        seat_surcharge: seatSurcharge,
        seat_fare: seatFare,
        baggage_price: baggagePrice,
        meal_price: mealPrice,
        insurance_price: insurancePrice,
        total_price: totalPrice,
      },

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
      code: error.code || null,
    });
  } finally {
    client.release();
  }
};

// =====================================================
// THANH TOÁN GIẢ LẬP
// POST /api/bookings/:bookingId/pay
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

    if (booking.status === "CONFIRMED") {
      await client.query("COMMIT");

      return res.json({
        message: "Đơn đặt vé đã hoàn thành trước đó",
        booking,
      });
    }

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

    const confirmedBookingResult = await client.query(
      `
        UPDATE bookings
        SET
          status = 'CONFIRMED',
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [bookingId],
    );

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

    return res.status(200).json({
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
      code: error.code || null,
    });
  } finally {
    client.release();
  }
};

// =====================================================
// MY TICKETS
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

          bd.passenger_name,
          bd.email,
          bd.phone,
          bd.gender,
          bd.date_of_birth,
          bd.document_type,
          bd.document_number,

          bd.baggage_weight,
          bd.baggage_price,

          bd.meal_type,
          bd.meal_price,

          bd.insurance,
          bd.insurance_price,

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

    return res.status(200).json({
      message: "Lấy danh sách vé thành công",
      data: result.rows,
    });
  } catch (error) {
    console.error("getMyTickets error:", error);

    return res.status(500).json({
      message: error.message,
      code: error.code || null,
    });
  }
};
