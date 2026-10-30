export default function PaymentMethods({
  demoEnabled,
  holdExpiresAt
}) {
  return <div className="payment-methods-card" style={{
    marginTop: "18px"
  }}>
                <div className="payment-method-title">
                  <div>
                    <span className="payment-label">
                      PHƯƠNG THỨC THANH TOÁN
                    </span>

                    <h2>{demoEnabled ? "Chọn cách thanh toán" : "Thanh toán bằng MoMo"}</h2>
                  </div>

                  <div className="momo-logo-box">MoMo</div>
                </div>

                <p className="methods-subtitle">
                  Sau khi nhấn thanh toán, bạn sẽ được chuyển sang cổng MoMo
                  để hoàn tất giao dịch.
                </p>

                <div className="momo-method-selected">
                  <div className="momo-radio">
                    <span />
                  </div>

                  <div className="momo-method-icon">M</div>

                  <div className="momo-method-content">
                    <strong>Ví điện tử MoMo</strong>

                    <p>Thanh toán trực tuyến qua cổng thanh toán MoMo.</p>
                  </div>

                  <span className="method-tag recommend">Đã chọn</span>
                </div>

                <div className="payment-flow-box">
                  <h3>Quy trình thanh toán</h3>

                  <div className="payment-flow-step">
                    <span>1</span>
                    <p>
                      Nhấn <strong>Thanh toán bằng MoMo</strong>
                    </p>
                  </div>

                  <div className="payment-flow-step">
                    <span>2</span>
                    <p>Hệ thống chuyển sang trang thanh toán MoMo.</p>
                  </div>

                  <div className="payment-flow-step">
                    <span>3</span>
                    <p>Hoàn tất thanh toán.</p>
                  </div>

                  <div className="payment-flow-step">
                    <span>4</span>
                    <p>Hệ thống xác nhận giao dịch và lưu vé trong tài khoản.</p>
                  </div>
                </div>

                <div className="sandbox-notice">
                  <span className="notice-icon">🧪</span>

                  <div>
                    <strong>Xác nhận thanh toán MoMo</strong>

                    <p>Chỉ ghi nhận thanh toán sau khi hệ thống nhận kết quả hợp lệ từ MoMo. Không thanh toán thêm khi chưa kiểm tra giao dịch trước.</p>
                  </div>
                </div>

                {demoEnabled && <div className="mock-payment-notice">
                  <span className="notice-icon">🎓</span>

                  <div>
                    <strong>Chế độ demo đồ án</strong>

                    <p>
                      Nhấn “Thanh toán giả lập (Demo)” để xác nhận vé ngay, không cần mở MoMo hoặc quét mã. Không trừ tiền thật.
                    </p>
                  </div>
                </div>}

                {holdExpiresAt && <div className="hold-payment-notice">
                    <span>⏳</span>

                    <div>
                      <strong>Ghế đang được giữ</strong>

                      <p>
                        Hoàn tất thanh toán trước khi thời gian giữ ghế kết
                        thúc.
                      </p>
                    </div>
                  </div>}
              </div>;
}
