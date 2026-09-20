import Header from "../components/Header";
import FlightSearch from "../components/FlightSearch";
import PopularFlights from "../components/PopularFlights";
import Promotions from "../components/Promotions";
import AirlinePartners from "../components/AirlinePartners";
import Footer from "../components/Footer";
import SupportButton from "../components/SupportButton";

import "../styles/home.css";

function Home() {
  return (
    <div className="home-page">
      {/* HEADER */}

      <Header />

      {/* HERO BANNER */}

      <section className="hero">
        <div className="hero-content">
          <h1>Bay mọi nơi - Kết nối mọi hành trình</h1>

          <p>Đặt vé máy bay nhanh chóng, an toàn và tiện lợi</p>

          {/* FORM TÌM KIẾM */}

          <FlightSearch />
        </div>
      </section>

      {/* VÉ MÁY BAY NỔI BẬT */}

      <PopularFlights />

      {/* ƯU ĐÃI */}

      <Promotions />

      {/* ĐỐI TÁC HÀNG KHÔNG */}

      <AirlinePartners />

      {/* FOOTER */}

      <Footer />

      {/* NÚT HỖ TRỢ */}

      <SupportButton />
    </div>
  );
}

export default Home;
