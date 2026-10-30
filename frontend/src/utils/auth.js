export function getStoredUser(fallback = null) {
  try {
    const stored = localStorage.getItem("user");
    if (!stored) return fallback;
    const user = JSON.parse(stored);
    return user && typeof user === "object" && !Array.isArray(user) ? user : fallback;
  } catch {
    try { localStorage.removeItem("user"); } catch { /* Storage may be disabled. */ }
    return fallback;
  }
}

export function getAuth() {
  try { return { token: localStorage.getItem("token"), user: getStoredUser() }; }
  catch { return { token: null, user: null }; }
}

export function isAdminUser(user) {
  return user?.role === "ADMIN";
}

export function clearAuthStorage() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.dispatchEvent(new Event("auth-changed"));
}

export function isTokenExpired(token) {
  try {
    if (!token || token.split(".").length !== 3) return true;
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(decodeURIComponent(Array.from(atob(payload), char =>
      `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`).join("")));
    return decoded.exp ? decoded.exp <= Math.floor(Date.now() / 1000) : false;
  } catch { return true; }
}
