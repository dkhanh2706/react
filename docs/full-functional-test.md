# Kiểm thử chức năng — 29/10/2026

Đã chạy lại các bộ kiểm thử và bổ sung lượt Chrome kết nối Express/PostgreSQL/WebSocket thật trên môi trường riêng. Không coi kết quả này là bảo đảm mọi trường hợp có thể xảy ra hoặc đã nghiệm thu các nhà cung cấp bên ngoài.

## Kết quả

| Bộ kiểm tra | Kết quả |
| --- | --- |
| Backend: avatar, lịch demo, bảo mật, API tích hợp PostgreSQL | **50/50 đạt** |
| Chat trực tiếp: API/PostgreSQL/WebSocket, mất/kết nối lại và phân quyền | **13/13 đạt** |
| Frontend: hàm định dạng, ngày giờ, phiên và nhãn dịch vụ | **8/8 đạt** |
| Tổng test Node.js | **71/71 đạt** |
| ESLint frontend | Đạt |
| Vite production build | Đạt; JavaScript khoảng 619,47 kB, còn cảnh báo chunk trên 500 kB |
| Chrome với API/WebSocket giả | Đạt: 55 mốc chờ và 82 lượt API; kiểm tra thêm cả ba hạng ghế và ba kích thước chat |
| Chrome → Express/PostgreSQL/WebSocket thật | Đạt 11 nhóm kịch bản; ghi nhận 139 phản hồi HTTP, không có exception JavaScript chưa xử lý |
| Backend production | Chặn demo payment, ẩn endpoint debug/tên database, chặn CORS origin không được phép |

Các lượt chạy lại chỉ nhắm nhóm đã thay đổi hoặc có lỗi ở bài kiểm tra; không gộp số lần lặp thành số lượng test.

## Phạm vi theo chức năng

| Chức năng | Kiểm tra đã thực hiện |
| --- | --- |
| Đăng ký/đăng nhập | Tạo khách qua UI và lưu PostgreSQL, hash mật khẩu, đăng nhập thật, chặn email trùng và khách gọi API admin. |
| Khôi phục mật khẩu | UI với API giả; API và database thật với email stub: mã dùng một lần, giới hạn lần sai/gửi lại, đổi mật khẩu và thu hồi token. Không gửi email thật. |
| Đổi mật khẩu trong hồ sơ | Thêm test API/database: khớp xác nhận, OTP `change` không dùng được cho `forgot`, mã không trả qua API, phiên cũ mất hiệu lực, mật khẩu mới đăng nhập được, chặn dùng lại mã/mật khẩu cũ. |
| Hồ sơ/ảnh | Sửa và lưu tên qua UI/database, upload PNG multipart thật, xác minh WebP và ảnh tải được sau reload. Kiểm tra file giả/hỏng/quá kích thước bằng test bảo mật. |
| Quyền/khóa tài khoản | Admin khóa/mở khóa qua UI; token bị thu hồi ngay và không phục hồi khi mở khóa. Test bổ sung chặn sửa role/email/admin chính qua API hồ sơ và không tin role giả trong JWT. |
| Tìm kiếm/lịch demo | UI chọn sân bay/ngày và tạo chuyến cần dùng thật; API test phân trang, lọc chuyến ngừng bán/quá giờ/hết ghế, tuyến quốc tế, 68 tuyến và lịch máy bay không trùng. |
| Hành khách/dịch vụ | Điền thông tin giấy tờ/ngày sinh/điện thoại, hành lý 10 kg, cơm gà và bảo hiểm; tổng tiền lưu đúng 1.780.000đ cho vé phổ thông mẫu 1.500.000đ. |
| Hạng ghế/giữ ghế | Test API giá ECONOMY/BUSINESS/FIRST và tranh chấp ghế giữa hai khách. UI kiểm tra riêng giá 1.780.000đ / 2.530.000đ / 3.280.000đ với cùng dịch vụ và nhãn phụ thu. |
| Đơn/tiếp tục thanh toán | Reload checkout, mở từ đơn của tôi, giữ nguyên deadline/giá đã lưu; tài khoản khác không xem được checkout. API test hết hạn, chặn xóa đơn có lịch sử, chỉ xóa đơn đủ điều kiện khi nhập đúng mã. |
| Thanh toán | MoMo bị tắt trả HTTP 502, lưu payment FAILED và UI cho tiếp tục demo. Thanh toán MOCK thật lưu CONFIRMED/BOOKED, một giao dịch SUCCESS. Callback MoMo kiểm thử bằng khóa/provider giả: chữ ký, số tiền, lặp/đảo thứ tự, thanh toán muộn/trùng. |
| Vé/đánh giá | Vé hiển thị từ database; gửi 5 sao qua UI, xuất hiện trên home; xóa và không gửi lại. API test chủ vé, sao/nội dung, đối soát, gửi đồng thời và giới hạn bài mới nhất. |
| Quản trị chuyến | Tạo, sửa giá và xóa chuyến chưa dùng qua UI/API/database thật. Test API kiểm tra trùng lịch máy bay, bảo vệ danh tính chuyến có lịch sử, hủy chuyến và giữ lịch sử. |
| Hủy/đối soát/hoàn tiền | Hủy đơn đã trả qua UI: PAYMENT_REVIEW, nhả ghế, giữ payment. Ghi mã FULL-REFUND, mở lại chi tiết và kiểm tra database REFUNDED; xem lịch sử thanh toán. Chặn xóa cả khi biết đúng mã đơn nếu có lịch sử. |
| Chat khách/admin | Hai context trình duyệt độc lập, WebSocket thật: admin bật online; khách gửi tin/yêu cầu nhân viên; hàng chờ cập nhật; tiếp nhận/gửi/kết thúc; khách nhận tin và PostgreSQL lưu lịch sử. API/WS test thêm grace 60 giây, nhiều tab, quyền phụ trách, unread và response bot cũ. |
| Blog/điểm đến | Smoke test mở danh sách/chi tiết blog, điểm đến và luồng chatbot tìm chuyến. Nội dung blog là dữ liệu tĩnh hiện tại. |
| Mobile/khung nhìn | Hồ sơ, đơn, checkout ở 390×844 không tràn ngang. Chat nằm trong khung nhìn tại 1024×500, 390×640 và 844×390. |
| Production | `/api/uploads-test` và `/api/chat/test` trả 404; `/` không lộ tên database; demo payment tắt dù cờ được đặt true; origin lạ bị 403. Test bảo mật xác minh exception/database không lọt vào response production. |

## Hai lỗi hiển thị đã sửa

1. `BookingPriceSummary.jsx`: FIRST trước đây ghi “Phụ thu hạng Thương gia”. Đã đổi theo hạng ghế; smoke test đối chiếu giá và nhãn cho cả ba hạng.
2. `Chatbot.css`: hộp chat cao cố định 580 px làm phần đầu ra ngoài cửa sổ thấp. Đã thêm `max-height` theo viewport, cho vùng tin nhắn co lại/cuộn và giữ header/input; cả test fixture và test kết nối thật đã kiểm tra ba kích thước, đã xem lại ảnh chụp.

Các lần phải chỉnh bài kiểm tra là do hộp thoại native cần bấm OK, phải đợi dữ liệu danh mục/hàng bảng render xong, hoặc mở lại modal sau khi lưu hoàn tiền. Không thay kết quả API/SQL để làm test đạt.

## Môi trường và bằng chứng cục bộ

- PostgreSQL 18 tạm, host `127.0.0.1`, cổng tự chọn; database mới/rỗng riêng cho API, chat và demo UI. Không dùng database ứng dụng và không sửa `.env`.
- Các tiến trình backend/PostgreSQL/Chrome do lượt kiểm tra tạo đã được dừng. Database/log còn trong thư mục ignore để đối chiếu; ảnh avatar dùng dữ liệu xanh giả do test tạo, không dùng ảnh người thật.
- Bộ cơ sở/lint/build/chat/frontend: `backend/temp/full-check-20261029034923302/`.
- Backend 50/50 sau hai test bổ sung: `backend/temp/full-check-20261029041623207/summary.json`.
- Lượt kết nối thật cuối: `backend/temp/full-check-20261029042257815/summary.json`, `browser-live.json`, `live-backend.log`.
- Ảnh đã xem: `mobile-checkout.png`, `landscape-chat.png` trong thư mục lượt cuối.

Các đường dẫn trên chỉ có trên máy chạy test, không được đưa vào Git. Script `scripts/test-project.cjs` và các bài kiểm tra trong `frontend/test/` được giữ để tái chạy.

## Giới hạn

- Chưa gọi thanh toán/hoàn tiền MoMo thật, gửi Gmail thật hay trả lời Groq thật. Các tác động ngoài được tắt trong backend riêng; test mô phỏng nhà cung cấp ở bộ API và kiểm tra phản hồi khi chưa cấu hình ở lượt UI thật.
- Test Chrome, không thay thế kiểm tra Safari/Firefox, thiết bị vật lý, tải lớn, phục hồi backup hay đánh giá bảo mật chuyên sâu.
- Ảnh/font bên ngoài bị chặn trong browser test; kết quả không chứng minh CDN bên ngoài luôn khả dụng. Avatar do backend phục vụ đã kiểm tra tải thật.
- Hệ thống vẫn thuộc phạm vi đồ án: một chiều, một hành khách/ghế mỗi đơn, dữ liệu chuyến demo và ghi nhận hoàn tiền thủ công.

## Chạy lại

Từ thư mục gốc: `node scripts/test-project.cjs`. Đặt `POSTGRES_BIN` trỏ đến thư mục chứa `initdb`, `postgres`, `pg_ctl` nếu không dùng cài đặt tại thư mục người dùng; đặt `CHROME_PATH` nếu cần. `--api-only` chạy riêng backend, `--live-only` chạy lại UI với database mới và bản frontend đã build.

Trong frontend: `npm test`, `npm run lint`, `npm run test:ui` (build + smoke với fixture). Chi tiết yêu cầu ở README.
