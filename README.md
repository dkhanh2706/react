# DAMH Shop — Website đặt vé máy bay

Đồ án React + Express + PostgreSQL, mô phỏng đặt vé một chiều, một hành khách/ghế trên mỗi đơn. Hệ thống chưa kết nối kho vé của hãng hàng không và không phát hành vé hãng thật.

## Mục lục

- [Công nghệ và cấu trúc](#công-nghệ-và-cấu-trúc)
- [Các chức năng hiện có](#các-chức-năng-hiện-có)
- [Yêu cầu và cài thư viện](#yêu-cầu-và-cài-thư-viện)
- [Môi trường](#môi-trường)
- [Tạo database demo mới từ đầu](#tạo-database-demo-mới-từ-đầu)
- [Database đang sử dụng](#database-đang-sử-dụng)
- [Chạy](#chạy)
- [Các trang và API chính](#các-trang-và-api-chính)
- [Chat trực tiếp và thời gian chờ kết nối lại](#chat-trực-tiếp-và-thời-gian-chờ-kết-nối-lại)
- [Trình diễn và nghiệm thu](#trình-diễn-và-nghiệm-thu)
- [Kiểm thử](#kiểm-thử)
- [Lỗi thường gặp](#lỗi-thường-gặp)
- [Phạm vi và tài liệu nghiệp vụ](#phạm-vi-và-tài-liệu-nghiệp-vụ)

## Công nghệ và cấu trúc

| Thành phần | Công nghệ sử dụng |
| --- | --- |
| Frontend | React 19, Vite 8, React Router 7, Axios, Tailwind CSS và CSS riêng, Lucide React, React Hot Toast |
| Backend | Node.js, Express 5, PostgreSQL qua `pg` |
| Tài khoản và ảnh | JWT, bcrypt, Multer, Sharp |
| Dịch vụ tích hợp | MoMo, Nodemailer với Gmail, Groq SDK |
| Chat trực tiếp | WebSocket qua `ws`, lưu hội thoại trong PostgreSQL |
| Kiểm tra | Node.js Test Runner, ESLint, Vite build |

```text
fe-react/
├── backend/
│   ├── config/          # Kết nối DB, cấu hình lịch demo và đánh giá
│   ├── controllers/     # Xử lý request tài khoản, chuyến, đơn, thanh toán, chat
│   ├── lib/             # Validation, tính giá, quy tắc tuyến, kiểm tra schema
│   ├── middleware/      # Xác thực, quyền admin, upload avatar, giới hạn request
│   ├── routes/          # Khai báo API
│   ├── services/        # Nghiệp vụ đặt chỗ, MoMo, email, lịch demo, chat
│   ├── migrations/      # Các migration 001–007
│   ├── setup/           # Schema nền cho database mới
│   ├── scripts/         # Dựng database demo, xem cấu hình tuyến
│   ├── test/            # Unit test và kiểm thử tích hợp
│   ├── uploads/avatars/ # Ảnh tải lên, sinh khi chạy và không đưa vào Git
│   ├── .env.example
│   └── server.js        # Khởi động HTTP, WebSocket và worker chat
├── frontend/
│   ├── src/
│   │   ├── admin/       # Dashboard và các màn hình quản trị
│   │   ├── api/         # Axios, kết nối WebSocket
│   │   ├── components/  # Giao diện theo nhóm chức năng, xem chi tiết bên dưới
│   │   ├── contexts/    # Context và provider chat quản trị dùng chung
│   │   ├── hooks/       # Logic hồ sơ, avatar, mật khẩu, hành khách, ghế, chat
│   │   ├── layouts/     # Header, Footer, AuthLayout và AdminLayout
│   │   ├── data/        # Nội dung blog tĩnh
│   │   ├── pages/       # Các trang khách hàng và xác thực
│   │   ├── styles/      # CSS theo trang và thành phần
│   │   ├── utils/       # Định dạng, phiên đăng nhập, nhãn, tên sân bay, avatar, chat
│   │   ├── App.jsx      # Định tuyến và bảo vệ trang
│   │   └── main.jsx     # Điểm vào React
│   └── .env.example
└── docs/                # Tài liệu nghiệp vụ và bàn giao
```

Frontend và backend có `package.json` riêng. Chạy lệnh npm trong đúng thư mục tương ứng; thư mục gốc không có script khởi động chung.

Các component frontend được phân nhóm như sau:

```text
frontend/src/components/
├── common/         # AccountAvatar, ProtectedRoute, ScrollToTop
├── home/           # Khối nội dung trang chủ
├── flights/        # Tìm kiếm chuyến bay
├── booking/        # Form hành khách, dịch vụ, sơ đồ ghế, tóm tắt đặt vé/đánh giá
├── payment/        # Thông tin xác nhận, phương thức và tổng tiền thanh toán
├── profile/        # Sidebar, ảnh đại diện, thông tin cá nhân, modal mật khẩu
├── chat/           # Chatbot, header, tin nhắn, ô nhập và trạng thái admin
└── admin/flights/  # Bảng chuyến bay, form thêm/sửa, modal hủy/xóa
```

`pages/` và `admin/` ghép các khối giao diện thành màn hình. Logic có state hoặc gọi API của hồ sơ, avatar, mật khẩu, hành khách, chọn ghế và chatbot nằm trong các hook tương ứng ở `hooks/`; `utils/` chứa các hàm hỗ trợ và cấu hình không có state. Các file CSS tiếp tục nằm trong `styles/` để giữ nguyên bố cục hiện tại. Khi thêm thành phần mới, đặt vào nhóm chức năng tương ứng; layout, hook và context đặt trong thư mục riêng.

Các hàm dùng chung đã được gom về một nơi; trang/component nên import trực tiếp từ các module sau:

| Module trong `frontend/src/utils` | Trách nhiệm |
| --- | --- |
| `format.js` | `formatNumber`, `formatMoney`, `formatDate`, `formatTime`, `formatDateTime`, `vietnamToday`; ngày giờ dùng `Asia/Ho_Chi_Minh`, giữ nguyên ngày dạng `YYYY-MM-DD` và giờ dạng `HH:mm` trên vé. |
| `auth.js` | `getStoredUser`, `getAuth`, `isAdminUser`, `clearAuthStorage`, `isTokenExpired`; đọc JSON an toàn và phát sự kiện `auth-changed` khi xóa phiên. Kiểm tra token phía trình duyệt chỉ phục vụ giao diện, backend vẫn xác thực JWT/quyền. |
| `labels.js` | Tên giới tính và suất ăn; nhãn suất ăn lấy từ danh sách dịch vụ dùng chung trong `passenger.js`. |
| `airportNames.js` | Tên điểm đi/đến hiển thị; dùng chung cho kết quả tìm kiếm, vé và đánh giá. |

Ví dụ: `formatMoney(1500000)` trả `1.500.000đ`; dùng `formatNumber` nếu giao diện đã có ký hiệu tiền riêng. `formatDate(value, { fallback: "Chưa cập nhật" })` giữ thông báo riêng của trang khi thiếu ngày. Các module `booking.js`, `passenger.js`, `profile.js` giữ quy tắc/cấu hình riêng của nghiệp vụ, không chứa bản sao hàm định dạng hoặc đọc phiên đăng nhập.

## Các chức năng hiện có

### Khách chưa đăng nhập

- Xem trang chủ, điểm đến, các tuyến phổ biến, nội dung giới thiệu hãng và đánh giá khách hàng.
- Tìm chuyến theo sân bay đi, sân bay đến và ngày bay; xem giờ bay, giá, số ghế còn trống và phân trang kết quả. Điểm đến được lọc theo tuyến hợp lệ.
- Xem danh sách và chi tiết blog; tìm bài, lọc chuyên mục và sắp xếp bài viết. Nội dung lấy từ `frontend/src/data/blogData.js`, chưa có CMS/API quản trị bài viết.
- Đăng ký, đăng nhập, quên mật khẩu và đặt lại mật khẩu bằng mã gửi qua email.
- Mở chatbot, tìm chuyến theo luồng hỏi điểm đi/đến/ngày, hỏi AI hoặc yêu cầu gặp nhân viên. Phiên chat khách có mã riêng, không bắt buộc đăng nhập tài khoản đặt vé.

### Khách đã đăng nhập

| Nhóm | Chức năng |
| --- | --- |
| Hồ sơ | Xem/cập nhật thông tin cá nhân, tải ảnh đại diện JPG/JPEG/PNG/WEBP tối đa 2 MB, tối đa 4096 × 4096 pixel. Backend xác minh nội dung, từ chối ảnh động, tạo lại WebP tối đa 512 × 512 và bỏ metadata/tên file gốc. |
| Mật khẩu | Đổi mật khẩu bằng mã email. Mã 6 chữ số có hạn 10 phút, tối đa 5 lần sai; gửi lại sau ít nhất 60 giây. Đổi mật khẩu thu hồi token cũ. |
| Hành khách | Nhập họ tên, email, điện thoại, giới tính, ngày sinh, loại và số giấy tờ CCCD/hộ chiếu. Backend kiểm tra dữ liệu trước khi lập đơn. |
| Ghế | Xem sơ đồ ghế theo chuyến, chọn ECONOMY/BUSINESS/FIRST, giữ ghế 15 phút; chống hai tài khoản đặt cùng ghế trên cùng chuyến. |
| Dịch vụ | Chọn hành lý ký gửi, suất ăn và bảo hiểm; xem tổng tiền do backend tính. |
| Thanh toán | Tạo thanh toán MoMo hoặc thanh toán giả lập khi bật chế độ demo. Kết quả MoMo được xác minh qua IPN và API trạng thái đơn. |
| Đơn của tôi | Xem/lọc trạng thái, làm mới, tự cập nhật định kỳ 15 giây và khi quay lại tab. Tiếp tục đơn chưa hết hạn qua `/payment?bookingId=...`, dùng giá/thông tin đã lưu, không gia hạn giữ ghế. |
| Vé của tôi | Xem vé điện tử, mã đặt chỗ, hành trình, ghế, dịch vụ, số tiền và trạng thái hiện tại của chuyến/thanh toán. |
| Đánh giá | Gửi 1–5 sao và nội dung 1–1000 ký tự cho đơn đã xác nhận, có thanh toán thành công không đang đối soát. Mỗi đơn chỉ đánh giá một lần; có thể xóa nhưng không gửi lại hoặc sửa. |

Trang chủ hiển thị tối đa **4 đánh giá mới nhất**. Backend xóa các bài vượt giới hạn khi có đánh giá mới và vẫn giữ dấu đã đánh giá trên đơn. Thay giới hạn trong `backend/config/reviews.js`.

### Quản trị viên

| Màn hình | Chức năng |
| --- | --- |
| Dashboard | Tổng chuyến, tài khoản, doanh thu MoMo và tỷ lệ lấp đầy từ database. Doanh thu chỉ gồm MOMO SUCCESS của đơn CONFIRMED, không có đối soát OPEN; loại thanh toán MOCK. |
| Người dùng | Tìm kiếm, lọc theo quyền/trạng thái, xem thông tin, khóa/mở khóa; chỉ xóa tài khoản chưa có lịch sử liên quan. Bảo vệ tài khoản admin, không có luồng cấp thêm quyền ADMIN/STAFF. |
| Chuyến bay | Tìm kiếm, lọc ngày/trạng thái, phân trang, thêm/sửa/hủy chuyến; kiểm tra tuyến, thời gian và trùng lịch máy bay. Chỉ xóa chuyến chưa có lịch sử và không phải chuyến demo. |
| Đơn đặt vé | Tìm/lọc/phân trang, xem hành khách, ghế, dịch vụ, giá, thanh toán, đối soát. Hủy kèm lý do để giải phóng ghế và giữ lịch sử. Chỉ xóa vĩnh viễn đơn chưa có giao dịch/vé và không ở trạng thái CONFIRMED/PAYMENT_REVIEW, sau khi nhập đúng mã đơn. |
| Thanh toán | Tìm/lọc theo trạng thái và phương thức, xem chi tiết giao dịch và hồ sơ đối soát; ghi nhận đã hoàn tiền với mã xác nhận, ghi chú, người xử lý và thời gian. |
| Chat hỗ trợ | Bật/tắt sẵn sàng nhận khách, xem hàng chờ, tiếp nhận, nhắn tin, xem tin chưa đọc và kết thúc hỗ trợ; xử lý mất kết nối và chuyển về bot. |
| Xem trang khách | Mở giao diện khách hàng từ quản trị và quay về qua menu tài khoản. |

**Hoàn tiền hiện là ghi nhận thủ công**, không gọi API chuyển tiền hoàn. Đơn có bất kỳ giao dịch PENDING/FAILED/SUCCESS/REFUNDED đều được giữ lịch sử để tiếp nhận callback đến muộn. Đơn đã thu tiền bị hủy hoặc callback thành công sau khi hết hạn sẽ chuyển sang đối soát thay vì tự cấp lại ghế.

### Quy tắc tuyến, lịch demo và giá

- Danh mục demo có 8 sân bay Việt Nam: HAN, SGN, DAD, PQC, CXR, DLI, HUI, VCA; 3 sân bay nước ngoài: NRT, HND, SIN.
- Có 56 tuyến nội địa và 12 tuyến quốc tế theo từng chiều. Quốc tế chỉ đi/đến Việt Nam qua HAN hoặc SGN; không khai thác tuyến giữa hai sân bay nước ngoài.
- Bật `DEMO_FLIGHTS_ENABLED=true`: khi tìm tuyến/ngày chưa có chuyến, backend tạo chuyến cần dùng. Tìm lại dùng chuyến đã lưu, không tạo sẵn cả năm và không tự mở lại chuyến bị hủy/hết ghế.
- Lịch demo bắt đầu xếp từ 06:00, chừa 30 phút giữa các chuyến cùng máy bay; giờ được hiểu theo múi giờ Việt Nam. Nội địa mẫu 2 giờ/1.500.000đ, quốc tế mẫu 8 giờ/5.500.000đ; đây là dữ liệu minh họa.
- Có 12 máy bay demo, mỗi máy bay 20 ghế: 16 ECONOMY, 3 BUSINESS, 1 FIRST. Ghế được giữ/đặt theo từng `flight_id`, độc lập giữa các chuyến.

| Thành phần giá | Mức hiện tại |
| --- | --- |
| Hạng ghế | ECONOMY ×1; BUSINESS ×1,5; FIRST ×2 giá cơ bản của chuyến |
| Hành lý ký gửi | 0 kg: 0đ; 10 kg: 150.000đ; 20 kg: 250.000đ; 30 kg: 350.000đ |
| Suất ăn | Không chọn: 0đ; cơm gà: 80.000đ; cơm bò: 100.000đ; mì: 70.000đ |
| Bảo hiểm | 50.000đ nếu chọn |

Tổng tiền = giá theo hạng ghế + hành lý + suất ăn + bảo hiểm. Backend lấy giá/hạng từ database và bảng giá trong `backend/lib/validation.js`, không tin giá gửi lên từ trình duyệt. Sau khi bắt đầu thanh toán, không được sửa thông tin/giá đơn.

## Yêu cầu và cài thư viện

Chuẩn bị Node.js **22.13 trở lên trong nhánh 22** (phù hợp cả Vite và ESLint hiện tại), npm, PostgreSQL 18 và hai terminal. Các lệnh database bên dưới cần `createdb`/`psql` trong PATH; có thể tạo database bằng pgAdmin. Kiểm tra phiên bản bằng `node --version`, `npm --version`, `psql --version`.

Các lệnh trong README dùng PowerShell và bắt đầu từ thư mục gốc dự án, trừ khi có ghi chú khác. Nếu dùng database có sẵn, đọc phần migration; nếu cài máy mới, thực hiện phần tạo database demo mới.

```powershell
cd backend
npm ci
cd ../frontend
npm ci
```

## Môi trường

Máy mới: sao chép `backend/.env.example` → `backend/.env`, `frontend/.env.example` → `frontend/.env`. **Không ghi đè `.env` đã cấu hình.** File mẫu không chứa thông tin đăng nhập thật. Chạy từ thư mục gốc:

```powershell
if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
if (!(Test-Path frontend/.env)) { Copy-Item frontend/.env.example frontend/.env }
```

Mở `backend/.env`, sửa mật khẩu PostgreSQL, tên database và `JWT_SECRET` theo máy của bạn. Cấu hình tối thiểu để chạy demo:

```dotenv
PORT=5000
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=airline_booking_demo
DB_USER=postgres
DB_PASSWORD=YOUR_LOCAL_POSTGRES_PASSWORD
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET
FRONTEND_URL=http://localhost:5173
DEMO_FLIGHTS_ENABLED=true
DEMO_PAYMENTS_ENABLED=true
```

Trong `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

| Biến                                                                       | Cấu hình                                                                                                           |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD`                              | Kết nối PostgreSQL của backend.                                                                                    |
| `JWT_SECRET`                                                               | Chuỗi bí mật ngẫu nhiên để ký token và băm mã khôi phục.                                                           |
| `FRONTEND_URL`                                                             | Origin frontend, mặc định local `http://localhost:5173`.                                                           |
| `VITE_API_URL`                                                             | Frontend: `http://localhost:5000/api`, phải có `/api`. Khởi động lại Vite sau khi đổi.                             |
| `NODE_ENV`                                                                 | `development` khi chạy đồ án.                                                                                      |
| `PORT`                                                                     | Cổng backend, mặc định `5000`. Nếu đổi, cập nhật URL API ở frontend. |
| `DEMO_FLIGHTS_ENABLED`, `DEMO_PAYMENTS_ENABLED`                            | `true` để tạo chuyến theo lượt tìm và thanh toán giả lập. Production luôn chặn demo.                               |
| `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM_NAME`                                 | Dịch vụ email hiện dùng Gmail; nhập địa chỉ Gmail, mật khẩu ứng dụng và tên người gửi. Dùng cho mã mật khẩu và biên nhận. |
| `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `MOMO_ENDPOINT` | Điền theo môi trường MoMo được cấp.                                                                                |
| `MOMO_REDIRECT_URL`, `MOMO_IPN_URL`                                        | Redirect về frontend `/payment-result`; IPN tới backend `/api/payments/momo/ipn`, phải truy cập được từ phía MoMo. |
| `GROQ_API_KEY`, `GROQ_MODEL`                                               | Chatbot; thiếu khóa thì chatbot báo chưa cấu hình.                                                                 |
| `VITE_CHAT_WS_URL` | Tùy chọn ở frontend; chỉ đặt khi URL WebSocket khác URL suy ra từ API. Mặc định dùng `/api/chat/live` trên backend. |

Không cần Gmail/MoMo/Groq để chạy tìm chuyến và thanh toán giả lập. Chat trực tiếp với admin không cần Groq; trả lời AI cần `GROQ_API_KEY`. Thiếu Gmail thì không gửi được mã mật khẩu/biên nhận, nhưng không ngăn xác nhận thanh toán demo. MoMo cần đủ cấu hình trong `.env.example` và IPN mà phía MoMo truy cập được; `localhost` trên máy bạn không phải địa chỉ callback công khai.

Nếu chạy LAN, đổi API URL sang IP máy backend và cập nhật `FRONTEND_URL` đúng origin frontend (gồm giao thức/cổng, không thêm đường dẫn). Khởi động lại backend/Vite sau khi sửa biến tương ứng. Giữ thư mục `backend/uploads/avatars` khi sao lưu/chuyển máy.

## Database đang sử dụng

**Chat trực tiếp cần thêm migration `007_live_chat.sql`. Không chạy setup lên database hiện tại.** Nếu nâng từ bản cũ, sao lưu và đối chiếu các file sau trước khi người quản trị áp dụng:

| Thứ tự | File trong `backend/migrations`            | Tác dụng                                                                                                            |
| ------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| 1      | `001_account_booking_safety.sql`           | Trạng thái đơn, token, mật khẩu, thông tin MoMo và đối soát. Cần đúng một ADMIN; enum phải commit trước phần BEGIN. |
| 2      | `002_demo_flight_schedule.sql`             | Khóa/index chuyến demo.                                                                                             |
| 3      | `003_on_demand_demo_data.sql`              | Sân bay/máy bay/ghế demo; có dọn chuyến demo cũ chưa sử dụng.                                                       |
| 4      | `004_remove_replaced_tables.sql`           | Bỏ hai bảng cũ khi thỏa điều kiện kiểm tra.                                                                         |
| 5      | `005_admin_booking_delete_permissions.sql` | Quyền xóa cho role codex_user; backend vẫn bảo vệ đơn có lịch sử giao dịch.                                         |
| 6      | `006_customer_reviews.sql`                 | Đánh giá theo đơn và dấu đã gửi đánh giá.                                                                           |
| 7      | `007_live_chat.sql`                        | Lưu hội thoại, tin nhắn, trạng thái nhân viên và tin chưa đọc. Chỉ thêm bảng/index, không xóa dữ liệu cũ.           |

Migration tham chiếu role `codex_user`; quản trị database cần đối chiếu role môi trường. Backend không tự migrate. Xem [bàn giao nghiệp vụ](docs/booking-safety-handoff.md), [lịch demo](docs/demo-flight-schedule.md), [đánh giá](docs/customer-reviews.md).

Sau khi sao lưu và xác định migration còn thiếu, chạy từng file theo thứ tự bằng tài khoản sở hữu database. Ví dụ, **chỉ khi database đã có 001–006** và còn thiếu chat, chạy từ thư mục gốc:

```powershell
psql -h 127.0.0.1 -p 5432 -U postgres -d YOUR_EXISTING_DATABASE -v ON_ERROR_STOP=1 -f backend/migrations/007_live_chat.sql
```

Thay tên database/cổng cho đúng môi trường. Với migration 001, không dùng `--single-transaction` hoặc bọc toàn bộ file trong một `BEGIN` khác vì phần thêm enum phải commit trước phần cập nhật bảng. Các migration 003/004 có dọn dữ liệu/bảng cũ theo điều kiện; đọc nội dung trước khi áp dụng, không chạy lại tất cả để thử sửa lỗi.

## Tạo database demo mới từ đầu

Chỉ dùng database **mới, rỗng**, local, tên `airline_booking_demo` hoặc `airline_booking_demo_<hậu_tố_chữ_thường_và_số>`. Script không đọc kết nối `.env`, từ chối database đã có bảng/enum và không xóa dữ liệu cũ. Tài khoản chạy setup cần quyền tạo schema/role, thường là postgres trên máy học tập.

```powershell
createdb -h 127.0.0.1 -p 5432 -U postgres airline_booking_demo
cd backend
$env:SETUP_DATABASE_URL = 'postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/airline_booking_demo'
$env:SETUP_ADMIN_EMAIL = 'admin@example.com'
$env:SETUP_ADMIN_PASSWORD = 'CHOOSE_YOUR_OWN_PASSWORD'
npm run setup:demo
Remove-Item Env:SETUP_DATABASE_URL, Env:SETUP_ADMIN_EMAIL, Env:SETUP_ADMIN_PASSWORD
```

Thay `YOUR_PASSWORD`, `admin@example.com` và `CHOOSE_YOUR_OWN_PASSWORD` bằng thông tin tự chọn; mật khẩu admin từ 8 ký tự, tối đa 72 byte. URL-encode mật khẩu PostgreSQL có ký tự đặc biệt trong URL kết nối. Script dùng `backend/setup/schema.sql`, tạo admin với mật khẩu băm, hãng VN, 11 sân bay và áp dụng migration 001–007. Kết quả có 12 máy bay/240 ghế demo, chưa có đơn/thanh toán. Chuyến phát sinh khi tìm tuyến/ngày. Nếu setup lỗi giữa chừng, tạo database mới; không chạy lại trên database có dữ liệu.

Đăng nhập admin bằng email/mật khẩu đã đặt ở `SETUP_ADMIN_EMAIL`/`SETUP_ADMIN_PASSWORD`; dự án không có mật khẩu admin mặc định. Tạo tài khoản khách qua trang `/register`. Biến `SETUP_*` chỉ dành cho script setup; backend chạy ứng dụng vẫn đọc nhóm `DB_*` từ `.env`.

Chỉ đổi DB_NAME và kết nối trong backend/.env khi chủ động chuyển sang database demo vừa tạo. Không dùng `backend/test/fixtures/schema.sql` cho database ứng dụng: đó là cấu trúc cũ dành riêng kiểm thử.

## Chạy

Terminal backend:

```powershell
cd backend
npm start
```

Terminal frontend:

```powershell
cd frontend
npm run dev
```

Mở http://localhost:5173; API mặc định http://localhost:5000. Có thể dùng `npm run dev` trong backend để tự khởi động lại khi sửa mã.

Kiểm tra nhanh sau khi cả hai tiến trình đã chạy:

```powershell
Invoke-RestMethod http://localhost:5000/api/test
Invoke-RestMethod http://localhost:5000/
Invoke-RestMethod http://localhost:5000/api/flights/catalog
```

Kết quả lần lượt có `API TEST OK`, `Backend + Database OK` và danh mục sân bay/hãng/máy bay/tuyến. Backend kiểm tra schema trước khi lắng nghe cổng; nếu thiếu migration, xử lý database trước rồi khởi động lại.

Để tạo bản frontend build, chạy trong `frontend`:

```powershell
npm run build
npm run preview
```

Build xuất ra `frontend/dist`; URL preview xem trong terminal Vite. Backend và PostgreSQL vẫn phải chạy. Nếu preview dùng origin khác `5173`, cập nhật `FRONTEND_URL` ở backend rồi khởi động lại để tránh lỗi CORS. Khi deploy, cấu hình hosting trả `index.html` cho các URL React Router như `/my-orders`; backend hiện không phục vụ `frontend/dist`.

## Các trang và API chính

### Trang giao diện

| Đường dẫn | Nội dung | Quyền |
| --- | --- | --- |
| `/home` | Trang chủ, tìm chuyến và đánh giá | Công khai |
| `/destinations` | Điểm đến | Công khai |
| `/blog`, `/blog/:slug` | Danh sách và chi tiết blog | Công khai |
| `/flights`, `/flight-list` | Kết quả/danh sách chuyến | Công khai |
| `/login`, `/register` | Đăng nhập, đăng ký | Công khai |
| `/forgot-password`, `/reset-password` | Khôi phục mật khẩu | Công khai |
| `/passenger-info`, `/booking` | Nhập hành khách, chọn ghế/dịch vụ | Đã đăng nhập |
| `/payment`, `/payment-result` | Thanh toán và kiểm tra kết quả | Đã đăng nhập |
| `/profile` | Hồ sơ và đổi mật khẩu | Đã đăng nhập |
| `/my-orders` | Đơn đặt vé, tiếp tục thanh toán | Đã đăng nhập |
| `/my-tickets` | Vé đã mua và đánh giá | Đã đăng nhập |
| `/admin` | Dashboard | ADMIN |
| `/admin/users`, `/admin/flights` | Người dùng, chuyến bay | ADMIN |
| `/admin/bookings`, `/admin/payments` | Đơn và thanh toán/đối soát | ADMIN |
| `/admin/chat` | Chat hỗ trợ trực tiếp | ADMIN |

`/` chuyển khách tới `/home`, admin đã đăng nhập tới `/admin`. `/my-bookings` chuyển sang `/my-orders`. Các bước đặt vé nhận dữ liệu từ bước trước; riêng trang thanh toán hỗ trợ mở lại bằng `?bookingId=<id>`.

### API backend

Base URL local: `http://localhost:5000/api`. API cần đăng nhập dùng header `Authorization: Bearer <token>` nhận sau đăng nhập; frontend tự gắn token. Backend kiểm tra lại quyền, trạng thái khóa và phiên từ database, không chỉ dựa vào việc ẩn trang trên giao diện.

| Nhóm | Endpoint tiêu biểu | Quyền |
| --- | --- | --- |
| Xác thực | `POST /auth/register`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password` | Công khai |
| Danh mục/tìm chuyến | `GET /flights/catalog`, `GET /flights/search?from=HAN&to=SGN&date=YYYY-MM-DD&page=1&page_size=10` | Công khai |
| Sơ đồ ghế | `GET /seats/flight/:flightId` | Đã đăng nhập |
| Đặt chỗ | `POST /bookings/hold-seat`, `POST /bookings` | Đã đăng nhập |
| Đơn/vé của tôi | `GET /bookings/mine`, `/bookings/my-tickets`, `/bookings/:bookingId/checkout` | Chủ đơn |
| Thanh toán | `GET /payments/config`, `POST /payments/momo/create`, `POST /bookings/:bookingId/pay`, `GET /payments/booking/:bookingId/status` | Config công khai; các thao tác đơn yêu cầu chủ đơn |
| Callback MoMo | `POST /payments/momo/ipn` | Không dùng JWT; xác minh chữ ký và dữ liệu giao dịch |
| Hồ sơ | `GET/PUT /users/profile`, `POST /users/profile/avatar` | Đã đăng nhập; upload multipart với trường `avatar` |
| Đổi mật khẩu | `POST /users/password/request-code`, `/users/password/change` | Đã đăng nhập |
| Đánh giá | `GET /reviews`, `GET /reviews/mine`, `POST /reviews/:bookingId`, `DELETE /reviews/:reviewId` | Danh sách công khai; thao tác cá nhân yêu cầu chủ đơn/bài |
| Quản trị người dùng | `GET /users`, `GET /users/:id`, `PUT /users/:id/role`, `PUT /users/:id/toggle-lock`, `DELETE /users/:id` | ADMIN; API quyền chỉ chấp nhận CUSTOMER, có bảo vệ admin |
| Quản trị chuyến | `GET/POST /flights`, `PUT/DELETE /flights/:id`, `PATCH /flights/:id/cancel`, `GET /flights/overview`, `GET /flights/demo/config` | ADMIN |
| Quản trị đơn | `GET /bookings/admin`, `PATCH /bookings/:bookingId/cancel`, `DELETE /bookings/:bookingId` | ADMIN |
| Giao dịch/hoàn tiền | `GET /payments`, `POST /payments/reviews/:reviewId/refund` | ADMIN |
| Chat AI | `POST /chat` | Công khai, cần cấu hình Groq |
| Phiên chat khách | `POST /chat/session`, `/chat/sync`, `/chat/messages`, `/chat/bot`, `/chat/request`, `/chat/cancel` | Tạo phiên công khai; các thao tác còn lại xác minh mã/bí mật phiên chat |
| Chat quản trị | `POST /chat/admin/state`, `/chat/admin/:id`, `/chat/admin/logout` | ADMIN |
| Sự kiện chat | WebSocket `/chat/live` (URL đầy đủ `/api/chat/live`) | Xác thực phiên chat hoặc JWT admin trong thông điệp đầu tiên |

Hai endpoint cũ `POST /flights/demo/preview` và `/flights/demo/generate` trả **410** vì đã bỏ tạo lịch hàng loạt. Lệnh `npm run demo:preview` trong backend chỉ đọc cấu hình tuyến, cần database, không tạo chuyến.

## Chat trực tiếp và thời gian chờ kết nối lại

- Admin vào **Chat hỗ trợ**, bật nút Wi-Fi **Sẵn sàng hỗ trợ** rồi **Tiếp nhận** từng cuộc. Khách có thể yêu cầu gặp nhân viên hoặc hủy yêu cầu. Bot vẫn trả lời trong lúc chờ tiếp nhận.
- Sau khi tiếp nhận, chỉ admin phụ trách được gửi tin; bot tạm dừng riêng cuộc đó. Phản hồi bot đang xử lý cũng bị chặn bằng phiên bản hội thoại.
- Tắt Wi-Fi chỉ ngừng nhận khách mới, các cuộc đã tiếp nhận vẫn tiếp tục đến khi **Kết thúc hỗ trợ**. Lịch sử được giữ sau khi tải lại trang trên cùng trình duyệt.
- **Mốc chờ đã chốt: 60 giây kể từ khi backend phát hiện admin mất kết nối.** Giá trị duy nhất để đổi nằm ở `ADMIN_RECONNECT_GRACE_MS` trong [liveChat.service.js](backend/services/liveChat.service.js), có ghi chú ngay cạnh. Không tạo file cấu hình riêng chỉ cho mốc này.
- Kết nối WebSocket được giữ chung cho phiên đăng nhập, xuyên suốt các mục admin và cả khi admin xem trang khách hàng. Nút Wi-Fi và số tin chưa đọc dùng chung trạng thái, không tạo lại khi đổi mục.
- Backend theo dõi từng tab bằng WebSocket: còn một tab admin kết nối thì vẫn online. Ping/pong mỗi 5 giây do server chủ động gửi, không phụ thuộc bộ đếm JavaScript của tab nền. Đóng tab cuối sẽ bắt đầu chờ kết nối lại; mất mạng được phát hiện qua ping/pong và lease 15 giây. Trong thời gian chờ, khách vẫn gửi tin được và bot tạm dừng. Admin quay lại trong 60 giây sẽ tiếp tục cuộc cũ.
- Đăng xuất khi có mạng sẽ tắt nhận khách, chuyển các cuộc đang hỗ trợ về bot ngay và đóng kết nối của admin trên các tab. Nếu đăng xuất khi mất mạng, backend xử lý như mất kết nối và giữ mốc chờ 60 giây. Đăng nhập lại sau khi đăng xuất cần tự bật Wi-Fi; mỗi lần đăng nhập có mã phiên JWT riêng.
- Quá thời gian chờ, backend tự kết thúc quyền phụ trách, thông báo chuyển về bot và xử lý tin khách chưa được trả lời. Worker kiểm tra mỗi 3 giây; thời gian sinh câu trả lời AI phụ thuộc Groq. Admin quay lại muộn phải **Tiếp nhận** lại. Không cần mở trang khách để worker hoạt động.
- Để cài trên database hiện có, người quản trị áp dụng **chỉ migration 007** nếu 001–006 đã có, rồi khởi động lại backend. Chat trực tiếp không cần Groq; câu trả lời AI cần `GROQ_API_KEY`. Khi AI lỗi, hệ thống báo rõ thay vì bỏ khách chờ mãi.
- Kiểm thử riêng: `npm run test:chat` trong backend với `TEST_DATABASE_URL` trỏ tới database local **mới, rỗng**, tên `airline_booking_test[_hậu_tố]`. Dùng database khác với lượt `npm test` vì mỗi bộ tự dựng schema riêng.

### Chạy local và deploy WebSocket

Local vẫn chỉ cần PostgreSQL, backend và frontend. Thư viện `ws` được cài bằng `npm ci` trong backend; trình duyệt dùng WebSocket có sẵn. Không cần tài khoản hay dịch vụ chat bên ngoài. Tin nhắn vẫn được lưu bằng API; WebSocket báo có cập nhật để giao diện tải dữ liệu mới ngay. Các yêu cầu đọc trạng thái không gia hạn online; chỉ kết nối sống và thao tác chủ động mới làm điều đó.

- Endpoint mặc định: `/api/chat/live`, dùng chung cổng Express. Frontend tự suy ra URL `ws://` hoặc `wss://` từ `VITE_API_URL`. Chỉ đặt `VITE_CHAT_WS_URL` nếu dùng URL WebSocket riêng.
- Deploy frontend HTTPS cần backend HTTPS/WSS. Đặt `FRONTEND_URL` đúng origin frontend; backend kiểm tra origin khi nâng cấp WebSocket. JWT gửi trong thông điệp xác thực đầu tiên, không đưa vào URL/log truy cập. Khách dùng mã phiên chat riêng để xác thực.
- Nếu dùng proxy, phải chuyển tiếp HTTP Upgrade cho `/api/chat/live`. Ví dụ Nginx trong cùng khối `server` với proxy API (thay `backend:5000` theo môi trường):

```nginx
location /api/chat/live {
    proxy_pass http://backend:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 75s;
}
```

Bản này dùng **một tiến trình backend**, lưu hội thoại trong PostgreSQL và theo dõi các socket đang sống trong bộ nhớ. Nếu sau này chạy nhiều replica/process (kể cả PM2 cluster), cần bổ sung chia sẻ presence/sự kiện và phiên chat đã đăng xuất qua Redis hoặc cơ chế tương đương trước khi mở rộng. Chưa cần Redis để chạy local hoặc deploy một backend. Tham khảo [tài liệu chính thức ws](https://github.com/websockets/ws#readme).

## Trình diễn và nghiệm thu

1. Đăng nhập khách, tìm HAN → SGN **ngày mai**, nhập hành khách, chọn ghế/dịch vụ và tạo đơn.
2. Mở **Đơn đặt vé của tôi**, đăng xuất/đăng nhập lại hoặc mở URL thanh toán ở tab khác: tiếp tục thanh toán đúng giá đã lưu, không kéo dài hạn giữ ghế.
3. Dùng **Thanh toán giả lập (Demo)** trên đơn mới chưa mở MoMo; xem vé và gửi đánh giá.
4. Admin chọn **Xem trang khách hàng**, dùng menu tài khoản để về quản trị.
5. Admin hủy đơn đã xác nhận: giữ đơn/giao dịch, giải phóng ghế, mở đối soát. Trong chi tiết đơn hoặc thanh toán, nhập ghi chú/mã xác nhận và ghi nhận hoàn tiền.
6. Với MOCK, dùng mã xử lý nội bộ thử nghiệm, không chuyển tiền thật. Với MOMO, chỉ xác nhận sau khi hoàn khoản tương ứng bên ngoài hệ thống. Hệ thống không tự chuyển tiền hoàn.
7. Dùng hai tài khoản ở hai trình duyệt chọn cùng ghế: chỉ một người giữ được.

MOCK không tính doanh thu MoMo; dashboard có thể bằng 0 khi demo. Đơn có giao dịch PENDING/FAILED/SUCCESS/REFUNDED đều được giữ lịch sử để xử lý callback muộn. Xem chi tiết ở [bản hoàn thiện](docs/report-readiness.md).

## Kiểm thử

Để chạy đầy đủ trên môi trường riêng, từ **thư mục gốc** sau khi đã cài thư viện cho frontend/backend:

```powershell
# Chỉ cần đặt nếu PostgreSQL không nằm ở <thư mục người dùng>/PostgreSQL/bin.
$env:POSTGRES_BIN = 'C:/Program Files/PostgreSQL/18/bin'
node scripts/test-project.cjs
```

Thay `POSTGRES_BIN` theo máy; không đặt dòng mẫu nếu script đã tìm được PostgreSQL. Cần Node.js theo yêu cầu dự án và Chrome/Edge (hoặc biến `CHROME_PATH`). Script tạo cluster PostgreSQL local và ba database mới trong `backend/temp/full-check-...`, chạy test backend/chat/frontend, lint/build, giao diện với fixture, rồi giao diện kết nối **Express + PostgreSQL + WebSocket thật**. Trình duyệt chỉ đổi địa chỉ API/WS sang backend test; không giả tài khoản, kết quả đặt vé hoặc dữ liệu nghiệp vụ trong lượt kết nối thật. Kiểm tra thêm các cổng demo/debug khi backend chạy production.

Script không đọc kết nối database ứng dụng; `.env` không bị sửa. Gmail, MoMo, Groq được tắt ở backend demo riêng để tránh tác động ngoài. Các tiến trình do script tạo sẽ được dừng khi kết thúc; log, JSON kết quả, ảnh chụp và database kiểm thử được giữ trong `backend/temp/` đã ignore. Có thể dùng `--api-only` để chạy lại backend hoặc `--live-only` để chỉ chạy kiểm tra giao diện với backend thật trên database mới (cần có frontend build sẵn).

Xem [báo cáo kiểm thử chức năng đầy đủ](docs/full-functional-test.md) để biết phạm vi đã xác minh và giới hạn dịch vụ ngoài. Các lệnh từng bộ:

```powershell
cd frontend
npm run lint
npm test
npm run build
cd ../backend
npm run test:demo
npm run test:avatar
npm run test:security
```

Trong `frontend`, `npm test` chạy kiểm thử các hàm định dạng, múi giờ, phiên đăng nhập và nhãn dịch vụ, không cần backend/database. Để kiểm tra các luồng giao diện bằng Chrome/Edge headless:

```powershell
cd frontend
npm run test:ui
```

Lệnh này build frontend rồi kiểm tra đăng ký/đăng nhập, khôi phục/đổi mật khẩu, hồ sơ, tìm chuyến, hành khách/dịch vụ, giữ ghế, tiếp tục thanh toán, thanh toán demo, vé/đánh giá, blog/điểm đến, quản trị tài khoản/chuyến/đơn/thanh toán, hoàn tiền, chat và một số bố cục mobile. Cần Chrome hoặc Edge đã cài; có thể đặt `CHROME_PATH` nếu trình duyệt nằm ở đường dẫn khác. Test dùng server local với API/WebSocket giả, chặn truy cập dịch vụ ngoài và không đọc database hay dùng tài khoản/thanh toán thật. Kết quả này kiểm chứng giao diện; các quy tắc nghiệp vụ và WebSocket thực được kiểm tra riêng bằng test backend/PostgreSQL.

Để chạy toàn bộ kiểm thử tích hợp, dùng PostgreSQL local với database **mới, rỗng mỗi lượt**, tên `airline_booking_test[_hậu_tố]`; không dùng database ứng dụng:

```powershell
# Chạy trong backend; thay cổng và mật khẩu theo PostgreSQL kiểm thử của bạn.
createdb -h 127.0.0.1 -p 5432 -U postgres airline_booking_test_example
$env:TEST_DATABASE_URL = 'postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/airline_booking_test_example'
npm test
Remove-Item Env:TEST_DATABASE_URL
```

`npm test` chạy avatar, lịch demo, kiểm thử bảo mật và tích hợp tài khoản/đặt vé/thanh toán/đánh giá; **không bao gồm bộ chat trực tiếp**. Chạy bộ chat riêng với database rỗng khác:

```powershell
# Vẫn trong backend; dùng tên mới cho mỗi lượt chạy.
createdb -h 127.0.0.1 -p 5432 -U postgres airline_booking_test_chat
$env:TEST_DATABASE_URL = 'postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/airline_booking_test_chat'
npm run test:chat
Remove-Item Env:TEST_DATABASE_URL
```

`npm run test:demo`, `npm run test:avatar` và `npm run test:security` không cần database thật. Kiểm thử tích hợp/chat cần PostgreSQL local đang chạy; tài khoản test cần quyền dựng schema và tạo role `codex_user` khi chưa có. Test tự dựng schema/migration/dữ liệu giả và giữ database sau chạy, nên lần sau phải chọn database mới. Email và lệnh tạo giao dịch MoMo được giả lập; callback vẫn kiểm tra chữ ký với khóa thử. Kết quả này không chứng minh Gmail/MoMo thật đã được cấu hình.

## Lỗi thường gặp

| Hiện tượng | Cách xử lý |
| --- | --- |
| `npm` báo không tìm thấy `package.json` | Vào `backend` hoặc `frontend` rồi chạy lệnh tương ứng. |
| `createdb`/`psql` không được nhận diện | Thêm thư mục `bin` PostgreSQL vào PATH hoặc tạo database bằng pgAdmin. |
| Backend báo lỗi kết nối/đăng nhập database | Kiểm tra dịch vụ PostgreSQL, cổng, database và nhóm `DB_*`; sửa `.env` rồi khởi động lại backend. |
| `Database migration required` hoặc thiếu bảng chat/đánh giá | Đối chiếu schema với migration 001–007. Máy mới dùng setup trên database rỗng; database đang dùng chỉ áp dụng migration còn thiếu. |
| Setup báo database không rỗng hoặc tên không hợp lệ | Script chỉ nhận database local mới/rỗng với tên `airline_booking_demo[_suffix]`, hậu tố chỉ có chữ thường/số. Không dùng database đang vận hành. |
| Giao diện gọi API sang cổng 5173 hoặc trả 404 | Đặt `VITE_API_URL=http://localhost:5000/api` rồi khởi động lại Vite; cấu hình Vite hiện không có proxy `/api`. |
| Lỗi CORS hoặc WebSocket không kết nối | Kiểm tra `FRONTEND_URL` khớp origin đang mở; kiểm tra URL API/WS, HTTPS/WSS và HTTP Upgrade nếu có proxy. |
| Tìm chuyến không có kết quả | Chọn ngày mai, tuyến hợp lệ; kiểm tra cờ demo, đủ máy bay/ghế và migration 003. Chuyến quá giờ, hủy, hoãn hoặc hết ghế không được mở bán. |
| Không có nút thanh toán demo | Kiểm tra `DEMO_PAYMENTS_ENABLED=true`, `NODE_ENV` khác `production`, rồi khởi động lại backend. Đơn đang có MoMo PENDING không được xen thanh toán demo. |
| Không thể tiếp tục thanh toán | Ghế có thể đã hết hạn 15 phút hoặc chuyến ngừng bán; tạo đơn mới nếu hết hạn. Mở lại trang không kéo dài thời gian giữ ghế. |
| Không gửi được mã email | Điền `MAIL_USER` và mật khẩu ứng dụng Gmail vào `MAIL_PASS`; mã không được trả về API. |
| AI báo chưa cấu hình | Điền `GROQ_API_KEY`, kiểm tra model rồi khởi động lại backend. Chat với admin vẫn hoạt động độc lập. |
| Dashboard doanh thu bằng 0 sau demo | Giao dịch MOCK bị loại khỏi doanh thu MoMo theo quy tắc hiện tại. |
| Không xóa được đơn/người dùng/chuyến | Dữ liệu có lịch sử được bảo vệ; dùng hủy đơn/chuyến hoặc khóa tài khoản theo trường hợp. |
| API trả 401 sau đổi mật khẩu/khóa tài khoản | Token cũ đã bị thu hồi; đăng nhập lại khi tài khoản còn được phép sử dụng. |

## Phạm vi và tài liệu nghiệp vụ

Phạm vi hiện tại: một chiều, một hành khách/ghế mỗi đơn; quốc tế qua HAN/SGN; lịch demo dùng giờ Việt Nam. Khứ hồi, nhiều hành khách, tồn chỗ hãng thật và hoàn tiền tự động là hướng phát triển.

Chat/presence và giới hạn request hiện phù hợp một tiến trình backend; xem phần WebSocket trước khi mở rộng nhiều process/replica. Các tài liệu trong `docs` có nhật ký và kết quả kiểm thử theo từng thời điểm, không phải số liệu database hiện tại trên mọi máy. Khi tài liệu cũ khác hành vi xóa đơn, ưu tiên mã nguồn hiện tại và `report-readiness.md`.

Các giới hạn bảo vệ đã áp dụng:

- API AI `POST /api/chat`: tối đa 20 yêu cầu/phút/IP; tin nhắn tối đa 4.000 ký tự, lịch sử tối đa 10 tin, tổng đầu vào tối đa 16.000 ký tự. JSON cho nhóm API chat giới hạn 128 KB. Lỗi đầu vào trả 400, vượt hạn mức trả 429 kèm `Retry-After`.
- HTTP chatbot và worker chat dùng chung giới hạn 120 lượt gọi AI/phút và tối đa 4 lượt đồng thời trên mỗi tiến trình; timeout 20 giây, không tự retry. Các giới hạn nằm trong `backend/controllers/chat.controller.js` và `backend/routes/chat.routes.js`. Nếu deploy sau proxy, cấu hình IP tin cậy theo hạ tầng trước khi dùng giới hạn theo IP; không tin trực tiếp header `X-Forwarded-For` từ client.
- Avatar mới được giải mã/tạo lại bằng Sharp; file giả ảnh, hỏng, sai MIME, ảnh động hoặc quá kích thước bị từ chối. File lưu có tên ngẫu nhiên với đuôi `.webp`; ảnh cũ vẫn được giữ cho tới khi người dùng thay ảnh.
- Với `NODE_ENV=production`, phản hồi lỗi không kèm chi tiết exception/database; server vẫn ghi log. Endpoint debug `/api/uploads-test`, `/api/chat/test` trả 404 và endpoint `/` không trả tên database.
- Chạy `npm run test:security` trong backend để kiểm tra các tình huống trên bằng dịch vụ AI/database giả, không cần database thật hay khóa AI thật.

- [An toàn tài khoản, đặt chỗ và thanh toán](docs/booking-safety-handoff.md)
- [Quy tắc lịch demo và tuyến bay](docs/demo-flight-schedule.md)
- [Quản trị đơn đặt vé](docs/admin-booking-management.md)
- [Vé điện tử và đánh giá](docs/customer-reviews.md)
- [Thay đổi trước báo cáo: giữ lịch sử, tiếp tục thanh toán và hoàn tiền](docs/report-readiness.md)
- [Lịch sử dọn bảng database cũ](docs/database-table-cleanup.md)
- [Kết quả gom hàm dùng chung và kiểm tra chức năng](docs/shared-utils-verification.md)
- [Báo cáo kiểm thử chức năng đầy đủ](docs/full-functional-test.md)
