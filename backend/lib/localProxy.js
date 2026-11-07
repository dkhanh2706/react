// Development API binds to loopback; only the local Vite proxy supplies client IPs.
module.exports = function configureLocalProxy(app) {
  const configured = process.env.TRUST_PROXY?.trim();
  // Accept a verified hop count or a comma-separated list of trusted CIDRs.
  const trust = !configured || configured === "false" ? false
    : /^\d+$/.test(configured) ? Number(configured)
    : configured.split(",").map(value => value.trim());
  app.set("trust proxy", process.env.NODE_ENV !== "production" ? "loopback" : trust);
};
