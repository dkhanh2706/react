import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";

import "../styles/PaymentResult.css";

function PaymentResult() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const resultCode = searchParams.get("resultCode");

  const message = searchParams.get("message");

  const orderId = searchParams.get("orderId");

  const transId = searchParams.get("transId");

  const amount = searchParams.get("amount");

  const bookingId = sessionStorage.getItem("momo_booking_id");

  const isSuccess = String(resultCode) === "0";

  const formattedAmount = useMemo(() => {
    const number = Number(amount || 0);

    if (!number) {
      return null;
    }

    return number.toLocaleString("vi-VN");
  }, [amount]);

  return (
    <div className="payment-result-page">
      <Header />

      <main className="payment-result-main">
        <div
          className={`payment-result-card ${isSuccess ? "success" : "failed"}`}
        >
          <div className="result-icon">{isSuccess ? "✓" : "!"}</div>

          {isSuccess ? (
            <>
              <span className="result-status">THANH TOÁN THÀNH CÔNG</span>

              <h1>Cảm ơn bạn đã đặt vé!</h1>

              <p className="result-description">
                MoMo đã trả kết quả thanh toán thành công. Backend sẽ xác nhận
                giao dịch qua IPN và cập nhật vé của bạn.
              </p>
            </>
          ) : (
            <>
              <span className="result-status">THANH TOÁN CHƯA THÀNH CÔNG</span>

              <h1>Giao dịch chưa hoàn tất</h1>

              <p className="result-description">
                {message || "Giao dịch MoMo đã bị hủy hoặc không thành công."}
              </p>
            </>
          )}

          <div className="result-information">
            {bookingId && (
              <div>
                <span>Booking ID</span>

                <strong>#{bookingId}</strong>
              </div>
            )}

            {orderId && (
              <div>
                <span>Mã giao dịch</span>

                <strong>{orderId}</strong>
              </div>
            )}

            {transId && transId !== "0" && (
              <div>
                <span>MoMo Trans ID</span>

                <strong>{transId}</strong>
              </div>
            )}

            {formattedAmount && (
              <div>
                <span>Số tiền</span>

                <strong className="result-amount">{formattedAmount}đ</strong>
              </div>
            )}
          </div>

          {isSuccess && (
            <div className="ipn-info-box">
              <span>ℹ</span>

              <p>
                Vé chỉ được xác nhận chính thức khi server nhận được callback
                IPN hợp lệ từ MoMo.
              </p>
            </div>
          )}

          <div className="result-actions">
            {isSuccess ? (
              <>
                <button
                  type="button"
                  className="result-primary-button"
                  onClick={() =>
                    navigate("/my-tickets", {
                      replace: true,
                    })
                  }
                >
                  Xem vé của tôi
                </button>

                <button
                  type="button"
                  className="result-secondary-button"
                  onClick={() =>
                    navigate("/home", {
                      replace: true,
                    })
                  }
                >
                  Về trang chủ
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="result-primary-button"
                  onClick={() =>
                    navigate("/home", {
                      replace: true,
                    })
                  }
                >
                  Đặt vé lại
                </button>

                <button
                  type="button"
                  className="result-secondary-button"
                  onClick={() => navigate("/my-tickets")}
                >
                  Vé của tôi
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default PaymentResult;
