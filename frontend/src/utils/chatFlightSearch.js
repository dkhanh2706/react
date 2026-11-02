import { normalizeAirport, normalizeDate } from "./chatFlightInput.js";
import { vietnamToday } from "./format.js";

export function validateChatFlight(data, today = vietnamToday()) {
  const from = normalizeAirport(data.from), to = normalizeAirport(data.to), date = normalizeDate(data.date);
  if (!from) return "Bạn muốn bay từ đâu?";
  if (!to) return "Bạn muốn đến đâu?";
  if (from === to) return "Điểm đến không được trùng với điểm đi. Bạn chọn điểm đến khác nhé.";
  if (!date) return "Bạn nhập ngày bay hợp lệ theo dạng DD/MM/YYYY nhé.";
  if (date < today) return "Ngày bay không thể là ngày đã qua. Bạn chọn ngày khác nhé.";
  return "";
}
