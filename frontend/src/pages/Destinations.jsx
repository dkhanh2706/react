import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Header from "../components/Header";
import Footer from "../components/Footer";
import api from "../api/axios";

import "../styles/Destinations.css";

const AIRPORTS = [
  {
    value: "HAN",
    label: "Nội Bài - Hà Nội",
    city: "Hà Nội",
  },
  {
    value: "SGN",
    label: "Tân Sơn Nhất - Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
  },
  {
    value: "DAD",
    label: "Đà Nẵng",
    city: "Đà Nẵng",
  },
  {
    value: "HND",
    label: "Haneda - Tokyo",
    city: "Tokyo",
  },
  {
    value: "SIN",
    label: "Changi - Singapore",
    city: "Singapore",
  },
];

const DESTINATIONS = [
  {
    id: 1,
    code: "DAD",
    city: "Đà Nẵng",
    country: "Việt Nam",
    category: "Biển",
    title: "Thành phố biển năng động",
    description:
      "Khám phá những bãi biển đẹp, ẩm thực hấp dẫn và nhiều địa điểm vui chơi nổi tiếng.",
    price: 899000,
    image:
      "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 2,
    code: "HAN",
    city: "Hà Nội",
    country: "Việt Nam",
    category: "Văn hóa",
    title: "Nét đẹp cổ kính giữa lòng thủ đô",
    description:
      "Trải nghiệm phố cổ, ẩm thực truyền thống và những công trình mang đậm dấu ấn lịch sử.",
    price: 1050000,
    image:
      "https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 3,
    code: "SGN",
    city: "TP. Hồ Chí Minh",
    country: "Việt Nam",
    category: "Thành phố",
    title: "Thành phố không ngủ",
    description:
      "Một điểm đến sôi động với mua sắm, ẩm thực, giải trí và nhiều trải nghiệm hiện đại.",
    price: 950000,
    image:
      "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 4,
    code: "SIN",
    city: "Singapore",
    country: "Singapore",
    category: "Quốc tế",
    title: "Hiện đại và đầy sắc màu",
    description:
      "Khám phá thành phố hiện đại, sạch đẹp với nhiều điểm tham quan và trung tâm mua sắm nổi tiếng.",
    price: 2190000,
    image:
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 5,
    code: "HND",
    city: "Tokyo",
    country: "Nhật Bản",
    category: "Quốc tế",
    title: "Giao thoa giữa hiện đại và truyền thống",
    description:
      "Trải nghiệm một trong những thành phố nổi tiếng nhất châu Á với văn hóa và công nghệ đặc sắc.",
    price: 5290000,
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 6,
    code: "DAD",
    city: "Đà Nẵng",
    country: "Việt Nam",
    category: "Nghỉ dưỡng",
    title: "Kỳ nghỉ bên bờ biển",
    description:
      "Lựa chọn phù hợp cho những chuyến nghỉ dưỡng nhẹ nhàng cùng gia đình và bạn bè.",
    price: 899000,
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  },
];

const CATEGORIES = [
  "Tất cả",
  "Biển",
  "Thành phố",
  "Văn hóa",
  "Nghỉ dưỡng",
  "Quốc tế",
];

function Destinations() {
  const navigate = useNavigate();

  const today = new Date().toISOString().split("T")[0];

  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [searchText, setSearchText] = useState("");
  const [selectedDestination, setSelectedDestination] = useState(null);

  const [form, setForm] = useState({
    from: "",
    to: "",
    departDate: "",
  });

  const [loading, setLoading] = useState(false);

  const filteredDestinations = useMemo(() => {
    return DESTINATIONS.filter((item) => {
      const matchCategory =
        activeCategory === "Tất cả" || item.category === activeCategory;

      const keyword = searchText.trim().toLowerCase();

      const matchSearch =
        !keyword ||
        item.city.toLowerCase().includes(keyword) ||
        item.country.toLowerCase().includes(keyword) ||
        item.title.toLowerCase().includes(keyword);

      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchText]);

  const selectDestination = (destination) => {
    setSelectedDestination(destination);

    setForm((current) => ({
      ...current,
      to: destination.code,
    }));

    setTimeout(() => {
      document.getElementById("destination-booking")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const searchFlights = async () => {
    if (!form.from || !form.to || !form.departDate) {
      toast.error("Vui lòng chọn đầy đủ điểm đi, điểm đến và ngày bay");

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
          searchInfo: form,
          source: "destinations",
        },
      });
    } catch (error) {
      console.error(
        "Lỗi tìm chuyến bay từ trang điểm đến:",
        error.response?.data || error,
      );

      toast.error(
        error.response?.data?.message ||
          "Không thể tìm chuyến bay. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="destinations-page">
      <Header />

      <main>
        {/* ==========================================
            HERO
        ========================================== */}
        <section className="destinations-hero">
          <div className="destinations-hero-overlay" />

          <div className="destinations-hero-content">
            <span className="destinations-eyebrow">KHÁM PHÁ THẾ GIỚI</span>

            <h1>
              Hành trình tiếp theo
              <br />
              của bạn bắt đầu từ đây
            </h1>

            <p>
              Khám phá những điểm đến hấp dẫn và tìm chuyến bay phù hợp cho hành
              trình của bạn.
            </p>

            <div className="destination-search-box">
              <span className="destination-search-icon">⌕</span>

              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Tìm điểm đến..."
              />
            </div>
          </div>
        </section>

        {/* ==========================================
            CONTENT
        ========================================== */}
        <section className="destinations-content">
          <div className="destinations-container">
            <div className="destinations-heading">
              <div>
                <span className="section-label">GỢI Ý CHO BẠN</span>

                <h2>Điểm đến nổi bật</h2>

                <p>
                  Chọn một điểm đến và tìm chuyến bay phù hợp với lịch trình của
                  bạn.
                </p>
              </div>
            </div>

            {/* CATEGORY */}
            <div className="destination-categories">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={
                    activeCategory === category
                      ? "destination-category active"
                      : "destination-category"
                  }
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* DESTINATION GRID */}
            {filteredDestinations.length > 0 ? (
              <div className="destinations-grid">
                {filteredDestinations.map((destination) => (
                  <article className="destination-card" key={destination.id}>
                    <div className="destination-image-wrap">
                      <img
                        src={destination.image}
                        alt={destination.city}
                        className="destination-image"
                      />

                      <span className="destination-category-badge">
                        {destination.category}
                      </span>

                      <div className="destination-image-gradient" />
                    </div>

                    <div className="destination-card-content">
                      <div className="destination-card-top">
                        <div>
                          <span className="destination-country">
                            {destination.country}
                          </span>

                          <h3>{destination.city}</h3>
                        </div>

                        <span className="destination-airport-code">
                          {destination.code}
                        </span>
                      </div>

                      <h4>{destination.title}</h4>

                      <p>{destination.description}</p>

                      <div className="destination-card-footer">
                        <div className="destination-price">
                          <span>Vé từ</span>

                          <strong>
                            {destination.price.toLocaleString("vi-VN")}đ
                          </strong>
                        </div>

                        <button
                          type="button"
                          onClick={() => selectDestination(destination)}
                        >
                          Xem chuyến bay
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="destination-empty">
                <div>✈</div>

                <h3>Không tìm thấy điểm đến</h3>

                <p>Hãy thử tìm bằng từ khóa hoặc danh mục khác.</p>
              </div>
            )}
          </div>
        </section>

        {/* ==========================================
            BOOKING SEARCH
        ========================================== */}
        <section
          className="destination-booking-section"
          id="destination-booking"
        >
          <div className="destinations-container">
            <div className="destination-booking-card">
              <div className="destination-booking-intro">
                <span className="section-label">TÌM CHUYẾN BAY</span>

                <h2>
                  {selectedDestination
                    ? `Bay đến ${selectedDestination.city}`
                    : "Bạn đã chọn được điểm đến?"}
                </h2>

                <p>
                  Chọn điểm khởi hành và ngày bay để xem các chuyến bay phù hợp.
                </p>

                {selectedDestination && (
                  <div className="selected-destination">
                    <span className="selected-destination-code">
                      {selectedDestination.code}
                    </span>

                    <div>
                      <strong>{selectedDestination.city}</strong>

                      <span>{selectedDestination.country}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="destination-booking-form">
                <div className="destination-form-group">
                  <label>Điểm đi</label>

                  <select name="from" value={form.from} onChange={handleChange}>
                    <option value="">-- Chọn điểm đi --</option>

                    {AIRPORTS.filter(
                      (airport) => airport.value !== form.to,
                    ).map((airport) => (
                      <option key={airport.value} value={airport.value}>
                        {airport.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="destination-form-group">
                  <label>Điểm đến</label>

                  <select name="to" value={form.to} onChange={handleChange}>
                    <option value="">-- Chọn điểm đến --</option>

                    {AIRPORTS.filter(
                      (airport) => airport.value !== form.from,
                    ).map((airport) => (
                      <option key={airport.value} value={airport.value}>
                        {airport.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="destination-form-group">
                  <label>Ngày bay</label>

                  <input
                    type="date"
                    name="departDate"
                    min={today}
                    value={form.departDate}
                    onChange={handleChange}
                  />
                </div>

                <button
                  type="button"
                  className="destination-search-button"
                  disabled={loading}
                  onClick={searchFlights}
                >
                  {loading ? "Đang tìm chuyến bay..." : "Tìm chuyến bay"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            TRAVEL TYPES
        ========================================== */}
        <section className="travel-style-section">
          <div className="destinations-container">
            <div className="travel-style-heading">
              <span className="section-label">CẢM HỨNG DU LỊCH</span>

              <h2>Bạn muốn chuyến đi như thế nào?</h2>
            </div>

            <div className="travel-style-grid">
              <button type="button" onClick={() => setActiveCategory("Biển")}>
                <span>🏖️</span>

                <div>
                  <strong>Biển</strong>
                  <small>Nắng, biển và những kỳ nghỉ thư giãn</small>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory("Thành phố")}
              >
                <span>🏙️</span>

                <div>
                  <strong>Thành phố</strong>
                  <small>Mua sắm, giải trí và nhịp sống sôi động</small>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory("Văn hóa")}
              >
                <span>🏛️</span>

                <div>
                  <strong>Văn hóa</strong>
                  <small>Khám phá lịch sử và nét đẹp bản địa</small>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory("Quốc tế")}
              >
                <span>🌏</span>

                <div>
                  <strong>Quốc tế</strong>
                  <small>Mở rộng hành trình ra ngoài Việt Nam</small>
                </div>
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Destinations;
