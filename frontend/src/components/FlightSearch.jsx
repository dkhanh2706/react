import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../api/axios";

const AIRPORTS = [
  {
    value: "HAN",
    label: "Nội Bài - Hà Nội",
  },
  {
    value: "SGN",
    label: "Tân Sơn Nhất - TP. Hồ Chí Minh",
  },
  {
    value: "DAD",
    label: "Đà Nẵng",
  },
  {
    value: "PQC",
    label: "Phú Quốc",
  },
  {
    value: "CXR",
    label: "Cam Ranh - Nha Trang",
  },
  {
    value: "DLI",
    label: "Liên Khương - Đà Lạt",
  },
  {
    value: "HUI",
    label: "Phú Bài - Huế",
  },
  {
    value: "VCA",
    label: "Cần Thơ",
  },
  {
    value: "HND",
    label: "Haneda - Tokyo",
  },
  {
    value: "NRT",
    label: "Narita - Tokyo",
  },
  {
    value: "SIN",
    label: "Changi - Singapore",
  },
];

function FlightSearch() {
  const navigate = useNavigate();

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    from: "",
    to: "",
    departDate: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const searchFlight = async () => {
    if (!form.from || !form.to || !form.departDate) {
      toast.error("Vui lòng chọn đầy đủ thông tin chuyến bay");

      return;
    }

    if (form.from === form.to) {
      toast.error("Điểm đi và điểm đến không được trùng nhau");

      return;
    }

    try {
      setLoading(true);

      const response = await api.get("/flights/search", {
        params: {
          from: form.from,
          to: form.to,
          date: form.departDate,
        },
      });

      const flights = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      navigate("/flights", {
        state: {
          flights,

          searchInfo: {
            from: form.from,
            to: form.to,
            departDate: form.departDate,
          },

          source: "home",
        },
      });
    } catch (error) {
      console.error("SEARCH FLIGHT ERROR:", error.response?.data || error);

      toast.error(error.response?.data?.message || "Không thể tìm chuyến bay");
    } finally {
      setLoading(false);
    }
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

          <select name="to" value={form.to} onChange={handleChange}>
            <option value="">-- Chọn điểm đến --</option>

            {AIRPORTS.filter((airport) => airport.value !== form.from).map(
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

      <button
        type="button"
        className="search-button"
        onClick={searchFlight}
        disabled={loading}
      >
        {loading ? "Đang tìm..." : "🔍 Tìm chuyến bay"}
      </button>
    </div>
  );
}

export default FlightSearch;
