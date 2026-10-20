const HUBS = new Set(["HAN", "SGN"]);
const countryName = value => String(value || "").normalize("NFD").replace(/\p{M}/gu, "").replace(/\s+/g, "").toUpperCase();
const domestic = airport => ["VIETNAM", "VN"].includes(countryName(airport.country));

function allowed(from, to) {
  if (!from || !to || !from.country || !to.country || from.code === to.code) return false;
  const a = domestic(from), b = domestic(to);
  return (a && b) || (a && !b && HUBS.has(from.code)) || (!a && b && HUBS.has(to.code));
}

function routesFor(airports) {
  return airports.flatMap(from => airports.filter(to => allowed(from, to)).map(to => ({
    from: from.code, to: to.code, departure_airport_id: from.id, arrival_airport_id: to.id,
    kind: domestic(from) && domestic(to) ? "DOMESTIC" : "INTERNATIONAL",
  })));
}

module.exports = { allowed, routesFor, domestic };
