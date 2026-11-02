import { vietnamToday } from "./format.js";

export function validateRegistration(form) {
  const errors = {};
  const name = form.full_name.trim(), email = form.email.trim().toLowerCase(), phone = form.phone.trim();
  if (name.length < 2 || name.length > 100 || !/^[\p{L}\s'.-]+$/u.test(name)) errors.full_name = "Nhập họ và tên hợp lệ, từ 2 đến 100 ký tự";
  if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,24}$/.test(email) || ["gmail.con", "gmai.com", "gmial.com", "gmail.co", "yahoo.con", "outlook.con"].includes(email.split("@")[1])) errors.email = "Địa chỉ email không hợp lệ";
  if (!/^0\d{9}$/.test(phone)) errors.phone = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0";
  const date = new Date(`${form.birth_date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.birth_date) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== form.birth_date || form.birth_date > vietnamToday()) errors.birth_date = "Chọn ngày sinh hợp lệ, không lớn hơn hôm nay";
  if (!["Nam", "Nữ", "Khác"].includes(form.gender)) errors.gender = "Vui lòng chọn giới tính";
  if (form.password.length < 8 || new TextEncoder().encode(form.password).length > 72) errors.password = "Mật khẩu phải có ít nhất 8 ký tự và không vượt quá 72 byte";
  if (!form.confirm_password || form.confirm_password !== form.password) errors.confirm_password = "Xác nhận mật khẩu phải trùng với mật khẩu";
  return errors;
}
