# Rà soát dự án — 02/11/2026

## Cập nhật sau khi xử lý các mục được chọn

Đã sửa các mục 2–6 của bản rà soát bên dưới:

- Danh sách người dùng, chuyến bay, đơn và thanh toán dùng thẻ có nhãn trên màn hình ≤640 px; bộ lọc xếp dọc, topbar rút gọn và menu icon có tên truy cập.
- Khách chưa đăng nhập thấy nút Đăng nhập trên header mobile, đồng thời có Đăng nhập/Đăng ký trong menu.
- FE kiểm tra hộ chiếu 6–20 chữ/số, bỏ khoảng trắng hai đầu và chuẩn hóa chữ hoa trước khi chuyển bước, khớp quy tắc BE.
- Ghi chú tìm chuyến có màu chữ riêng trên nền trắng; selector mô tả hero không áp dụng cho ghi chú trong form.
- Vite ghi đè X-Forwarded-For bằng IP của kết nối thực; BE development chỉ tin proxy loopback. Production giữ trust proxy tắt. Giới hạn theo IP LAN riêng, không gộp mọi người vào 127.0.0.1.

Kiểm chứng sau sửa: **90/90 test Node.js**, lint/build, toàn bộ browser fixture và 12 nhóm kịch bản BE/database/WebSocket thật đều đạt; production gates đạt. Ma trận **168 lượt hiển thị** đạt, có thêm assertion cho thẻ mobile, nhãn từng trường, bộ lọc không bị cắt, trạng thái nằm trong topbar, menu đăng nhập và hộ chiếu không hợp lệ/hợp lệ. Bài test bảo mật xác minh IP thứ nhất bị giới hạn không chặn IP thứ hai và header IP giả không đặt lại hạn mức.

Bằng chứng mới: `backend/temp/full-check-20261102161258237/summary.json`, `backend/temp/responsive-audit-20261102161131749/results.json`, và ảnh thẻ trong `backend/temp/responsive-audit-20261102162152598/`.

Các phần tiếp theo giữ kết quả và phát hiện của lượt rà soát ban đầu để đối chiếu.

## Kết luận

Các luồng chính FE–BE–PostgreSQL hoạt động trong phạm vi đã kiểm tra. Giao diện khách hàng cơ bản dùng được trên điện thoại. Chưa nên kết luận đã đồng bộ hoặc tối ưu toàn bộ: còn lỗi kiểm tra dữ liệu giữa FE/BE, điều hướng đăng nhập trên mobile, bộ lọc admin bị cắt và cấu hình liên quan đến LAN.

Lượt rà soát ban đầu bổ sung bài kiểm tra responsive và sửa lệnh chờ trong bài kiểm tra chat. Trạng thái sửa các lỗi ứng dụng được cập nhật ở đầu tài liệu.

## Kết quả đã kiểm chứng

| Phạm vi | Kết quả |
| --- | --- |
| Backend: avatar, demo flights, bảo mật, AI contract, API/database | 60/60 test đạt |
| Chat API/database/WebSocket | 15/15 test đạt |
| Frontend utilities | 14/14 test đạt |
| Tổng test Node.js | **89/89 đạt** |
| ESLint và production build | Đạt; JS 652,17 kB, gzip 185,62 kB; còn cảnh báo chunk lớn |
| Browser với API giả | Đạt các luồng tài khoản, đặt vé, ba hạng ghế, thanh toán demo, quản trị, chat và 8 khung hỗ trợ |
| Browser với Express/PostgreSQL/WebSocket thật | 12 nhóm kịch bản đạt; 170 phản hồi HTTP, không có exception JavaScript chưa xử lý |
| Production gates | Chặn demo payment, origin không được phép, endpoint debug và lộ tên database |
| Responsive mở rộng | 24 trang/trạng thái × 7 kích thước = **168 lượt hiển thị**, không tràn ngang toàn tài liệu, không exception JavaScript |
| Database ứng dụng hiện tại | Kiểm tra khởi động schema đạt; có 19 bảng public, gồm đủ các bảng chat và đánh giá đã đối chiếu |

Kích thước đã kiểm tra: 320×740, 360×800, 390×844, 430×932, 768×1024, 844×390 và 1440×900. Phạm vi trang gồm khách chưa/đã đăng nhập, điểm đến, blog/chi tiết, đăng nhập/đăng ký/khôi phục mật khẩu, kết quả tìm kiếm, hành khách, chọn ghế, thanh toán/kết quả, đơn/vé/hồ sơ và sáu trang admin.

Không tràn ngang toàn trang **không có nghĩa** mọi điều khiển đều hiển thị đủ: các bộ lọc admin bên dưới bị cắt bởi vùng chứa.

## Các điểm cần sửa, theo thứ tự ưu tiên

### 1. Manifest frontend không đi cùng Git — ưu tiên cao

- `.gitignore:7` bỏ qua `package.json`; `frontend/package.json` chưa được theo dõi, trong khi `backend/package.json` có được theo dõi.
- Thành viên clone repo không nhận manifest/script frontend đang dùng, bao gồm `dev:lan`; lockfile không thay thế được các script này.
- Cần bỏ quy tắc ignore manifest, đưa `frontend/package.json` vào quản lý phiên bản và thử cài/chạy từ một checkout sạch. Không đưa `.env` hay `node_modules` vào Git.

### 2. Điều khiển admin bị cắt trên điện thoại — ưu tiên cao cho mobile

- Tại 390 px, bộ lọc trạng thái ở `/admin/users` có cạnh phải tại x=478; bộ lọc ngày ở `/admin/flights` tại x=500; phương thức thanh toán ở `/admin/payments` tại x=521.
- `.adm-filter-group` không xuống dòng; `.adm-content-card` đặt `overflow: hidden`, khiến một phần điều khiển không nhìn thấy.
- Badge trạng thái ở topbar có y=-18,375 tới 89,375 trong thanh cao 72 px: chữ bị ép nhiều dòng và tràn khỏi thanh.
- Nguồn: `frontend/src/styles/admin/FlightManagement.css:145`, `:206`; `frontend/src/styles/admin/AdminLayout.css:309`, `:351`.
- Cần xếp bộ lọc theo một cột trên mobile, rút gọn topbar và cân nhắc bảng dạng thẻ hoặc bảng cuộn có chỉ dẫn rõ. Sidebar hiện chiếm cố định 80 px trên màn hình nhỏ.

### 3. Đăng nhập không có lối vào rõ trên mobile — ưu tiên cao cho trải nghiệm khách

- Dưới 480 px, `.auth-buttons > .btn-outline` bị ẩn trong `Header.css:479`.
- Menu mobile của khách chưa đăng nhập không có mục Đăng nhập. Người dùng vẫn có thể bị chuyển tới đăng nhập qua trang cần tài khoản hoặc đi qua trang đăng ký, nhưng không có lựa chọn trực tiếp ở menu.
- Cần thêm Đăng nhập vào menu mobile hoặc giữ một nút đăng nhập dễ nhận ra.

### 4. FE và BE chưa kiểm tra hộ chiếu thống nhất — ưu tiên vừa

- Tái hiện: nhập loại PASSPORT và số `A` tại `/passenger-info`; FE cho tiếp tục sang `/booking`.
- BE `passengerData` từ chối cùng dữ liệu với HTTP 400 vì hộ chiếu cần 6–20 chữ/số.
- Nguồn: `frontend/src/hooks/usePassengerInfo.js:102` chỉ có regex cho CCCD; `backend/lib/validation.js:27` có quy tắc riêng cho hộ chiếu.
- Cần kiểm tra ngay tại ô nhập và thống nhất các ràng buộc tên, email, giấy tờ. Đây là kiểm tra bị trễ, không phải BE chấp nhận dữ liệu không hợp lệ.

### 5. Gợi ý tìm chuyến có chữ trắng trên nền trắng — ưu tiên vừa

- Nội dung “Chuyến quốc tế đi/về qua Nội Bài (HAN) hoặc Tân Sơn Nhất (SGN).” trong `.flight-box > p` có màu `rgba(255,255,255,0.9)` trên nền `rgb(255,255,255)`.
- Quy tắc `.hero-content p` ở `frontend/src/styles/home.css:184` áp dụng cả cho đoạn gợi ý trong form trắng; cũng tạo khoảng trống khó hiểu trước nút tìm chuyến.
- Cần giới hạn selector vào đoạn mô tả trực tiếp của hero hoặc đặt class/màu riêng cho ghi chú trong form.

### 6. Nhiều thiết bị qua proxy dùng chung hạn mức thao tác — ưu tiên vừa cho làm nhóm

- `backend/middleware/rateLimit.js:7` dùng `req.ip`; backend không cấu hình trusted proxy và Vite chưa chuyển IP để ứng dụng dùng.
- Kiểm tra qua cấu hình proxy thực tế tới backend giả: 22 request với hai giá trị IP chuyển tiếp đều được BE nhận là `127.0.0.1`; request 21 và 22 trả 429.
- Auth hiện dùng chung giới hạn 20 request/10 phút cho các route đăng ký/đăng nhập/khôi phục, không chỉ tính đăng nhập sai.
- Cần thiết kế trusted proxy giới hạn đúng nguồn loopback, truyền IP đúng và tách hạn mức theo mục đích/tài khoản. Không nên bật tin mọi header IP hoặc bỏ toàn bộ rate limit.

### 7. MoMo redirect vẫn trỏ loopback — cần sửa trước khi thử MoMo trên điện thoại

- Cấu hình ứng dụng hiện tại có `MOMO_REDIRECT_URL` trỏ tới hostname loopback; dịch vụ MoMo sử dụng trực tiếp biến này (`backend/services/momo.service.js:28`).
- Trên điện thoại, `localhost` trỏ tới điện thoại, nên đường quay về không tự trở thành địa chỉ LAN của máy chạy dự án.
- Proxy `/api` giải quyết API/ảnh/chat, không sửa được redirect của nhà cung cấp thanh toán. Cần một URL được thiết bị truy cập, cấu hình callback phù hợp và kiểm tra end-to-end khi sử dụng MoMo. Thanh toán giả lập không có phụ thuộc này.

## Cải thiện tiếp theo

- **Nhãn và bàn phím:** nhiều label ở form tìm chuyến/hành khách/đăng nhập chưa gắn `htmlFor`–`id`; menu còn dùng span có onClick. Dùng label liên kết đúng và button/Link để tăng vùng thao tác và hỗ trợ bàn phím/trình đọc màn hình. Tham khảo [W3C: Labeling Controls](https://www.w3.org/WAI/tutorials/forms/labels/).
- **Cỡ chữ và vùng chạm:** tại 390 px, nhiều ô nhập còn 12–15 px. Nên tăng cỡ chữ phù hợp trên mobile, kiểm tra vùng chạm/khoảng cách của nút và icon theo [W3C: Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). Chưa thực hiện kiểm toán tuân thủ WCAG toàn diện.
- **Tải trang:** App import sẵn cả trang khách và admin. Cân nhắc lazy-load theo route để không phải tải toàn bộ mã admin khi chỉ mở Trang chủ. Đây là cơ hội tối ưu, chưa có đo đạc tốc độ trên mạng điện thoại thật.
- **Giá và dịch vụ:** hiện các trường hợp giá đã kiểm tra khớp, nhưng bảng giá dịch vụ/hệ số ghế còn được khai báo ở cả FE và BE. Nên có nguồn cấu hình chung hoặc API cấu hình để giảm nguy cơ lệch khi chỉnh sau này; BE vẫn là nơi quyết định giá cuối.
- **Liên kết tìm chuyến:** luồng từ Trang chủ truyền kết quả qua router state. Nên đưa điểm đi/đến/ngày lên URL để chia sẻ hoặc mở tab mới vẫn giữ được tìm kiếm.
- **Nội dung và metadata:** `frontend/index.html` vẫn có `lang="en"`, favicon rỗng; một số nhãn admin/email dùng AirAdmin hoặc Airline Booking. Cần thống nhất với DAMH Shop và tiếng Việt.
- **Vận hành:** nên có hướng dẫn triển khai/reverse proxy, sao lưu và khôi phục database/ảnh upload, kiểm tra nhà cung cấp ngoài và kiểm tra thao tác đồng thời của nhóm trên mạng trường.

## Bằng chứng cục bộ

- Test cơ sở/lint/build/API giả: `backend/temp/full-check-20261102155344670/summary.json`.
- Test kết nối thật sau khi sửa lệnh chờ: `backend/temp/full-check-20261102155630892/summary.json`.
- Ma trận responsive cuối: `backend/temp/responsive-audit-20261102160304844/results.json` (168/168 lượt, không exception/tràn ngang toàn tài liệu).
- Kiểm tra chi tiết màu chữ, menu, hộ chiếu và clipping: `backend/temp/responsive-audit-20261102160434623/results.json`.
- Ảnh guest home/booking/admin tại thư mục ma trận responsive cuối. Đây là dữ liệu giả của bài kiểm tra.

Thư mục `backend/temp` được ignore trong Git; báo cáo này giữ mô tả và đường dẫn để đối chiếu trên máy hiện tại.

## Giới hạn của kết luận

- Responsive chạy bằng Chrome mô phỏng kích thước; chưa xác minh Safari/iPhone/Android vật lý, bàn phím ảo và Wi-Fi trường.
- Không gọi thanh toán/hoàn tiền MoMo thật, Gmail thật hoặc Groq thật. IPN có cấu hình không đồng nghĩa nhà cung cấp đã truy cập thành công.
- Bộ browser test chặn ảnh/font ngoài; chưa chứng minh CDN, ảnh Unsplash và font luôn tải được trên mạng trường.
- Kiểm tra database ứng dụng chỉ đọc metadata trong transaction READ ONLY; các bài test ghi dữ liệu dùng PostgreSQL tạm riêng. Không thay đổi `.env` hoặc dữ liệu ứng dụng.
- Lượt test kết nối thật đầu dừng do đọc `.innerText` trước khi phần tử chat xuất hiện. Đã sửa điều kiện chờ bằng optional chaining; lượt chạy lại đạt toàn bộ phần kết nối thật và production gates. Đây là sửa bài kiểm tra, không phải sửa nghiệp vụ chat.
