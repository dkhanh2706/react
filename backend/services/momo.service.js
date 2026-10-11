const axios = require("axios");
const crypto = require("crypto");

// =====================================================
// TẠO SIGNATURE
// =====================================================
function createSignature(rawSignature) {
  const secretKey = process.env.MOMO_SECRET_KEY;

  if (!secretKey) {
    throw new Error("MOMO_SECRET_KEY chưa được cấu hình trong .env");
  }

  return crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");
}

// =====================================================
// TẠO PAYMENT MOMO
// =====================================================
async function createMomoPayment({ bookingId, amount, orderInfo }) {
  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;

  const endpoint = process.env.MOMO_ENDPOINT;
  const redirectUrl = process.env.MOMO_REDIRECT_URL;
  const ipnUrl = process.env.MOMO_IPN_URL;

  if (!partnerCode) {
    throw new Error("MOMO_PARTNER_CODE chưa được cấu hình");
  }

  if (!accessKey) {
    throw new Error("MOMO_ACCESS_KEY chưa được cấu hình");
  }

  if (!endpoint) {
    throw new Error("MOMO_ENDPOINT chưa được cấu hình");
  }

  if (!redirectUrl) {
    throw new Error("MOMO_REDIRECT_URL chưa được cấu hình");
  }

  if (!ipnUrl) {
    throw new Error("MOMO_IPN_URL chưa được cấu hình");
  }

  // ===================================================
  // ID GIAO DỊCH
  // ===================================================

  const requestId = `REQ_${Date.now()}_${bookingId}`;

  const orderId = `BK_${bookingId}_${Date.now()}`;

  const requestType = "payWithMethod";

  // ===================================================
  // EXTRA DATA
  // Chứa bookingId để lấy lại ở IPN
  // ===================================================

  const extraData = Buffer.from(
    JSON.stringify({
      bookingId,
    }),
  ).toString("base64");

  // ===================================================
  // RAW SIGNATURE
  // Thứ tự field phải giữ nguyên
  // ===================================================

  const rawSignature =
    `accessKey=${accessKey}` +
    `&amount=${amount}` +
    `&extraData=${extraData}` +
    `&ipnUrl=${ipnUrl}` +
    `&orderId=${orderId}` +
    `&orderInfo=${orderInfo}` +
    `&partnerCode=${partnerCode}` +
    `&redirectUrl=${redirectUrl}` +
    `&requestId=${requestId}` +
    `&requestType=${requestType}`;

  const signature = createSignature(rawSignature);

  // ===================================================
  // REQUEST BODY
  // ===================================================

  const requestBody = {
    partnerCode,

    partnerName: "Airline Booking",

    storeId: "AirlineBooking",

    requestId,

    amount: String(amount),

    orderId,

    orderInfo,

    redirectUrl,

    ipnUrl,

    lang: "vi",

    requestType,

    autoCapture: true,

    extraData,

    signature,
  };

  // ===================================================
  // CALL MOMO
  // ===================================================

  const response = await axios.post(endpoint, requestBody, {
    headers: {
      "Content-Type": "application/json",
    },

    timeout: 15000,
  });

  return {
    ...response.data,

    bookingId,

    requestId,

    orderId,
  };
}

// =====================================================
// VERIFY IPN SIGNATURE
// =====================================================
function verifyMomoIpnSignature(body) {
  const accessKey = process.env.MOMO_ACCESS_KEY;

  const secretKey = process.env.MOMO_SECRET_KEY;

  if (!accessKey || !secretKey) {
    throw new Error("Thiếu MOMO_ACCESS_KEY hoặc MOMO_SECRET_KEY");
  }

  const {
    partnerCode,
    orderId,
    requestId,
    amount,
    orderInfo,
    orderType,
    transId,
    resultCode,
    message,
    payType,
    responseTime,
    extraData,
    signature,
  } = body;

  const rawSignature =
    `accessKey=${accessKey}` +
    `&amount=${amount}` +
    `&extraData=${extraData}` +
    `&message=${message}` +
    `&orderId=${orderId}` +
    `&orderInfo=${orderInfo}` +
    `&orderType=${orderType}` +
    `&partnerCode=${partnerCode}` +
    `&payType=${payType}` +
    `&requestId=${requestId}` +
    `&responseTime=${responseTime}` +
    `&resultCode=${resultCode}` +
    `&transId=${transId}`;

  const expectedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  return expectedSignature === signature;
}

// =====================================================
// DECODE EXTRA DATA
// =====================================================
function decodeExtraData(extraData) {
  if (!extraData) {
    return {};
  }

  const decoded = Buffer.from(extraData, "base64").toString("utf8");

  return JSON.parse(decoded);
}

module.exports = {
  createMomoPayment,
  verifyMomoIpnSignature,
  decodeExtraData,
};
