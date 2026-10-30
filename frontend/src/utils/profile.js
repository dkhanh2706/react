const API_BASE = String(import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const PROFILE_API = `${API_BASE}/users/profile`;
const AVATAR_API = `${API_BASE}/users/profile/avatar`;
const PASSWORD_CODE_API = `${API_BASE}/users/password/request-code`;
const PASSWORD_CHANGE_API = `${API_BASE}/users/password/change`;

export { API_BASE, PROFILE_API, AVATAR_API, PASSWORD_CODE_API, PASSWORD_CHANGE_API };
