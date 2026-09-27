const pool = require("../config/database");

// =====================================
// AUTO GENERATE FLIGHT SEARCH
// =====================================

const airlines = [
  "Vietnam Airlines",
  "Vietjet Air",
  "Bamboo Airways",
  "Pacific Airlines",
];

function generateFlightNumber() {
  const prefix = ["VN", "VJ", "QH", "BL"];

  return (
    prefix[Math.floor(Math.random() * prefix.length)] +
    Math.floor(100 + Math.random() * 900)
  );
}

function generateDepartureTime() {
  const times = ["06:30", "08:45", "10:20", "13:00", "15:30", "18:45", "21:00"];

  return times[Math.floor(Math.random() * times.length)];
}

function calculateArrival(time) {
  let hour = Number(time.split(":")[0]);

  let minute = Number(time.split(":")[1]);

  hour += 2;

  if (hour >= 24) {
    hour -= 24;
  }

  return (
    hour.toString().padStart(2, "0") + ":" + minute.toString().padStart(2, "0")
  );
}

// lấy máy bay

function getAirplaneId(airline) {
  if (airline === "Vietnam Airlines") return 1;

  if (airline === "Vietjet Air") return 3;

  if (airline === "Bamboo Airways") return 4;

  return 2;
}

// =====================================
// SEARCH FLIGHT
// =====================================

exports.searchFlight = async (req, res) => {
  try {
    const { from, to, date } = req.query;

    if (!from || !to || !date) {
      return res.status(400).json({
        message: "Thiếu thông tin tìm kiếm",
      });
    }

    // lấy chuyến bay mẫu từ database

    const dbFlights = await pool.query(
      `
SELECT 
f.id,
f.flight_number,
a.name AS airline,
f.airplane_id,
f.departure_time,
f.arrival_time,
f.price

FROM flights f

JOIN airlines a
ON f.airline_id=a.id

LIMIT 10
`,
    );

    let result = [];

    dbFlights.rows.forEach((flight, index) => {
      result.push({
        /*
 QUAN TRỌNG:
 id này là id thật database
*/

        id: flight.id,

        flight_number: flight.flight_number,

        airline: flight.airline,

        airplane_id: flight.airplane_id,

        from,

        to,

        date,

        departure_time: flight.departure_time
          ? flight.departure_time.toString().substring(11, 16)
          : generateDepartureTime(),

        arrival_time: flight.arrival_time
          ? flight.arrival_time.toString().substring(11, 16)
          : calculateArrival(generateDepartureTime()),

        departure_datetime: `${date} ${flight.departure_time}`,

        arrival_datetime: `${date} ${flight.arrival_time}`,

        price: Number(flight.price),

        type: "Bay thẳng",
      });
    });

    res.json({
      message: "Tìm chuyến bay thành công",

      data: result,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};
