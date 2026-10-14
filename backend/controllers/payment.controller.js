const pool = require("../config/database");

const {
  createMomoPayment,
  verifyMomoIpnSignature,
  decodeExtraData,
} = require("../services/momo.service");

const { sendPaymentSuccessEmail } = require("../services/email.service");

// =====================================================
// USER ID
// =====================================================

function getUserId(req) {
  return req.user?.id || req.user?.user_id || req.user?.userId || null;
}

// =====================================================
// LOAD DATA CHO EMAIL BILL
// =====================================================

async function getPaymentEmailData(bookingId) {
  const result = await pool.query(
    `
        SELECT
          b.id AS booking_id,
          b.booking_code,
          b.total_price,
          b.status AS booking_status,
          b.created_at,

          b.flight_date,
          b.departure_place,
          b.arrival_place,
          b.departure_time_text,
          b.arrival_time_text,
          b.airline_name,
          b.flight_number_snapshot,
          b.seat_number_snapshot,

          u.full_name AS account_name,
          u.email AS account_email,

          bd.passenger_name,
          bd.email AS passenger_email,
          bd.phone AS passenger_phone,

          bd.gender,
          bd.date_of_birth,
          bd.document_type,
          bd.document_number,

          bd.seat_class,
          bd.price AS seat_fare,

          bd.baggage_weight,
          bd.baggage_price,

          bd.meal_type,
          bd.meal_price,

          bd.insurance,
          bd.insurance_price,

          p.id AS payment_id,
          p.method AS payment_method,
          p.amount AS payment_amount,
          p.status AS payment_status,
          p.transaction_id,
          p.paid_at

        FROM bookings b

        JOIN users u
          ON u.id = b.user_id

        JOIN booking_details bd
          ON bd.booking_id = b.id

        LEFT JOIN LATERAL
        (
          SELECT *

          FROM payments

          WHERE booking_id = b.id

          ORDER BY id DESC

          LIMIT 1
        ) p
          ON TRUE

        WHERE b.id = $1

        LIMIT 1
      `,
    [bookingId],
  );

  return result.rows[0] || null;
}

// =====================================================
// SEND EMAIL BILL
// =====================================================

async function sendPaymentEmailSafely(bookingId) {
  try {
    const data = await getPaymentEmailData(bookingId);

    if (!data) {
      console.warn("EMAIL BILL: booking không tồn tại:", bookingId);

      return false;
    }

    const receiverEmail = data.passenger_email || data.account_email;

    if (!receiverEmail) {
      console.warn("EMAIL BILL: không có email nhận bill");

      return false;
    }

    await sendPaymentSuccessEmail({
      to: receiverEmail,

      fullName: data.passenger_name || data.account_name,

      booking: data,

      detail: data,

      payment: data,
    });

    console.log(`✅ PAYMENT BILL SENT: ${receiverEmail}`);

    return true;
  } catch (error) {
    // Quan trọng:
    // Mail lỗi KHÔNG được làm payment lỗi
    console.error("SEND PAYMENT BILL ERROR:", error);

    return false;
  }
}

// =====================================================
// CREATE MOMO
// POST /api/payments/momo/create
// =====================================================

exports.createMomo = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = getUserId(req);

    const bookingId = Number(req.body.booking_id || req.body.bookingId);

    if (!userId) {
      return res.status(401).json({
        message: "Không xác định được tài khoản đăng nhập",
      });
    }

    if (!bookingId) {
      return res.status(400).json({
        message: "bookingId không hợp lệ",
      });
    }

    await client.query("BEGIN");

    // =================================================
    // BOOKING
    // KHÔNG LẤY AMOUNT TỪ FRONTEND
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
        message: "Không tìm thấy booking của bạn",
      });
    }

    const booking = bookingResult.rows[0];

    if (booking.status === "CONFIRMED") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "Booking này đã được thanh toán",
      });
    }

    // =================================================
    // DETAIL
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

    // HOLD hết hạn
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
        message: "Thời gian giữ ghế đã hết. Vui lòng chọn lại ghế.",
      });
    }

    if (detail.seat_status !== "HOLD") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "Ghế hiện không còn được giữ",
      });
    }

    // =================================================
    // AMOUNT DATABASE
    // =================================================

    const amount = Number(booking.total_price);

    if (!Number.isFinite(amount) || amount <= 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Số tiền booking không hợp lệ",
      });
    }

    const momoAmount = Math.round(amount);

    // =================================================
    // PAYMENT CŨ
    // =================================================

    const oldPaymentResult = await client.query(
      `
          SELECT *

          FROM payments

          WHERE booking_id = $1

          ORDER BY id DESC

          LIMIT 1

          FOR UPDATE
        `,
      [bookingId],
    );

    if (oldPaymentResult.rows.length > 0) {
      await client.query(
        `
          UPDATE payments

          SET
            method = 'MOMO',
            amount = $1,
            status = 'PENDING',
            transaction_id = NULL,
            paid_at = NULL

          WHERE id = $2
        `,
        [momoAmount, oldPaymentResult.rows[0].id],
      );
    } else {
      await client.query(
        `
          INSERT INTO payments
          (
            booking_id,
            method,
            amount,
            status,
            transaction_id,
            paid_at
          )

          VALUES
          (
            $1,
            'MOMO',
            $2,
            'PENDING',
            NULL,
            NULL
          )
        `,
        [bookingId, momoAmount],
      );
    }

    // Commit trước khi gọi MoMo
    await client.query("COMMIT");

    // =================================================
    // MOMO
    // =================================================

    const momoResponse = await createMomoPayment({
      bookingId,

      amount: momoAmount,

      orderInfo: `Thanh toan ve may bay booking ${booking.booking_code}`,
    });

    if (!momoResponse.payUrl) {
      console.error("MoMo response không có payUrl:", momoResponse);

      return res.status(502).json({
        message: "MoMo không trả về đường dẫn thanh toán",

        momo: momoResponse,
      });
    }

    return res.status(200).json({
      message: "Tạo thanh toán MoMo thành công",

      booking_id: bookingId,

      orderId: momoResponse.orderId,

      requestId: momoResponse.requestId,

      payUrl: momoResponse.payUrl,

      deeplink: momoResponse.deeplink || null,

      qrCodeUrl: momoResponse.qrCodeUrl || null,
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // có thể đã commit
    }

    console.error(
      "CREATE MOMO PAYMENT ERROR:",
      error.response?.data || error.message || error,
    );

    return res.status(500).json({
      message: "Không thể tạo thanh toán MoMo",

      error: error.response?.data || error.message,
    });
  } finally {
    client.release();
  }
};

// =====================================================
// MOMO IPN
// POST /api/payments/momo/ipn
//
// KHÔNG verifyToken
// =====================================================

exports.momoIpn = async (req, res) => {
  const client = await pool.connect();

  try {
    const body = req.body;

    console.log("========== MOMO IPN ==========");

    console.log(body);

    // =================================================
    // VERIFY SIGNATURE
    // =================================================

    const validSignature = verifyMomoIpnSignature(body);

    if (!validSignature) {
      console.error("MOMO IPN: signature không hợp lệ");

      return res.status(400).json({
        message: "Invalid signature",
      });
    }

    // =================================================
    // BOOKING ID
    // =================================================

    let extraData;

    try {
      extraData = decodeExtraData(body.extraData);
    } catch (error) {
      console.error("Decode extraData lỗi:", error);

      return res.status(400).json({
        message: "extraData không hợp lệ",
      });
    }

    const bookingId = Number(extraData.bookingId);

    if (!bookingId) {
      return res.status(400).json({
        message: "Không tìm thấy bookingId trong extraData",
      });
    }

    await client.query("BEGIN");

    // =================================================
    // LOCK BOOKING
    // =================================================

    const bookingResult = await client.query(
      `
          SELECT *

          FROM bookings

          WHERE id = $1

          FOR UPDATE
        `,
      [bookingId],
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Booking không tồn tại",
      });
    }

    const booking = bookingResult.rows[0];

    // =================================================
    // AMOUNT CHECK
    // =================================================

    if (Number(booking.total_price) !== Number(body.amount)) {
      await client.query("ROLLBACK");

      console.error("MOMO IPN: amount không khớp");

      return res.status(400).json({
        message: "Số tiền không khớp",
      });
    }

    const paymentResult = await client.query(
      `
          SELECT *

          FROM payments

          WHERE booking_id = $1

          ORDER BY id DESC

          LIMIT 1

          FOR UPDATE
        `,
      [bookingId],
    );

    // =================================================
    // MOMO SUCCESS
    // =================================================

    if (Number(body.resultCode) === 0) {
      // IPN có thể gửi nhiều lần
      if (booking.status === "CONFIRMED") {
        await client.query("COMMIT");

        return res.status(200).json({
          message: "Booking đã được xác nhận trước đó",
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
          message: "Không tìm thấy booking detail",
        });
      }

      const detail = detailResult.rows[0];

      if (detail.seat_status === "EXPIRED") {
        await client.query("ROLLBACK");

        return res.status(409).json({
          message: "Ghế đã hết thời gian giữ",
        });
      }

      // Booking confirmed
      await client.query(
        `
          UPDATE bookings

          SET
            status = 'CONFIRMED',
            updated_at = NOW()

          WHERE id = $1
        `,
        [bookingId],
      );

      // Seat booked
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
      // PAYMENT SUCCESS
      // =================================================

      const transactionId = body.transId ? String(body.transId) : null;

      if (paymentResult.rows.length > 0) {
        await client.query(
          `
            UPDATE payments

            SET
              method = 'MOMO',
              amount = $1,
              status = 'SUCCESS',
              transaction_id = $2,
              paid_at = NOW()

            WHERE id = $3
          `,
          [body.amount, transactionId, paymentResult.rows[0].id],
        );
      } else {
        await client.query(
          `
            INSERT INTO payments
            (
              booking_id,
              method,
              amount,
              status,
              transaction_id,
              paid_at
            )

            VALUES
            (
              $1,
              'MOMO',
              $2,
              'SUCCESS',
              $3,
              NOW()
            )
          `,
          [bookingId, body.amount, transactionId],
        );
      }

      await client.query("COMMIT");

      console.log(`✅ MOMO SUCCESS - Booking ${bookingId}`);

      // ===============================================
      // GỬI BILL SAU KHI ĐÃ COMMIT
      //
      // Không chờ Gmail để tránh giữ MoMo IPN lâu.
      // ===============================================

      sendPaymentEmailSafely(bookingId).catch((error) => {
        console.error("PAYMENT EMAIL BACKGROUND ERROR:", error);
      });

      return res.status(200).json({
        message: "Thanh toán MoMo thành công",
      });
    }

    // =================================================
    // MOMO FAILED
    // =================================================

    const transactionId = body.transId ? String(body.transId) : null;

    if (paymentResult.rows.length > 0) {
      await client.query(
        `
          UPDATE payments

          SET
            method = 'MOMO',
            amount = $1,
            status = 'FAILED',
            transaction_id = $2,
            paid_at = NULL

          WHERE id = $3
        `,
        [body.amount, transactionId, paymentResult.rows[0].id],
      );
    } else {
      await client.query(
        `
          INSERT INTO payments
          (
            booking_id,
            method,
            amount,
            status,
            transaction_id,
            paid_at
          )

          VALUES
          (
            $1,
            'MOMO',
            $2,
            'FAILED',
            $3,
            NULL
          )
        `,
        [bookingId, body.amount, transactionId],
      );
    }

    await client.query("COMMIT");

    console.log(
      `MOMO FAILED - Booking ${bookingId}`,
      body.resultCode,
      body.message,
    );

    return res.status(200).json({
      message: "Đã ghi nhận thanh toán thất bại",
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      //
    }

    console.error("MOMO IPN ERROR:", error);

    return res.status(500).json({
      message: "Lỗi xử lý callback MoMo",

      error: error.message,
    });
  } finally {
    client.release();
  }
};

// =====================================================
// MOMO RETURN
// GET /api/payments/momo/return
// =====================================================

exports.momoReturn = async (req, res) => {
  return res.status(200).json({
    message: "Kết quả redirect từ MoMo",

    data: req.query,
  });
};

// =====================================================
// ADMIN - ALL PAYMENTS
// GET /api/payments
// =====================================================

exports.getAllPayments = async (req, res) => {
  try {
    const result = await pool.query(
      `
          SELECT
            b.id AS booking_id,
            b.booking_code,
            b.total_price,

            b.status::text
              AS booking_status,

            b.created_at
              AS booking_date,

            b.flight_date,
            b.departure_place,
            b.arrival_place,
            b.departure_time_text,
            b.arrival_time_text,
            b.airline_name,
            b.flight_number_snapshot,
            b.seat_number_snapshot,

            u.id AS user_id,
            u.full_name
              AS customer_name,
            u.email
              AS customer_email,
            u.phone
              AS customer_phone,

            bd.passenger_name,
            bd.email
              AS passenger_email,
            bd.phone
              AS passenger_phone,

            bd.seat_class,

            bd.seat_status::text
              AS seat_status,

            bd.baggage_weight,
            bd.baggage_price,

            bd.meal_type,
            bd.meal_price,

            bd.insurance,
            bd.insurance_price,

            COALESCE(
              p.method,
              'MOCK'
            ) AS payment_method,

            COALESCE(
              p.status::text,

              CASE
                WHEN b.status::text =
                  'CONFIRMED'
                THEN 'SUCCESS'
                ELSE 'PENDING'
              END
            ) AS payment_status,

            COALESCE(
              p.amount,
              b.total_price
            ) AS payment_amount,

            COALESCE(
              p.paid_at,
              b.created_at
            ) AS paid_at,

            p.transaction_id

          FROM bookings b

          LEFT JOIN users u
            ON u.id = b.user_id

          LEFT JOIN booking_details bd
            ON bd.booking_id = b.id

          LEFT JOIN LATERAL
          (
            SELECT
              id,
              method,
              status,
              amount,
              paid_at,
              transaction_id

            FROM payments

            WHERE booking_id = b.id

            ORDER BY id DESC

            LIMIT 1
          ) p
            ON TRUE

          WHERE
            b.booking_code
              NOT LIKE 'TMP%'

            OR
            b.status::text =
              'CONFIRMED'

          ORDER BY
            b.created_at DESC
        `,
    );

    return res.status(200).json({
      message: "Lấy danh sách thanh toán thành công",

      data: result.rows,
    });
  } catch (error) {
    console.error("GET ALL PAYMENTS ERROR:", error);

    return res.status(500).json({
      message: "Lỗi tải danh sách thanh toán",

      error: error.message,
    });
  }
};
