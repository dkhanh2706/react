const pool = require("../config/database");

// =====================================
// LẤY GHẾ THEO CHUYẾN BAY
// GET /api/seats/flight/:flightId
// =====================================

exports.getSeatsByFlight = async (req, res) => {
  try {
    const { flightId } = req.params;

    const result = await pool.query(
      `
            SELECT

                s.id,

                s.seat_number,

                s.class,


                CASE

                    WHEN EXISTS (

                        SELECT 1

                        FROM booking_details bd

                        WHERE bd.seat_id = s.id

                        AND bd.flight_id = f.id

                        AND bd.seat_status IN ('HOLD','BOOKED')

                    )

                    THEN 'BOOKED'


                    ELSE 'AVAILABLE'


                END AS status



            FROM flights f



            JOIN seats s

            ON s.airplane_id = f.airplane_id



            WHERE f.id = $1



            ORDER BY s.id

            `,

      [flightId],
    );

    res.json(result.rows);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Lỗi lấy danh sách ghế",

      error: error.message,
    });
  }
};
