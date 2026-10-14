import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Header from "../components/Header";
import Footer from "../components/Footer";

import "../styles/PassengerInfo.css";

// =====================================================
// FORMAT MONEY
// =====================================================

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString("vi-VN") + "đ";
};

// =====================================================
// FORMAT DATE
// =====================================================

const formatDate = (value) => {
  if (!value) return "---";

  const stringValue = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    const [year, month, day] = stringValue.split("-");

    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return stringValue;
  }

  return date.toLocaleDateString("vi-VN");
};

// =====================================================
// FORMAT TIME
// =====================================================

const formatTime = (value) => {
  if (!value) return "--:--";

  const stringValue = String(value);

  if (/^\d{2}:\d{2}$/.test(stringValue)) {
    return stringValue;
  }

  if (/^\d{2}:\d{2}:\d{2}/.test(stringValue)) {
    return stringValue.slice(0, 5);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return stringValue;
  }

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// =====================================================
// GET INITIAL PASSENGER
// Không dùng setState trong useEffect nữa
// =====================================================

const getInitialPassenger = () => {
  try {
    const storedUser = localStorage.getItem("user");

    const user = storedUser ? JSON.parse(storedUser) : null;

    return {
      full_name: user?.full_name || user?.name || "",

      gender: "MALE",

      date_of_birth: "",

      document_type: "CCCD",

      document_number: "",

      phone: user?.phone || "",

      email: user?.email || "",
    };
  } catch (error) {
    console.error("Không thể đọc thông tin user:", error);

    return {
      full_name: "",
      gender: "MALE",
      date_of_birth: "",
      document_type: "CCCD",
      document_number: "",
      phone: "",
      email: "",
    };
  }
};

// =====================================================
// BAGGAGE OPTIONS
// =====================================================

const BAGGAGE_OPTIONS = [
  {
    weight: 0,
    label: "Không thêm hành lý ký gửi",
    description: "Chỉ sử dụng hành lý xách tay theo tiêu chuẩn hãng",
    price: 0,
  },

  {
    weight: 10,
    label: "Hành lý ký gửi 10kg",
    description: "Phù hợp chuyến đi ngắn ngày",
    price: 150000,
  },

  {
    weight: 20,
    label: "Hành lý ký gửi 20kg",
    description: "Lựa chọn phổ biến",
    price: 250000,
  },

  {
    weight: 30,
    label: "Hành lý ký gửi 30kg",
    description: "Phù hợp khi mang nhiều hành lý",
    price: 350000,
  },
];

// =====================================================
// MEAL OPTIONS
// =====================================================

const MEAL_OPTIONS = [
  {
    value: "NONE",
    label: "Không chọn suất ăn",
    price: 0,
  },

  {
    value: "CHICKEN_RICE",
    label: "Cơm gà",
    price: 80000,
  },

  {
    value: "BEEF_RICE",
    label: "Cơm bò",
    price: 100000,
  },

  {
    value: "NOODLES",
    label: "Mì",
    price: 70000,
  },
];

// =====================================================
// COMPONENT
// =====================================================

function PassengerInfo() {
  const location = useLocation();

  const navigate = useNavigate();

  const flight = location.state?.flight;

  // ===================================================
  // PASSENGER
  // ===================================================

  const [passenger, setPassenger] = useState(getInitialPassenger);

  // ===================================================
  // SERVICES
  // ===================================================

  const [baggageWeight, setBaggageWeight] = useState(0);

  const [mealType, setMealType] = useState("NONE");

  const [insurance, setInsurance] = useState(false);

  // ===================================================
  // CHECK LOGIN
  // ===================================================

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Vui lòng đăng nhập để đặt vé");

      navigate("/login", {
        replace: true,
      });
    }
  }, [navigate]);

  // ===================================================
  // SELECTED BAGGAGE
  // ===================================================

  const selectedBaggage = useMemo(() => {
    return (
      BAGGAGE_OPTIONS.find(
        (item) => Number(item.weight) === Number(baggageWeight),
      ) || BAGGAGE_OPTIONS[0]
    );
  }, [baggageWeight]);

  // ===================================================
  // SELECTED MEAL
  // ===================================================

  const selectedMeal = useMemo(() => {
    return (
      MEAL_OPTIONS.find((item) => item.value === mealType) || MEAL_OPTIONS[0]
    );
  }, [mealType]);

  // ===================================================
  // PRICE
  // ===================================================

  const baseFlightPrice = Number(flight?.price || 0);

  const baggagePrice = Number(selectedBaggage?.price || 0);

  const mealPrice = Number(selectedMeal?.price || 0);

  const insurancePrice = insurance ? 50000 : 0;

  const servicePrice = baggagePrice + mealPrice + insurancePrice;

  const temporaryPrice = baseFlightPrice + servicePrice;

  // ===================================================
  // INPUT CHANGE
  // ===================================================

  const handlePassengerChange = (event) => {
    const { name, value } = event.target;

    setPassenger((prev) => ({
      ...prev,

      [name]: value,
    }));
  };

  // ===================================================
  // VALIDATE
  // ===================================================

  const validateForm = () => {
    const fullName = passenger.full_name.trim();

    const documentNumber = passenger.document_number.trim();

    const phone = passenger.phone.trim();

    const email = passenger.email.trim();

    // FULL NAME
    if (!fullName) {
      toast.error("Vui lòng nhập họ và tên hành khách");

      return false;
    }

    if (fullName.length < 2) {
      toast.error("Họ và tên hành khách không hợp lệ");

      return false;
    }

    // GENDER
    if (!passenger.gender) {
      toast.error("Vui lòng chọn giới tính");

      return false;
    }

    // DATE OF BIRTH
    if (!passenger.date_of_birth) {
      toast.error("Vui lòng chọn ngày sinh");

      return false;
    }

    const birthDate = new Date(passenger.date_of_birth);

    const today = new Date();

    if (Number.isNaN(birthDate.getTime()) || birthDate > today) {
      toast.error("Ngày sinh không hợp lệ");

      return false;
    }

    // DOCUMENT
    if (!passenger.document_type) {
      toast.error("Vui lòng chọn loại giấy tờ");

      return false;
    }

    if (!documentNumber) {
      toast.error("Vui lòng nhập số CCCD/Hộ chiếu");

      return false;
    }

    if (passenger.document_type === "CCCD") {
      if (!/^\d{9,12}$/.test(documentNumber)) {
        toast.error("Số CCCD/CMND phải gồm từ 9 đến 12 chữ số");

        return false;
      }
    }

    // PHONE
    if (!phone) {
      toast.error("Vui lòng nhập số điện thoại");

      return false;
    }

    const normalizedPhone = phone.replace(/\s/g, "");

    if (!/^(0|\+84)[0-9]{9,10}$/.test(normalizedPhone)) {
      toast.error("Số điện thoại không hợp lệ");

      return false;
    }

    // EMAIL
    if (!email) {
      toast.error("Vui lòng nhập email");

      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      toast.error("Email không hợp lệ");

      return false;
    }

    return true;
  };

  // ===================================================
  // CONTINUE
  // ===================================================

  const handleContinue = () => {
    if (!validateForm()) {
      return;
    }

    const passengerData = {
      full_name: passenger.full_name.trim(),

      gender: passenger.gender,

      date_of_birth: passenger.date_of_birth,

      document_type: passenger.document_type,

      document_number: passenger.document_number.trim(),

      phone: passenger.phone.trim(),

      email: passenger.email.trim(),
    };

    const services = {
      baggage_weight: Number(selectedBaggage.weight || 0),

      baggage_price: Number(selectedBaggage.price || 0),

      meal_type: selectedMeal.value,

      meal_name: selectedMeal.label,

      meal_price: Number(selectedMeal.price || 0),

      insurance: Boolean(insurance),

      insurance_price: Number(insurancePrice),

      service_price: Number(servicePrice),
    };

    navigate("/booking", {
      state: {
        flight,

        passenger: passengerData,

        services,
      },
    });
  };

  // ===================================================
  // NO FLIGHT
  // ===================================================

  if (!flight) {
    return (
      <div className="passenger-page">
        <Header />

        <main className="passenger-main">
          <div className="passenger-empty">
            <div className="passenger-empty-icon">✈</div>

            <h2>Không tìm thấy thông tin chuyến bay</h2>

            <p>Bạn cần chọn chuyến bay trước khi nhập thông tin hành khách.</p>

            <button
              type="button"
              onClick={() => navigate("/home")}
              className="passenger-home-button"
            >
              Về trang chủ
            </button>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="passenger-page">
      <Header />

      <main className="passenger-main">
        <div className="passenger-container">
          {/* =================================================
              STEPS
          ================================================= */}

          <div className="passenger-steps">
            <div className="passenger-step completed">
              <span className="passenger-step-number">✓</span>

              <span>1. Chọn chuyến bay</span>
            </div>

            <div className="passenger-step-line active" />

            <div className="passenger-step active">
              <span className="passenger-step-number">2</span>

              <span>2. Thông tin hành khách</span>
            </div>

            <div className="passenger-step-line" />

            <div className="passenger-step">
              <span className="passenger-step-number">3</span>

              <span>3. Chọn ghế</span>
            </div>

            <div className="passenger-step-line" />

            <div className="passenger-step">
              <span className="passenger-step-number">4</span>

              <span>4. Thanh toán</span>
            </div>
          </div>

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="passenger-page-heading">
            <div>
              <span className="passenger-heading-label">THÔNG TIN ĐẶT VÉ</span>

              <h1>Thông tin hành khách & dịch vụ</h1>

              <p>
                Vui lòng nhập chính xác thông tin theo giấy tờ tùy thân của hành
                khách.
              </p>
            </div>

            <button
              type="button"
              className="passenger-back-button"
              onClick={() => navigate(-1)}
            >
              ← Đổi chuyến bay
            </button>
          </div>

          {/* =================================================
              LAYOUT
          ================================================= */}

          <div className="passenger-layout">
            {/* LEFT */}

            <div className="passenger-left">
              {/* FLIGHT */}

              <section className="passenger-card passenger-flight-card">
                <div className="passenger-card-title">
                  <div className="passenger-title-icon">✈</div>

                  <div>
                    <span>CHUYẾN BAY ĐÃ CHỌN</span>

                    <h2>
                      {flight.airline || "Hãng hàng không"}{" "}
                      {flight.flight_number || ""}
                    </h2>
                  </div>
                </div>

                <div className="passenger-flight-route">
                  <div className="passenger-airport">
                    <strong>
                      {flight.departure_code || flight.from || "---"}
                    </strong>

                    <span>{formatTime(flight.departure_time)}</span>
                  </div>

                  <div className="passenger-route-middle">
                    <small>Bay thẳng</small>

                    <div>────── ✈ ──────</div>
                  </div>

                  <div className="passenger-airport right">
                    <strong>{flight.arrival_code || flight.to || "---"}</strong>

                    <span>{formatTime(flight.arrival_time)}</span>
                  </div>
                </div>

                <div className="passenger-flight-footer">
                  <div>
                    <span>Ngày khởi hành</span>

                    <strong>{formatDate(flight.date)}</strong>
                  </div>

                  <div>
                    <span>Giá vé cơ bản</span>

                    <strong>{formatMoney(baseFlightPrice)}</strong>
                  </div>
                </div>
              </section>

              {/* =================================================
                  PASSENGER
              ================================================= */}

              <section className="passenger-card">
                <div className="passenger-section-heading">
                  <div>
                    <span className="passenger-section-number">1</span>

                    <div>
                      <h2>Thông tin hành khách</h2>

                      <p>Thông tin phải trùng khớp với giấy tờ tùy thân.</p>
                    </div>
                  </div>
                </div>

                <div className="passenger-form-grid">
                  {/* FULL NAME */}

                  <div className="passenger-field full">
                    <label>
                      Họ và tên <span>*</span>
                    </label>

                    <input
                      type="text"
                      name="full_name"
                      value={passenger.full_name}
                      onChange={handlePassengerChange}
                      placeholder="Ví dụ: Nguyễn Văn An"
                      autoComplete="name"
                    />

                    <small>Nhập đầy đủ họ tên, không sử dụng biệt danh.</small>
                  </div>

                  {/* GENDER */}

                  <div className="passenger-field">
                    <label>
                      Giới tính <span>*</span>
                    </label>

                    <select
                      name="gender"
                      value={passenger.gender}
                      onChange={handlePassengerChange}
                    >
                      <option value="MALE">Nam</option>

                      <option value="FEMALE">Nữ</option>

                      <option value="OTHER">Khác</option>
                    </select>
                  </div>

                  {/* DATE */}

                  <div className="passenger-field">
                    <label>
                      Ngày sinh <span>*</span>
                    </label>

                    <input
                      type="date"
                      name="date_of_birth"
                      value={passenger.date_of_birth}
                      onChange={handlePassengerChange}
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </div>

                  {/* DOCUMENT TYPE */}

                  <div className="passenger-field">
                    <label>
                      Loại giấy tờ <span>*</span>
                    </label>

                    <select
                      name="document_type"
                      value={passenger.document_type}
                      onChange={handlePassengerChange}
                    >
                      <option value="CCCD">CCCD / CMND</option>

                      <option value="PASSPORT">Hộ chiếu</option>
                    </select>
                  </div>

                  {/* DOCUMENT NUMBER */}

                  <div className="passenger-field">
                    <label>
                      Số giấy tờ <span>*</span>
                    </label>

                    <input
                      type="text"
                      name="document_number"
                      value={passenger.document_number}
                      onChange={handlePassengerChange}
                      placeholder={
                        passenger.document_type === "CCCD"
                          ? "Nhập số CCCD"
                          : "Nhập số hộ chiếu"
                      }
                    />
                  </div>

                  {/* PHONE */}

                  <div className="passenger-field">
                    <label>
                      Số điện thoại <span>*</span>
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={passenger.phone}
                      onChange={handlePassengerChange}
                      placeholder="Ví dụ: 0901234567"
                      autoComplete="tel"
                    />
                  </div>

                  {/* EMAIL */}

                  <div className="passenger-field">
                    <label>
                      Email <span>*</span>
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={passenger.email}
                      onChange={handlePassengerChange}
                      placeholder="example@gmail.com"
                      autoComplete="email"
                    />
                  </div>
                </div>
              </section>

              {/* =================================================
                  BAGGAGE
              ================================================= */}

              <section className="passenger-card">
                <div className="passenger-section-heading">
                  <div>
                    <span className="passenger-section-number">2</span>

                    <div>
                      <h2>Hành lý ký gửi</h2>

                      <p>Chọn mức hành lý phù hợp với nhu cầu của bạn.</p>
                    </div>
                  </div>
                </div>

                <div className="baggage-options">
                  {BAGGAGE_OPTIONS.map((item) => {
                    const active =
                      Number(baggageWeight) === Number(item.weight);

                    return (
                      <button
                        type="button"
                        key={item.weight}
                        className={`baggage-option ${active ? "active" : ""}`}
                        onClick={() => setBaggageWeight(item.weight)}
                      >
                        <span className="baggage-radio">
                          {active && <span />}
                        </span>

                        <span className="baggage-icon">🧳</span>

                        <span className="baggage-content">
                          <strong>{item.label}</strong>

                          <small>{item.description}</small>
                        </span>

                        <strong className="baggage-price">
                          {item.price === 0
                            ? "Miễn phí"
                            : `+${formatMoney(item.price)}`}
                        </strong>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* =================================================
                  EXTRA SERVICES
              ================================================= */}

              <section className="passenger-card">
                <div className="passenger-section-heading">
                  <div>
                    <span className="passenger-section-number">3</span>

                    <div>
                      <h2>Dịch vụ bổ sung</h2>

                      <p>Bạn có thể bỏ qua nếu không có nhu cầu.</p>
                    </div>
                  </div>
                </div>

                {/* MEAL */}

                <div className="extra-service-block">
                  <div className="extra-service-heading">
                    <div className="extra-service-icon">🍱</div>

                    <div>
                      <strong>Suất ăn trên chuyến bay</strong>

                      <span>Lựa chọn suất ăn phù hợp</span>
                    </div>
                  </div>

                  <select
                    className="meal-select"
                    value={mealType}
                    onChange={(event) => setMealType(event.target.value)}
                  >
                    {MEAL_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                        {item.price > 0 ? ` - ${formatMoney(item.price)}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* INSURANCE */}

                <button
                  type="button"
                  className={`insurance-option ${insurance ? "active" : ""}`}
                  onClick={() => setInsurance((prev) => !prev)}
                >
                  <span
                    className={`insurance-checkbox ${
                      insurance ? "checked" : ""
                    }`}
                  >
                    {insurance ? "✓" : ""}
                  </span>

                  <span className="insurance-icon">🛡️</span>

                  <span className="insurance-content">
                    <strong>Bảo hiểm chuyến bay</strong>

                    <small>Hỗ trợ bảo vệ hành trình của hành khách.</small>
                  </span>

                  <strong className="insurance-price">+50.000đ</strong>
                </button>
              </section>
            </div>

            {/* =================================================
                RIGHT
            ================================================= */}

            <aside className="passenger-right">
              <div className="passenger-summary-card">
                <h2>Tóm tắt đặt vé</h2>

                <div className="passenger-summary-route">
                  <div>
                    <span>Chuyến bay</span>

                    <strong>
                      {flight.departure_code || flight.from || "---"} →{" "}
                      {flight.arrival_code || flight.to || "---"}
                    </strong>
                  </div>

                  <span className="summary-flight-number">
                    {flight.flight_number || "---"}
                  </span>
                </div>

                {/* PRICE */}

                <div className="passenger-price-list">
                  <div className="passenger-price-row">
                    <span>Giá vé cơ bản</span>

                    <strong>{formatMoney(baseFlightPrice)}</strong>
                  </div>

                  <div className="passenger-price-row">
                    <span>
                      Hành lý
                      {selectedBaggage.weight > 0
                        ? ` (${selectedBaggage.weight}kg)`
                        : ""}
                    </span>

                    <strong>
                      {baggagePrice > 0 ? formatMoney(baggagePrice) : "0đ"}
                    </strong>
                  </div>

                  <div className="passenger-price-row">
                    <span>
                      Suất ăn
                      {selectedMeal.value !== "NONE"
                        ? ` (${selectedMeal.label})`
                        : ""}
                    </span>

                    <strong>
                      {mealPrice > 0 ? formatMoney(mealPrice) : "0đ"}
                    </strong>
                  </div>

                  <div className="passenger-price-row">
                    <span>Bảo hiểm</span>

                    <strong>
                      {insurance ? formatMoney(insurancePrice) : "0đ"}
                    </strong>
                  </div>
                </div>

                {/* TOTAL */}

                <div className="passenger-summary-total">
                  <span>Tạm tính</span>

                  <strong>{formatMoney(temporaryPrice)}</strong>
                </div>

                <div className="passenger-summary-note">
                  <span>ℹ</span>

                  <p>
                    Giá cuối cùng có thể thay đổi nếu bạn chọn ghế hạng Thương
                    gia ở bước tiếp theo.
                  </p>
                </div>

                <button
                  type="button"
                  className="passenger-continue-button"
                  onClick={handleContinue}
                >
                  Tiếp tục chọn ghế
                  <span>→</span>
                </button>

                <button
                  type="button"
                  className="passenger-summary-back"
                  onClick={() => navigate(-1)}
                >
                  ← Quay lại chọn chuyến
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default PassengerInfo;
