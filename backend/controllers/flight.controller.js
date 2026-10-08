const pool = require("../config/database");
const Flight = require("../models/flight.models");

// =====================================================
// CẤU HÌNH CHUYẾN BAY TỰ SINH
// =====================================================

const AUTO_FLIGHT_TIMES = [
  {
    departure: "06:30",
    arrival: "08:30",
  },
  {
    departure: "08:45",
    arrival: "10:45",
  },
  {
    departure: "10:20",
    arrival: "12:20",
  },
  {
    departure: "13:00",
    arrival: "15:00",
  },
  {
    departure: "15:30",
    arrival: "17:30",
  },
];

// =====================================================
// HÀM PHỤ TRỢ
// =====================================================

// Format YYYY-MM-DD
function isValidDateString(value) {
  if (!value) {
    return false;
  }

  const regex = /^\d{4}-\d{2}-\d{2}$/;

  if (!regex.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);

  return !Number.isNaN(date.getTime());
}

// =====================================================
// FORMAT NGÀY
// =====================================================

function formatDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// =====================================================
// FORMAT GIỜ
// =====================================================

function formatTime(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  // Nếu database trả TIME hoặc string
  if (Number.isNaN(date.getTime())) {
    const stringValue = String(value);

    const match = stringValue.match(/(\d{1,2}):(\d{2})/);

    if (match) {
      return `${match[1].padStart(2, "0")}:${match[2]}`;
    }

    return null;
  }

  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

// =====================================================
// TẠO DATETIME
// =====================================================

function createDateTime(date, time) {
  return `${date} ${time}:00`;
}

// =====================================================
// KIỂM TRA ARRIVAL CÓ QUA NGÀY KHÁC KHÔNG
// =====================================================

function getArrivalDate(date, departureTime, arrivalTime) {
  const departure = Number(departureTime.replace(":", ""));

  const arrival = Number(arrivalTime.replace(":", ""));

  if (arrival > departure) {
    return date;
  }

  const result = new Date(`${date}T00:00:00`);

  result.setDate(result.getDate() + 1);

  return result.toISOString().split("T")[0];
}

// =====================================================
// TẠO MÃ CHUYẾN BAY
// =====================================================

function generateFlightNumber(date, index) {
  const shortDate = date.replaceAll("-", "").slice(2);

  const randomNumber = Math.floor(Math.random() * 90) + 10;

  return `A${shortDate}${index + 1}${randomNumber}`;
}

// =====================================================
// MAP CHUYẾN BAY TRẢ VỀ FRONTEND
// =====================================================

function mapFlight(flight, from, to, requestedDate) {
  const departureTime = formatTime(flight.departure_time);

  const arrivalTime = formatTime(flight.arrival_time);

  return {
    id: flight.id,

    flight_number: flight.flight_number,

    airline: flight.airline,

    airplane_id: flight.airplane_id,

    // ----------------------------
    // ĐIỂM ĐI / ĐẾN
    // ----------------------------

    from: flight.departure_code || from,

    to: flight.arrival_code || to,

    departure_code: flight.departure_code || from,

    arrival_code: flight.arrival_code || to,

    departure_city: flight.departure_city || "",

    arrival_city: flight.arrival_city || "",

    // ----------------------------
    // NGÀY
    // ----------------------------

    date: requestedDate || formatDate(flight.departure_time),

    // ----------------------------
    // GIỜ
    // ----------------------------

    departure_time: departureTime,

    arrival_time: arrivalTime,

    // Có thêm datetime đầy đủ
    // để frontend sử dụng nếu cần

    departure_datetime: flight.departure_time,

    arrival_datetime: flight.arrival_time,

    // ----------------------------
    // GIÁ
    // ----------------------------

    price: Number(flight.price || 0),

    status: flight.status,

    type: "Bay thẳng",
  };
}

// =====================================================
// QUERY CHUYẾN BAY THEO CHẶNG + NGÀY
// =====================================================

async function findFlights(client, from, to, date) {
  const result = await client.query(
    `
        SELECT
          f.id,
          f.flight_number,

          f.airline_id,
          a.name AS airline,

          f.airplane_id,

          f.departure_airport_id,
          da.code AS departure_code,
          da.name AS departure_city,

          f.arrival_airport_id,
          aa.code AS arrival_code,
          aa.name AS arrival_city,

          f.departure_time,
          f.arrival_time,

          f.status,
          f.price

        FROM flights f

        JOIN airlines a
          ON a.id = f.airline_id

        JOIN airports da
          ON da.id =
            f.departure_airport_id

        JOIN airports aa
          ON aa.id =
            f.arrival_airport_id

        WHERE UPPER(da.code)
              = UPPER($1)

          AND UPPER(aa.code)
              = UPPER($2)

          AND DATE(
                f.departure_time
              ) = $3::date

        ORDER BY
          f.departure_time ASC

        LIMIT 10
      `,
    [from, to, date],
  );

  return result.rows;
}

// =====================================================
// CUSTOMER SEARCH FLIGHT
//
// GET
// /api/flights/search
//
// ?from=SGN
// &to=DAD
// &date=2026-10-20
// =====================================================

exports.searchFlight = async (req, res) => {
  const client = await pool.connect();

  try {
    let { from, to, date } = req.query;

    // ==========================================
    // CLEAN INPUT
    // ==========================================

    from = String(from || "")
      .trim()
      .toUpperCase();

    to = String(to || "")
      .trim()
      .toUpperCase();

    date = String(date || "").trim();

    // ==========================================
    // VALIDATE
    // ==========================================

    if (!from || !to || !date) {
      return res.status(400).json({
        message: "Thiếu thông tin tìm kiếm",
      });
    }

    if (from === to) {
      return res.status(400).json({
        message: "Điểm đi và điểm đến không được trùng nhau",
      });
    }

    if (!isValidDateString(date)) {
      return res.status(400).json({
        message: "Ngày bay không hợp lệ",
      });
    }

    // ==========================================
    // BẮT ĐẦU TRANSACTION
    // ==========================================

    await client.query("BEGIN");

    // ==========================================
    // KHÓA THEO CHẶNG + NGÀY
    //
    // Tránh 2 người tìm cùng lúc
    // làm sinh trùng chuyến bay.
    // ==========================================

    const lockKey = `FLIGHT_${from}_${to}_${date}`;

    await client.query(
      `
          SELECT
            pg_advisory_xact_lock(
              hashtext($1)
            )
        `,
      [lockKey],
    );

    // ==========================================
    // KIỂM TRA SÂN BAY
    // ==========================================

    const airportResult = await client.query(
      `
            SELECT
              id,
              code,
              name

            FROM airports

            WHERE UPPER(code)
              IN (
                UPPER($1),
                UPPER($2)
              )
          `,
      [from, to],
    );

    const departureAirport = airportResult.rows.find(
      (airport) => String(airport.code).toUpperCase() === from,
    );

    const arrivalAirport = airportResult.rows.find(
      (airport) => String(airport.code).toUpperCase() === to,
    );

    if (!departureAirport) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: `Không tìm thấy sân bay ${from} trong hệ thống`,
      });
    }

    if (!arrivalAirport) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: `Không tìm thấy sân bay ${to} trong hệ thống`,
      });
    }

    // ==========================================
    // TÌM CHUYẾN ĐÃ TỒN TẠI
    // ==========================================

    let flights = await findFlights(client, from, to, date);

    // ==========================================
    // NẾU CHƯA CÓ
    // => TỰ SINH CHUYẾN BAY CHO NGÀY ĐÓ
    // ==========================================

    if (flights.length === 0) {
      // ----------------------------------------
      // LẤY CÁC CHUYẾN CÓ SẴN
      // LÀM TEMPLATE
      // ----------------------------------------

      const templateResult = await client.query(
        `
              SELECT
                airline_id,
                airplane_id,
                price

              FROM flights

              WHERE airline_id
                    IS NOT NULL

                AND airplane_id
                    IS NOT NULL

              ORDER BY
                id ASC

              LIMIT 5
            `,
      );

      const templates = templateResult.rows;

      if (templates.length === 0) {
        await client.query("ROLLBACK");

        return res.status(500).json({
          message: "Chưa có dữ liệu chuyến bay mẫu để tự sinh chuyến bay",
        });
      }

      // ----------------------------------------
      // TẠO 5 CHUYẾN
      // ----------------------------------------

      for (let i = 0; i < AUTO_FLIGHT_TIMES.length; i += 1) {
        const schedule = AUTO_FLIGHT_TIMES[i];

        const template = templates[i % templates.length];

        const arrivalDate = getArrivalDate(
          date,
          schedule.departure,
          schedule.arrival,
        );

        const departureDateTime = createDateTime(date, schedule.departure);

        const arrivalDateTime = createDateTime(arrivalDate, schedule.arrival);

        // Giá tăng nhẹ giữa
        // các khung giờ

        const basePrice = Number(template.price || 1000000);

        const priceMultiplier = 1 + i * 0.05;

        const generatedPrice =
          Math.round((basePrice * priceMultiplier) / 10000) * 10000;

        const flightNumber = generateFlightNumber(date, i);

        await client.query(
          `
              INSERT INTO flights
              (
                flight_number,

                airline_id,
                airplane_id,

                departure_airport_id,
                arrival_airport_id,

                departure_time,
                arrival_time,

                price,
                status
              )

              VALUES
              (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                'AVAILABLE'
              )
            `,
          [
            flightNumber,

            template.airline_id,

            template.airplane_id,

            departureAirport.id,

            arrivalAirport.id,

            departureDateTime,

            arrivalDateTime,

            generatedPrice,
          ],
        );
      }

      // ----------------------------------------
      // QUERY LẠI
      // ----------------------------------------

      flights = await findFlights(client, from, to, date);
    }

    // ==========================================
    // COMMIT
    // ==========================================

    await client.query("COMMIT");

    // ==========================================
    // MAP DATA
    // ==========================================

    const data = flights.map((flight) => mapFlight(flight, from, to, date));

    return res.json({
      message: "Tìm chuyến bay thành công",

      count: data.length,

      data,
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("ROLLBACK searchFlight:", rollbackError);
    }

    console.error("searchFlight error:", error);

    return res.status(500).json({
      message: error.message,
    });
  } finally {
    client.release();
  }
};

// =====================================================
// ADMIN - GET ALL FLIGHTS
// =====================================================

exports.getAllFlights = async (req, res) => {
  try {
    const flights = await Flight.getAllFlights();

    return res.json({
      data: flights,
    });
  } catch (error) {
    console.error("getAllFlights error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================================
// ADMIN - CREATE FLIGHT
// =====================================================

exports.createFlight = async (req, res) => {
  try {
    const flight = await Flight.createFlight(req.body);

    return res.json({
      message: "Thêm chuyến bay thành công",

      data: flight,
    });
  } catch (error) {
    console.error("createFlight error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================================
// ADMIN - UPDATE FLIGHT
// =====================================================

exports.updateFlight = async (req, res) => {
  try {
    const flight = await Flight.updateFlight(req.params.id, req.body);

    if (!flight) {
      return res.status(404).json({
        message: "Không tìm thấy chuyến bay",
      });
    }

    return res.json({
      message: "Cập nhật chuyến bay thành công",

      data: flight,
    });
  } catch (error) {
    console.error("updateFlight error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================================
// ADMIN - DELETE FLIGHT
// =====================================================

exports.deleteFlight = async (req, res) => {
  try {
    await Flight.deleteFlight(req.params.id);

    return res.json({
      message: "Xóa chuyến bay thành công",
    });
  } catch (error) {
    console.error("deleteFlight error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};
