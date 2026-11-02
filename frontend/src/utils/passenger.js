import { getStoredUser } from "./auth.js";
const passengerFromProfile = (user) => {
  const genders = { nam: "MALE", male: "MALE", "nữ": "FEMALE", nu: "FEMALE", female: "FEMALE", "khác": "OTHER", khac: "OTHER", other: "OTHER" };
  return {
    full_name: user?.full_name || user?.name || "",
    gender: genders[String(user?.gender || "").toLowerCase()] || "",
    date_of_birth: String(user?.birth_date || "").slice(0, 10), document_type: "CCCD", document_number: "",
    phone: user?.phone || "", email: user?.email || "",
  };
};
const getInitialPassenger = () => passengerFromProfile(getStoredUser());
const BAGGAGE_OPTIONS = [{
  weight: 0,
  label: "Không thêm hành lý ký gửi",
  description: "Chỉ sử dụng hành lý xách tay theo tiêu chuẩn hãng",
  price: 0
}, {
  weight: 10,
  label: "Hành lý ký gửi 10kg",
  description: "Phù hợp chuyến đi ngắn ngày",
  price: 150000
}, {
  weight: 20,
  label: "Hành lý ký gửi 20kg",
  description: "Lựa chọn phổ biến",
  price: 250000
}, {
  weight: 30,
  label: "Hành lý ký gửi 30kg",
  description: "Phù hợp khi mang nhiều hành lý",
  price: 350000
}];
const MEAL_OPTIONS = [{
  value: "NONE",
  label: "Không chọn suất ăn",
  price: 0
}, {
  value: "CHICKEN_RICE",
  label: "Cơm gà",
  price: 80000
}, {
  value: "BEEF_RICE",
  label: "Cơm bò",
  price: 100000
}, {
  value: "NOODLES",
  label: "Mì",
  price: 70000
}];
export { getInitialPassenger, passengerFromProfile, BAGGAGE_OPTIONS, MEAL_OPTIONS };
