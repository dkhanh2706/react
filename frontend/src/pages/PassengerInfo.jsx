import usePassengerInfo from "../hooks/usePassengerInfo.js";
import PassengerPriceSummary from "../components/booking/PassengerPriceSummary.jsx";
import ExtraServices from "../components/booking/ExtraServices.jsx";
import BaggageOptions from "../components/booking/BaggageOptions.jsx";
import PassengerForm from "../components/booking/PassengerForm.jsx";
import PassengerFlightCard from "../components/booking/PassengerFlightCard.jsx";
import Header from "../layouts/Header";
import Footer from "../layouts/Footer";
import "../styles/PassengerInfo.css";
function PassengerInfo() {
  const {
    navigate,
    flight,
    passenger,
    baggageWeight,
    setBaggageWeight,
    mealType,
    setMealType,
    insurance,
    setInsurance,
    selectedBaggage,
    selectedMeal,
    baseFlightPrice,
    baggagePrice,
    mealPrice,
    insurancePrice,
    temporaryPrice,
    handlePassengerChange,
    handleContinue
  } = usePassengerInfo();
  if (!flight) {
    return <div className="passenger-page">
        <Header />

        <main className="passenger-main">
          <div className="passenger-empty">
            <div className="passenger-empty-icon">✈</div>

            <h2>Không tìm thấy thông tin chuyến bay</h2>

            <p>Bạn cần chọn chuyến bay trước khi nhập thông tin hành khách.</p>

            <button type="button" onClick={() => navigate("/home")} className="passenger-home-button">
              Về trang chủ
            </button>
          </div>
        </main>

        <Footer />
      </div>;
  }
  return <div className="passenger-page">
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

            <button type="button" className="passenger-back-button" onClick={() => navigate(-1)}>
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

              <PassengerFlightCard flight={flight} baseFlightPrice={baseFlightPrice} />

              {/* =================================================
                  PASSENGER
               ================================================= */}

              <PassengerForm passenger={passenger} handlePassengerChange={handlePassengerChange} />

              {/* =================================================
                  BAGGAGE
               ================================================= */}

              <BaggageOptions baggageWeight={baggageWeight} setBaggageWeight={setBaggageWeight} />

              {/* =================================================
                  EXTRA SERVICES
               ================================================= */}

              <ExtraServices mealType={mealType} setMealType={setMealType} insurance={insurance} setInsurance={setInsurance} />
            </div>

            {/* =================================================
                RIGHT
             ================================================= */}

            <PassengerPriceSummary flight={flight} baseFlightPrice={baseFlightPrice} selectedBaggage={selectedBaggage} baggagePrice={baggagePrice} selectedMeal={selectedMeal} mealPrice={mealPrice} insurance={insurance} insurancePrice={insurancePrice} temporaryPrice={temporaryPrice} handleContinue={handleContinue} navigate={navigate} />
          </div>
        </div>
      </main>

      <Footer />
    </div>;
}
export default PassengerInfo;
