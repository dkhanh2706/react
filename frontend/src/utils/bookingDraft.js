import { getAuthOwner } from "./auth.js";

const prefix = "flight-booking-draft:";
const lifetime = 30 * 60 * 1000;
const keyFor = (flightId, owner) => `${prefix}${owner}:${flightId}`;

export function readBookingDraft(flightId, storage = globalThis.sessionStorage, owner = getAuthOwner(), now = Date.now()) {
  try {
    if (!flightId || owner === "guest") return null;
    const key = keyFor(flightId, owner);
    const draft = JSON.parse(storage.getItem(key));
    if (!draft || draft.owner !== owner || String(draft.flight?.id) !== String(flightId) || !Number.isFinite(draft.savedAt) || now - draft.savedAt > lifetime) {
      storage.removeItem(key);
      return null;
    }
    return draft;
  } catch { return null; }
}

export function saveBookingDraft(draft, storage = globalThis.sessionStorage, owner = getAuthOwner(), now = Date.now()) {
  try {
    if (owner !== "guest" && draft.flight?.id) storage.setItem(keyFor(draft.flight.id, owner), JSON.stringify({ ...draft, owner, savedAt: now }));
  } catch { /* Booking remains available if browser storage is disabled. */ }
}

export function clearBookingDraft(flightId, storage = globalThis.sessionStorage, owner = getAuthOwner()) {
  try { storage.removeItem(keyFor(flightId, owner)); } catch { /* Storage may be disabled. */ }
}
