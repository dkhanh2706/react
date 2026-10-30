import { AlertTriangle } from "lucide-react";

export default function FlightCancelModal({ deleteTarget, cancelReason, setCancelReason, deleting, setDeleteTarget, confirmDelete }) {
  return (
<div className="adm-modal-overlay">
            <div className="adm-modal-card confirm-modal">
              <div className="confirm-icon-box">
                <AlertTriangle size={36} />
              </div>

              <h3>{deleteTarget.has_history || deleteTarget.demo_key ? "Xác nhận hủy chuyến bay?" : "Xác nhận xóa chuyến bay?"}</h3>

              <p>
                Bạn có chắc chắn muốn {deleteTarget.has_history || deleteTarget.demo_key ? "hủy" : "xóa"} chuyến bay{" "}
                <strong>{deleteTarget.flight_number}</strong> khỏi hệ thống?
                {deleteTarget.has_history || deleteTarget.demo_key
                  ? " Chuyến được giữ lại trong lịch sử; đặt chỗ bị hủy và khoản đã thu được chuyển đối soát."
                  : " Chuyến chưa có lịch sử sẽ bị xóa khỏi danh sách."}
              </p>
              {(deleteTarget.has_history || deleteTarget.demo_key) && <div className="adm-form-group">
                <label htmlFor="flight-cancel-reason">Lý do hủy chuyến</label>
                <textarea id="flight-cancel-reason" minLength={5} maxLength={1000} required value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)} placeholder="Nhập lý do để lưu vào các đặt chỗ bị ảnh hưởng" />
              </div>}

              <div className="confirm-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  disabled={deleting}
                  onClick={() => setDeleteTarget(null)}
                >
                  Hủy bỏ
                </button>

                <button
                  type="button"
                  className="btn-danger-confirm"
                  disabled={deleting || ((deleteTarget.has_history || deleteTarget.demo_key) && cancelReason.trim().length < 5)}
                  onClick={confirmDelete}
                >
                  {deleting ? "Đang xử lý..." : (deleteTarget.has_history || deleteTarget.demo_key ? "Xác nhận hủy chuyến" : "Xác nhận xóa")}
                </button>
              </div>
            </div>
          </div>
  );
}
