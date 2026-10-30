# Hoàn thiện trước báo cáo — 23/10/2026

Tài liệu này mô tả hành vi hiện tại, thay thế phần xóa đơn trong tài liệu quản trị cũ nếu có khác biệt.

## Các thay đổi

1. **Giữ lịch sử giao dịch:** DELETE đơn chỉ được phép khi không có payment, hồ sơ đối soát, vé đã cấp, và trạng thái không phải CONFIRMED/PAYMENT_REVIEW. Đơn có giao dịch PENDING/FAILED cũng được bảo vệ vì callback thành công có thể đến muộn. Nhập đúng mã đơn vẫn là điều kiện bắt buộc để xóa đơn chưa có giao dịch.
2. **Hủy đơn:** admin dùng PATCH `/api/bookings/:id/cancel` với lý do 5–1000 ký tự. Hủy giải phóng ghế, giữ đơn và mọi giao dịch. Khoản SUCCESS mở hồ sơ đối soát; không tự hoàn tiền. Hủy lại đơn CANCELLED/PAYMENT_REVIEW không mở thêm hồ sơ hoặc ghi đè lý do.
3. **Ghi nhận hoàn tiền:** form tại chi tiết đơn và chi tiết thanh toán có mã giao dịch, số tiền, lý do đối soát, ghi chú, mã hoàn tiền và ô xác nhận. Chỉ dùng sau khi đã xử lý hoàn khoản tương ứng; MOCK là thao tác giả lập. Backend chỉ cho ADMIN, lưu người xử lý và thời gian. Gửi lại cùng hồ sơ đã REFUNDED không hoàn lại lần nữa. Hoàn khoản thu trùng không hủy vé đã xác nhận bằng giao dịch đầu.
4. **Đơn của khách:** `/my-orders` hiển thị đơn đã hoàn tất nhập thông tin, có lọc trạng thái, tải lại, tự cập nhật khi lấy lại focus và định kỳ 15 giây. Lượt giữ ghế tạm TMP chưa có hành khách không được hiển thị như đơn hoàn chỉnh. `/my-bookings` cũ chuyển tới trang mới.
5. **Tiếp tục thanh toán:** `/payment?bookingId=...` gọi GET `/api/bookings/:id/checkout`. Backend đọc snapshot hành khách, ghế, dịch vụ, giá đã lưu; kiểm tra chủ đơn, trạng thái, chuyến và hạn giữ ghế. Không gia hạn giữ ghế và không áp giá chuyến mới vào đơn cũ. Nếu MoMo đang PENDING, mở lại giao dịch hiện tại; không cho xen thanh toán MOCK.
6. **Admin xem trang khách:** trang chủ/điểm đến/blog không ép admin quay về dashboard. Menu tài khoản có “Về trang quản trị”. Root/login vẫn ưu tiên đưa admin về dashboard; API quản trị vẫn xác minh quyền từ database.
7. **Nội dung và tài liệu:** bỏ giá khuyến mãi không gắn dữ liệu và tuyến Seoul/Bangkok ngoài phạm vi, footer chỉ hiển thị MoMo. README có cấu hình mẫu, thứ tự migration, setup database mới, cách chạy/test và kịch bản demo. Thiếu khóa Groq không ngăn backend khởi động.

## Database

Không tạo migration mới, không thay bảng/cột hay dữ liệu trong database ứng dụng hiện tại; không chỉnh `.env` của người dùng.

Các thao tác qua giao diện sau khi triển khai sẽ cập nhật những bảng sẵn có: `bookings`, `booking_details`, `payments`, `payment_review_cases`. Hủy lưu lý do/thời gian, cập nhật trạng thái ghế; hoàn tiền ghi kết quả, người xử lý và thời gian. Không xóa lịch sử giao dịch.

`backend/setup/schema.sql` và `npm run setup:demo` chỉ để dựng **database mới, rỗng** trên máy cài mới. Script dùng `SETUP_DATABASE_URL`, từ chối tên database ngoài `airline_booking_demo[_suffix]`, host ngoài local hoặc schema đã có bảng/enum; không đọc kết nối ứng dụng từ `.env`. Dùng PostgreSQL 18, tài khoản có quyền dựng schema/role. Script tạo schema, admin do người cài chỉ định, sân bay và áp dụng migration cũ. Không chạy script này trên database hiện tại.

## Kiểm thử và giới hạn

- Đã chạy 37/37 kiểm thử tự động đạt, gồm lịch bay, avatar và API tích hợp PostgreSQL thật. Kiểm tra mới bao gồm giữ lịch sử sau hủy/hoàn, chặn xóa payment đang chờ, callback muộn, giá/hạn giữ ghế khi tiếp tục, chặn truy cập đơn khác và xóa đơn chưa thanh toán.
- Cluster kiểm thử mới: thư mục tạm `booking-report-pg-20261023`, cổng 25432; database `airline_booking_test_report20261023`. Chỉ chứa dữ liệu giả, email và lệnh tạo thanh toán MoMo được thay bằng dịch vụ giả.
- Đã dựng thử `airline_booking_demo_report20261023` bằng script setup: một admin giả, 11 sân bay, 12 máy bay/240 ghế, chưa có đơn/thanh toán ở thời điểm setup. Kịch bản trình duyệt sau đó tạo thêm khách/đơn/thanh toán MOCK và ghi nhận hoàn tiền trong chính database demo này. Không thay kết nối ứng dụng hiện tại. Chạy setup lại trên database đã có dữ liệu bị từ chối trước khi thay đổi schema.
- Đã kiểm tra Chrome headless trên backend demo riêng cổng 5051 và Vite cổng 5174: khách mở đơn, tiếp tục và tải lại trang thanh toán, thanh toán MOCK, admin xem trang khách/quay về quản trị, chặn nút xóa đơn đã trả, hủy đơn, nhập form hoàn tiền, kiểm tra trạng thái REFUNDED/CANCELLED và mở lại chi tiết thanh toán để xác minh mã hoàn tiền đã lưu. Không có lỗi JavaScript trong kịch bản. Đã chụp/kiểm tra bố cục thanh toán trên màn hình 390px và mở modal admin ở cùng kích thước.
- Thiếu cấu hình Groq không ngăn backend demo khởi động. Chưa xác minh Gmail/MoMo thật và chưa kết nối tồn vé của hãng.
- Frontend lint và production build đạt. Build còn cảnh báo kích thước JavaScript khoảng 594 kB, không phải lỗi build.

## Checklist trình duyệt trước báo cáo

- Khách tạo đơn rồi đăng xuất/đăng nhập; mở Đơn đặt vé và tiếp tục đúng đơn/giá/hạn giữ ghế. Mở URL thanh toán ở tab mới cũng hoạt động.
- Hết hạn: nút tiếp tục không còn khả dụng, API checkout/pay từ chối, có đường tìm chuyến mới.
- Đăng nhập tài khoản khác và mở URL checkout: không được xem thông tin hành khách của chủ đơn.
- Admin xem trang khách hàng và quay về quản trị; tài khoản khách không vào được API admin.
- Admin hủy đơn đã trả tiền: đơn/giao dịch vẫn còn, ghế trống, có hồ sơ OPEN. Nhập mã/ghi chú, xác nhận khoản đã hoàn; hồ sơ/payment chuyển REFUNDED, trạng thái khách được cập nhật.
- Callback thành công sau khi hủy: giữ tiền SUCCESS trong lịch sử và tạo đối soát, không cấp lại ghế.
- Kiểm tra trên màn hình điện thoại: danh sách đơn, nút tiếp tục, modal hủy và form hoàn tiền.
- Chuẩn bị hai trình duyệt hoặc cửa sổ ẩn danh để thử tranh chấp ghế; chọn ngày mai để tránh lịch demo đã qua giờ.
