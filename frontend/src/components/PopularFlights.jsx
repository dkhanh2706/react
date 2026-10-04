import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PopularFlights.css";

function PopularFlights() {
  const navigate = useNavigate();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides = [
    {
      id: 1,
      badge: "🔥 KHUYẾN MÃI HOT",
      title: "Bay thả ga - Giá cực đã",
      description:
        "Săn vé máy bay giá sốc, ưu đãi hấp dẫn cho hàng ngàn hành trình trong nước.",
      price: "Chỉ từ 499.000đ",
      buttonText: "Săn vé ngay",
      image:
        "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=85",
    },
    {
      id: 2,
      badge: "☀️ ƯU ĐÃI MÙA HÈ",
      title: "Hè rực rỡ - Bay khắp Việt Nam",
      description:
        "Khám phá Đà Nẵng, Nha Trang, Phú Quốc cùng hàng loạt ưu đãi mùa hè.",
      price: "Giảm đến 30%",
      buttonText: "Khám phá ngay",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85",
    },
    {
      id: 3,
      badge: "🧧 ƯU ĐÃI TẾT",
      title: "Tết sum vầy - Bay về nhà",
      description:
        "Đặt vé Tết sớm để nhận mức giá tốt và nhiều quyền lợi hấp dẫn.",
      price: "Ưu đãi đến 25%",
      buttonText: "Đặt vé Tết",
      image:
        "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1600&q=85",
    },
    {
      id: 4,
      badge: "🌏 BAY QUỐC TẾ",
      title: "Vi vu thế giới - Giá siêu hời",
      description:
        "Khám phá Tokyo, Singapore, Seoul, Bangkok với giá vé cực kỳ hấp dẫn.",
      price: "Từ 1.999.000đ",
      buttonText: "Xem hành trình",
      image:
        "https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=1600&q=85",
    },
  ];

  // Tự động chuyển slide
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  // Slide tiếp theo
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  // Slide trước
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  // Khi nhấn nút đặt vé
  const handleBooking = () => {
    navigate("/booking");
  };

  return (
    <section className="promotion-slider-section">
      {/* Tiêu đề */}
      <div className="promotion-heading">
        <span className="promotion-small-title">ƯU ĐÃI DÀNH CHO BẠN</span>

        <h2>Khuyến mãi nổi bật</h2>

        <p>
          Săn ngay những chương trình ưu đãi hấp dẫn cho chuyến đi tiếp theo của
          bạn.
        </p>
      </div>

      {/* Slider */}
      <div
        className="promotion-slider"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`promotion-slide ${
              index === currentSlide ? "active" : ""
            }`}
          >
            {/* Ảnh nền */}
            <div
              className="promotion-background"
              style={{
                backgroundImage: `url("${slide.image}")`,
              }}
            />

            {/* Overlay */}
            <div className="promotion-overlay" />

            {/* Trang trí */}
            <div className="promotion-glow promotion-glow-1" />
            <div className="promotion-glow promotion-glow-2" />

            {/* Nội dung */}
            <div className="promotion-content">
              <div className="promotion-content-inner">
                <span className="promotion-badge">{slide.badge}</span>

                <h3>{slide.title}</h3>

                <p className="promotion-description">{slide.description}</p>

                <div className="promotion-price">{slide.price}</div>

                <button
                  className="promotion-book-button"
                  onClick={handleBooking}
                >
                  <span>{slide.buttonText}</span>
                  <span className="promotion-button-arrow">→</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Nút trái */}
        <button
          className="promotion-arrow promotion-arrow-left"
          onClick={prevSlide}
          aria-label="Banner trước"
        >
          ‹
        </button>

        {/* Nút phải */}
        <button
          className="promotion-arrow promotion-arrow-right"
          onClick={nextSlide}
          aria-label="Banner tiếp theo"
        >
          ›
        </button>

        {/* Dots */}
        <div className="promotion-dots">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              className={`promotion-dot ${
                index === currentSlide ? "active" : ""
              }`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Chuyển tới banner ${index + 1}`}
            />
          ))}
        </div>

        {/* Số slide */}
        <div className="promotion-counter">
          <span>{String(currentSlide + 1).padStart(2, "0")}</span>

          <div className="promotion-counter-line" />

          <span>{String(slides.length).padStart(2, "0")}</span>
        </div>

        {/* Thanh chạy */}
        {!isPaused && <div key={currentSlide} className="promotion-progress" />}
      </div>
    </section>
  );
}

export default PopularFlights;
