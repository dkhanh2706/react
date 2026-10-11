const pool = require("../config/database");

const {
  createMomoPayment,
  verifyMomoIpnSignature,
  decodeExtraData,
} = require("../services/momo.service");

// =====================================================
// LẤY USER ID TỪ JWT
// =====================================================
function getUserId(req) {
  return req.user?.id || req.user?.user_id || req.user?.userId || null;
}

// =====================================================
// TẠO THANH TOÁN MOMO
//
// POST /api/payments/momo/create
// =====================================================
exports.createMomo = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = getUserId(req);

    const bookingId = Number(req.body.booking_id || req.body.bookingId);

    // =================================================
    // KIỂM TRA USER
    // =================================================

    if (!userId) {
      return res.status(401).json({
        message: "Không xác định được tài khoản đăng nhập",
      });
    }

    // =================================================
    // KIỂM TRA BOOKING ID
    // =================================================

    if (!bookingId) {
      return res.status(400).json({
        message: "bookingId không hợp lệ",
      });
    }

    await client.query("BEGIN");

    // =================================================
    // LẤY BOOKING
    // Không bao giờ lấy số tiền từ frontend
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

    // =================================================
    // BOOKING ĐÃ CONFIRMED
    // =================================================

    if (booking.status === "CONFIRMED") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "Booking này đã được thanh toán",
      });
    }

    // =================================================
    // KIỂM TRA GHẾ HOLD
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
    // HOLD ĐÃ HẾT HẠN
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
        message: "Thời gian giữ ghế đã hết. Vui lòng chọn lại ghế.",
      });
    }

    // =================================================
    // GHẾ KHÔNG CÒN HOLD
    // =================================================

    if (detail.seat_status !== "HOLD") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "Ghế hiện không còn được giữ",
      });
    }

    // =================================================
    // KIỂM TRA SỐ TIỀN
    // =================================================

    const amount = Number(booking.total_price);

    if (!Number.isFinite(amount) || amount <= 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Số tiền booking không hợp lệ",
      });
    }

    // MoMo dùng số nguyên VND
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
      `,
      [bookingId],
    );

    // =================================================
    // TẠO / UPDATE PAYMENT PENDING
    // =================================================

    if (oldPaymentResult.rows.length > 0) {
      await client.query(
        `
          UPDATE payments
          SET
            method = 'MOMO',
            amount = $1,
            status = 'PENDING',
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
            paid_at
          )
          VALUES
          (
            $1,
            'MOMO',
            $2,
            'PENDING',
            NULL
          )
        `,
        [bookingId, momoAmount],
      );
    }

    // =================================================
    // COMMIT DB TRƯỚC KHI GỌI MOMO
    // =================================================

    await client.query("COMMIT");

    // =================================================
    // GỌI MOMO
    // =================================================

    const momoResponse = await createMomoPayment({
      bookingId,

      amount: momoAmount,

      orderInfo: `Thanh toan ve may bay booking ${booking.booking_code}`,
    });

    // =================================================
    // MOMO KHÔNG TRẢ PAY URL
    // =================================================

    if (!momoResponse.payUrl) {
      console.error("MoMo response không có payUrl:", momoResponse);

      return res.status(502).json({
        message: "MoMo không trả về đường dẫn thanh toán",

        momo: momoResponse,
      });
    }

    // =================================================
    // RESPONSE FE
    // =================================================

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
      // transaction có thể đã commit
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
//
// POST /api/payments/momo/ipn
//
// MoMo gọi route này.
// KHÔNG DÙNG verifyToken.
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
    // LẤY BOOKING ID
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
    // KIỂM TRA SỐ TIỀN
    // =================================================

    if (Number(booking.total_price) !== Number(body.amount)) {
      await client.query("ROLLBACK");

      console.error("MOMO IPN: amount không khớp");

      return res.status(400).json({
        message: "Số tiền không khớp",
      });
    }

    // =================================================
    // LẤY PAYMENT
    // =================================================

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
    // MOMO THÀNH CÔNG
    // resultCode = 0
    // =================================================

    if (Number(body.resultCode) === 0) {
      // ===============================================
      // IPN CÓ THỂ GỬI NHIỀU LẦN
      // Nếu booking đã confirmed thì trả OK luôn
      // ===============================================

      if (booking.status === "CONFIRMED") {
        await client.query("COMMIT");

        return res.status(200).json({
          message: "Booking đã được xác nhận trước đó",
        });
      }

      // ===============================================
      // LẤY DETAIL
      // ===============================================

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

      // ===============================================
      // KHÔNG CHO CONFIRM GHẾ EXPIRED
      // ===============================================

      if (detail.seat_status === "EXPIRED") {
        await client.query("ROLLBACK");

        return res.status(409).json({
          message: "Ghế đã hết thời gian giữ",
        });
      }

      // ===============================================
      // UPDATE BOOKING
      // ===============================================

      await client.query(
        `
          UPDATE bookings
          SET
            status = 'CONFIRMED'
          WHERE id = $1
        `,
        [bookingId],
      );

      // ===============================================
      // UPDATE GHẾ
      // ===============================================

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

      // ===============================================
      // UPDATE / INSERT PAYMENT
      // ===============================================

      if (paymentResult.rows.length > 0) {
        await client.query(
          `
            UPDATE payments
            SET
              method = 'MOMO',
              amount = $1,
              status = 'SUCCESS',
              paid_at = NOW()
            WHERE id = $2
          `,
          [body.amount, paymentResult.rows[0].id],
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
              paid_at
            )
            VALUES
            (
              $1,
              'MOMO',
              $2,
              'SUCCESS',
              NOW()
            )
          `,
          [bookingId, body.amount],
        );
      }

      await client.query("COMMIT");

      console.log(`MOMO SUCCESS - Booking ${bookingId}`);

      return res.status(200).json({
        message: "Thanh toán MoMo thành công",
      });
    }

    // =================================================
    // MOMO THẤT BẠI
    // =================================================

    if (paymentResult.rows.length > 0) {
      await client.query(
        `
          UPDATE payments
          SET
            method = 'MOMO',
            amount = $1,
            status = 'FAILED',
            paid_at = NULL
          WHERE id = $2
        `,
        [body.amount, paymentResult.rows[0].id],
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
            paid_at
          )
          VALUES
          (
            $1,
            'MOMO',
            $2,
            'FAILED',
            NULL
          )
        `,
        [bookingId, body.amount],
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
//
// GET /api/payments/momo/return
//
// Route này CHỈ để xem kết quả.
// Không cập nhật booking.
// =====================================================
exports.momoReturn = async (req, res) => {
  return res.status(200).json({
    message: "Kết quả redirect từ MoMo",

    data: req.query,
  });
};
