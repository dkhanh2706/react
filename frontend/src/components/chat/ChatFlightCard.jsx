import { useState } from "react";
import { Link } from "react-router-dom";
import { chatAirportCodes } from "../../utils/chatFlightInput.js";
import { airportName } from "../../utils/airportNames.js";
import { formatDate, vietnamToday } from "../../utils/format.js";
import { validateChatFlight } from "../../utils/chatFlightSearch.js";

export default function ChatFlightCard({ flightData, disabled, onSearch, onApply }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(flightData);
  const [error, setError] = useState("");
  const change = event => {
    const { name, value } = event.target;
    setDraft(current => ({ ...current, [name]: value }));
    setError("");
  };
  const submit = event => {
    event.preventDefault();
    const validation = validateChatFlight(draft);
    if (validation) { setError(validation); return; }
    onApply(`Tìm chuyến bay từ ${draft.from} đến ${draft.to} ngày ${draft.date}`);
  };

  return <section className="flight-search-action chat-flight-card" aria-label="Thông tin tìm chuyến bay">
    <p className="chat-flight-caption">CHUYẾN BAY CỦA BẠN</p>
    {editing ? <form className="chat-flight-edit" onSubmit={submit}>
      {[["from", "Điểm đi"], ["to", "Điểm đến"]].map(([name, label]) => <label key={name}>
        <span>{label}</span>
        <select aria-label={label} name={name} value={draft[name]} onChange={change} disabled={disabled} required>
          {chatAirportCodes.map(code => <option key={code} value={code}>{airportName(code)} ({code})</option>)}
        </select>
      </label>)}
      <label><span>Ngày đi</span><input aria-label="Ngày đi" type="date" name="date" min={vietnamToday()} value={draft.date} onChange={change} disabled={disabled} required /></label>
      {error && <p className="chat-flight-error" role="alert">{error}</p>}
      <div className="chat-flight-actions">
        <button type="submit" disabled={disabled}>Cập nhật</button>
        <button className="chat-flight-secondary" type="button" disabled={disabled} onClick={() => { setEditing(false); setDraft(flightData); setError(""); }}>Hủy sửa</button>
      </div>
    </form> : <>
      <div className="chat-flight-route">
        <div><strong>{airportName(flightData.from)}</strong><span>{flightData.from}</span></div>
        <span aria-label="đến">→</span>
        <div><strong>{airportName(flightData.to)}</strong><span>{flightData.to}</span></div>
      </div>
      <p className="chat-flight-date">Ngày đi <strong>{formatDate(flightData.date)}</strong></p>
      <div className="chat-flight-actions">
        <Link className="chat-flight-primary" to={`/flights?${new URLSearchParams(flightData)}`} aria-disabled={disabled} onClick={event => { if (disabled) event.preventDefault(); else onSearch(event); }}>Xem chuyến bay</Link>
        <button className="chat-flight-secondary" type="button" disabled={disabled} onClick={() => { setDraft(flightData); setEditing(true); }}>Sửa thông tin</button>
      </div>
    </>}
  </section>;
}
