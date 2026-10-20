# Bàn giao sửa logic đặt vé

## Phạm vi và trạng thái

Đã sửa code theo các quyết định đã chốt: migration do chủ database chạy; hoàn tiền thủ công; FIRST = 2 × giá cơ bản cho đơn mới; chỉ bán chuyến AVAILABLE, chưa khởi hành và còn ghế. Phần tìm kiếm demo sau đó được đổi theo yêu cầu mới: tạo chuyến theo tuyến/ngày khi tìm, thay cho lịch tạo trước cả năm; quy tắc hiện tại và nhật ký dữ liệu nằm ở [demo-flight-schedule.md](demo-flight-schedule.md).

**Ở thời điểm bàn giao phần sửa logic ban đầu, chưa áp dụng migration hoặc sửa dữ liệu trên database thật `airline_booking`.** Các lần chạy kiểm thử dùng PostgreSQL tạm tại `127.0.0.1:25432`, tách khỏi kết nối `localdb`. Sau đó, theo yêu cầu bổ sung lịch demo, chủ database đã áp dụng migration 002 và đã thêm dữ liệu lịch bay qua MCP; xem nhật ký hiện tại trong [demo-flight-schedule.md](demo-flight-schedule.md). Yêu cầu dọn bảng tiếp theo đã cho phép bỏ hai bảng cũ qua migration 004; kết quả hiện tại nằm trong [database-table-cleanup.md](database-table-cleanup.md).

Backend mới cần migration bên dưới trước khi khởi động. Kiểm tra lúc khởi động chỉ đọc metadata, báo rõ nếu thiếu cấu trúc; không tự thay đổi database.

## Toàn bộ thay đổi dự kiến trên database thật

File: `backend/migrations/001_account_booking_safety.sql`.

| Đối tượng | Thay đổi |
| --- | --- |
| Enum `public.booking_status` | Thêm `EXPIRED`, `PAYMENT_REVIEW`. |
| `public.users` | Thêm `token_version integer NOT NULL DEFAULT 0`, `is_primary_admin boolean NOT NULL DEFAULT false`. |
| Dữ liệu `users` | Nếu chưa có admin chính và có đúng một ADMIN, đánh dấu tài khoản đó `is_primary_admin=true`. Nếu có 0 hoặc nhiều ADMIN, migration dừng để xác định tài khoản chính, không tự chọn. |
| `public.password_challenges` — bảng mới | `id` bigint identity PK; `user_id` FK users; `purpose` forgot/change; `code_hash`; `attempts` mặc định 0, không âm; `created_at`, `expires_at`, `consumed_at` kiểu timestamptz. |
| `public.payments` | Thêm `momo_order_id`, `momo_request_id`, `provider_result_code`, `provider_message`, `pay_url`; dữ liệu lịch sử để NULL ở các cột mới. |
| `public.payment_review_cases` — bảng mới | `id` bigint identity PK; `payment_id` unique FK payments; `booking_id` FK bookings; `reason`; `status` OPEN/REFUNDED; `resolution_note`, `refund_reference`; `resolved_by` FK users; `created_at`, `resolved_at` timestamptz. |
| `public.bookings` | Thêm `cancelled_at timestamptz`, `cancellation_reason text`. |
| Index mới | `users_one_primary_admin` (unique khi cờ true); `password_challenges_user_time`; `payments_momo_order_unique`, `payments_momo_request_unique` (unique khi không NULL); `payments_booking_created`; `booking_details_booking`. |
| Sequence mới | Hai sequence identity tự tạo cho `password_challenges.id` và `payment_review_cases.id`. |
| Quyền `codex_user` | SELECT/INSERT/UPDATE trên hai bảng mới; USAGE/SELECT trên hai sequence mới. Không đổi quyền sở hữu hay quyền trên các bảng cũ. |

Các PK/FK/unique/check của bảng mới được khai báo ngay trong file SQL. Giữ nguyên index `unique_active_flight_seat` để chống giữ/đặt trùng ghế trên một chuyến.

Không DROP/TRUNCATE bảng, không xóa cột, không xóa booking/payment lịch sử. Bảng `password_resets` cũ vẫn giữ nguyên nhưng luồng mới không dùng mã cũ. Không cập nhật lại giá vé đã mua.

### Cách áp dụng — người quản trị thực hiện

1. Dừng backend cũ để tránh hai phiên bản cùng ghi dữ liệu trong lúc chuyển đổi. Sao lưu database hiện tại.
2. Dùng tài khoản sở hữu bảng (`postgres`) kết nối đúng `airline_booking`. Không dùng `codex_user` để ALTER các bảng public.
3. Chạy **toàn bộ file** SQL bằng `psql`, với autocommit bình thường:

   ```powershell
   psql -h localhost -U postgres -d airline_booking -v ON_ERROR_STOP=1 -f backend/migrations/001_account_booking_safety.sql
   ```

   Dùng host/port thực tế của `localdb` nếu khác mặc định; lệnh chạy từ thư mục gốc dự án. Không dùng `--single-transaction` và không bọc toàn bộ file trong BEGIN khác: hai giá trị enum được thêm trước giao dịch thay đổi bảng.

4. Nếu migration báo admin không rõ ràng, dừng lại để chọn admin chính; không sửa đại dữ liệu. Phần thay đổi bảng nằm trong giao dịch sẽ rollback; hai giá trị enum thêm trước đó có thể đã tồn tại. File hỗ trợ chạy lại khi hoàn tất bước xử lý.
5. Khởi động backend mới từ thư mục `backend` bằng `node server.js`; chạy frontend như trước.
6. Đăng nhập lại: token cũ không có `token_version` sẽ không còn hợp lệ. Các mã khôi phục cũ không sử dụng được.

**Giao dịch MoMo đang chờ từ phiên bản cũ:** không có bộ mã order/request được lưu theo cơ chế mới nên callback cũ sẽ không được tự nhận diện. Kiểm tra và đối soát các giao dịch đang chờ trước chuyển đổi; không suy đoán mã giao dịch hoặc tự đánh dấu đã trả tiền.

## Cấu hình

Không ghi đè các file `.env` hiện có và không đưa bí mật vào tài liệu.

- Giữ các biến DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD hiện tại.
- `JWT_SECRET` phải được cấu hình; dùng để ký token và băm mã khôi phục.
- Email dùng `MAIL_USER`, `MAIL_PASS` (mật khẩu ứng dụng Gmail), tùy chọn `MAIL_FROM_NAME` như dịch vụ email hiện tại. Không gửi được mã thì yêu cầu trả lỗi, không trả mã trong API.
- Bật thanh toán giả lập trong môi trường đồ án bằng `DEMO_PAYMENTS_ENABLED=true`, với `NODE_ENV` khác `production`. Mặc định tắt nếu thiếu cờ; production luôn tắt. Frontend lấy cờ từ `/api/payments/config`.
- Giữ cấu hình MoMo hiện tại và URL IPN/redirect phù hợp môi trường. Kiểm thử tự động không gọi MoMo thật.
- `VITE_API_URL` là URL API có `/api`; nếu bỏ trống, frontend dùng `/api` cùng origin.

## Quy tắc đã triển khai

- Mỗi request có xác thực đọc lại user, quyền, khóa và token_version từ database. Khóa, đổi mật khẩu hoặc đổi quyền làm token cũ mất hiệu lực ở lần request kế tiếp. Mở khóa không khôi phục token cũ.
- Mã khôi phục 6 chữ số, hiệu lực 10 phút, tối đa 5 lần sai; chờ 60 giây trước lần gửi tiếp. Mã lưu dạng HMAC; chỉ dùng một lần. Rate limit HTTP hiện lưu trong bộ nhớ từng tiến trình; triển khai nhiều backend cần kho giới hạn dùng chung.
- Không xóa tài khoản có lịch sử liên quan; sử dụng khóa. Admin chính được bảo vệ. Không mở thêm chức năng cấp quyền ADMIN/STAFF trong đợt này.
- Một lượt giữ ghế có hạn 15 phút, không kéo dài khi tạo đơn/tạo thanh toán. Đổi ghế kết thúc lượt giữ cũ cùng chuyến của tài khoản. Giữ nguyên dòng lịch sử, không chuyển dòng của người này cho người khác.
- Backend lấy hạng ghế, giá, hành trình và thông tin chuyến từ DB. ECONOMY ×1, BUSINESS ×1.5, FIRST ×2; dịch vụ theo bảng giá đã có. Sau khi bắt đầu thanh toán, không sửa thông tin/giá đơn.
- Các thao tác đặt chỗ, chuyến bay, hết hạn và thanh toán dùng chung advisory lock trong giao dịch, kết hợp index ghế. Cách này ưu tiên tính đúng cho quy mô đồ án; có thể giới hạn thông lượng khi nhiều người ghi đồng thời.
- Hết hạn được cập nhật khi xử lý các API đặt vé/thanh toán/quản trị; tìm kiếm và danh sách ghế tự loại HOLD quá hạn ngay cả trước lần cập nhật trạng thái. Không có job nền mới.
- Mỗi lần thanh toán có dòng riêng. Callback kiểm tra chữ ký, partner, order/request, booking, số tiền; kết quả thất bại đến sau không hạ trạng thái đã thành công. Callback lặp không cấp ghế/ghi nhận thu tiền lần nữa.
- Đã thu tiền nhưng đơn hết hạn, bị hủy, chuyến ngừng bán hoặc đã có thanh toán khác: giữ giao dịch SUCCESS và tạo hồ sơ đối soát. Không chiếm lại ghế người khác.
- Admin hủy đơn chưa thanh toán: CANCELLED và nhả ghế. Đơn đã thu tiền: PAYMENT_REVIEW, nhả ghế và mở hồ sơ. Admin chỉ ghi nhận REFUNDED sau khi đã hoàn tiền thực tế, có mã xác nhận và ghi chú; hệ thống không tự chuyển tiền.
- Nếu một đơn được thu hai lần, hoàn khoản dư không làm hủy vé đã được xác nhận bằng khoản đầu tiên.
- Xóa chuyến đã có dữ liệu liên quan chuyển sang hủy và giữ lịch sử. Chuyến chưa có liên quan mới được xóa bản ghi. Không đổi máy bay của chuyến đã có lịch sử; kiểm tra trùng lịch máy bay khi thêm/sửa.
- Lịch cũ trong TIMESTAMP WITHOUT TIME ZONE được hiểu theo giờ Việt Nam. Vé hiển thị thông tin lúc mua cùng lịch/trạng thái hiện tại.
- Dashboard doanh thu là tổng MOMO SUCCESS của đơn CONFIRMED, loại giao dịch đang OPEN đối soát. MOCK, FAILED, PENDING, REFUNDED không góp doanh thu. Tỷ lệ lấp đầy lấy ghế BOOKED so với số ghế thực tế trên chuyến AVAILABLE/DELAYED tương lai.

## Kiểm thử

`backend/test/integration.test.js` kiểm tra bằng API Express và PostgreSQL thật trong database thử riêng; email và lệnh tạo giao dịch MoMo được thay bằng dịch vụ giả. Callback vẫn chạy bộ kiểm tra chữ ký thật với khóa thử.

Chuẩn bị một PostgreSQL thử nghiệm riêng và một database **mới, rỗng**, tên `airline_booking_test` hoặc `airline_booking_test_<hậu_tố_chữ_thường_và_số>`. Mỗi lượt dùng database mới, không xóa/truncate bảng để chạy lại:

```powershell
# Chạy trong backend; thay cổng bằng cổng PostgreSQL thử nghiệm.
$env:TEST_DATABASE_URL = 'postgresql://postgres@127.0.0.1:25432/airline_booking_test_example'
npm test
```

Fixture tạo 14 bảng theo cấu trúc đã đọc, các enum/sequence/index và role codex_user nếu chưa có; chèn dữ liệu giả rồi áp dụng migration hai lần để kiểm tra chạy lại. Bộ test từ chối database sai tên, host không phải local hoặc public không rỗng. Không dùng tài khoản/database vận hành cho test.

Các trường hợp bao gồm: khóa/mở khóa phiên cũ; bảo vệ admin; mã khôi phục và số lần sai; tranh chấp ghế; ghế sai máy bay; chuyến quá giờ/hủy/delayed; giá BUSINESS/FIRST và snapshot; đơn thiếu/hết hạn; demo tắt; doanh thu loại MOCK; callback giả/sai tiền/lặp/đảo thứ tự; thanh toán muộn sau chuyển ghế; thanh toán trùng và hoàn khoản dư; trùng lịch máy bay; hủy đơn khi đang thanh toán; giữ lịch sử và vé hiện tại. Kiểm tra thiếu migration và chạy migration lặp được thực hiện trong bước chuẩn bị.

Frontend kiểm tra bằng `npm run lint`, `npm run build` trong thư mục `frontend`.

Kết quả ngày 20/10/2026: **15/15 bài kiểm thử tích hợp đạt**, lint và build frontend đạt; kiểm tra cú pháp JavaScript backend và `git diff --check` đạt. Build có cảnh báo bundle JavaScript khoảng 561 kB, không phải lỗi build.

Các database thử đã tạo trong cluster riêng cổng 25432: `airline_booking_test`, `airline_booking_test_final`, `airline_booking_test_verified`. Chỉ chứa cấu trúc và dữ liệu giả do fixture/test tạo; không sao chép dữ liệu cá nhân từ database thật. Không xóa database hay bảng sau test.

Chưa kiểm tra email Gmail/MoMo thật hoặc thao tác toàn luồng bằng trình duyệt. Cần kiểm tra cấu hình thực tế sau khi người quản trị áp dụng migration; không diễn giải kết quả tự động thành đã triển khai thành công trên database thật.
