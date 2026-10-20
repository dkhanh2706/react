const { fail } = require("./http");

const validDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
const vietnamToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 100;

function passengerData(input = {}) {
  const data = {
    full_name: String(input.full_name || input.passenger_name || "").trim(),
    email: String(input.email || "").trim().toLowerCase(),
    phone: String(input.phone || "").replace(/\s/g, ""),
    gender: String(input.gender || "").toUpperCase(),
    date_of_birth: String(input.date_of_birth || ""),
    document_type: String(input.document_type || "").toUpperCase(),
    document_number: String(input.document_number || "").trim().toUpperCase(),
  };
  if (data.full_name.length < 2 || data.full_name.length > 100 || !/^[\p{L}\s'.-]+$/u.test(data.full_name)) fail(400, "Họ tên hành khách không hợp lệ");
  if (!validEmail(data.email)) fail(400, "Email hành khách không hợp lệ");
  if (!/^(0\d{9}|\+84\d{9})$/.test(data.phone)) fail(400, "Số điện thoại hành khách không hợp lệ");
  if (!["MALE", "FEMALE", "OTHER"].includes(data.gender)) fail(400, "Giới tính không hợp lệ");
  if (!validDate(data.date_of_birth) || data.date_of_birth > vietnamToday()) fail(400, "Ngày sinh không hợp lệ");
  if (!["CCCD", "PASSPORT"].includes(data.document_type)) fail(400, "Loại giấy tờ không hợp lệ");
  const documentPattern = data.document_type === "CCCD" ? /^(\d{9}|\d{12})$/ : /^[A-Z0-9]{6,20}$/;
  if (!documentPattern.test(data.document_number)) fail(400, "Số giấy tờ không hợp lệ");
  return data;
}

function pricing(basePrice, seatClass, services = {}) {
  const baggage = { 0: 0, 10: 150000, 20: 250000, 30: 350000 };
  const meals = { NONE: 0, CHICKEN_RICE: 80000, BEEF_RICE: 100000, NOODLES: 70000 };
  const multipliers = { ECONOMY: 1, BUSINESS: 1.5, FIRST: 2 };
  const baggageWeight = Number(services.baggage_weight ?? 0);
  const mealType = String(services.meal_type || "NONE").toUpperCase();
  if (!Object.hasOwn(baggage, baggageWeight) || !Object.hasOwn(meals, mealType)) fail(400, "Dịch vụ không hợp lệ");
  if (!Object.hasOwn(multipliers, seatClass) || !Number.isFinite(Number(basePrice)) || Number(basePrice) <= 0) fail(400, "Giá hoặc hạng ghế không hợp lệ");
  const insurance = services.insurance === true || services.insurance === "true";
  const seatFare = Math.round(Number(basePrice) * multipliers[seatClass]);
  return {
    services: { baggage_weight: baggageWeight, baggage_price: baggage[baggageWeight], meal_type: mealType, meal_price: meals[mealType], insurance, insurance_price: insurance ? 50000 : 0 },
    pricing: { base_price: Number(basePrice), seat_fare: seatFare, seat_surcharge: seatFare - Number(basePrice), baggage_price: baggage[baggageWeight], meal_price: meals[mealType], insurance_price: insurance ? 50000 : 0, total_price: seatFare + baggage[baggageWeight] + meals[mealType] + (insurance ? 50000 : 0) },
  };
}

module.exports = { validDate, vietnamToday, validEmail, passengerData, pricing };
