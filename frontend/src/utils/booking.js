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

export function getFlightSearchPath(flight) {
  const from = flight?.departure_code || flight?.from;
  const to = flight?.arrival_code || flight?.to;
  const date = String(flight?.date || flight?.flight_date || "").slice(0, 10);
  return from && to && date ? `/flights?${new URLSearchParams({ from, to, date, source: "home" })}` : "/destinations";
}
