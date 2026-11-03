# Rà soát liên kết và luồng sử dụng — 03/11/2026

## Kết quả

Các luồng khách hàng và quản trị đã được rà soát trong mã nguồn, kiểm tra bằng API giả lập và chạy với Express/PostgreSQL riêng. Những điểm làm mất ngữ cảnh giữa các trang đã được chỉnh lại. Các kiểm tra này phục vụ bản đồ án/demo; không phải xác nhận giao dịch MoMo thật hoặc chứng nhận hệ thống bán vé thương mại.

## Những điểm đã sửa

| Trước đây | Hành vi hiện tại |
| --- | --- |
| Trang chủ/điểm đến gọi tìm kiếm rồi trang kết quả gọi lại | Các trang đầu chuyển tuyến/ngày vào URL; `/flights` thực hiện tìm kiếm |
| `/flight-list` có giao diện và cách xử lý đăng nhập riêng | Đường dẫn cũ chuyển sang cùng luồng `/flights`, giữ query và dữ liệu tương thích |
| Thiếu dữ liệu chuyển trang có thể mất chuyến đã chọn | Trang hành khách/chọn ghế dùng `flightId` và API đọc chuyến còn mở bán |
| Quay lại sửa hành khách dễ phải nhập lại dịch vụ/giấy tờ | Bản nháp theo tài khoản/chuyến lưu trong tab, hạn 30 phút; giữ lại khi quay lại |
| Nút quay lại có thể trở về trang chọn ghế thay vì kết quả | “Đổi chuyến bay” mở lại kết quả của đúng tuyến/ngày |
| Hết phiên đăng nhập chuyển về login và mất đích | Giữ đích tối đa 30 phút cho cùng tài khoản; đăng nhập xong kiểm tra lại đơn |
| Phản hồi 401 của request cũ có thể xóa phiên vừa đăng nhập | Chỉ thu hồi phiên nếu token của request vẫn là token hiện tại |
| API login sai mật khẩu có thể kích hoạt xử lý hết phiên chung | Xử lý hết phiên chỉ áp dụng với request có token; lỗi đăng nhập giữ tại form |
| Trang admin chưa giữ đích khi yêu cầu đăng nhập | Dùng chung route bảo vệ và cơ chế quay về; backend vẫn kiểm tra ADMIN |
| Chat có thể khôi phục phiên của tài khoản trước trên cùng trình duyệt | Phiên lưu kèm chủ sở hữu giao diện; đổi tài khoản ngắt UI/kết nối cũ và không khôi phục hội thoại đó |
| Trang kết quả luôn ưu tiên “Xem vé” | Nút thay đổi theo trạng thái: xem vé, tiếp tục thanh toán hoặc xem đơn/tìm chuyến |
| Admin phải tự chép mã để tìm ở màn hình khác | Tài khoản → đơn của khách; chi tiết đơn → giao dịch/tài khoản; giao dịch → đúng đơn |
| URL sai tự quay về trang chủ | Có trang 404 với liên kết trở lại |
| Menu desktop thiếu đường trực tiếp tới đơn chờ | Có liên kết Đơn đặt vé và Vé của tôi; menu desktop dùng liên kết hỗ trợ bàn phím/tab mới |
| Setup mới chỉ áp dụng tới migration 007 | Setup database mới áp dụng đủ 001–008; không tự chạy trên database ứng dụng |
| Thiếu rewrite cho React Router trên Vercel | Có `frontend/vercel.json`; cần cấu hình URL API và dịch vụ cloud trước khi deploy |

Đã bỏ CSS riêng của trang danh sách cũ sau khi hợp nhất luồng. README được viết lại theo trình tự cài đặt, database mới/có sẵn, chạy, cơ chế hoạt động, kiểm tra và triển khai.

## Phạm vi đã kiểm tra

- 61 bài backend, gồm tích hợp PostgreSQL: xác thực, quyền admin/chủ đơn, giữ ghế đồng thời, giá, thanh toán, callback đến muộn, đối soát, lịch demo và dashboard.
- 15 bài chat: quyền phiên, hỗ trợ trực tiếp, trạng thái nhân viên và WebSocket.
- 16 bài frontend: thông tin hành khách, ngày giờ, đích đăng nhập, thời hạn và tách bản nháp theo tài khoản/chuyến.
- ESLint và bản build frontend chạy thành công.
- Trình duyệt với API giả lập: 178 điều kiện chờ, 186 lượt gọi API, không có exception JavaScript chưa xử lý. Có kiểm tra mới cho một lượt tìm kiếm, đường dẫn cũ, sửa/quay lại hành khách, reload không có history state, hết phiên tại checkout, tách chat và trang 404.
- Trình duyệt với backend/database riêng: đăng ký, hồ sơ/upload, tìm chuyến, đặt vé/thanh toán demo, vé/đánh giá, dashboard, khóa tài khoản, quản trị chuyến, hủy/hoàn tiền và chat trực tiếp.
- Kiểm tra production: tắt demo và endpoint debug; origin không hợp lệ bị từ chối.
- Các liên kết file tương đối trong README được kiểm tra tồn tại.

Kết quả toàn dự án: `backend/temp/full-check-20261103092611183/summary.json`.
Luồng backend/trình duyệt được chạy lại sau chỉnh sửa cuối: `backend/temp/full-check-20261103093117201/summary.json`.
Các thư mục này chỉ là kết quả local, không đưa vào Git và có thể dọn sau khi dừng kiểm thử.

## Những phần còn giới hạn

- Chưa dùng database ứng dụng hoặc giao dịch MoMo/Gmail/Groq thật trong đợt kiểm tra; database test hoàn toàn tách biệt.
- Website vẫn mô phỏng một chiều/một hành khách mỗi đơn; hoàn tiền ghi nhận thủ công và chưa nối kho vé hãng.
- Chat là phiên trình duyệt. Cột `customer_id` đã có trong migration nhưng chưa dùng để xác thực danh tính chủ đơn hay đồng bộ hộp thư nhiều thiết bị; admin cần kiểm tra khách trước khi xử lý yêu cầu.
- Bản nháp là dữ liệu trong tab, không phải đơn đã được server xác nhận. Giữ bản nháp/đăng nhập lại không gia hạn giữ ghế.
- Vercel/Render cần database cloud, URL môi trường, email và nơi lưu ảnh bền vững. Production hiện chặn tạo chuyến mẫu và thanh toán MOCK.
- Build còn cảnh báo bundle lớn; có thể tách tải các nhóm trang khi tối ưu hiệu năng tiếp theo.

Xem quy trình chạy và các giới hạn triển khai cụ thể trong [README](../README.md).
