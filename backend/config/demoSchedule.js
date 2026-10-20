// Approved classroom examples; these are not real airline fares or timetables.
module.exports = {
  airlineCode: "VN",
  planeModels: Array.from({ length: 12 }, (_, i) => `DEMO-A320-${String(i + 1).padStart(2, "0")}`),
  DOMESTIC: { minutes: 120, price: 1500000 },
  INTERNATIONAL: { minutes: 480, price: 5500000 },
};
