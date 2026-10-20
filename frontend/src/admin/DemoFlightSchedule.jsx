import { useEffect, useState } from "react";
import api from "../api/axios";
import "../styles/admin/DemoFlightSchedule.css";

export default function DemoFlightSchedule() {
  const [config, setConfig] = useState(null);
  useEffect(() => {
    let active = true;
    api.get("/flights/demo/config").then(r => { if (active) setConfig(r.data); }).catch(() => {});
    return () => { active = false; };
  }, []);
  if (!config?.enabled) return null;
  return <section className="demo-schedule-panel">
    <strong>Lịch mẫu cho báo cáo môn học</strong>
    <p>Có {config.routes.length} tuyến: nội địa giữa các sân bay Việt Nam; quốc tế hai chiều chỉ qua HAN hoặc SGN.</p>
    <p>Nội địa: 2 giờ, {config.domestic.price.toLocaleString("vi-VN")}đ. Quốc tế: 8 giờ, {config.international.price.toLocaleString("vi-VN")}đ. Đây là giá cơ bản hạng phổ thông.</p>
    <p>Khi khách tìm tuyến và ngày, hệ thống lưu chuyến cần dùng vào danh sách bên dưới. Tìm lại dùng cùng chuyến, không tạo lịch trước cả năm. Chuyến đã hủy, đổi lịch hoặc hết ghế được giữ nguyên.</p>
  </section>;
}
