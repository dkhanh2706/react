# Chat Groq và hồ sơ hành khách

Chat dùng `POST /api/chat` với `mode: "assistant"`, lịch sử gần nhất, bản nháp `{from,to,date}` và `awaitingField` (phần đang hỏi khách). Mỗi tin nhắn tự do và tùy chọn nhanh đều gọi Groq; không còn bộ phân loại từ khóa hoặc parser câu tìm chuyến ở FE. Groq trả ý định cùng `updates` chỉ chứa phần khách vừa cung cấp; `null` nghĩa là giữ nguyên. Backend gộp với bản nháp đã xác nhận; chỉ `clearFields` hoặc `newSearch` mới bỏ thông tin cũ. Các hàm chuẩn hóa FE chỉ phục vụ kiểm tra form/thẻ.

Backend lấy danh mục sân bay đang có trong PostgreSQL và ngày Việt Nam để tạo ngữ cảnh cho model. Với GPT-OSS 20B/120B, sử dụng JSON Schema strict theo [Groq Structured Outputs](https://console.groq.com/docs/structured-outputs); model khác dùng JSON object và vẫn phải qua kiểm tra kết quả. Ngân sách yêu cầu đồng thời, giới hạn lượt gọi, timeout và che lỗi nhà cung cấp được dùng chung với bot nền.

Backend kiểm tra lại sân bay, ngày có thật, ngày quá khứ, điểm trùng và quy tắc tuyến quốc tế. Chỉ khi đủ thông tin hợp lệ và ý định là tìm chuyến mới tạo đường dẫn nội bộ `/flights?from=...&to=...&date=...`. Đề xuất du lịch, câu hỏi hỗ trợ và khách còn phân vân không tạo đường dẫn. Model không được cung cấp quyền đặt/hủy vé, thanh toán hoặc URL tùy ý.

Khách bấm **Xem chuyến bay**, chọn chuyến thực tế từ API rồi đến form hành khách. Nếu cần đăng nhập hoặc đăng ký, thông tin chuyến đang chọn đi qua router state và quay lại sau đăng nhập. Đường dẫn tìm chuyến chỉ chứa sân bay/ngày, không chứa hồ sơ hoặc giấy tờ.

Form hành khách lấy hồ sơ tài khoản qua API đã xác thực, điền họ tên, ngày sinh, giới tính, email, điện thoại và liệt kê các mục còn thiếu. Các trường vẫn chỉnh sửa được để đặt cho người khác. Số giấy tờ không tự bịa hoặc suy ra từ tài khoản. Hồ sơ tài khoản không được thêm vào request Groq; nội dung người dùng tự nhập trong chat vẫn là nội dung gửi cho AI.

Kiểm tra:

- `npm --prefix backend run test:ai`: provider/database giả, kiểm tra schema, kiểm tra dữ liệu, đường dẫn nội bộ và lỗi.
- `npm --prefix backend run test:ai:live`: gọi Groq thật bằng ba câu du lịch giả lập, không mở database hoặc đặt vé.
- `npm --prefix frontend run test:ui`: API/model giả, kiểm tra thẻ/link, sửa thông tin, đăng ký/đăng nhập tiếp tục chuyến và điền hồ sơ.
- `node scripts/test-project.cjs`: PostgreSQL/backend riêng trong `backend/temp`, gồm kiểm tra HTTP/WebSocket và hồ sơ thật trong database kiểm thử; các dịch vụ ngoài bị tắt.

Bản nháp và bước đang hỏi được giữ trong state FE và `sessionStorage`, gắn với ID phiên chat. Tải lại trang trong cùng tab sẽ khôi phục chặng/ngày; ngày đã qua bị bỏ để chọn lại. Làm mới/xóa phiên chat hoặc chuyển sang nhân viên sẽ xóa bản nháp. Backend cũ phải khởi động lại để nhận hợp đồng JSON mới.

Khách chỉ cần nhập tên thành phố/sân bay (Tân Sơn Nhất, Nội Bài…) và có thể trả lời “mai”. Prompt cấm hỏi mã IATA; backend dùng câu hỏi có tên dễ hiểu khi cần bổ sung dữ liệu. Kiểm tra Groq thật cho câu ngắn: `node backend/scripts/checkChatAssistant.js --short-answers`; kiểm tra đoạn người dùng báo lỗi và lặp lại điểm đi: thêm `--reported-dialogue` thay cho `--short-answers`. Mỗi lệnh gọi nhiều lượt model, có thể chạm hạn mức nhà cung cấp nếu chạy liên tiếp.
