import { normalizeAirport, normalizeDate } from './chatFlightInput.js';
import { validateChatFlight } from './chatFlightSearch.js';
import { vietnamToday } from './format.js';

const storageKey = 'flight-support-search';
const empty = () => ({ flightData: { from: '', to: '', date: '' }, step: 'idle' });

export function readChatSearch(storage, credentials, today = vietnamToday()) {
  try {
    const owner = credentials || JSON.parse(globalThis.localStorage.getItem('flight-support-session'));
    const saved = JSON.parse((storage || globalThis.sessionStorage).getItem(storageKey));
    if (!owner?.id || saved?.id !== owner.id) return empty();
    const flightData = {
      from: normalizeAirport(saved.flightData?.from), to: normalizeAirport(saved.flightData?.to),
      date: normalizeDate(saved.flightData?.date),
    };
    if (flightData.date < today) flightData.date = '';
    const pending = !flightData.from ? 'from' : !flightData.to ? 'to' : 'date';
    const step = saved.step === 'done' ? validateChatFlight(flightData, today) ? pending : 'done'
      : ['from', 'to', 'date'].includes(saved.step) ? pending : 'idle';
    return { flightData, step };
  } catch { return empty(); }
}

export function saveChatSearch(id, flightData, step, storage) {
  try { (storage || globalThis.sessionStorage).setItem(storageKey, JSON.stringify({ id, flightData, step })); } catch { /* Chat remains usable when storage is unavailable. */ }
}

export function clearChatSearch(storage) {
  try { (storage || globalThis.sessionStorage).removeItem(storageKey); } catch { /* Storage can be disabled. */ }
}
