# Dọn bảng đã có cơ chế thay thế

## Phạm vi đã chốt

Theo yêu cầu ngày 20/10/2026: xóa bảng không còn dùng, giữ bảng còn hữu ích cho mở rộng. Chỉ loại **booking_temp** và **password_resets**. Không xóa bảng chỉ vì bảng đang rỗng.

| Bảng | Xử lý | Lý do |
| --- | --- | --- |
| booking_temp | Bỏ | Giữ ghế hiện nằm trong booking_details bằng HOLD và hold_expires_at. |
| password_resets | Bỏ | Luồng mã mới dùng password_challenges, có băm mã, hạn, giới hạn số lần thử và dùng một lần. |
| passengers | Giữ | Có thể tách hành khách thành thực thể riêng khi mở rộng nhiều hành khách/đơn. |
| tickets | Giữ | Có thể dùng để phát hành mã vé riêng, liên kết passengers, flight, seat và booking. |
| notifications | Giữ | Có thể triển khai thông báo đổi lịch, thanh toán và thông báo trong tài khoản. |

Thông tin hành khách và hiển thị vé hiện vẫn lấy từ booking_details/bookings/payments. Việc giữ các bảng dự phòng không có nghĩa tính năng mở rộng đã được triển khai.

## Kiểm tra database thật trước khi áp dụng

Đã đọc qua PostgreSQL MCP, profile localdb, database airline_booking:

- booking_temp: **0 dòng**.
- password_resets: **1 dòng, đã hết hạn**; không có mã còn hạn.
- Cả hai bảng và hai sequence cũ thuộc postgres. Tài khoản MCP codex_user không phải chủ sở hữu nên không thực hiện DROP.
- Không tìm thấy khóa ngoại từ bảng khác trỏ vào hai bảng cần bỏ. Migration vẫn dùng RESTRICT để bảo vệ nếu có thêm phụ thuộc vào lúc chạy.

## Thay đổi cấu trúc

File: `backend/migrations/004_remove_replaced_tables.sql`.

1. Trong giao dịch, lấy advisory lock chung với booking/admin và khóa bảng cần bỏ.
2. Dừng nếu booking_temp có bất kỳ dòng nào; dừng nếu password_resets còn mã chưa hết hạn.
3. DROP TABLE booking_temp và password_resets, có IF EXISTS và RESTRICT.
4. Bỏ sequence cũ booking_temp_id_seq, password_resets_id_seq nếu còn tồn tại và không còn phụ thuộc.

Index, ràng buộc và quyền gắn với hai bảng bị bỏ cùng bảng. Một mã reset cũ đã hết hạn sẽ không còn được lưu. Không đổi cấu trúc hoặc dữ liệu người dùng, chuyến bay, ghế, booking, thanh toán, password_challenges hay hồ sơ đối soát.

Sau khi áp dụng thành công còn **14 bảng public**: users, airlines, airplanes, airports, flights, seats, bookings, booking_details, payments, password_challenges, payment_review_cases, passengers, tickets, notifications.

## Code đã chuẩn bị

- Bỏ truy vấn booking_temp khỏi kiểm tra sửa/xóa chuyến bay.
- Bỏ booking_temp/password_resets khỏi kiểm tra xóa user. Giữ các kiểm tra booking, notifications, password_challenges và đối soát.
- Setup dữ liệu demo 003 đọc liên kết booking_temp khi bảng còn tồn tại; chạy được cả trước/sau 004. Không bỏ bảo vệ dữ liệu cũ nếu chạy trên database chưa dọn.
- Fixture test giữ cấu trúc cũ để kiểm tra migration, không dùng làm schema vận hành.

## Cách áp dụng

Khởi động lại backend với code mới trước. Trong pgAdmin, kết nối bằng postgres, chọn đúng airline_booking, mở Query Tool và chạy **toàn bộ file 004 từ BEGIN đến COMMIT**. Không chạy từng dòng DROP riêng.

Nếu tab đang lỗi giao dịch cũ, chạy riêng ROLLBACK trước. Nếu file 004 có ERROR, gửi lỗi đầu tiên; chạy ROLLBACK để thoát giao dịch lỗi và xử lý nguyên nhân trước khi chạy lại. Không thêm CASCADE để vượt qua lỗi phụ thuộc.

Kiểm tra sau khi chạy:

```sql
SELECT to_regclass('public.booking_temp') AS removed_temp,
       to_regclass('public.password_resets') AS removed_resets,
       to_regclass('public.booking_temp_id_seq') AS removed_temp_sequence,
       to_regclass('public.password_resets_id_seq') AS removed_reset_sequence;
```

Bốn giá trị cần là NULL. Các bảng passengers, tickets, notifications vẫn giữ nguyên.

## Kiểm thử

**27/27 bài đạt** trên database tạm `airline_booking_test_cleanup` (cổng 25432). Tất cả API test chạy sau khi 004 đã bỏ hai bảng. Đã kiểm tra:

- Giữ nguyên dữ liệu và không xóa khi booking_temp có dòng hoặc mã cũ còn hạn.
- Phụ thuộc view làm RESTRICT dừng và rollback cả giao dịch, kể cả bảng đã DROP trước đó trong cùng giao dịch.
- Chạy lại migration không lỗi; bảng và sequence mục tiêu đã biến mất; ba bảng dự phòng vẫn còn.
- Đăng nhập/khôi phục mật khẩu, giữ ghế, đặt vé, MOCK/MoMo callback, lịch demo và admin vẫn hoạt động.
- Admin xóa user/chuyến thủ công chưa phát sinh dữ liệu không bị lỗi do tham chiếu bảng đã bỏ.

Kiểm tra cú pháp JavaScript và git diff --check đạt. Không cần thay đổi frontend trong đợt này.

## Trạng thái database thật

Chủ database đã chạy toàn bộ file 004 bằng postgres trong pgAdmin và nhận COMMIT thành công ngày 20/10/2026. Đã kiểm tra lại qua MCP: booking_temp, password_resets và hai sequence đều không còn; passengers, tickets, notifications vẫn tồn tại; public hiện có **14 bảng**. Bookings còn **56 dòng**, payments **13 dòng**, trùng số lượng tại lần kiểm tra trước khi dọn. Không thay đổi dữ liệu booking/thanh toán để bỏ hai bảng cũ.
