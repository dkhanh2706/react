// ============================
// SEARCH FLIGHT MOCK DATA
// ============================

const flights = [
  {
    id: 1,

    flight_number: "VN201",

    airline: "Vietnam Airlines",

    from: "HAN",

    to: "SGN",

    departure_time: "08:30",

    arrival_time: "10:40",

    price: 2500000,

    type: "Bay thẳng",
  },

  {
    id: 2,

    flight_number: "VJ301",

    airline: "Vietjet Air",

    from: "HAN",

    to: "SGN",

    departure_time: "14:00",

    arrival_time: "16:15",

    price: 1800000,

    type: "Bay thẳng",
  },

  {
    id: 3,

    flight_number: "QH101",

    airline: "Bamboo Airways",

    from: "HAN",

    to: "DAD",

    departure_time: "09:20",

    arrival_time: "10:40",

    price: 1600000,

    type: "Bay thẳng",
  },

  {
    id: 4,

    flight_number: "VN550",

    airline: "Vietnam Airlines",

    from: "SGN",

    to: "SIN",

    departure_time: "12:00",

    arrival_time: "15:10",

    price: 4200000,

    type: "Bay thẳng",
  },

  {
    id: 5,

    flight_number: "JL701",

    airline: "Japan Airlines",

    from: "HND",

    to: "SIN",

    departure_time: "18:00",

    arrival_time: "23:30",

    price: 6500000,

    type: "Bay thẳng",
  },
];

exports.searchFlight = async (req, res) => {
  try {
    const {
      from,

      to,

      date,
    } = req.query;

    const result = flights.filter(
      (flight) => flight.from === from && flight.to === to,
    );

    res.json({
      message: "Tìm chuyến bay thành công",

      date: date,

      data: result,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: error.message,
    });
  }
};
