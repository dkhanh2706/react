import { MEAL_OPTIONS } from "./passenger.js";

export function getMealName(value) {
  if (!value || value === "NONE") return "Không chọn";
  return MEAL_OPTIONS.find(option => option.value === value)?.label || value;
}

export function getGenderName(value) {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "MALE") return "Nam";
  if (normalized === "FEMALE") return "Nữ";
  return "Khác";
}
