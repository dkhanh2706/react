// Development API binds to loopback; only the local Vite proxy supplies client IPs.
module.exports = function configureLocalProxy(app) {
  app.set("trust proxy", process.env.NODE_ENV !== "production" ? "loopback" : false);
};
