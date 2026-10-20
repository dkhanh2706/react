# Quản lý đặt vé: xem chi tiết và xóa vĩnh viễn

Theo yêu cầu chủ dự án: trang `/admin/bookings` xem mã đơn, khách hàng, hành khách, chuyến/ghế, tổng tiền, trạng thái và lý do hủy. Không có thao tác hủy từng đơn hay ghi nhận hoàn tiền trên trang này.

Danh sách dùng cùng header, ba thẻ thống kê, bảng, avatar khách hàng và nút thao tác với trang Quản lý tài khoản. Có tìm kiếm, lọc trạng thái, phân trang 10 đơn; lý do hủy hiển thị dưới trạng thái để bảng gọn hơn. Mã đơn dài được rút gọn trên bảng, xem đầy đủ khi trỏ chuột hoặc mở chi tiết. Cửa sổ Xem dùng phong cách popup admin, có các nhóm riêng: tóm tắt đơn, thông tin vé lúc đặt, khách đặt vé, hành khách/chỗ ngồi hiện tại, lịch sử thanh toán và đối soát. Thông tin không được lưu hiển thị là thiếu dữ liệu, không suy đoán lý do hủy.

## Xóa vĩnh viễn theo yêu cầu

`DELETE /api/bookings/:bookingId` chỉ dành cho ADMIN. Body JSON cần `booking_code` khớp chính xác mã đơn hiện tại. Giao diện yêu cầu nhập lại mã đơn và giải thích hậu quả trước khi gửi. Hỗ trợ mọi trạng thái đơn, kể cả đã xác nhận hoặc có thanh toán.

Trong một giao dịch, lấy advisory lock dùng chung với đặt vé/thanh toán và khóa đơn, sau đó xóa các dòng có đúng booking_id của đơn:

1. `payment_review_cases`: hồ sơ đối soát.
2. `tickets`: vé phát hành.
3. `passengers`: hành khách thuộc đơn.
4. `payments`: giao dịch.
5. `booking_details`: thông tin đặt chỗ/giữ ghế và hành khách hiện dùng.
6. `bookings`: đơn.

Không xóa tài khoản, chuyến bay, máy bay hoặc danh mục ghế. Nếu có ràng buộc ngoài dự kiến ngăn xóa, toàn bộ giao dịch rollback; không xóa một phần hay xóa bản ghi của đơn khác để vượt ràng buộc.

Xóa đơn giải phóng ghế đang giữ/đã đặt và làm vé biến mất khỏi tài khoản khách hàng. Giao dịch bị xóa sẽ không còn được tính trong báo cáo. Hệ thống không hoàn tiền hoặc hủy giao dịch bên MoMo. Callback đến sau khi đơn bị xóa không còn tìm được đơn để xử lý; bản ghi không được tự khôi phục. Thao tác không thể hoàn tác trong ứng dụng.

## Thay đổi database cần người quản trị thực hiện

File `backend/migrations/005_admin_booking_delete_permissions.sql` chỉ GRANT DELETE cho role `codex_user` trên sáu bảng nói trên. Không tạo/xóa bảng, không thêm/bỏ cột, không cập nhật hoặc xóa dữ liệu khi chạy file này. Cần cấp quyền DELETE vì migration 001 chỉ cấp SELECT/INSERT/UPDATE cho bảng đối soát.

Dùng postgres trong pgAdmin, chọn đúng database `airline_booking`, chạy toàn bộ file 005 từ BEGIN đến COMMIT. File chạy lặp được. Nếu backend dùng role khác `codex_user`, quản trị database cần cấp cùng quyền cho đúng role thực tế. Không chạy fixture test trên database vận hành.

Chưa áp dụng file 005 hoặc xóa đơn nào trên database vận hành trong lần thay đổi code này. Sau khi cấp quyền, khởi động lại backend và tải lại frontend.

## Kiểm tra

Frontend lint và production build đạt. Toàn bộ **29/29 kiểm thử backend đạt**, gồm chặn khách hàng xóa, yêu cầu mã xác nhận đúng, xóa hết dữ liệu con và giữ nguyên tài khoản/chuyến/ghế, trả 404 khi xóa lại, rollback khi gặp liên kết sang đơn khác. Migration 005 được áp dụng hai lần trong database thử và quyền DELETE được kiểm tra.

Database thử: `airline_booking_test_adminbooking`, tại `127.0.0.1:25432`, trong cụm riêng `C:\Users\Home\AppData\Local\Temp\booking-admin-pg-20261020`. Chỉ có cấu trúc và dữ liệu giả của fixture, không sao chép dữ liệu vận hành; email/MoMo được giả lập. Database thử được giữ lại để kiểm tra. Không chạy test hoặc migration 005 trên database vận hành.

Lần chỉnh giao diện theo mẫu Quản lý tài khoản đã kiểm tra trên Chromium bằng dữ liệu giả, chặn API ở tầng trình duyệt: danh sách desktop 1440px, popup desktop và mobile 390px; tìm kiếm/xóa từ khóa, lọc trạng thái, phân trang, mở chi tiết, đóng bằng Escape, nút xóa bị khóa trước khi nhập đúng mã đơn. Không có lỗi JavaScript; không gọi API hoặc xóa đơn thật trong bước kiểm tra giao diện.
