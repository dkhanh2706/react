import { Link } from "react-router-dom";
import Header from "../layouts/Header";
import Footer from "../layouts/Footer";
import "../styles/PassengerInfo.css";

export default function NotFound() {
  return <div className="passenger-page"><Header /><main className="passenger-main">
    <section className="passenger-empty"><div className="passenger-empty-icon">404</div>
      <h1>Không tìm thấy trang</h1><p>Đường dẫn có thể đã thay đổi. Bạn có thể tìm chuyến bay hoặc xem các đơn đã đặt.</p>
      <p><Link to="/home">Về trang chủ</Link> · <Link to="/my-orders">Đơn đặt vé của tôi</Link></p>
    </section></main><Footer /></div>;
}
