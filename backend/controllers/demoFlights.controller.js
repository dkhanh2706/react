const pool = require("../config/database");
const { endpoint, fail } = require("../lib/http");
const { routesFor } = require("../lib/flightRoutes");
const demo = require("../services/demoFlights.service");
const settings = require("../config/demoSchedule");

exports.config = endpoint(async (req, res) => {
  const airports = (await pool.query("SELECT id,code,country FROM airports ORDER BY id")).rows;
  res.json({ enabled: demo.enabled(), mode: "ON_DEMAND", routes: routesFor(airports),
    domestic: settings.DOMESTIC, international: settings.INTERNATIONAL });
});
// Old bookmarks cannot accidentally regenerate thousands of flights.
exports.preview = exports.generate = endpoint(async () => {
  fail(410, "Đã chuyển sang lịch mẫu: tìm tuyến và ngày sẽ tạo chuyến cần dùng, không tạo lịch hàng loạt nữa");
});
