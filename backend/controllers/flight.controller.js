const pool = require("../config/database");
const Flight = require("../models/flight.models");

// =====================================
// HÀM PHỤ TRỢ
// =====================================

function generateDepartureTime() {
  const times = ["06:30", "08:45", "10:20", "13:00", "15:30", "18:45", "21:00"];

  return times[Math.floor(Math.random() * times.length)];
}

function calculateArrival(time) {
  let [hour, minute] = time.split(":");

  hour = Number(hour) + 2;

  if (hour >= 24) {
    hour -= 24;
  }

  return hour.toString().padStart(2, "0") + ":" + minute;
}

// format giờ an toàn

function formatTime(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (isNaN(date)) {
    return value.toString().substring(0, 5);
  }

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =====================================
// CUSTOMER SEARCH FLIGHT
// =====================================

exports.searchFlight = async (req, res) => {
  try {
    const { from, to, date } = req.query;

    if (!from || !to || !date) {
      return res.status(400).json({
        message: "Thiếu thông tin tìm kiếm",
      });
    }

    const result = await pool.query(
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

        ON f.airline_id = a.id


        LIMIT 10

        `,
    );

    const flights = result.rows.map((flight) => {
      let departure = formatTime(flight.departure_time);

      let arrival = formatTime(flight.arrival_time);

      if (!departure) {
        departure = generateDepartureTime();
      }

      if (!arrival) {
        arrival = calculateArrival(departure);
      }

      return {
        id: flight.id,

        flight_number: flight.flight_number,

        airline: flight.airline,

        airplane_id: flight.airplane_id,

        from,

        to,

        date,

        departure_time: departure,

        arrival_time: arrival,

        departure_datetime: `${date} ${departure}`,

        arrival_datetime: `${date} ${arrival}`,

        price: Number(flight.price),

        type: "Bay thẳng",
      };
    });

    res.json({
      message: "Tìm chuyến bay thành công",

      data: flights,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================
// ADMIN - GET ALL FLIGHTS
// =====================================

exports.getAllFlights = async (req, res) => {
  try {
    const flights = await Flight.getAllFlights();

    res.json({
      data: flights,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================
// ADMIN - CREATE FLIGHT
// =====================================

exports.createFlight = async (req, res) => {
  try {
    const flight = await Flight.createFlight(req.body);

    res.json({
      message: "Thêm chuyến bay thành công",

      data: flight,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================
// ADMIN - UPDATE FLIGHT
// =====================================

exports.updateFlight = async (req, res) => {
  try {
    const flight = await Flight.updateFlight(
      req.params.id,

      req.body,
    );

    res.json({
      message: "Cập nhật chuyến bay thành công",

      data: flight,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================
// ADMIN - DELETE FLIGHT
// =====================================

exports.deleteFlight = async (req, res) => {
  try {
    await Flight.deleteFlight(req.params.id);

    res.json({
      message: "Xóa chuyến bay thành công",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
