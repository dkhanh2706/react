# Dashboard và đăng ký đầy đủ hồ sơ

## Phạm vi

Đăng ký bắt buộc họ tên, email, điện thoại, ngày sinh, giới tính, mật khẩu và xác nhận mật khẩu. Frontend hiện lỗi dưới từng trường; API trả `errors` theo tên trường và kiểm tra lại độc lập. Xác nhận mật khẩu không được lưu; mật khẩu chỉ lưu dưới dạng bcrypt hash. Ngày sinh/giới tính dùng các cột đã có trong `users`; không cần migration.

Thông tin hành khách lấy họ tên, email, điện thoại, ngày sinh, giới tính từ hồ sơ mới nhất. Người dùng vẫn sửa được để đặt cho người khác; phản hồi API đến muộn không ghi đè ô đã sửa. Hồ sơ cũ thiếu ngày sinh/giới tính được giữ trống để người dùng chọn, không mặc định là nam. Giấy tờ nhập ở bước hành khách.

## API thống kê

`GET /api/flights/statistics?from=YYYY-MM-DD&to=YYYY-MM-DD&group=day|month`

Chỉ ADMIN; khoảng ngày bao gồm cả hai đầu, tối đa 366 ngày, theo múi giờ Việt Nam. Trả `range`, `summary`, `revenue_series`, `flight_series`, `flights`, `updated_at`. Ngày/tháng không phát sinh có giá trị 0. Thống kê dùng một câu SELECT để các phần cùng đọc một ảnh chụp dữ liệu; không tự cập nhật trạng thái đơn/ghế khi đọc.

| Chỉ số | Cơ sở thời gian và quy tắc |
| --- | --- |
| Tổng chuyến | Ngày khởi hành trong kỳ; đếm các chuyến thực sự đã lưu, gồm hủy và chia trạng thái. Không suy ra từ tổng tuyến mẫu. |
| Ghế cung ứng | Tổng số ghế trong danh mục máy bay cho mỗi chuyến AVAILABLE/DELAYED trong kỳ khởi hành. Một máy bay chạy hai chuyến cung ứng hai lượt ghế. |
| Ghế đã bán | Ghế BOOKED thuộc đơn CONFIRMED của các chuyến trên. Bao gồm vé xác nhận bằng MOCK. |
| Ghế đang giữ | HOLD, đơn PENDING, hạn giữ lớn hơn thời điểm đọc. Giữ hết hạn không tính dù chưa được worker/API khác đổi trạng thái. |
| Ghế trống | Ghế cung ứng − ghế đã bán − ghế đang giữ còn hạn. |
| Tỷ lệ lấp đầy | Tổng ghế đã bán / tổng ghế cung ứng × 100%; không lấy trung bình phần trăm các chuyến. Mẫu số 0 trả null và giao diện hiện chưa có dữ liệu. |
| Doanh thu MoMo | Theo `paid_at`; giao dịch MOMO SUCCESS, đơn CONFIRMED, ghế BOOKED, chuyến không hủy, không có hồ sơ hoàn tiền OPEN cho giao dịch. |
| Thanh toán MOCK | Cùng nguyên tắc ngày thanh toán, hiển thị thành chỉ số/cột riêng, không cộng vào doanh thu MoMo. |
| Giá trị đơn xác nhận hợp lệ | Tổng `bookings.total_price` của đơn có giao dịch thành công hợp lệ, theo kỳ khởi hành của chuyến; gồm MOCK. |
| Giá trị đơn chờ | Đơn PENDING đã hoàn tất thông tin, không phải TMP, còn hạn giữ, chuyến AVAILABLE chưa khởi hành, không có khoản SUCCESS/REFUNDED. Lấy giá đã lưu trong đơn, gồm dịch vụ. |
| Doanh số dự kiến | Giá trị đơn xác nhận hợp lệ + giá trị đơn chờ còn hạn, theo ngày khởi hành. Giả định mọi đơn chờ đều thanh toán thành công; không phải dự báo cuối tháng. |

Mỗi đơn chỉ chọn một giao dịch thành công hợp lệ để tránh nhân tiền khi có nhiều lần thử thanh toán. Khoản thu trùng đang đối soát không làm tăng doanh thu; hoàn khoản thu trùng vẫn giữ giao dịch hợp lệ của vé. Hủy đơn/chuyến và hoàn tiền làm số liệu phản ánh trạng thái hiện tại; đây không phải sổ cái kế toán lịch sử theo ngày hoàn tiền.

Dashboard có bộ lọc ngày và nhóm ngày/tháng, 6 thẻ số liệu, công thức doanh số dự kiến, biểu đồ cột MoMo/MOCK riêng, cột chồng số chuyến theo trạng thái, biểu đồ vòng phân bổ ghế, bảng từng chuyến có tìm kiếm/lọc/phân trang. Chọn cột để xem giá trị cụ thể. Không có nhãn xu hướng tăng/giảm khi chưa có phép so sánh.

## Kiểm tra đã chạy ngày 30/10/2026

- Backend: 52/52; gồm đăng ký đầy đủ, validation API, dữ liệu lưu/đăng nhập và vòng đời thống kê từ giữ ghế, lập đơn, MOCK, MoMo IPN lặp, hết hạn, thu trùng, hủy, hoàn tiền, hủy chuyến.
- Chat: 13/13. Frontend: 10/10. ESLint và production build đạt; build còn cảnh báo bundle vượt 500 kB.
- Chrome headless dùng fixture: đạt 62 lần chờ điều kiện và 83 lượt API giả lập; kiểm tra form lỗi, tương tác biểu đồ, lọc bảng/ngày và bố cục điện thoại, không có JavaScript exception.
- Chrome headless với Express/PostgreSQL riêng: đạt 12 nhóm luồng, gồm dashboard và tự điền hồ sơ; các kiểm tra production cũng đạt.
- Toàn bộ ghi dữ liệu kiểm thử vào cluster/database riêng trong `backend/temp`, không dùng database `airline_booking` của ứng dụng; không sửa `.env`.

Kết quả backend/chat/frontend/lint: `backend/temp/full-check-20261030141710278`. Lượt kiểm tra trình duyệt fixture cuối chạy qua `npm run test:ui` đạt; bộ cầu nối Chrome đã xử lý request bị hủy khi chuyển trang. Kết quả trình duyệt API thật và ảnh dashboard: `backend/temp/full-check-20261030141916675`. Thư mục kiểm thử được Git bỏ qua.

Sau khi cập nhật mã, khởi động lại backend và tải lại frontend. Database dự án giữ nguyên; tài khoản đăng ký mới sẽ lưu thêm hai trường hồ sơ sẵn có.
