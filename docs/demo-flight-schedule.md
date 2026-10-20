# Lịch mẫu và chuyến bay theo ngày — bản hiện tại

## Ý tưởng để trình bày khi báo cáo

**Tuyến + ngày bay → chuyến cụ thể. Chuyến + ghế + hành khách → vé.**

Hệ thống có hai khung mẫu trong `backend/config/demoSchedule.js`: nội địa và quốc tế. Từ danh mục sân bay, backend suy ra các tuyến hợp lệ. Khi khách tìm một tuyến/ngày, chế độ demo tạo đúng một chuyến còn thiếu và lưu vào bảng flights. Tìm lại lấy cùng chuyến; ghế quản lý theo flight_id nên cùng ghế ở hai ngày khác nhau không chiếm chỗ của nhau.

Không có bảng lịch mẫu mới, không tạo sẵn lịch 365 ngày và không nhân bản ghế cho từng chuyến. Máy bay giữ danh mục ghế, còn booking_details ghi việc giữ/đặt ghế trên từng chuyến. Admin nhìn thấy và quản lý chính các chuyến được khách tìm/đặt.

## Quy tắc đã được chủ dự án chốt

- 8 sân bay Việt Nam: SGN, HAN, DAD, PQC, CXR, DLI, HUI, VCA. Mọi cặp khác nhau theo từng chiều đều được phép: **56 tuyến nội địa**.
- 3 sân bay nước ngoài: NRT, HND, SIN. Đi/về Việt Nam chỉ qua HAN hoặc SGN: **12 tuyến quốc tế**.
- Tổng cộng **68 tuyến**, suy ra trong code từ trường country của sân bay. Không khai thác tuyến giữa hai sân bay nước ngoài, hoặc quốc tế qua sân bay Việt Nam khác HAN/SGN. Đây là quy tắc của đồ án.
- Chuyến demo mới: nội địa **2 giờ, 1.500.000đ** giá phổ thông; quốc tế **8 giờ, 5.500.000đ**. BUSINESS ×1,5, FIRST ×2; dịch vụ tính riêng. Các chuyến cũ giữ giá và lịch cũ.
- 12 máy bay demo của hãng VN, model `DEMO-A320-01` đến `DEMO-A320-12`, mỗi chiếc **20 ghế: 16 ECONOMY, 3 BUSINESS, 1 FIRST**. Không chiếm lịch của 4 máy bay gốc.

## Luồng đơn giản

1. API catalog trả sân bay và tuyến hợp lệ. Giao diện lọc điểm đến theo điểm đi; chọn NRT làm điểm đi thì chỉ chọn đến HAN hoặc SGN.
2. Backend kiểm tra ngày, tuyến và chế độ demo. Trong giao dịch dùng chung khóa với booking/admin, kiểm tra chuyến đã tồn tại theo ngày/tuyến hoặc demo_key. Nếu có thì dùng lại, kể cả chuyến bị hủy, đổi lịch hoặc hết ghế; không tự hồi sinh chuyến.
3. Nếu chưa có, tính lịch một ngày trong bộ nhớ rồi chỉ lưu chuyến khách đang tìm. Khóa demo `ngày:id_đi:id_đến` và unique index chống tạo trùng khi giao diện gọi nhiều lần hoặc hai khách tìm cùng lúc.
4. Sau đó tìm kiếm chỉ trả chuyến AVAILABLE, chưa khởi hành, giá hợp lệ và còn ghế. Giữ ghế, lập đơn và thanh toán dùng flight_id thực trong database như trước.

Mỗi lần tính lịch dùng cùng thứ tự tuyến và máy bay, nội địa trước quốc tế. Giờ bắt đầu từ 06:00, có thể hạ cánh ngày sau, chừa 30 phút giữa các chuyến cùng máy bay. Kiểm thử đủ 68 tuyến trong thứ tự tìm đảo ngược và nhiều ngày liên tiếp đã đạt. Giữ nguyên lịch đã lưu, không điều chuyển vé cũ để nhường cho lượt tìm mới.

**Hôm nay đã qua giờ bay của tuyến mẫu thì không tạo một chuyến trong quá khứ.** Khi trình diễn, chọn từ ngày mai để thử đủ các tuyến. Chuyến bị hủy, hoãn, hết ghế cũng ngừng bán. Nếu admin thay đổi lịch khiến không đủ máy bay, hệ thống báo chưa bố trí được, không bỏ kiểm tra trùng lịch. Chưa mô phỏng phi hành đoàn/điều chuyển máy bay; giờ quốc tế vẫn được hiểu theo múi giờ Việt Nam của đồ án.

## Những gì đã thực hiện trên database thật ngày 20/10/2026

Đã thao tác qua PostgreSQL MCP, profile `localdb`, database `airline_booking`, theo xác nhận của chủ dự án. **Không xóa bảng hoặc thêm cấu trúc mới trong đợt chuyển đổi này.**

| Thay đổi | Số dòng |
| --- | ---: |
| Điền country còn NULL cho HND, SIN, PQC, CXR, DLI, HUI, VCA | UPDATE 7 airports |
| Xóa chuyến demo cũ của đợt tạo hàng loạt, chưa có bất kỳ liên kết đặt vé | DELETE 4.015 flights |
| Thêm máy bay demo VN | INSERT 12 airplanes |
| Thêm ghế thuộc các máy bay mới | INSERT 240 seats |
| Tìm thử 4 cặp tuyến/ngày để kiểm tra bằng API thật | INSERT 4 flights |

Script đã thực hiện: `backend/migrations/003_on_demand_demo_data.sql`. Đây là data setup, dùng cột/index từ migration 002 đã có. Cả khối thực hiện trong một giao dịch, có advisory lock và khóa bảng flights khi dọn lịch. Script hỗ trợ chạy lại: không tạo thêm máy bay/ghế, không xóa các chuyến mới có tiền tố DT.

Chỉ xóa dòng có demo_key, tiền tố mã `DM` đúng định dạng đợt cũ, đồng thời không có booking_details, booking_temp, tickets hoặc booking tham chiếu qua flight_number_snapshot. Các liên kết được bảo vệ kể cả khi đơn đã hủy/hết hạn. Không thay đổi bảng bookings/payments để dọn dữ liệu.

Sau chuyển đổi và thử API:

- **118 flights** = 114 chuyến gốc + 4 chuyến mới cần dùng. Không còn 4.015 chuyến demo tạo trước.
- **16 airplanes, 420 seats** = 4/180 ban đầu + 12/240 mới.
- **55 bookings, 12 payments** giữ nguyên.
- 114 chuyến gốc giữ nguyên toàn bộ trường; fingerprint trước/sau: `0d5bf911163951624dafb2b83b3bf585`.
- Không còn sân bay thiếu country; không có trùng lịch liên quan đến 4 chuyến demo mới.

4 chuyến thử là VCA → CXR ngày 21 và 22/10/2026, NRT → HAN ngày 21/10, SGN → SIN ngày 21/10. Tìm lặp vẫn cùng id. NRT → VCA và DAD → NRT trả danh sách rỗng, không tạo chuyến.

## Sử dụng

Giữ `DEMO_FLIGHTS_ENABLED=true` trong backend/.env và NODE_ENV khác production. Production hoặc tắt cờ: không tạo chuyến khi tìm kiếm; chỉ đọc những chuyến đã có, vẫn áp dụng quy tắc tuyến và ghế.

Khởi động lại backend rồi tải lại frontend để nhận code mới. Không cần tự chạy thêm SQL cho database localdb hiện tại: setup 003 đã chạy xong. Màn hình admin chỉ giải thích khung mẫu và liệt kê các chuyến phát sinh; nút tạo cả năm đã bỏ. Endpoint tạo hàng loạt cũ trả 410 để tránh dùng nhầm giao diện còn cache.

Ví dụ trình diễn:

1. Tìm VCA → CXR ngày mai: có chuyến nội địa.
2. Tìm NRT → HAN ngày mai: có chuyến quốc tế chiều về.
3. Chọn NRT làm điểm đi: giao diện chỉ cho đến HAN/SGN; API trực tiếp NRT → VCA không tạo chuyến.
4. Tìm cùng tuyến/ngày hai lần: không tăng số chuyến. Chọn thêm một ngày khác: tạo một flight_id khác, ghế độc lập.
5. Đặt vé trên chuyến đó và mở admin để đối chiếu mã chuyến, ghế, đơn và thanh toán.

### Thanh toán khi MoMo chưa duyệt

`backend/.env` đã bật `DEMO_PAYMENTS_ENABLED=true`. Khởi động lại backend để nhận cờ. Ở bước thanh toán cuối, chọn nút xanh **Thanh toán giả lập (Demo)** ngay trên nút MoMo. Backend kiểm tra đơn/ghế còn hợp lệ, lưu payments với method MOCK, status SUCCESS, xác nhận booking và ghế, rồi giao diện mở trang **Thanh toán giả lập thành công**. Bấm Vé của tôi để xem vé. Không cần quét mã hoặc chuyển tiền; MOCK không tính vào doanh thu thật.

Nút chỉ hiện khi backend cho phép demo; production luôn chặn. Bấm lặp không tạo thêm giao dịch. Nếu đơn hết hạn, chuyến ngừng bán hoặc đang có giao dịch MoMo PENDING thì không giả lập thành công: với bài báo cáo hãy dùng nút demo ngay trên một đơn mới, trước khi mở MoMo. Không thay cấu trúc database và không thanh toán hộ đơn thật trong bước cấu hình này.

Lệnh chỉ đọc để xem khung mẫu và danh sách tuyến: `npm run demo:preview` trong backend. Không cần nhập khoảng 365 ngày nữa.

## Kiểm thử

26 bài gồm 5 bài lịch/quy tắc và 21 bài tích hợp, chạy trên database tạm riêng. Bao gồm giữ toàn bộ kiểm tra tài khoản/booking/payment trước đây; thêm kiểm tra cleanup giữ booking và snapshot, setup chạy lặp, 68 tuyến, tìm đồng thời, hai ngày cùng ghế, đặt và thanh toán trên chuyến phát sinh, giữ trạng thái hủy/đổi lịch/hết ghế, chặn tạo trong production.

Frontend lint/build và kiểm tra cú pháp backend cũng được chạy. Không tạo booking/thanh toán thật hoặc gọi Gmail/MoMo thật trong đợt smoke test dữ liệu localdb.

Lịch 4.015 chuyến tạo trước là phương án cũ đã được chủ dự án đồng ý thay thế; migration 002 vẫn giữ để dùng demo_key và index. Không chạy fixture `backend/test/fixtures/schema.sql` trên database thật.
