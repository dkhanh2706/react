# Vé điện tử và đánh giá khách hàng

Trang thanh toán thành công hiển thị vé điện tử: hãng, số hiệu, điểm đi/đến, giờ bay, ngày bay, ghế, số tiền và mã đặt chỗ. Thông tin lấy từ booking, không tạo mã QR/barcode giả. Luồng MoMo, thanh toán demo, đối soát và hoàn tiền giữ nguyên.

Điểm đi/đến trên vé, trang thanh toán thành công, form đánh giá và đánh giá ở home dùng tên tiếng Việt từ `frontend/src/utils/airportNames.js`. Ví dụ `PQC` hoặc `PhuQuoc` hiển thị `Phú Quốc`, `HAN` hiển thị `Hà Nội`. Bộ chuyển tên hỗ trợ mã sân bay và tên không dấu của các địa điểm có trong dự án; giá trị chưa nhận diện giữ nguyên để tránh đoán sai. Thay đổi này chỉ ở giao diện, không sửa database hoặc mã tuyến dùng để đặt vé.

## Quy tắc đánh giá

- Trong Vé của tôi, vé CONFIRMED có thanh toán SUCCESS được mở form đánh giá. Backend kiểm tra chủ vé và thanh toán không có hồ sơ đối soát OPEN.
- Chọn 1–5 sao và nhập nội dung từ 1–1000 ký tự. Điểm đi/đến lấy từ booking; tên người đánh giá lấy từ tài khoản.
- Mỗi đơn chỉ gửi một lần. Không có API sửa. Chủ vé có thể xóa vĩnh viễn sau khi xác nhận; xóa không mở lại lượt gửi.
- Home dùng dữ liệu thật, không dùng đánh giá mẫu. Mới nhất đứng đầu (#1); cùng thời điểm thì ID lớn đứng trước.
- Chỉ giữ tối đa 4 đánh giá trong database. Khi gửi mới thành công, các bài vượt giới hạn bị xóa vĩnh viễn ngay trong cùng giao dịch. Các đơn tương ứng vẫn lưu dấu đã đánh giá.
- Home lấy dữ liệu khi mở trang, khi quay lại tab, khi tab khác gửi/xóa đánh giá; tự cập nhật mỗi 15 giây khi đang mở.
- Khi admin xóa đơn vĩnh viễn, đánh giá của đơn đó cũng bị xóa theo khóa ngoại ON DELETE CASCADE.

## Đổi giới hạn từ 4 thành 5

Mở `backend/config/reviews.js`, đổi `const MAX_REVIEWS = 4;` thành `const MAX_REVIEWS = 5;`, rồi khởi động lại backend. Cả API home và thao tác giữ/xóa bài đều dùng cùng cấu hình này. Không cần sửa frontend hoặc database.

Nếu giảm giới hạn, home áp dụng ngay sau khởi động lại; các bài vượt giới hạn được xóa khỏi database ở lần gửi đánh giá kế tiếp. Tăng giới hạn không khôi phục bài đã bị xóa.

## Thay đổi database

File `backend/migrations/006_customer_reviews.sql`:

1. Thêm cột nullable `bookings.customer_reviewed_at` để ghi dấu đã đánh giá, vẫn giữ sau khi bài bị xóa.
2. Tạo bảng `customer_reviews`: `id`, `booking_id` (duy nhất, liên kết đơn), `rating`, `comment`, `created_at`; có CHECK sao/nội dung và index mới nhất.
3. Cấp quyền SELECT/INSERT/DELETE và sequence cho role ứng dụng `codex_user`. Không cấp UPDATE trên đánh giá.

Migration không thêm dữ liệu mẫu, không xóa dữ liệu cũ và chạy lặp được. Không có migration tự động khi khởi động backend. Trước khi áp dụng, API đánh giá trả 503 và các luồng vé/thanh toán cũ vẫn hoạt động. Nếu role ứng dụng khác `codex_user`, cần thay role trong GRANT trước khi áp dụng.

Database vận hành chưa được thay đổi trong quá trình viết code. Chỉ áp dụng migration sau khi chủ dự án xác nhận.

## Kiểm chứng

32/32 kiểm thử backend đạt trên database riêng `airline_booking_test_reviews2`, cổng 25433, cụm tạm `booking-reviews-pg-20261022`. Bao gồm 29 kiểm thử cũ và kiểm tra mới: chặn sai chủ/chưa trả tiền/đối soát/dữ liệu sai, gửi đồng thời cùng đơn chỉ thành công một lần, chặn sửa, xóa không đánh giá lại, gửi đồng thời nhiều đơn giữ đúng số bài mới nhất, admin xóa đơn vẫn hoạt động với khóa ngoại mới. Migration áp dụng lặp hai lần trong database thử.

Không chạy fixture hoặc bộ kiểm thử tích hợp trên database vận hành. Email và MoMo được giả lập trong kiểm thử.

Frontend lint và production build đạt. Kiểm tra Chromium bằng API giả: trang thanh toán thành công desktop 1440px/mobile 390px, mở form, chọn sao, gửi, hiển thị ở home, xóa và chặn gửi lại. Không có lỗi JavaScript hoặc tràn ngang trên các trang được kiểm tra. Ảnh kiểm tra lưu trong thư mục tạm `ticket-review-preview`.
