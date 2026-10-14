const nodemailer = require("nodemailer");

// =====================================================
// MAIL CONFIG
// =====================================================

function getMailConfig() {
  const user = String(process.env.MAIL_USER || "").trim();

  const pass = String(process.env.MAIL_PASS || "").trim();

  const fromName = String(
    process.env.MAIL_FROM_NAME || "Airline Booking",
  ).trim();

  if (!user) {
    throw new Error("Thiếu MAIL_USER trong file .env");
  }

  if (!pass) {
    throw new Error("Thiếu MAIL_PASS trong file .env");
  }

  return {
    user,
    pass,
    fromName,
  };
}

// =====================================================
// TRANSPORTER
// =====================================================

function createTransporter() {
  const { user, pass } = getMailConfig();

  return nodemailer.createTransport({
    service: "gmail",

    auth: {
      user,
      pass,
    },
  });
}

// =====================================================
// VERIFY GMAIL
// =====================================================

async function verifyEmailConnection() {
  const transporter = createTransporter();

  await transporter.verify();

  return true;
}

// =====================================================
// FORMAT MONEY
// =====================================================

function formatMoney(value) {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) {
    return "0 ₫";
  }

  return new Intl.NumberFormat("vi-VN").format(number) + " ₫";
}

// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(value) {
  if (!value) {
    return "Chưa cập nhật";
  }

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch {
    return String(value);
  }
}

// =====================================================
// FORMAT DATETIME
// =====================================================

function formatDateTime(value) {
  if (!value) {
    return "Chưa cập nhật";
  }

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",

      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return String(value);
  }
}

// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =====================================================
// MEAL NAME
// =====================================================

function getMealName(value) {
  const meal = String(value || "")
    .trim()
    .toUpperCase();

  switch (meal) {
    case "CHICKEN_RICE":
      return "Cơm gà";

    case "BEEF_RICE":
      return "Cơm bò";

    case "NOODLES":
      return "Mì";

    case "NONE":
    default:
      return "Không chọn";
  }
}

// =====================================================
// SEAT CLASS
// =====================================================

function getSeatClassName(value) {
  const seatClass = String(value || "")
    .trim()
    .toUpperCase();

  switch (seatClass) {
    case "BUSINESS":
      return "Thương gia";

    case "FIRST":
      return "Hạng nhất";

    case "ECONOMY":
    default:
      return "Phổ thông";
  }
}

// =====================================================
// PAYMENT METHOD
// =====================================================

function getPaymentMethodName(value) {
  const method = String(value || "")
    .trim()
    .toUpperCase();

  switch (method) {
    case "MOMO":
      return "Ví MoMo";

    case "MOCK":
      return "Thanh toán thử nghiệm";

    default:
      return method || "Không xác định";
  }
}

// =====================================================
// PASSWORD OTP TEMPLATE
// =====================================================

function buildPasswordCodeHtml({ fullName, code, purpose }) {
  const displayName = escapeHtml(fullName || "Quý khách");

  const safeCode = escapeHtml(code);

  const isForgot = purpose === "forgot";

  const title = isForgot ? "Khôi phục mật khẩu" : "Xác nhận đổi mật khẩu";

  const description = isForgot
    ? "Hệ thống nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn."
    : "Hệ thống nhận được yêu cầu đổi mật khẩu cho tài khoản của bạn.";

  return `
    <!DOCTYPE html>
    <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>${title}</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background: #f4f7fb;
          font-family: Arial, Helvetica, sans-serif;
          color: #172033;
        "
      >
        <div
          style="
            width: 100%;
            padding: 36px 14px;
            box-sizing: border-box;
          "
        >
          <div
            style="
              width: 100%;
              max-width: 560px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 18px;
              overflow: hidden;
              box-shadow:
                0 12px 40px
                rgba(15, 23, 42, 0.10);
            "
          >
            <div
              style="
                padding: 28px 30px;
                background:
                  linear-gradient(
                    135deg,
                    #0d47a1,
                    #1565c0
                  );
                color: #ffffff;
              "
            >
              <div
                style="
                  font-size: 12px;
                  font-weight: 700;
                  letter-spacing: 2px;
                  opacity: 0.88;
                "
              >
                AIRLINE BOOKING
              </div>

              <div
                style="
                  margin-top: 8px;
                  font-size: 26px;
                  line-height: 1.25;
                  font-weight: 800;
                "
              >
                ${title}
              </div>
            </div>

            <div
              style="
                padding: 30px;
              "
            >
              <p
                style="
                  margin: 0 0 16px;
                  font-size: 15px;
                  line-height: 1.7;
                "
              >
                Xin chào
                <strong>${displayName}</strong>,
              </p>

              <p
                style="
                  margin: 0 0 14px;
                  font-size: 15px;
                  line-height: 1.7;
                  color: #475569;
                "
              >
                ${description}
              </p>

              <p
                style="
                  margin: 0;
                  font-size: 15px;
                  line-height: 1.7;
                "
              >
                Mã xác nhận của bạn là:
              </p>

              <div
                style="
                  margin: 25px 0;
                  text-align: center;
                "
              >
                <div
                  style="
                    display: inline-block;
                    min-width: 220px;
                    padding: 18px 24px;
                    border-radius: 14px;
                    border: 1px solid #bfdbfe;
                    background: #eff6ff;
                    color: #0d47a1;
                    font-size: 34px;
                    font-weight: 800;
                    letter-spacing: 8px;
                    box-sizing: border-box;
                  "
                >
                  ${safeCode}
                </div>
              </div>

              <div
                style="
                  padding: 14px 16px;
                  border-radius: 10px;
                  border: 1px solid #fed7aa;
                  background: #fff7ed;
                  color: #9a3412;
                  font-size: 13px;
                  line-height: 1.65;
                "
              >
                Mã có hiệu lực trong
                <strong>10 phút</strong>.
                Vui lòng không cung cấp mã này cho người khác.
              </div>

              <p
                style="
                  margin: 24px 0 0;
                  color: #64748b;
                  font-size: 13px;
                  line-height: 1.7;
                "
              >
                Nếu bạn không thực hiện yêu cầu này,
                bạn có thể bỏ qua email.
              </p>
            </div>

            <div
              style="
                padding: 18px 30px;
                background: #f8fafc;
                border-top: 1px solid #e2e8f0;
                text-align: center;
                color: #94a3b8;
                font-size: 12px;
                line-height: 1.6;
              "
            >
              Airline Booking System
              <br />
              Đây là email tự động,
              vui lòng không trả lời email này.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

// =====================================================
// SEND PASSWORD CODE
// =====================================================

async function sendPasswordCode({ to, code, fullName, purpose = "change" }) {
  if (!to) {
    throw new Error("Không có email người nhận");
  }

  if (!code) {
    throw new Error("Không có mã xác nhận");
  }

  const { user, fromName } = getMailConfig();

  const transporter = createTransporter();

  const isForgot = purpose === "forgot";

  const subject = isForgot
    ? "Mã khôi phục mật khẩu - Airline Booking"
    : "Mã xác nhận đổi mật khẩu - Airline Booking";

  const info = await transporter.sendMail({
    from: `"${fromName}" <${user}>`,

    to,

    subject,

    text: `Mã xác nhận của bạn là ${code}. ` + `Mã có hiệu lực trong 10 phút.`,

    html: buildPasswordCodeHtml({
      fullName,
      code,
      purpose,
    }),
  });

  console.log("✅ PASSWORD EMAIL SENT:", {
    to,
    messageId: info.messageId,
  });

  return info;
}

// =====================================================
// BUILD PAYMENT EMAIL
// =====================================================

function buildPaymentSuccessHtml({
  fullName,
  booking = {},
  detail = {},
  payment = {},
}) {
  const passengerName = escapeHtml(
    detail.passenger_name || fullName || booking.account_name || "Quý khách",
  );

  const bookingCode = escapeHtml(
    booking.booking_code || detail.booking_code || "",
  );

  const airline = escapeHtml(
    booking.airline_name || detail.airline_name || "Airline",
  );

  const flightNumber = escapeHtml(
    booking.flight_number_snapshot || detail.flight_number_snapshot || "",
  );

  const departure = escapeHtml(
    booking.departure_place || detail.departure_place || "",
  );

  const arrival = escapeHtml(
    booking.arrival_place || detail.arrival_place || "",
  );

  const departureTime = escapeHtml(
    booking.departure_time_text || detail.departure_time_text || "",
  );

  const arrivalTime = escapeHtml(
    booking.arrival_time_text || detail.arrival_time_text || "",
  );

  const seatNumber = escapeHtml(
    booking.seat_number_snapshot || detail.seat_number_snapshot || "",
  );

  const documentType = escapeHtml(detail.document_type || "");

  const documentNumber = escapeHtml(detail.document_number || "");

  const passengerPhone = escapeHtml(
    detail.passenger_phone || detail.phone || "",
  );

  const seatClass = getSeatClassName(detail.seat_class);

  const baggageWeight = Number(detail.baggage_weight || 0);

  const insurance = detail.insurance === true || detail.insurance === "true";

  const paymentMethod = getPaymentMethodName(
    payment.payment_method || payment.method || detail.payment_method,
  );

  const transactionId = escapeHtml(
    payment.transaction_id || detail.transaction_id || "Không có",
  );

  const paidAt = payment.paid_at || detail.paid_at || new Date();

  const flightDate = booking.flight_date || detail.flight_date;

  const seatFare = detail.seat_fare ?? detail.price ?? 0;

  const baggagePrice = detail.baggage_price || 0;

  const mealPrice = detail.meal_price || 0;

  const insurancePrice = detail.insurance_price || 0;

  const totalPrice =
    booking.total_price ??
    detail.total_price ??
    payment.payment_amount ??
    payment.amount ??
    0;

  const mealName = getMealName(detail.meal_type);

  return `
    <!DOCTYPE html>
    <html lang="vi">
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>
          Xác nhận thanh toán thành công
        </title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background: #f1f5f9;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          color: #172033;
        "
      >
        <div
          style="
            width: 100%;
            box-sizing: border-box;
            padding: 35px 14px;
          "
        >
          <div
            style="
              width: 100%;
              max-width: 680px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 20px;
              overflow: hidden;
              box-shadow:
                0 14px 44px
                rgba(15, 23, 42, 0.10);
            "
          >
            <!-- HEADER -->

            <div
              style="
                padding: 30px 32px;
                background:
                  linear-gradient(
                    135deg,
                    #064e3b,
                    #059669
                  );
                color: #ffffff;
              "
            >
              <div
                style="
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                "
              >
                <div>
                  <div
                    style="
                      font-size: 12px;
                      font-weight: 700;
                      letter-spacing: 2px;
                      opacity: 0.9;
                    "
                  >
                    AIRLINE BOOKING
                  </div>

                  <div
                    style="
                      margin-top: 7px;
                      font-size: 28px;
                      line-height: 1.2;
                      font-weight: 800;
                    "
                  >
                    Thanh toán thành công
                  </div>
                </div>
              </div>

              <div
                style="
                  margin-top: 14px;
                  font-size: 14px;
                  line-height: 1.7;
                  opacity: 0.95;
                "
              >
                Vé của bạn đã được xác nhận.
                Vui lòng giữ email này để đối chiếu khi cần.
              </div>
            </div>

            <!-- BOOKING CODE -->

            <div
              style="
                padding: 24px 32px 0;
              "
            >
              <div
                style="
                  padding: 18px;
                  border-radius: 14px;
                  background: #ecfdf5;
                  border: 1px solid #a7f3d0;
                  text-align: center;
                "
              >
                <div
                  style="
                    font-size: 12px;
                    color: #047857;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                  "
                >
                  Mã đặt chỗ
                </div>

                <div
                  style="
                    margin-top: 5px;
                    color: #065f46;
                    font-size: 26px;
                    font-weight: 800;
                    letter-spacing: 1px;
                  "
                >
                  ${bookingCode || "-"}
                </div>
              </div>
            </div>

            <!-- FLIGHT -->

            <div
              style="
                padding: 26px 32px 0;
              "
            >
              <div
                style="
                  font-size: 17px;
                  font-weight: 800;
                  margin-bottom: 14px;
                  color: #0f172a;
                "
              >
                Thông tin chuyến bay
              </div>

              <div
                style="
                  border: 1px solid #e2e8f0;
                  border-radius: 15px;
                  padding: 20px;
                "
              >
                <div
                  style="
                    font-size: 16px;
                    font-weight: 800;
                    color: #0f172a;
                  "
                >
                  ${airline}
                  ${flightNumber ? ` · ${flightNumber}` : ""}
                </div>

                <div
                  style="
                    margin-top: 18px;
                    display: table;
                    width: 100%;
                  "
                >
                  <div
                    style="
                      display: table-cell;
                      width: 42%;
                      vertical-align: top;
                    "
                  >
                    <div
                      style="
                        color: #64748b;
                        font-size: 12px;
                      "
                    >
                      Khởi hành
                    </div>

                    <div
                      style="
                        margin-top: 4px;
                        font-size: 19px;
                        font-weight: 800;
                      "
                    >
                      ${departure || "-"}
                    </div>

                    <div
                      style="
                        margin-top: 4px;
                        color: #475569;
                        font-size: 13px;
                      "
                    >
                      ${departureTime || "-"}
                    </div>
                  </div>

                  <div
                    style="
                      display: table-cell;
                      width: 16%;
                      text-align: center;
                      vertical-align: middle;
                      color: #94a3b8;
                    "
                  >
                    ✈
                  </div>

                  <div
                    style="
                      display: table-cell;
                      width: 42%;
                      vertical-align: top;
                      text-align: right;
                    "
                  >
                    <div
                      style="
                        color: #64748b;
                        font-size: 12px;
                      "
                    >
                      Đến
                    </div>

                    <div
                      style="
                        margin-top: 4px;
                        font-size: 19px;
                        font-weight: 800;
                      "
                    >
                      ${arrival || "-"}
                    </div>

                    <div
                      style="
                        margin-top: 4px;
                        color: #475569;
                        font-size: 13px;
                      "
                    >
                      ${arrivalTime || "-"}
                    </div>
                  </div>
                </div>

                <div
                  style="
                    margin-top: 18px;
                    padding-top: 15px;
                    border-top: 1px dashed #cbd5e1;
                    color: #475569;
                    font-size: 13px;
                    line-height: 1.8;
                  "
                >
                  <strong>Ngày bay:</strong>
                  ${formatDate(flightDate)}

                  <br />

                  <strong>Ghế:</strong>
                  ${seatNumber || "-"}

                  &nbsp;&nbsp;·&nbsp;&nbsp;

                  <strong>Hạng:</strong>
                  ${seatClass}
                </div>
              </div>
            </div>

            <!-- PASSENGER -->

            <div
              style="
                padding: 26px 32px 0;
              "
            >
              <div
                style="
                  font-size: 17px;
                  font-weight: 800;
                  margin-bottom: 14px;
                "
              >
                Hành khách
              </div>

              <div
                style="
                  border: 1px solid #e2e8f0;
                  border-radius: 15px;
                  overflow: hidden;
                "
              >
                <table
                  cellpadding="0"
                  cellspacing="0"
                  width="100%"
                  style="
                    border-collapse: collapse;
                    font-size: 13px;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding: 13px 16px;
                        color: #64748b;
                        border-bottom: 1px solid #f1f5f9;
                        width: 40%;
                      "
                    >
                      Họ và tên
                    </td>

                    <td
                      style="
                        padding: 13px 16px;
                        font-weight: 700;
                        border-bottom: 1px solid #f1f5f9;
                      "
                    >
                      ${passengerName}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding: 13px 16px;
                        color: #64748b;
                        border-bottom: 1px solid #f1f5f9;
                      "
                    >
                      Số điện thoại
                    </td>

                    <td
                      style="
                        padding: 13px 16px;
                        border-bottom: 1px solid #f1f5f9;
                      "
                    >
                      ${passengerPhone || "-"}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding: 13px 16px;
                        color: #64748b;
                      "
                    >
                      Giấy tờ
                    </td>

                    <td
                      style="
                        padding: 13px 16px;
                      "
                    >
                      ${
                        documentType || documentNumber
                          ? `${documentType} ${documentNumber}`
                          : "-"
                      }
                    </td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- SERVICES -->

            <div
              style="
                padding: 26px 32px 0;
              "
            >
              <div
                style="
                  font-size: 17px;
                  font-weight: 800;
                  margin-bottom: 14px;
                "
              >
                Dịch vụ đã chọn
              </div>

              <div
                style="
                  border: 1px solid #e2e8f0;
                  border-radius: 15px;
                  overflow: hidden;
                "
              >
                <table
                  cellpadding="0"
                  cellspacing="0"
                  width="100%"
                  style="
                    border-collapse: collapse;
                    font-size: 13px;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding: 13px 16px;
                        border-bottom: 1px solid #f1f5f9;
                      "
                    >
                      Hành lý ký gửi
                    </td>

                    <td
                      align="right"
                      style="
                        padding: 13px 16px;
                        border-bottom: 1px solid #f1f5f9;
                        font-weight: 700;
                      "
                    >
                      ${
                        baggageWeight > 0 ? `${baggageWeight} kg` : "Không chọn"
                      }
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding: 13px 16px;
                        border-bottom: 1px solid #f1f5f9;
                      "
                    >
                      Suất ăn
                    </td>

                    <td
                      align="right"
                      style="
                        padding: 13px 16px;
                        border-bottom: 1px solid #f1f5f9;
                        font-weight: 700;
                      "
                    >
                      ${mealName}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding: 13px 16px;
                      "
                    >
                      Bảo hiểm
                    </td>

                    <td
                      align="right"
                      style="
                        padding: 13px 16px;
                        font-weight: 700;
                      "
                    >
                      ${insurance ? "Có" : "Không"}
                    </td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- PRICE -->

            <div
              style="
                padding: 26px 32px 0;
              "
            >
              <div
                style="
                  font-size: 17px;
                  font-weight: 800;
                  margin-bottom: 14px;
                "
              >
                Chi tiết thanh toán
              </div>

              <div
                style="
                  border-radius: 15px;
                  background: #f8fafc;
                  border: 1px solid #e2e8f0;
                  padding: 18px;
                "
              >
                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  style="
                    border-collapse: collapse;
                    font-size: 13px;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding: 7px 0;
                        color: #64748b;
                      "
                    >
                      Giá vé
                    </td>

                    <td
                      align="right"
                      style="
                        padding: 7px 0;
                      "
                    >
                      ${formatMoney(seatFare)}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding: 7px 0;
                        color: #64748b;
                      "
                    >
                      Hành lý
                    </td>

                    <td
                      align="right"
                      style="
                        padding: 7px 0;
                      "
                    >
                      ${formatMoney(baggagePrice)}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding: 7px 0;
                        color: #64748b;
                      "
                    >
                      Suất ăn
                    </td>

                    <td
                      align="right"
                      style="
                        padding: 7px 0;
                      "
                    >
                      ${formatMoney(mealPrice)}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding: 7px 0 14px;
                        color: #64748b;
                        border-bottom: 1px solid #cbd5e1;
                      "
                    >
                      Bảo hiểm
                    </td>

                    <td
                      align="right"
                      style="
                        padding: 7px 0 14px;
                        border-bottom: 1px solid #cbd5e1;
                      "
                    >
                      ${formatMoney(insurancePrice)}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding: 16px 0 0;
                        font-size: 16px;
                        font-weight: 800;
                      "
                    >
                      Tổng thanh toán
                    </td>

                    <td
                      align="right"
                      style="
                        padding: 16px 0 0;
                        font-size: 20px;
                        font-weight: 800;
                        color: #059669;
                      "
                    >
                      ${formatMoney(totalPrice)}
                    </td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- PAYMENT INFO -->

            <div
              style="
                padding: 26px 32px 30px;
              "
            >
              <div
                style="
                  border: 1px solid #e2e8f0;
                  border-radius: 15px;
                  padding: 18px;
                  background: #ffffff;
                  font-size: 13px;
                  line-height: 1.9;
                  color: #475569;
                "
              >
                <strong
                  style="
                    color: #0f172a;
                  "
                >
                  Thông tin giao dịch
                </strong>

                <br />

                Phương thức:
                <strong>
                  ${paymentMethod}
                </strong>

                <br />

                Thời gian:
                <strong>
                  ${formatDateTime(paidAt)}
                </strong>

                <br />

                Mã giao dịch:
                <strong>
                  ${transactionId}
                </strong>

                <br />

                Trạng thái:
                <strong
                  style="
                    color: #059669;
                  "
                >
                  THANH TOÁN THÀNH CÔNG
                </strong>
              </div>
            </div>

            <!-- FOOTER -->

            <div
              style="
                background: #f8fafc;
                border-top: 1px solid #e2e8f0;
                padding: 20px 30px;
                color: #64748b;
                text-align: center;
                font-size: 12px;
                line-height: 1.7;
              "
            >
              Cảm ơn bạn đã sử dụng
              Airline Booking.
              <br />

              Đây là email xác nhận tự động,
              vui lòng lưu lại để đối chiếu khi cần.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

// =====================================================
// PAYMENT SUCCESS TEXT
// =====================================================

function buildPaymentSuccessText({
  fullName,
  booking = {},
  detail = {},
  payment = {},
}) {
  const name = detail.passenger_name || fullName || "Quý khách";

  const totalPrice =
    booking.total_price ??
    detail.total_price ??
    payment.payment_amount ??
    payment.amount ??
    0;

  return [
    "AIRLINE BOOKING",
    "",
    "THANH TOÁN THÀNH CÔNG",
    "",
    `Hành khách: ${name}`,
    `Mã đặt chỗ: ${booking.booking_code || "-"}`,
    `Chuyến bay: ${booking.flight_number_snapshot || "-"}`,
    `Hành trình: ${booking.departure_place || "-"} → ${booking.arrival_place || "-"}`,
    `Ngày bay: ${formatDate(booking.flight_date)}`,
    `Ghế: ${booking.seat_number_snapshot || "-"}`,
    `Hạng ghế: ${getSeatClassName(detail.seat_class)}`,
    "",
    `Tổng thanh toán: ${formatMoney(totalPrice)}`,
    `Phương thức: ${getPaymentMethodName(
      payment.payment_method || payment.method || detail.payment_method,
    )}`,
    `Mã giao dịch: ${
      payment.transaction_id || detail.transaction_id || "Không có"
    }`,
    "",
    "Vé của bạn đã được xác nhận.",
    "",
    "Cảm ơn bạn đã sử dụng Airline Booking.",
  ].join("\n");
}

// =====================================================
// SEND PAYMENT SUCCESS EMAIL
// =====================================================

async function sendPaymentSuccessEmail({
  to,
  fullName,
  booking = {},
  detail = {},
  payment = {},
}) {
  if (!to) {
    throw new Error("Không có email nhận bill");
  }

  const { user, fromName } = getMailConfig();

  const transporter = createTransporter();

  const bookingCode = booking.booking_code || detail.booking_code || "";

  const subject = bookingCode
    ? `Thanh toán thành công - Vé ${bookingCode}`
    : "Thanh toán vé máy bay thành công";

  const info = await transporter.sendMail({
    from: `"${fromName}" <${user}>`,

    to,

    subject,

    text: buildPaymentSuccessText({
      fullName,
      booking,
      detail,
      payment,
    }),

    html: buildPaymentSuccessHtml({
      fullName,
      booking,
      detail,
      payment,
    }),
  });

  console.log("✅ PAYMENT EMAIL SENT:", {
    to,
    bookingCode,
    messageId: info.messageId,
  });

  return info;
}

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  verifyEmailConnection,

  sendPasswordCode,

  sendPaymentSuccessEmail,
};
