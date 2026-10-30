import { vietnamToday } from "../../utils/format.js";
export default function PassengerForm({
  passenger,
  handlePassengerChange
}) {
  return <section className="passenger-card">
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

                    <input type="text" name="full_name" value={passenger.full_name} onChange={handlePassengerChange} placeholder="Ví dụ: Nguyễn Văn An" autoComplete="name" />

                    <small>Nhập đầy đủ họ tên, không sử dụng biệt danh.</small>
                  </div>

                  {/* GENDER */}

                  <div className="passenger-field">
                    <label>
                      Giới tính <span>*</span>
                    </label>

                    <select name="gender" value={passenger.gender} onChange={handlePassengerChange}>
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

                    <input type="date" name="date_of_birth" value={passenger.date_of_birth} onChange={handlePassengerChange} max={vietnamToday()} />
                  </div>

                  {/* DOCUMENT TYPE */}

                  <div className="passenger-field">
                    <label>
                      Loại giấy tờ <span>*</span>
                    </label>

                    <select name="document_type" value={passenger.document_type} onChange={handlePassengerChange}>
                      <option value="CCCD">CCCD / CMND</option>

                      <option value="PASSPORT">Hộ chiếu</option>
                    </select>
                  </div>

                  {/* DOCUMENT NUMBER */}

                  <div className="passenger-field">
                    <label>
                      Số giấy tờ <span>*</span>
                    </label>

                    <input type="text" name="document_number" value={passenger.document_number} onChange={handlePassengerChange} placeholder={passenger.document_type === "CCCD" ? "Nhập số CCCD" : "Nhập số hộ chiếu"} />
                  </div>

                  {/* PHONE */}

                  <div className="passenger-field">
                    <label>
                      Số điện thoại <span>*</span>
                    </label>

                    <input type="tel" name="phone" value={passenger.phone} onChange={handlePassengerChange} placeholder="Ví dụ: 0901234567" autoComplete="tel" />
                  </div>

                  {/* EMAIL */}

                  <div className="passenger-field">
                    <label>
                      Email <span>*</span>
                    </label>

                    <input type="email" name="email" value={passenger.email} onChange={handlePassengerChange} placeholder="example@gmail.com" autoComplete="email" />
                  </div>
                </div>
              </section>;
}
