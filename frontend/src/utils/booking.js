const normalizeSeatClass = value => {
  return String(value || "").trim().toUpperCase();
};
const normalizeSeatStatus = value => {
  return String(value || "AVAILABLE").trim().toUpperCase();
};
const normalizeSeats = seatData => {
  if (!Array.isArray(seatData)) {
    return [];
  }
  return seatData.map(seat => ({
    ...seat,
    class: normalizeSeatClass(seat.class),
    status: normalizeSeatStatus(seat.status)
  }));
};
export { normalizeSeatClass, normalizeSeatStatus, normalizeSeats };
