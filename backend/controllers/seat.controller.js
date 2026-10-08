const pool = require("../config/database");

// =====================================================
// DỌN CÁC HOLD ĐÃ HẾT HẠN
// =====================================================

async function cleanupExpiredHolds(client, flightId) {
  await client.query(
    `
      UPDATE booking_details
      SET
        seat_status = 'EXPIRED',
        hold_expires_at = NULL
      WHERE flight_id = $1
        AND seat_status = 'HOLD'
        AND hold_expires_at IS NOT NULL
        AND hold_expires_at <= NOW()
    `,
    [flightId],
  );
}

// =====================================================
// LẤY DANH SÁCH GHẾ THEO CHUYẾN BAY
//
// GET /api/seats/flight/:flightId
// =====================================================

exports.getSeatsByFlight = async (req, res) => {
  const client = await pool.connect();

  try {
    const flightId = Number(req.params.flightId);

    // =================================================
    // VALIDATE
    // =================================================

    if (!flightId || Number.isNaN(flightId)) {
      return res.status(400).json({
        message: "flightId không hợp lệ",
      });
    }

    // =================================================
    // KIỂM TRA FLIGHT
    // =================================================

    const flightResult = await client.query(
      `
        SELECT
          id,
          flight_number,
          airplane_id
        FROM flights
        WHERE id = $1
        LIMIT 1
      `,
      [flightId],
    );

    if (flightResult.rows.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy chuyến bay",
      });
    }

    const flight = flightResult.rows[0];

    if (!flight.airplane_id) {
      return res.status(400).json({
        message: "Chuyến bay chưa được gán máy bay",
      });
    }

    // =================================================
    // DỌN HOLD HẾT HẠN
    // =================================================

    await cleanupExpiredHolds(client, flightId);

    // =================================================
    // LẤY GHẾ
    // =================================================

    const result = await client.query(
      `
        SELECT
          s.id,

          s.seat_number,

          UPPER(s.class::text) AS class,

          CASE

            -- ========================================
            -- ĐÃ ĐẶT
            -- ========================================

            WHEN EXISTS (
              SELECT 1
              FROM booking_details bd
              WHERE bd.flight_id = $1
                AND bd.seat_id = s.id
                AND bd.seat_status = 'BOOKED'
            )
            THEN 'BOOKED'

            -- ========================================
            -- ĐANG ĐƯỢC GIỮ
            -- ========================================

            WHEN EXISTS (
              SELECT 1
              FROM booking_details bd
              WHERE bd.flight_id = $1
                AND bd.seat_id = s.id
                AND bd.seat_status = 'HOLD'
                AND bd.hold_expires_at IS NOT NULL
                AND bd.hold_expires_at > NOW()
            )
            THEN 'HOLD'

            -- ========================================
            -- CÒN TRỐNG
            -- ========================================

            ELSE 'AVAILABLE'

          END AS status,

          (
            SELECT bd.hold_expires_at
            FROM booking_details bd
            WHERE bd.flight_id = $1
              AND bd.seat_id = s.id
              AND bd.seat_status = 'HOLD'
              AND bd.hold_expires_at IS NOT NULL
              AND bd.hold_expires_at > NOW()
            ORDER BY bd.id DESC
            LIMIT 1
          ) AS hold_expires_at

        FROM seats s

        WHERE s.airplane_id = $2

        ORDER BY
          CASE
            WHEN UPPER(s.class::text) = 'BUSINESS' THEN 1
            WHEN UPPER(s.class::text) = 'ECONOMY' THEN 2
            WHEN UPPER(s.class::text) = 'FIRST' THEN 3
            ELSE 4
          END,
          s.seat_number ASC
      `,
      [flightId, flight.airplane_id],
    );

    // =================================================
    // DEBUG
    // Có thể giữ tạm để kiểm tra
    // =================================================

    console.log(
      `Flight ${flightId} - airplane ${flight.airplane_id} - seats:`,
      result.rows.length,
    );

    console.log("Seat classes:", [
      ...new Set(result.rows.map((seat) => seat.class)),
    ]);

    // =================================================
    // RESPONSE
    // =================================================

    return res.json(result.rows);
  } catch (error) {
    console.error("getSeatsByFlight error:", error);

    return res.status(500).json({
      message: "Lỗi lấy danh sách ghế",
      error: error.message,
    });
  } finally {
    client.release();
  }
};
