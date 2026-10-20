const pool = require("../config/database");
const { sendPaymentSuccessEmail } = require("./email.service");
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

          WHERE booking_id = b.id AND status = 'SUCCESS'

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
// SEND PAYMENT EMAIL SAFELY
// =====================================================

async function sendPaymentEmailSafely(bookingId) {
  try {
    const data = await getPaymentEmailData(bookingId);

    if (!data) {
      console.warn("EMAIL BILL: booking không tồn tại:", bookingId);

      return;
    }

    const email = data.passenger_email || data.account_email;

    if (!email) {
      console.warn("EMAIL BILL: không có email người nhận");

      return;
    }

    await sendPaymentSuccessEmail({
      to: email,

      fullName: data.passenger_name || data.account_name,

      booking: data,

      detail: data,

      payment: data,
    });

    return true;
  } catch (error) {
    // KHÔNG rollback thanh toán
    console.error("SEND PAYMENT EMAIL ERROR:", error.message);
    return false;
  }
}


module.exports = { sendPaymentEmailSafely };
