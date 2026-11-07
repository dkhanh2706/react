# Deploy frontend lên Vercel và backend lên Render

Cấu hình đã được chuẩn bị trong repository; chưa tạo dịch vụ hoặc deploy lên tài khoản hosting.

## 1. Database

Dùng PostgreSQL cloud đã có schema/dữ liệu ứng dụng (Neon hoặc Render Postgres). Có thể backup database local rồi restore vào database cloud mới bằng pgAdmin. Database rỗng sẽ khiến backend dừng với lỗi migration; quá trình deploy không tự tạo bảng hoặc sửa dữ liệu.

Script `setup:demo` chỉ dùng cho database local mới theo mục 3 trong README. Với database cũ, sao lưu và kiểm tra các migration 001–008 trước khi chuyển. Giữ chuỗi kết nối và mật khẩu trong biến môi trường của Render.

## 2. Frontend: Vercel

Import repository GitHub và chọn:

| Thiết lập | Giá trị |
| --- | --- |
| Root Directory | `frontend` |
| Framework | `Vite` |
| Node.js | `22.x`, tối thiểu `22.19` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

File `frontend/vercel.json` đã khai báo install/build/output và rewrite React Router để refresh trang con. Tạo project để lấy domain production, sau đó đặt biến ở môi trường Production:

```dotenv
VITE_API_URL=https://YOUR_BACKEND.onrender.com/api
```

Thay URL bằng backend Render thật, giữ hậu tố `/api`, không thêm dấu `/` cuối. Vite nhúng biến lúc build nên phải redeploy sau khi thay biến. Không đưa JWT secret, mật khẩu database hoặc khóa dịch vụ vào biến `VITE_*`. Chat tự suy ra URL `wss` từ API; ảnh cũng lấy từ origin backend.

## 3. Backend: Render

Cách nhanh: **New → Blueprint**, kết nối repository và chọn `render.yaml` ở thư mục gốc. Blueprint khai báo một Web Service Free; không tự tạo database hoặc mua disk. Render yêu cầu nhập `DATABASE_URL`, `FRONTEND_URL` và tự sinh `JWT_SECRET`.

Hoặc tạo **New → Web Service** với:

| Thiết lập | Giá trị |
| --- | --- |
| Root Directory | `backend` |
| Runtime | `Node` |
| Node version | `22.19.0` |
| Build Command | `npm ci --omit=dev` |
| Start Command | `npm start` |
| Health Check Path | `/` |

Đặt các biến môi trường:

```dotenv
NODE_ENV=production
NODE_VERSION=22.19.0
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
DB_SSL=true
JWT_SECRET=YOUR_LONG_RANDOM_SECRET
FRONTEND_URL=https://YOUR_FRONTEND.vercel.app
DEMO_FLIGHTS_ENABLED=false
DEMO_PAYMENTS_ENABLED=false
```

`DATABASE_URL` được ưu tiên hơn các biến kết nối `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD`. `DB_SSL=true` bật TLS và xác minh chứng chỉ cho endpoint public như Neon. Với Internal Database URL của Render trong cùng region, đặt `DB_SSL=false`. `DB_SSL` nếu được đặt sẽ ghi đè các tham số SSL trong URL. Không đặt `PORT` thủ công; Render cung cấp cổng và backend nghe `0.0.0.0` trong production.

`FRONTEND_URL` là origin chính xác, không kèm đường dẫn. Nếu dùng thêm custom domain hoặc preview, đặt `CORS_ORIGINS` là danh sách origin cụ thể cách nhau bằng dấu phẩy. Cùng danh sách áp dụng cho HTTP và WebSocket; không bật wildcard cho mọi domain Vercel.

## 4. Kết nối và kiểm tra

1. Mở `https://YOUR_BACKEND.onrender.com/`; phải trả về `Backend + Database OK`. Health check kiểm tra kết nối database; server cũng kiểm tra schema bắt buộc khi khởi động.
2. Đặt `VITE_API_URL` trên Vercel bằng URL Render thật cộng `/api`, rồi redeploy frontend.
3. Đặt `FRONTEND_URL` trên Render bằng domain Vercel thật, rồi redeploy backend.
4. Thử đăng nhập, refresh trực tiếp trang `/login`, xem avatar và kiểm tra chat WebSocket. Thêm đúng preview origin vào `CORS_ORIGINS` nếu cần.

## 5. Chức năng cần cấu hình thêm

- **Chuyến bay/thanh toán:** production chặn tự tạo chuyến demo và thanh toán MOCK. Cần chuẩn bị chuyến có ngày tương lai trong database và cấu hình thanh toán phù hợp. Bật `DEMO_*` không bỏ được chặn production.
- **Email:** backend dùng Gmail SMTP với `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM_NAME`. Render Free chặn các cổng SMTP 25/465/587; OTP và email vé cần hosting hỗ trợ SMTP hoặc bổ sung dịch vụ email qua HTTPS API.
- **Ảnh:** Render Free dùng filesystem tạm, ảnh upload có thể mất khi restart/deploy. Với service trả phí có persistent disk, mount tại `/var/data`, đặt `UPLOAD_DIR=/var/data/uploads`. Backend dùng cùng đường dẫn cho ghi, phục vụ và xóa ảnh. Sao lưu/chuyển cả ảnh cũ khi đổi nơi lưu.
- **MoMo:** đặt `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `MOMO_ENDPOINT` ở Render; `MOMO_REDIRECT_URL=https://YOUR_FRONTEND.vercel.app/payment-result` và `MOMO_IPN_URL=https://YOUR_BACKEND.onrender.com/api/payments/momo/ipn`. Kiểm tra đúng môi trường MoMo trước giao dịch.
- **AI:** đặt `GROQ_API_KEY`, `GROQ_MODEL` ở Render nếu dùng trợ lý AI.
- **Proxy/IP:** `TRUST_PROXY` nhận số proxy hop hoặc danh sách CIDR tin cậy; mặc định production tắt. Xác minh chuỗi proxy thực tế trước khi đặt để giới hạn request nhận đúng IP người dùng, tránh tin header giả từ client.

Tham khảo: [Vite trên Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Render Blueprint](https://render.com/docs/blueprint-spec), [Render Web Service](https://render.com/docs/web-services), [giới hạn Render Free](https://render.com/docs/free), [persistent disk](https://render.com/docs/disks), [Express proxy](https://expressjs.com/en/guide/behind-proxies/).

## 6. Test và docs trên máy

Các thư mục `test/`, `tests/` ở mọi cấp và `docs/` ở thư mục gốc đã được `.gitignore` bỏ qua. Lệnh `git rm --cached` bỏ theo dõi các file đó nhưng vẫn giữ bản trên máy. Bản clone mới từ GitHub không có test/docs nên các lệnh test trong README chỉ dùng được trên máy còn các thư mục này. Các npm script test được giữ để kiểm tra local; deploy không gọi chúng. Thay đổi chỉ xóa khỏi phiên bản hiện tại của repository, không xóa lịch sử commit cũ.
