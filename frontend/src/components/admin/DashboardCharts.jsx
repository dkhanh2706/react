import { useState } from "react";
import { formatMoney, formatNumber } from "../../utils/format.js";

const colors = { momo: "#7c3aed", mock: "#0d9488", available: "#7c3aed", delayed: "#d97706", cancelled: "#e11d48", other: "#64748b" };
const names = { momo: "MoMo", mock: "MOCK (giả lập)", available: "Mở bán", delayed: "Hoãn", cancelled: "Hủy", other: "Trạng thái khác" };
const periodLabel = (period, group) => group === "month" ? `${period.slice(5, 7)}/${period.slice(0, 4)}` : `${period.slice(8, 10)}/${period.slice(5, 7)}`;

export function PeriodChart({ title, description, points, series, money = false, group }) {
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const selected = points.find(point => point.period === selectedPeriod);
  const maximum = Math.max(1, ...points.map(point => money ? Math.max(...series.map(key => point[key])) : series.reduce((sum, key) => sum + point[key], 0)));
  const display = money ? formatMoney : formatNumber;
  return <section className="dash-panel dash-chart" aria-label={title}>
    <div className="dash-panel-heading"><div><h2>{title}</h2><p>{description}</p></div></div>
    <div className="dash-legend">{series.map(key => <span key={key}><i style={{ background: colors[key] }} />{names[key]}</span>)}</div>
    <p className="dash-scale">Thang cao nhất: {display(maximum === 1 && points.every(p => series.every(key => !p[key])) ? 0 : maximum)}</p>
    <div className="dash-chart-scroll">
      <div className="dash-bars" style={{ minWidth: `${Math.max(300, points.length * 38)}px`, gridTemplateColumns: `repeat(${points.length || 1}, minmax(0, 1fr))` }}>
        {points.map(point => {
          const text = `${periodLabel(point.period, group)}: ${series.map(key => `${names[key]} ${display(point[key])}`).join(", ")}`;
          return <button key={point.period} type="button" className={`dash-bar-button ${selectedPeriod === point.period ? "is-selected" : ""}`} aria-label={text} aria-pressed={selectedPeriod === point.period} onClick={() => setSelectedPeriod(point.period)} title={text}>
            <span className={`dash-bar-stack ${money ? "dash-bar-grouped" : ""}`}>{series.map(key => <span key={key} style={{ height: `${point[key] / maximum * 100}%`, background: colors[key] }} />)}</span>
            <span className="dash-bar-label">{periodLabel(point.period, group)}</span>
          </button>;
        })}
      </div>
    </div>
    <p className="dash-chart-detail" aria-live="polite">{selected ? `${periodLabel(selected.period, group)} · ${series.map(key => `${names[key]}: ${display(selected[key])}`).join(" · ")}` : "Chọn một cột để xem số liệu chi tiết."}</p>
  </section>;
}

export function SeatChart({ summary }) {
  const { booked_seats: booked, held_seats: held, empty_seats: empty, offered_seats: total, occupancy_rate: rate } = summary;
  const soldAngle = total ? booked / total * 360 : 0;
  const heldAngle = total ? (booked + held) / total * 360 : 0;
  return <section className="dash-panel dash-seat-panel" aria-label="Phân bổ ghế">
    <div className="dash-panel-heading"><div><h2>Phân bổ ghế</h2><p>Theo ngày khởi hành; chỉ gồm chuyến mở bán và hoãn.</p></div></div>
    <div className="dash-seat-content">
      <div className="dash-donut" role="img" aria-label={`${booked} ghế đã bán, ${held} ghế đang giữ còn hạn, ${empty} ghế còn trống trên ${total} ghế`} style={{ background: total ? `conic-gradient(#7c3aed 0deg ${soldAngle}deg, #d97706 ${soldAngle}deg ${heldAngle}deg, #e2e8f0 ${heldAngle}deg 360deg)` : "#e2e8f0" }}>
        <div><strong>{rate === null ? "—" : `${rate.toFixed(1)}%`}</strong><span>{total ? "Tỷ lệ lấp đầy" : "Chưa có dữ liệu"}</span></div>
      </div>
      <dl className="dash-seat-legend">{[["Đã bán", booked, "#7c3aed"], ["Đang giữ còn hạn", held, "#d97706"], ["Còn trống", empty, "#e2e8f0"]].map(([name, value, color]) => <div key={name}><dt><i style={{ background: color }} />{name}</dt><dd>{formatNumber(value)}</dd></div>)}<div className="dash-seat-total"><dt>Tổng ghế cung ứng</dt><dd>{formatNumber(total)}</dd></div></dl>
    </div>
    <p className="dash-footnote">Tỷ lệ lấp đầy = tổng ghế đã bán / tổng ghế cung ứng × 100%. Ghế giữ chưa thanh toán được thống kê riêng.</p>
  </section>;
}
