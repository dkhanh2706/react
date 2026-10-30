// Uploaded files are served by the same origin as the configured backend API.
export function getAvatarUrl(value) {
  if (!value) return "";
  const apiBase = import.meta.env.VITE_API_URL || "/api";
  const origin = new URL(apiBase, window.location.origin).origin;
  return new URL(value, `${origin}/`).href;
}
