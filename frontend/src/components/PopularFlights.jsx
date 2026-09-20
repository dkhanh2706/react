import { useNavigate } from "react-router-dom";

function PopularFlights() {
  const navigate = useNavigate();

  const flights = [
    {
      from: "Hà Nội",
      to: "TP.HCM",
      price: "899.000đ",
      discount: "Giảm 15%",
      image: "🛫",
    },

    {
      from: "TP.HCM",
      to: "Đà Nẵng",
      price: "599.000đ",
      discount: "Ưu đãi mùa hè",
      image: "🌴",
    },

    {
      from: "TP.HCM",
      to: "Tokyo",
      price: "5.500.000đ",
      discount: "Giảm 20%",
      image: "🇯🇵",
    },

    {
      from: "Hà Nội",
      to: "Singapore",
      price: "2.300.000đ",
      discount: "Combo tiết kiệm",
      image: "🌏",
    },
  ];

  return (
    <section className="popular-flight">
      <h2>✈️ Vé máy bay nổi bật</h2>

      <p>Khám phá các hành trình được nhiều khách hàng lựa chọn</p>

      <div className="flight-card-list">
        {flights.map((item, index) => (
          <div className="flight-card" key={index}>
            <div className="flight-image">{item.image}</div>

            <h3>
              {item.from}

              {"  ✈  "}

              {item.to}
            </h3>

            <p className="price">
              Từ <b>{item.price}</b>
            </p>

            <span className="discount">🔥 {item.discount}</span>

            <button onClick={() => navigate("/booking")}>Mua ngay</button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default PopularFlights;
