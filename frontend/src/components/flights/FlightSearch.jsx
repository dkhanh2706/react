import { vietnamToday } from "../../utils/format.js";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../api/axios";

function FlightSearch() {
  const [AIRPORTS, setAirports] = useState([]);
  const [routes, setRoutes] = useState([]);
  useEffect(() => {
    let active = true;
    api.get("/flights/catalog").then(r => { if (active) {
      setAirports(r.data.airports.map(a => ({ ...a, value: a.code, label: `${a.name} - ${a.city || a.code}` })));
      setRoutes(r.data.routes || []);
    } })
      .catch(() => toast.error("Không tải được danh sách sân bay"));
    return () => { active = false; };
  }, []);
  const navigate = useNavigate();

  const today = vietnamToday();

  const [form, setForm] = useState({
    from: "",
    to: "",
    departDate: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      ...(name === "from" ? { to: routes.some(r => r.from === value && r.to === current.to) ? current.to : "" } : {}),
      [name]: value,
    }));
  };

  const searchFlight = () => {
    if (!form.from || !form.to || !form.departDate) {
      toast.error("Vui lòng chọn đầy đủ thông tin chuyến bay");

      return;
    }

    if (form.from === form.to) {
      toast.error("Điểm đi và điểm đến không được trùng nhau");

      return;
    }

    if (form.departDate < today) return toast.error("Vui lòng chọn ngày bay từ hôm nay");
    const query = new URLSearchParams({ from: form.from, to: form.to, date: form.departDate, source: "home" });
    navigate(`/flights?${query}`);
  };

  return (
    <div className="flight-box">
      <h2>Tìm chuyến bay</h2>

      <div className="search-grid">
        <div>
          <label>Điểm đi</label>

          <select name="from" value={form.from} onChange={handleChange}>
            <option value="">-- Chọn điểm đi --</option>

            {AIRPORTS.map((airport) => (
              <option key={airport.value} value={airport.value}>
                {airport.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Điểm đến</label>

          <select name="to" value={form.to} onChange={handleChange} disabled={!form.from}>
            <option value="">-- Chọn điểm đến --</option>

            {AIRPORTS.filter((airport) => routes.some(r => r.from === form.from && r.to === airport.value)).map(
              (airport) => (
                <option key={airport.value} value={airport.value}>
                  {airport.label}
                </option>
              ),
            )}
          </select>
        </div>

        <div>
          <label>Ngày bay</label>

          <input
            type="date"
            name="departDate"
            min={today}
            value={form.departDate}
            onChange={handleChange}
          />
        </div>
      </div>
      <p>Chuyến quốc tế đi/về qua Nội Bài (HAN) hoặc Tân Sơn Nhất (SGN).</p>

      <button
        type="button"
        className="search-button"
        onClick={searchFlight}
      >
        🔍 Tìm chuyến bay
      </button>
    </div>
  );
}

export default FlightSearch;
