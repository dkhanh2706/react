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

export function getLoginReturnTarget(from) {
  if (!from || typeof from.pathname !== "string" || !/^\/(?!\/)[a-z0-9/-]*$/i.test(from.pathname)
    || ["/login", "/register"].includes(from.pathname)) return null;
  return { pathname: from.pathname, search: typeof from.search === "string" && from.search.startsWith("?") ? from.search : "", state: from.state };
}

export function isAdminUser(user) {
  return user?.role === "ADMIN";
}

export function getAuthOwner() {
  const { token, user } = getAuth();
  return token && user?.id ? `user:${user.id}` : "guest";
}

// Persist navigation context only, never passwords or tokens.
export function saveLoginReturnTarget(from, owner = getAuth().user?.id) {
  const target = getLoginReturnTarget(from);
  try {
    if (target) sessionStorage.setItem("login-return", JSON.stringify({ ...target, owner, savedAt: Date.now() }));
  } catch { /* Direct navigation still works when storage is unavailable. */ }
}

export function readLoginReturnTarget(user) {
  try {
    const saved = JSON.parse(sessionStorage.getItem("login-return"));
    if (!saved || !Number.isFinite(saved.savedAt) || Date.now() - saved.savedAt > 30 * 60 * 1000 || (saved.owner && String(saved.owner) !== String(user?.id))) return null;
    return getLoginReturnTarget(saved);
  } catch { return null; }
}

export function clearLoginReturnTarget() {
  try { sessionStorage.removeItem("login-return"); } catch { /* Storage may be disabled. */ }
}

export function clearAuthStorage() {
  clearLoginReturnTarget();
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
