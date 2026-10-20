// Read-only summary of route rules; this command never creates flights.
const pool = require("../config/database");
const { routesFor } = require("../lib/flightRoutes");
const settings = require("../config/demoSchedule");
pool.query("SELECT id,code,country FROM airports ORDER BY code")
  .then(r => console.log(JSON.stringify({ mode: "ON_DEMAND", templates: { domestic: settings.DOMESTIC, international: settings.INTERNATIONAL }, routes: routesFor(r.rows) }, null, 2)))
  .catch(error => { console.error(error.message); process.exitCode = 1; })
  .finally(() => pool.end());
