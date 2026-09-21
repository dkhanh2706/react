// =====================================
// AUTO GENERATE FLIGHT SEARCH SYSTEM
// =====================================

// Danh sách hãng bay giả lập

const airlines = [
  "Vietnam Airlines",
  "Vietjet Air",
  "Bamboo Airways",
  "Pacific Airlines",
];

// =====================================
// Tạo mã chuyến bay
// =====================================

function generateFlightNumber() {
  const prefix = ["VN", "VJ", "QH", "BL"];

  return (
    prefix[Math.floor(Math.random() * prefix.length)] +
    Math.floor(100 + Math.random() * 900)
  );
}

// =====================================
// Sinh giờ bay
// =====================================

function generateDepartureTime() {
  const times = ["06:30", "08:45", "10:20", "13:00", "15:30", "18:45", "21:00"];

  return times[Math.floor(Math.random() * times.length)];
}

// =====================================
// Tính giờ đến
// =====================================

function calculateArrival(time) {
  let hour = Number(time.split(":")[0]);

  let minute = Number(time.split(":")[1]);

  // giả lập thời gian bay 2 tiếng

  hour += 2;

  if (hour >= 24) {
    hour -= 24;
  }

  return (
    hour.toString().padStart(2, "0") + ":" + minute.toString().padStart(2, "0")
  );
}

// =====================================
// Tự sinh chuyến bay
// =====================================

function generateFlights(from, to, date) {
  const flights = [];

  // tạo 2-4 chuyến mỗi lần tìm

  const total = Math.floor(Math.random() * 3) + 2;

  for (let i = 0; i < total; i++) {
    const departure = generateDepartureTime();

    const arrival = calculateArrival(departure);

    const airline = airlines[Math.floor(Math.random() * airlines.length)];

    flights.push({
      id: Date.now() + i,

      flight_number: generateFlightNumber(),

      airline,

      from,

      to,

      date,

      departure_time: departure,

      arrival_time: arrival,

      departure_datetime: `${date} ${departure}`,

      arrival_datetime: `${date} ${arrival}`,

      price: 1200000 + Math.floor(Math.random() * 3500000),

      type: "Bay thẳng",
    });
  }

  return flights;
}

// =====================================
// API SEARCH
// =====================================

exports.searchFlight = async (req, res) => {
  try {
    const {
      from,

      to,

      date,
    } = req.query;

    if (!from || !to || !date) {
      return res.status(400).json({
        message: "Thiếu thông tin tìm kiếm",
      });
    }

    // Không lưu database
    // Không tìm theo ngày
    // Tự sinh chuyến bay

    const result = generateFlights(
      from,

      to,

      date,
    );

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
