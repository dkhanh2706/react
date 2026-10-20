// Limits are per process; use a shared store for multiple backend instances.
module.exports = function rateLimit({ max = 10, windowMs = 600000 } = {}) {
  const attempts = new Map();
  return (req, res, next) => {
    const now = Date.now();
    for (const [key, entry] of attempts) if (entry.until <= now) attempts.delete(key);
    const key = req.ip;
    const entry = attempts.get(key) || { count: 0, until: now + windowMs };
    entry.count += 1;
    attempts.set(key, entry);
    if (entry.count > max) {
      res.set("Retry-After", String(Math.ceil((entry.until - now) / 1000)));
      return res.status(429).json({ message: "Bạn thao tác quá nhiều lần. Vui lòng thử lại sau." });
    }
    next();
  };
};
