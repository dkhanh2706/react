const pool = require("../config/database");

// ===============================
// LẤY TOÀN BỘ GHẾ THEO MÁY BAY
// GET /api/seats/airplane/:airplaneId
// ===============================

exports.getSeatsByAirplane = async (req, res) => {
  try {
    const { airplaneId } = req.params;

    const result = await pool.query(
      `
            SELECT 
                id,
                seat_number,
                class
            FROM seats
            WHERE airplane_id = $1
            ORDER BY id
            `,
      [airplaneId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Lỗi lấy danh sách ghế",
      error: error.message,
    });
  }
};

// ===============================
// LẤY GHẾ ĐÃ ĐẶT THEO CHUYẾN BAY
// GET /api/seats/booked/:flightId
// ===============================

exports.getBookedSeats = async (req, res) => {
  try {
    const { flightId } = req.params;

    const result = await pool.query(
      `
            SELECT 
                bd.seat_id,
                s.seat_number
            FROM booking_details bd

            JOIN seats s
            ON bd.seat_id = s.id

            WHERE bd.flight_id = $1
            `,
      [flightId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Lỗi lấy ghế đã đặt",
      error: error.message,
    });
  }
};
