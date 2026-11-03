# DAMH Shop — Website đặt vé máy bay

DAMH Shop là đồ án website đặt vé máy bay bằng **React + Express + PostgreSQL**. Khách hàng tìm chuyến, nhập thông tin hành khách, chọn dịch vụ và ghế, thanh toán, xem đơn và vé. Quản trị viên quản lý chuyến bay, tài khoản, đặt vé, giao dịch và chat hỗ trợ.

**Phạm vi:** mô phỏng vé một chiều, một hành khách và một ghế trên mỗi đơn. Dữ liệu chuyến bay mẫu do dự án tạo, chưa kết nối kho vé hãng hàng không và chưa phát hành vé hãng thật. Hoàn tiền hiện là ghi nhận nghiệp vụ thủ công, chưa tự chuyển tiền qua MoMo.

## Mục lục

1. [Hiểu nhanh kiến trúc](#1-hiểu-nhanh-kiến-trúc)
2. [Chuẩn bị môi trường](#2-chuẩn-bị-môi-trường)
3. [Cài đặt và chạy lần đầu](#3-cài-đặt-và-chạy-lần-đầu)
4. [Chạy với database đang có trong pgAdmin](#4-chạy-với-database-đang-có-trong-pgadmin)
5. [Các trang và quyền truy cập](#5-các-trang-và-quyền-truy-cập)
6. [Dự án hoạt động như thế nào](#6-dự-án-hoạt-động-như-thế-nào)
7. [Cấu hình dịch vụ và biến môi trường](#7-cấu-hình-dịch-vụ-và-biến-môi-trường)
8. [Cấu trúc mã nguồn và database](#8-cấu-trúc-mã-nguồn-và-database)
9. [Chạy thử, kiểm tra và build](#9-chạy-thử-kiểm-tra-và-build)
10. [Triển khai Vercel và Render](#10-triển-khai-vercel-và-render)
11. [Lỗi thường gặp](#11-lỗi-thường-gặp)
12. [Giới hạn và tài liệu chi tiết](#12-giới-hạn-và-tài-liệu-chi-tiết)

## 1. Hiểu nhanh kiến trúc

```mermaid
flowchart LR
    Customer[Trình duyệt khách hàng] --> Frontend[React / Vite]
    Admin[Trình duyệt quản trị viên] --> Frontend
    Frontend -->|HTTP API / JWT| Backend[Express]
    Frontend <-->|WebSocket chat| Backend
    Backend --> Database[(PostgreSQL)]
    Backend --> Groq[Groq: trả lời AI]
    Backend --> Mail[Gmail: OTP và email vé]
    Backend <-->|Tạo giao dịch / IPN| MoMo[MoMo]
```

| Thành phần | Vai trò | Địa chỉ local mặc định |
| --- | --- | --- |
| Frontend | Giao diện, điều hướng, gọi API | `http://localhost:5173` |
| Backend | Xác thực, kiểm tra quyền, nghiệp vụ, HTTP và WebSocket | `http://localhost:5000` |
| PostgreSQL | Lưu tài khoản, chuyến, ghế, đơn, thanh toán, chat | `127.0.0.1:5432` |
| pgAdmin 4 | Công cụ để bạn quản lý PostgreSQL | Không phải database server, không thay backend |

Khi chạy local, Vite chuyển tiếp `/api` và `/uploads` tới backend. Trình duyệt kết nối chat tại `/api/chat/live`; backend lưu hội thoại trong PostgreSQL. Vì vậy, cần giữ **PostgreSQL, backend và frontend cùng hoạt động**.

Frontend và backend có `package.json` riêng. **Không chạy `npm install` hay `npm start` trực tiếp ở thư mục gốc.** Các lệnh bên dưới dùng `npm --prefix` để bạn có thể thực hiện từ thư mục gốc `fe-react`.

## 2. Chuẩn bị môi trường

| Công cụ | Yêu cầu |
| --- | --- |
| Node.js | Nhánh **22 từ 22.13 trở lên**, hoặc Node.js 24; phù hợp yêu cầu của Vite/ESLint trong dự án |
| npm | Đi kèm Node.js |
| PostgreSQL | Bản 18 là môi trường dùng để kiểm tra dự án |
| pgAdmin 4 | Dùng để tạo, kiểm tra, sao lưu và quản lý database |
| Git | Lấy mã nguồn nếu nhận dự án qua repository |
| Chrome/Edge | Cần nếu chạy kiểm thử giao diện tự động |

Kiểm tra trong terminal:

```powershell
node --version
npm --version
```

Các ví dụ cài đặt dùng **PowerShell trên Windows**. Mở terminal tại thư mục gốc chứa `backend/`, `frontend/`, `README.md`. Khi dùng macOS/Linux, các lệnh npm vẫn giống nhau; cú pháp đặt biến môi trường và sao chép file cần đổi theo shell.

## 3. Cài đặt và chạy lần đầu

Đường này dành cho **máy mới hoặc database mới, rỗng**. Nếu bạn đã có database chứa dữ liệu cần giữ, chuyển sang [mục 4](#4-chạy-với-database-đang-có-trong-pgadmin).

### Bước 1 — Cài thư viện

Tại thư mục gốc:

```powershell
npm --prefix backend ci
npm --prefix frontend ci
```

`npm ci` cài đúng phiên bản từ `package-lock.json`. Không cần chép `node_modules` từ máy khác.

### Bước 2 — Tạo file môi trường

```powershell
if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
if (!(Test-Path frontend/.env)) { Copy-Item frontend/.env.example frontend/.env }
```

Mở `backend/.env`, điền thông tin PostgreSQL của máy bạn:

```dotenv
PORT=5000
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=airline_booking_demo
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET
FRONTEND_URL=http://localhost:5173
DEMO_FLIGHTS_ENABLED=true
DEMO_PAYMENTS_ENABLED=true
```

Có thể tạo chuỗi ngẫu nhiên cho `JWT_SECRET` bằng:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Trong `frontend/.env`, giữ:

```dotenv
VITE_API_URL=/api
```

Không ghi đè `.env` đã có. Không đưa mật khẩu database, khóa JWT, Groq, Gmail hoặc MoMo lên Git.

### Bước 3 — Tạo database rỗng trong pgAdmin 4

1. Mở pgAdmin, kết nối PostgreSQL bằng tài khoản quản trị của máy, thường là `postgres`.
2. Tại `Databases`, tạo database tên **`airline_booking_demo`**.
3. Để database rỗng; chưa chạy file SQL nào vào database này.
4. Ghi lại host, port, tên database, username và mật khẩu. Chúng phải khớp `DB_*` ở bước 2.

Nếu tên này đã có dữ liệu, hãy tạo tên mới, chẳng hạn `airline_booking_demo_nhom1`, rồi đổi `DB_NAME` tương ứng. Script chấp nhận tên `airline_booking_demo` hoặc hậu tố gồm chữ thường/số sau dấu `_`.

### Bước 4 — Dựng schema, dữ liệu mẫu và admin

Tại thư mục gốc, thay các giá trị mẫu bằng thông tin của bạn:

```powershell
$env:SETUP_DATABASE_URL = 'postgresql://postgres:YOUR_URL_ENCODED_PASSWORD@127.0.0.1:5432/airline_booking_demo'
$env:SETUP_ADMIN_EMAIL = 'admin@example.com'
$env:SETUP_ADMIN_PASSWORD = 'CHOOSE_YOUR_OWN_ADMIN_PASSWORD'
try {
    npm --prefix backend run setup:demo
} finally {
    Remove-Item Env:SETUP_DATABASE_URL, Env:SETUP_ADMIN_EMAIL, Env:SETUP_ADMIN_PASSWORD -ErrorAction SilentlyContinue
}
```

- Mật khẩu PostgreSQL trong URL phải được URL-encode nếu có ký tự đặc biệt: ví dụ `@` thành `%40`, `#` thành `%23`. Trong `DB_PASSWORD` của `.env` vẫn dùng mật khẩu gốc.
- Mật khẩu admin từ 8 ký tự, tối đa 72 byte. Email/mật khẩu ở đây do bạn tự đặt, **không có tài khoản admin mặc định**.
- `SETUP_DATABASE_URL` là kết nối riêng của script setup, không phải biến kết nối khi ứng dụng chạy.
- Script chỉ chấp nhận database local mới, rỗng; không đọc kết nối `.env` và từ chối database đã có bảng/enum. Tài khoản chạy setup cần quyền tạo schema/role, thường là `postgres` local.
- Script đọc `backend/setup/schema.sql`, tạo admin với mật khẩu đã băm, danh mục ban đầu, rồi áp dụng migration **001–008**.

Kết quả: một admin, một hãng mẫu, 11 sân bay, 12 máy bay demo và 240 ghế. **Chưa có đơn, giao dịch hoặc lịch chuyến tạo sẵn cho cả năm.** Khi khách tìm tuyến/ngày hợp lệ, chế độ demo sẽ tạo chuyến cần dùng.

Nếu setup báo lỗi giữa chừng, đọc lỗi trước; không xóa database đang có dữ liệu để chạy lại. Với database mới dựng chưa có dữ liệu cần giữ, có thể chọn một database rỗng khác và chạy lại.

### Bước 5 — Chạy backend và frontend

Terminal thứ nhất, tại thư mục gốc:

```powershell
npm --prefix backend start
```

Terminal thứ hai, cũng tại thư mục gốc:

```powershell
npm --prefix frontend run dev
```

Mở **http://localhost:5173**. Để backend tự khởi động lại khi sửa mã, dùng `npm --prefix backend run dev` thay cho `start`.

Backend kiểm tra cấu trúc database trước khi mở cổng. Nếu terminal báo thiếu migration, sửa cấu hình/database theo [mục 4](#4-chạy-với-database-đang-có-trong-pgadmin), không bỏ qua lỗi kiểm tra schema.

### Bước 6 — Kiểm tra cài đặt

```powershell
Invoke-RestMethod http://localhost:5000/api/test
Invoke-RestMethod http://localhost:5000/
Invoke-RestMethod http://localhost:5000/api/flights/catalog
```

Kết quả tương ứng phải có `API TEST OK`, `Backend + Database OK` và danh mục sân bay/tuyến.

Sau đó:

1. Đăng nhập admin bằng thông tin đã chọn ở bước 4; kiểm tra trang `/admin`.
2. Đăng xuất, tạo tài khoản khách tại `/register`.
3. Tìm tuyến **HAN → SGN** vào một ngày tương lai để không chọn chuyến đã qua giờ.
4. Nhập hành khách, chọn dịch vụ/ghế và bấm **Thanh toán Demo**. Đơn được ghi nhận đã thanh toán và có vé ngay trong hệ thống.
5. Kiểm tra `/my-orders`, `/my-tickets`, sau đó đăng nhập admin kiểm tra cùng mã đơn.

**Không cần Gmail, Groq hay MoMo để hoàn thành luồng đặt vé/thanh toán giả lập local.** Thiếu các dịch vụ đó chỉ ảnh hưởng những tính năng tương ứng.

## 4. Chạy với database đang có trong pgAdmin

Nếu database hiện tại đã chứa dữ liệu dự án:

1. Sao lưu database bằng pgAdmin trước khi cập nhật cấu trúc.
2. Điền đúng kết nối đó vào `backend/.env`; cài thư viện và chạy hai tiến trình như mục 3.
3. **Không chạy `setup:demo`, không chạy schema kiểm thử lên database hiện tại.**
4. Nếu phiên bản mã mới cần migration, đối chiếu cấu trúc và áp dụng đúng file còn thiếu bằng tài khoản sở hữu database.

pgAdmin chỉ là công cụ quản lý: các file SQL trong repository vẫn cần để mô tả và dựng lại cấu trúc. Backend không tự chạy migration khi khởi động.

| File SQL | Vai trò |
| --- | --- |
| `backend/setup/schema.sql` | Schema nền để script dựng **database mới**, không phải file cập nhật database đang dùng |
| `001_account_booking_safety.sql` | Token, mật khẩu, trạng thái đơn, MoMo và đối soát; cần xác định đúng một admin chính |
| `002_demo_flight_schedule.sql` | Khóa/index phục vụ lịch demo |
| `003_on_demand_demo_data.sql` | Dữ liệu sân bay/máy bay/ghế demo; có dọn lịch demo cũ chưa được dùng |
| `004_remove_replaced_tables.sql` | Dọn bảng cũ `booking_temp`, `password_resets` khi thỏa điều kiện |
| `005_admin_booking_delete_permissions.sql` | Quyền database cho nghiệp vụ xóa đơn |
| `006_customer_reviews.sql` | Cấu trúc đánh giá và dấu đã đánh giá trên đơn |
| `007_live_chat.sql` | Hội thoại, tin nhắn, trạng thái nhân viên và tin chưa đọc |
| `008_chat_customer_identity.sql` | Chuẩn bị cột liên kết hội thoại với tài khoản; giao diện hiện chưa dùng cột này để xác minh danh tính khách |
| `backend/test/fixtures/schema.sql` | Chỉ dành cho database kiểm thử, không dùng cho database ứng dụng |

Các file 001–008 nằm trong `backend/migrations/`. Một số file tham chiếu role `codex_user`; người quản lý database cần đối chiếu quyền với tài khoản ứng dụng thực tế.

**Cách chạy SQL trong pgAdmin:** chọn đúng database → mở Query Tool → mở file cần áp dụng → đọc và chạy. Với migration 001, thực hiện hai câu `ALTER TYPE ... ADD VALUE` đầu file và commit trước, rồi mới chạy phần `BEGIN ... COMMIT` còn lại. Không bọc toàn bộ migration 001 trong một transaction vì các giá trị enum mới cần được commit trước khi sử dụng.

Không chạy lại toàn bộ migration chỉ để thử sửa lỗi: 003/004 có tác động dọn dữ liệu/bảng theo điều kiện. Đọc thêm [bàn giao database và đặt vé](docs/booking-safety-handoff.md) và [dọn bảng cũ](docs/database-table-cleanup.md).

## 5. Các trang và quyền truy cập

| Đường dẫn | Chức năng | Quyền |
| --- | --- | --- |
| `/`, `/home` | Trang chủ; `/` chuyển admin về quản trị và khách về trang chủ | Công khai |
| `/destinations` | Khám phá điểm đến và chọn tuyến/ngày | Công khai |
| `/blog`, `/blog/:slug` | Nội dung du lịch tĩnh | Công khai |
| `/flights?from=HAN&to=SGN&date=YYYY-MM-DD` | Kết quả tìm kiếm, phân trang; có thể tải lại/chia sẻ URL | Công khai |
| `/flight-list` | Đường dẫn tương thích cũ, chuyển sang `/flights` | Công khai |
| `/login`, `/register` | Đăng nhập/đăng ký; giữ chuyến đã chọn khi đi từ bước mua vé | Công khai |
| `/forgot-password`, `/reset-password` | Khôi phục mật khẩu bằng mã email | Công khai |
| `/passenger-info?flightId=...` | Thông tin hành khách và dịch vụ | Đã đăng nhập |
| `/booking?flightId=...` | Chọn/giữ ghế | Đã đăng nhập |
| `/payment?bookingId=...` | Tải đơn từ server và tiếp tục thanh toán | Chủ đơn |
| `/payment-result?bookingId=...` | Đọc trạng thái giao dịch từ backend | Chủ đơn |
| `/my-orders` | Lịch sử đơn, đơn chờ và tiếp tục thanh toán | Chủ đơn |
| `/my-bookings` | Đường dẫn cũ chuyển sang `/my-orders` | Theo trang đích |
| `/my-tickets` | Vé, chi tiết dịch vụ và đánh giá | Chủ đơn |
| `/profile` | Hồ sơ, avatar và đổi mật khẩu | Đã đăng nhập |
| `/admin` | Thống kê chuyến bay, ghế và doanh số | ADMIN |
| `/admin/users` | Quản lý tài khoản; mở danh sách đơn của khách | ADMIN |
| `/admin/flights` | Quản lý chuyến bay | ADMIN |
| `/admin/bookings` | Quản lý đơn; `?bookingId=...` mở chi tiết, `?q=...` tìm đơn | ADMIN |
| `/admin/payments` | Giao dịch/đối soát; `?bookingId=...` lọc theo đơn | ADMIN |
| `/admin/chat` | Tiếp nhận, trả lời và kết thúc hỗ trợ | ADMIN |
| Đường dẫn không tồn tại | Trang 404 và liên kết quay lại | Công khai |

Frontend bảo vệ trang để điều hướng; **backend mới quyết định quyền thật** bằng JWT, trạng thái tài khoản và chủ sở hữu dữ liệu. Sửa role trong localStorage không cấp được quyền API admin.

Admin có nút **Xem trang khách hàng**; menu tài khoản phía khách có nút **Về trang quản trị**. Đây vẫn là cùng tài khoản admin, không phải đăng nhập giả làm khách khác.

## 6. Dự án hoạt động như thế nào

### 6.1 Tìm chuyến và đặt vé

```mermaid
flowchart TD
    A[Trang chủ / Điểm đến / Chatbot] --> B[Kết quả chuyến bay]
    B --> C{Đã đăng nhập?}
    C -->|Chưa| D[Đăng nhập hoặc đăng ký]
    D --> E[Nhập hành khách và dịch vụ]
    C -->|Rồi| E
    E --> F[Chọn và giữ ghế 15 phút]
    F --> G[Tạo đơn với giá server tính]
    G --> H[Thanh toán MoMo hoặc demo]
    H --> I[Đọc trạng thái từ backend]
    I --> J[Đơn của tôi / Vé của tôi]
```

- Các điểm tìm kiếm dùng chung `/flights`; tuyến/ngày nằm trên URL. Trang kết quả chịu trách nhiệm gọi API tìm kiếm.
- Khi chọn chuyến, frontend đưa `flightId` vào URL. Trang hành khách/chọn ghế có thể tải lại chuyến từ API, không chỉ dựa vào dữ liệu chuyển trang.
- Bản nháp hành khách/dịch vụ lưu trong **sessionStorage của tab, tách theo tài khoản và chuyến, hết hạn sau 30 phút kể từ lần lưu**. Quay lại sửa giữ thông tin đã nhập; bản nháp bị xóa khi tạo đơn thành công. Mở tab mới vẫn tải được chuyến nhưng cần nhập lại thông tin chưa lưu thành đơn.
- Phiên đăng nhập hết hạn sẽ yêu cầu đăng nhập lại và giữ đích quay về tối đa 30 phút cho đúng tài khoản. Thời hạn giữ ghế phía server vẫn giữ nguyên.
- Backend kiểm tra chuyến còn mở bán, giấy tờ, dịch vụ và giá. Giữ ghế có transaction/khóa để hai người không cùng đặt một ghế trên cùng chuyến.
- Đơn đã tạo có thể mở lại bằng `bookingId` tại trang thanh toán. Không lấy tổng tiền từ URL hoặc tin giá do trình duyệt gửi.

### 6.2 Chuyến mẫu và giá

Demo có 8 sân bay Việt Nam (HAN, SGN, DAD, PQC, CXR, DLI, HUI, VCA) và 3 sân bay nước ngoài (NRT, HND, SIN). Có 56 tuyến nội địa, 12 tuyến quốc tế theo từng chiều. Quốc tế chỉ đi/đến Việt Nam qua HAN hoặc SGN; không bán tuyến giữa hai sân bay nước ngoài.

`DEMO_FLIGHTS_ENABLED=true` và môi trường khác production cho phép tạo chuyến theo lượt tìm. Tìm lại dùng cùng chuyến đã lưu; không tự mở lại chuyến hủy, đổi lịch hoặc hết ghế. Lịch dùng giờ Việt Nam, có khoảng nghỉ 30 phút cho máy bay. Đây là quy tắc mô phỏng cho đồ án.

| Thành phần | Giá/cấu hình |
| --- | --- |
| Chuyến nội địa mẫu | 2 giờ; giá cơ bản 1.500.000đ |
| Chuyến quốc tế mẫu | 8 giờ; giá cơ bản 5.500.000đ |
| Hạng ghế | ECONOMY ×1; BUSINESS ×1,5; FIRST ×2 |
| Hành lý | 0 kg: 0đ; 10 kg: 150.000đ; 20 kg: 250.000đ; 30 kg: 350.000đ |
| Suất ăn | Không chọn: 0đ; cơm gà: 80.000đ; cơm bò: 100.000đ; mì: 70.000đ |
| Bảo hiểm | 50.000đ nếu chọn |

Tổng tiền = giá theo hạng ghế + hành lý + suất ăn + bảo hiểm. Mỗi máy bay demo có 20 ghế: 16 phổ thông, 3 thương gia, 1 hạng nhất. Trạng thái giữ/đặt ghế được tính theo từng chuyến, không khóa ghế vĩnh viễn cho mọi ngày bay.

### 6.3 Thanh toán và trạng thái đơn

| Trạng thái | Ý nghĩa và bước tiếp theo |
| --- | --- |
| `PENDING` | Chờ thanh toán; có thể tiếp tục nếu ghế còn hạn và chuyến còn hợp lệ |
| `CONFIRMED` | Đã xác nhận; xem vé và có thể đánh giá nếu đủ điều kiện |
| `EXPIRED` | Hết thời gian giữ ghế; tìm chuyến khác để đặt lại |
| `CANCELLED` | Đã hủy; giữ lịch sử và lý do |
| `PAYMENT_REVIEW` | Có khoản cần đối soát; admin kiểm tra để xử lý |

`REFUNDED` là trạng thái giao dịch hoàn tiền; giao diện đơn cũng thể hiện nhãn đã hoàn tiền khi phù hợp.

- **Demo:** bấm nút là xác nhận thanh toán trong hệ thống: giao dịch `SUCCESS`, đơn `CONFIRMED` (giao diện “Đã thanh toán”), ghế `BOOKED`; vé hiển thị trong Vé của tôi. Không cần quét mã hoặc trả thêm lần nữa. Phương thức vẫn lưu `MOCK` để phân biệt với MoMo; không trừ tiền qua ví/ngân hàng. Email biên nhận gửi sau khi xác nhận, không bắt người dùng chờ email xong.
- **MoMo:** backend tạo giao dịch và trả URL thanh toán. MoMo gửi IPN về backend; backend kiểm tra chữ ký, mã giao dịch và số tiền trước khi xác nhận. Trang kết quả đọc lại trạng thái server, không kết luận thành công chỉ từ query string MoMo trả về.
- Callback đến muộn sau khi ghế hết hạn/đã được người khác đặt chuyển sang đối soát, không lấy ghế của khách khác.
- Admin hủy đơn/chuyến có lý do và giữ lịch sử. Đơn có giao dịch hoặc vé không được xóa như dữ liệu nháp. Hoàn tiền hiện được admin ghi nhận bằng mã tham chiếu và ghi chú sau khi xử lý bên ngoài.
- Dashboard và quản lý thanh toán cộng cả MoMo và Demo vào **Giá trị đã thanh toán** cho các đơn/giao dịch hợp lệ. Biểu đồ vẫn tách từng phương thức; khoản chờ hoàn hoặc đã hoàn không tính vào tổng này. Giá trị ghi nhận trong hệ thống có phần Demo, không đồng nghĩa toàn bộ là tiền thực thu.

### 6.4 Chat AI và hỗ trợ trực tiếp

1. Khách mở chat, có phiên hội thoại và mã bí mật riêng; không bắt buộc đăng nhập.
2. Có khóa Groq thì AI xử lý câu hỏi/tuyến/ngày; khách xác nhận liên kết tìm chuyến để xem kết quả. Bot không tự mua vé hoặc thanh toán.
3. Tin nhắn được lưu vào PostgreSQL. Admin bật sẵn sàng, xem hàng chờ, tiếp nhận và trả lời qua WebSocket.
4. Khi nhân viên đang nhận hội thoại, bot không chen câu trả lời vào luồng hỗ trợ. Kết thúc hoặc mất kết nối quá thời gian cho phép sẽ trả về bot.
5. Phiên chat trong trình duyệt được tách khi đổi tài khoản/đăng xuất; dữ liệu tìm chuyến cũ không được khôi phục sang tài khoản khác.

Chat hiện là phiên theo trình duyệt, **chưa phải hộp thư tài khoản đồng bộ nhiều thiết bị**. Admin thấy mã khách/hội thoại, chưa tự xác minh khách đó là chủ của một đơn; cần kiểm tra thông tin trước khi hỗ trợ nghiệp vụ.

### 6.5 Tài khoản, hồ sơ và đánh giá

- Mật khẩu băm bằng bcrypt; JWT được kiểm tra lại với tài khoản, role, khóa tài khoản và `token_version` ở backend.
- Quên/đổi mật khẩu dùng mã email 6 chữ số, hạn 10 phút, tối đa 5 lần sai; gửi lại sau ít nhất 60 giây. Đổi mật khẩu thu hồi phiên cũ.
- Avatar JPG/JPEG/PNG/WEBP tối đa 2 MB, 4096 × 4096 pixel được backend kiểm tra và tạo lại thành WebP tối đa 512 × 512.
- Một đơn hợp lệ chỉ đánh giá một lần. Có thể xóa đánh giá nhưng không gửi lại/sửa. Trang chủ giữ tối đa 4 đánh giá mới nhất; backend xóa đánh giá vượt giới hạn khi có bài mới. Cấu hình tại `backend/config/reviews.js`.
- Admin chính được bảo vệ; giao diện hiện không có luồng cấp thêm quyền ADMIN/STAFF. Không thể xóa tài khoản đang có lịch sử nghiệp vụ liên quan.

## 7. Cấu hình dịch vụ và biến môi trường

| Nhóm biến | Nơi cấu hình | Tác dụng |
| --- | --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Backend | Kết nối PostgreSQL; mã hiện đọc từng biến, chưa đọc `DATABASE_URL` |
| `JWT_SECRET` | Backend | Ký token và bảo vệ mã mật khẩu |
| `PORT` | Backend | Cổng HTTP/WebSocket, mặc định 5000 |
| `NODE_ENV` | Backend | Local dùng `development`; production chặn cả hai chế độ demo |
| `FRONTEND_URL` | Backend | Origin frontend được phép gọi API và WebSocket |
| `DEMO_FLIGHTS_ENABLED` | Backend | Tạo chuyến mẫu theo lượt tìm khi không phải production |
| `DEMO_PAYMENTS_ENABLED` | Backend | Thanh toán giả lập khi không phải production |
| `GROQ_API_KEY`, `GROQ_MODEL` | Backend | Chat AI; model mặc định trong mã là `openai/gpt-oss-120b` |
| `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM_NAME` | Backend | Gmail gửi OTP/biên nhận; `MAIL_PASS` dùng mật khẩu ứng dụng phù hợp tài khoản Gmail |
| `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `MOMO_ENDPOINT` | Backend | Thông tin tích hợp MoMo được cấp cho môi trường tương ứng |
| `MOMO_REDIRECT_URL` | Backend | URL frontend `/payment-result` |
| `MOMO_IPN_URL` | Backend | URL backend `/api/payments/momo/ipn`, phải truy cập được từ MoMo |
| `VITE_API_URL` | Frontend | `/api` khi local; URL backend có `/api` khi deploy tách hosting |
| `VITE_CHAT_WS_URL` | Frontend, tùy chọn | Chỉ đặt khi WebSocket khác URL tự suy ra từ API |

Thiếu Gmail thì không gửi được OTP/email vé; thiếu Groq thì AI báo chưa cấu hình; thiếu MoMo thì không tạo được thanh toán MoMo. Chat người thật và thanh toán demo local không cần khóa Groq/MoMo. Dịch vụ email lỗi không biến một giao dịch đã xác nhận thành thất bại.

`VITE_*` là cấu hình được đưa vào bản frontend, không đặt bí mật trong đó. Đổi biến frontend cần khởi động lại Vite hoặc build/deploy lại; đổi biến backend cần khởi động lại backend.

## 8. Cấu trúc mã nguồn và database

```text
fe-react/
├── backend/
│   ├── config/       # PostgreSQL, quy tắc demo, giới hạn đánh giá
│   ├── routes/       # URL API và middleware quyền truy cập
│   ├── controllers/  # Nhận request, gọi nghiệp vụ, trả response
│   ├── services/     # Đặt chỗ, thanh toán, email, chat, thống kê
│   ├── middleware/   # JWT, quyền admin, upload, giới hạn request
│   ├── lib/          # Validation, tính giá, kiểm tra schema, lỗi HTTP
│   ├── setup/        # Schema dựng database mới
│   ├── migrations/   # Thay đổi database 001–008
│   ├── scripts/      # Setup demo, kiểm tra AI, xem quy tắc tuyến
│   ├── test/         # Kiểm thử backend và schema thử nghiệm
│   ├── uploads/      # Ảnh người dùng, cần giữ khi chuyển máy
│   ├── temp/         # Ảnh/log/database tạm do kiểm thử tạo
│   └── server.js     # HTTP, WebSocket và worker chat
├── frontend/
│   ├── src/
│   │   ├── pages/    # Trang khách và xác thực
│   │   ├── admin/    # Màn hình quản trị
│   │   ├── components/ # Thành phần theo nhóm chức năng
│   │   ├── hooks/    # Logic biểu mẫu, đặt vé, chat và hồ sơ
│   │   ├── contexts/ # Trạng thái chat quản trị dùng chung
│   │   ├── layouts/  # Header, Footer, bố cục admin và xác thực
│   │   ├── api/      # Axios và WebSocket
│   │   ├── utils/    # Định dạng, phiên, bản nháp, validation giao diện
│   │   ├── data/     # Nội dung blog và hướng dẫn tĩnh
│   │   ├── styles/   # CSS
│   │   └── App.jsx   # Bản đồ trang và bảo vệ route
│   ├── test/         # Unit test và trình duyệt với dữ liệu giả
│   ├── vercel.json   # Rewrite React Router khi deploy Vercel
│   └── dist/         # Bản build sinh tự động
├── scripts/test-project.cjs # Kiểm thử toàn dự án với PostgreSQL riêng
├── docs/             # Chi tiết nghiệp vụ và báo cáo kiểm tra
└── README.md
```

| Nhóm bảng chính | Dữ liệu |
| --- | --- |
| `users`, `password_challenges` | Tài khoản, role, khóa phiên và mã mật khẩu |
| `airlines`, `airports`, `airplanes`, `seats`, `flights` | Danh mục và chuyến bay |
| `bookings`, `booking_details`, `passengers`, `tickets` | Đơn, hành khách, dịch vụ, giữ ghế và vé |
| `payments`, `payment_review_cases` | Giao dịch, đối soát và ghi nhận hoàn tiền |
| `customer_reviews` | Đánh giá |
| `chat_conversations`, `chat_messages`, `chat_presence`, `chat_reads` | Hội thoại và trạng thái hỗ trợ |

Thông tin hành trình/giá/ghế lúc đặt được lưu trên đơn để giữ lịch sử. Thay đổi chuyến hiện tại không được tùy tiện ghi đè dữ liệu vé đã mua. Ngày giờ hiển thị theo Việt Nam (`Asia/Ho_Chi_Minh`); dữ liệu `TIMESTAMP WITHOUT TIME ZONE` hiện được hiểu là giờ Việt Nam.

Các nhóm API: `/api/auth`, `/api/users`, `/api/flights`, `/api/seats`, `/api/bookings`, `/api/payments`, `/api/reviews`, `/api/chat`. Tra cứu URL chính xác trong `backend/routes/`; các API quản trị dùng `verifyToken` và `isAdmin`, API đơn/thanh toán cá nhân còn kiểm tra chủ đơn.

## 9. Chạy thử, kiểm tra và build

### Chạy hằng ngày và trong mạng LAN

Sau lần cài đầu, chỉ cần PostgreSQL đang chạy và hai terminal `npm --prefix backend start`, `npm --prefix frontend run dev`.

Để người cùng Wi-Fi thử website, thay lệnh frontend bằng:

```powershell
npm --prefix frontend run dev:lan
```

Mở địa chỉ **Network** Vite in ra, ví dụ `http://192.168.1.12:5173`. Cho phép cổng 5173 qua tường lửa nếu cần. Backend vẫn chỉ nghe loopback và nhận API qua Vite. Khi đổi Wi-Fi/IP, khởi động lại backend và Vite. LAN không tự giới hạn người truy cập trong một nhóm cụ thể.

### Kiểm tra không cần database thật

```powershell
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend run test:ui
```

`test:ui` build lại và chạy Chrome/Edge headless với API giả lập; không tạo giao dịch thật. Nếu vừa build và chưa sửa mã, có thể chạy trực tiếp từ thư mục `frontend`: `node test/browser-smoke.cjs`.

Backend có các lệnh độc lập dùng mock:

```powershell
npm --prefix backend run test:security
npm --prefix backend run test:avatar
npm --prefix backend run test:ai
npm --prefix backend run test:demo
```

`test:ai` dùng provider giả. `test:ai:live` gọi Groq thật và cần khóa API; lệnh đó có tiêu thụ hạn mức dịch vụ.

### Kiểm thử tích hợp và toàn dự án

`npm --prefix backend test` có bài tích hợp nên **không chạy được khi thiếu `TEST_DATABASE_URL`**. Bộ test không được trỏ vào database ứng dụng.

Cách kiểm tra toàn bộ được khuyến nghị, từ thư mục gốc:

```powershell
$env:POSTGRES_BIN = 'C:\Program Files\PostgreSQL\18\bin'
node scripts/test-project.cjs
```

Đổi đường dẫn PostgreSQL đúng máy. Runner cần `initdb`, `postgres`, `pg_ctl` và Chrome/Edge; có thể đặt `CHROME_PATH` nếu trình duyệt cài ở vị trí khác. Không đặt `POSTGRES_BIN` thì mặc định tìm trong thư mục `PostgreSQL/bin` của người dùng.

Runner tạo PostgreSQL riêng với cổng ngẫu nhiên, dựng database test/demo riêng trong `backend/temp`, chạy unit/integration/chat, lint, build, trình duyệt giả lập, trình duyệt với backend thật và kiểm tra cổng chặn production. Dịch vụ thanh toán/email/AI thật bị tắt trong luồng kiểm tra này. Runner không đổi `.env` hay dùng database ứng dụng.

- `node scripts/test-project.cjs --api-only`: kiểm tra backend với database riêng.
- `node scripts/test-project.cjs --live-only`: kiểm tra UI với backend/database riêng; cần frontend đã build.

Kết quả ở `backend/temp/full-check-<thời_gian>/summary.json` và các file log/ảnh đi kèm. Có thể dọn dữ liệu trong `backend/temp` khi không chạy test; test sau sẽ tạo lại. **Không nhầm với `backend/uploads` chứa ảnh người dùng.**

### Build và preview

```powershell
npm --prefix frontend run build
npm --prefix frontend run preview
```

Build tạo `frontend/dist`. Preview chỉ phục vụ bản frontend; PostgreSQL/backend vẫn cần chạy. Dùng URL/cổng mà Vite in ra; nếu origin frontend đổi, cấu hình `FRONTEND_URL` phù hợp rồi khởi động lại backend. Backend hiện không tự phục vụ `frontend/dist`.

## 10. Triển khai Vercel và Render

Mô hình phù hợp: **frontend Vercel + backend Render Web Service + PostgreSQL cloud**. Các bước dưới là cấu hình cần chuẩn bị, không có nghĩa repository đã được deploy hoặc kiểm tra giao dịch thật trên cloud.

| Dịch vụ | Thiết lập |
| --- | --- |
| Vercel | Root Directory `frontend`; Framework Vite; Build `npm run build`; Output `dist` |
| Render | Root Directory `backend`; Build `npm ci`; Start `npm start`; Node tương thích mục 2 |
| PostgreSQL cloud | Khôi phục schema/dữ liệu phù hợp, cấu hình quyền tài khoản ứng dụng và kết nối backend |

Frontend trên Vercel:

```dotenv
VITE_API_URL=https://YOUR_BACKEND.onrender.com/api
```

Backend trên Render:

```dotenv
NODE_ENV=production
FRONTEND_URL=https://YOUR_FRONTEND.vercel.app
DB_HOST=YOUR_CLOUD_DATABASE_HOST
DB_PORT=5432
DB_NAME=YOUR_CLOUD_DATABASE_NAME
DB_USER=YOUR_CLOUD_DATABASE_USER
DB_PASSWORD=YOUR_CLOUD_DATABASE_PASSWORD
JWT_SECRET=YOUR_RANDOM_SECRET
```

Render cung cấp `PORT`; backend đã đọc biến này và nghe `0.0.0.0` trong production. `frontend/vercel.json` đưa đường dẫn React Router về `index.html` để tải lại trang con. Chat suy ra `wss://YOUR_BACKEND.onrender.com/api/chat/live` từ URL API; backend chỉ cho origin khớp `FRONTEND_URL`.

**Các điểm cần xử lý để đủ chức năng trên hosting:**

1. **Database:** `127.0.0.1` trên Render là máy Render, không phải máy bạn. Chuyển database lên cloud; vẫn dùng pgAdmin kết nối để quản lý. Mã hiện chưa hỗ trợ `DATABASE_URL` hoặc cấu hình SSL riêng; đối chiếu yêu cầu endpoint, bổ sung cấu hình kết nối nếu dùng endpoint bắt buộc TLS. Script setup local không chấp nhận database cloud.
2. **Demo:** production luôn chặn tạo chuyến mẫu và thanh toán MOCK, dù cờ `DEMO_*` bật. Cần chuẩn bị chuyến thật trong database và tích hợp thanh toán phù hợp, hoặc thiết kế một chế độ demo online riêng. Không đổi `NODE_ENV` để lách chặn demo: backend development chỉ nghe loopback.
3. **Email:** mã hiện dùng Gmail SMTP. Render Free chặn các cổng SMTP 25/465/587, ảnh hưởng OTP và email vé; cần dịch vụ gửi qua HTTPS API hoặc hạ tầng hỗ trợ SMTP.
4. **Ảnh:** `backend/uploads` là file local; Render có filesystem tạm. Cần dịch vụ lưu ảnh hoặc persistent disk phù hợp để ảnh không mất sau restart/deploy.
5. **MoMo/Groq:** đặt khóa ở backend; đổi redirect sang Vercel và IPN sang Render. Callback cần URL HTTPS công khai và đúng môi trường MoMo.
6. **Proxy/IP:** `trust proxy` production hiện tắt; cần cấu hình theo proxy thực tế trước khi dựa vào giới hạn request theo IP. Không tin mọi header IP tùy ý từ client.
7. **Phiên chat:** sửa vấn đề đổi tài khoản theo mục 6 không thay việc kiểm thử quyền riêng tư và thanh toán khi mở cho người dùng thực.

Tài liệu nền tảng: [Vite trên Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Render Web Service](https://render.com/docs/web-services), [WebSocket](https://render.com/docs/websocket), [giới hạn Render Free](https://render.com/docs/free), [persistent disk](https://render.com/docs/disks).

Render Free có thể ngủ khi không hoạt động và database Postgres Free có thời hạn sử dụng; đối chiếu tài liệu trước khi dùng cho buổi báo cáo hoặc lưu dữ liệu lâu dài. Không coi gói miễn phí là phương án vận hành bán vé thương mại đã hoàn thiện.

## 11. Lỗi thường gặp

| Hiện tượng | Kiểm tra và xử lý |
| --- | --- |
| `ENOENT ... package.json` khi chạy npm | Đang chạy sai thư mục; dùng các lệnh `npm --prefix backend ...` hoặc `frontend ...` từ thư mục gốc |
| `npm ci` báo engine không phù hợp | Kiểm tra `node --version`; dùng phiên bản trong mục 2 |
| Backend không kết nối được PostgreSQL | PostgreSQL server có chạy không; kiểm tra host/port/tên DB/user/mật khẩu trong `backend/.env`, không chỉ việc pgAdmin đang mở |
| `Database migration required` | Đúng database chưa; đối chiếu schema và migration 001; sao lưu trước khi áp dụng |
| Chat báo chưa có database/migration 007 | Database thiếu bảng chat; áp dụng migration phù hợp, không chạy schema test |
| Setup từ chối database | Database không rỗng, sai tên hoặc không ở local; chọn đúng quy trình mục 3/mục 4 |
| Không đăng nhập được admin | Dùng thông tin tự chọn khi chạy setup; dự án không có mật khẩu admin công khai mặc định |
| Không có chuyến | Chọn tuyến hợp lệ và ngày tương lai; kiểm tra cờ demo và `NODE_ENV`; production không tự tạo chuyến |
| Ghế vừa chọn nhưng không thanh toán được | Ghế hết hạn, chuyến thay đổi hoặc phiên hết hạn; mở Đơn đặt vé để kiểm tra; không tự tăng thời gian giữ ghế |
| Không thấy nút thanh toán giả lập | Chỉ có khi `DEMO_PAYMENTS_ENABLED=true` và không chạy production |
| Không nhận OTP/email | Kiểm tra cấu hình Gmail, kết nối SMTP và giới hạn hosting; OTP không được in công khai để thay thế email |
| Chat AI báo chưa cấu hình | Kiểm tra `GROQ_API_KEY`, model và hạn mức; chat với admin không cần Groq |
| CORS hoặc WebSocket bị từ chối | `FRONTEND_URL` phải đúng origin gồm giao thức/cổng, không thêm đường dẫn; kiểm tra URL API, `wss` và khởi động lại backend |
| MoMo trả về nhưng chưa có vé | Trang kết quả còn chờ IPN/đối soát; kiểm tra URL callback và trạng thái đơn, không dựa riêng vào `resultCode` trên URL |
| Refresh trang con trên Vercel bị 404 | Kiểm tra Root Directory và việc deploy có `frontend/vercel.json` |
| Avatar mất sau redeploy | Ảnh lưu trên filesystem tạm; cấu hình nơi lưu bền vững và sao lưu cả uploads khi chuyển máy |
| `npm test` backend thiếu `TEST_DATABASE_URL` | Đây là kiểm thử tích hợp; dùng runner toàn dự án hoặc database test mới, không dùng database ứng dụng |
| Thư mục `backend/temp` quá lớn | Chứa database/ảnh/log kiểm thử; dọn khi mọi tiến trình test đã dừng |

## 12. Giới hạn và tài liệu chi tiết

Hiện dự án tập trung demo nghiệp vụ: chưa có vé khứ hồi/nhiều chặng, nhiều hành khách trong một đơn, kết nối hãng, hoàn tiền tự động, CMS blog, hộp thư chat đồng bộ tài khoản trên nhiều máy hoặc cơ chế phối hợp nhiều backend instance. Chat/rate limit hiện có trạng thái trong một tiến trình; cần thiết kế chia sẻ trạng thái trước khi scale ngang.

Khi chuyển máy, giữ mã nguồn, lockfile, cấu hình riêng được bàn giao an toàn, bản sao database và `backend/uploads`. Có thể tạo lại `node_modules`, `frontend/dist` và `backend/temp`. File SQL, test và tài liệu vẫn liên quan đến khả năng dựng lại/kiểm tra dự án dù không được gọi khi khách mua vé.

Tài liệu bổ sung:

- [Kết quả rà soát liên kết và luồng sử dụng hiện tại](docs/navigation-review.md)
- [Đặt vé, tài khoản, thanh toán và database](docs/booking-safety-handoff.md)
- [Lịch mẫu và quy tắc tuyến](docs/demo-flight-schedule.md)
- [Quản lý đơn đặt vé](docs/admin-booking-management.md)
- [Dashboard và hồ sơ](docs/dashboard-profile-update.md)
- [Đánh giá khách hàng](docs/customer-reviews.md)
- [Chatbot AI và tìm chuyến](docs/groq-flight-assistant.md)
- [Chat trực tiếp và xóa hội thoại](docs/chat-handoff-deletion.md)
- [Chuẩn bị báo cáo và luồng đối soát](docs/report-readiness.md)
- [Báo cáo kiểm thử trước đây](docs/full-functional-test.md)

Các báo cáo có ngày hoặc đường dẫn kết quả test là ảnh chụp tại thời điểm kiểm tra. Chạy lại các lệnh mục 9 để xác minh phiên bản mã đang sử dụng.
