import { useState } from "react";

const TRIPS = [
  { value: "oneway", label: "Một chiều" },
  { value: "round", label: "Khứ hồi" },
  { value: "multi", label: "Nhiều chặng" },
];

function FlightSearch() {
  const [type, setType] = useState("oneway");

  return (
    <div className="flight-box">
      {/* data-type điều khiển viên thuốc trượt trong CSS */}
      <div
        className="trip"
        data-type={type}
        role="group"
        aria-label="Loại hành trình"
      >
        {TRIPS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={type === value ? "active" : ""}
            aria-pressed={type === value}
            onClick={() => setType(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="search-grid">
        <div>
          <label htmlFor="fs-from">Điểm đi</label>

          <input id="fs-from" placeholder="VD: Hà Nội (HAN)" />
        </div>

        <div>
          <label htmlFor="fs-to">Điểm đến</label>

          <input id="fs-to" placeholder="VD: TP.HCM (SGN)" />
        </div>

        <div>
          <label htmlFor="fs-depart">Ngày đi</label>

          <input id="fs-depart" type="date" />
        </div>

        {type === "round" && (
          <div>
            <label htmlFor="fs-return">Ngày về</label>

            <input id="fs-return" type="date" />
          </div>
        )}
      </div>

      <div className="search-grid">
        <div>
          <label htmlFor="fs-passengers">Hành khách</label>

          <select id="fs-passengers">
            <option>1 người lớn</option>

            <option>2 người lớn</option>

            <option>1 người lớn + 1 trẻ em</option>
          </select>
        </div>

        <div>
          <label htmlFor="fs-class">Hạng ghế</label>

          <select id="fs-class">
            <option>Phổ thông</option>

            <option>Phổ thông đặc biệt</option>

            <option>Thương gia</option>
          </select>
        </div>
      </div>

      <button className="search-button">🔍 Tìm chuyến bay</button>
    </div>
  );
}

export default FlightSearch;
