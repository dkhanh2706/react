# Gom hàm dùng chung và kiểm tra chức năng

Hoàn tất kiểm tra ngày 29/10/2026 sau khi tiếp tục phần công việc ngày 28/10.

## Mã dùng chung

- `frontend/src/utils/format.js`: định dạng số/tiền, ngày, giờ, ngày giờ và ngày hiện tại tại Việt Nam. Phân biệt ngày lịch trên vé với timestamp; timestamp không có offset từ database được hiểu là giờ Việt Nam. Xử lý giá trị thiếu/không hợp lệ, giữ suffix tiền và placeholder riêng của trang qua tham số.
- `frontend/src/utils/auth.js`: đọc tài khoản/phiên từ localStorage an toàn, kiểm tra role/expiry phục vụ giao diện, xóa phiên và thông báo `auth-changed`. Backend tiếp tục kiểm tra chữ ký JWT, quyền, khóa và token version.
- `frontend/src/utils/labels.js`: tên giới tính/suất ăn. Suất ăn lấy nhãn từ `MEAL_OPTIONS`, không khai báo thêm bảng tên trùng.
- Kết quả tìm kiếm sử dụng `airportNames.js` cùng các màn hình vé/đánh giá.
- Đã thay các bản sao tại trang khách, trang admin, layout, context, hook và component. `booking.js`, `passenger.js`, `profile.js` còn lại các quy tắc/cấu hình riêng; bỏ `payment.js` vì các hàm của nó đã được chuyển hết sang module dùng chung.

## Kết quả kiểm tra

| Nhóm | Kết quả | Phạm vi |
| --- | --- | --- |
| Frontend unit | 8/8 đạt | Tiền dạng chuỗi từ PostgreSQL, giá trị thiếu/sai, ngày nhuận, UTC/giờ Việt Nam, giờ trên vé, ranh giới ngày, JSON phiên lỗi, logout, token và nhãn dịch vụ. |
| Backend | 48/48 đạt | Avatar, lịch demo, bảo mật và tích hợp API với PostgreSQL thật: tài khoản/quyền, giữ ghế, giá, thanh toán, callback, hủy/đối soát/hoàn tiền, đơn/vé/đánh giá. |
| Chat trực tiếp | 13/13 đạt | PostgreSQL/WebSocket thật trong môi trường kiểm thử; tiếp nhận, quyền phụ trách, tin nhắn, ngắt/kết nối lại và chuyển về bot. |
| ESLint | Đạt | Mã frontend và unit test. |
| Production build | Đạt | Vite build; còn cảnh báo bundle JavaScript trên 500 kB. |
| Trình duyệt | Đạt | Chrome headless với API/WebSocket giả; 47 mốc chờ trạng thái và 66 lượt API trong kịch bản. Không có JavaScript exception chưa xử lý. |

Kịch bản trình duyệt gồm:

1. Đăng ký, đăng nhập, gửi mã khôi phục và đặt lại mật khẩu.
2. Sửa/lưu hồ sơ; đổi mật khẩu qua mã và thu hồi phiên trên giao diện.
3. Tìm chuyến; nhập hành khách, hành lý, suất ăn, bảo hiểm; giữ ghế; tạo đơn; mở lại từ danh sách đơn; thanh toán demo và xem kết quả.
4. Xem vé, gửi đánh giá và xóa; giữ dấu đã đánh giá.
5. Mở blog/chi tiết, điểm đến và luồng chatbot tìm chuyến.
6. Dashboard, khóa khách hàng, form sửa chuyến có lịch sử và hủy chuyến.
7. Hủy đơn đã trả, nhập form ghi nhận hoàn tiền và mở lại chi tiết để kiểm tra mã đã lưu; xem danh sách thanh toán.
8. Admin tiếp nhận hội thoại, gửi tin và kết thúc hỗ trợ.
9. Kiểm tra trang hồ sơ, đơn và thanh toán ở viewport 390 × 844; không tràn ngang. Khách chưa đăng nhập bị chuyển về login khi vào trang bảo vệ.

## Database và giới hạn

Backend chạy trên cluster PostgreSQL tạm riêng, hai database mới/rỗng cho tích hợp và chat. Không chạy fixture/migration trên database ứng dụng, không sửa `.env`. Tiến trình PostgreSQL tạm đã dừng sau kiểm thử; log/dữ liệu kiểm thử được giữ trong `backend/temp/` (đã ignore trong Git).

Log backend đạt: `backend/temp/shared-utils-20261028222221/integration.log`. Log chat đạt: `backend/temp/shared-utils-20261028221707/chat.log`. Đây là đường dẫn của lượt kiểm tra cục bộ, không được đưa lên Git và có thể không tồn tại trên máy khác.

Bài kiểm thử tích hợp avatar được cập nhật để tạo PNG hợp lệ, kiểm tra kết quả WebP và dùng error handler thật. Kiểm tra metadata đọc từ buffer để tránh libvips giữ handle file trên Windows khi dọn ảnh fixture. Không nới lỏng bước kiểm tra ảnh của ứng dụng.

Gmail, Groq và thanh toán/hoàn tiền MoMo thật chưa được xác minh trong lượt này. Test dùng dịch vụ giả cho tác động bên ngoài; không phát hành vé hãng hoặc chuyển tiền thật.

## Chạy lại

Trong `frontend`: `npm test`, `npm run lint`, `npm run build`; `npm run test:ui` tự build rồi chạy trình duyệt với fixture. Có thể đặt `CHROME_PATH` để chọn Chrome/Edge trên máy.

Trong `backend`: `npm test` và `npm run test:chat`, mỗi bộ cần `TEST_DATABASE_URL` trỏ đến database local mới/rỗng khác nhau theo hướng dẫn trong README. Backend mặc định không đọc lại schema của database ứng dụng cho các test này.
