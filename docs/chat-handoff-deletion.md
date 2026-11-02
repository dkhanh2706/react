# Chat tự chuyển nhân viên, làm mới và xóa hội thoại

## Hành vi đã chốt

- Tin nhắn khách đầu tiên tự chuyển hội thoại sang hàng chờ admin. Bot vẫn trả lời trong lúc chờ. Không còn nút “Chat với nhân viên” hoặc “Hủy yêu cầu” ở phía khách.
- Admin chỉ cần **Tiếp nhận** để phụ trách; không phải bật nút trạng thái trực trước. Chỉ admin phụ trách được gửi tin và kết thúc hỗ trợ; bot dừng riêng cuộc này. Hai admin tiếp nhận đồng thời chỉ một người thành công.
- Khi nhân viên kết thúc, bot hỗ trợ tiếp; nếu khách gửi tin mới, cuộc chat lại xuất hiện trong hàng chờ. Cơ chế kết nối lại 60 giây đang có được giữ.
- Khách bấm **Làm mới cuộc trò chuyện**: xác minh bí mật phiên, xóa cuộc cũ và tạo cuộc mới trong cùng transaction. Có thể làm mới khi nhân viên đang hỗ trợ.
- Admin bấm **Xóa**: xóa ngay cuộc đang chọn, gồm cả cuộc đang hỗ trợ hoặc do admin khác phụ trách; không tác động các cuộc khác. Không có xác nhận bổ sung hay chức năng khôi phục/thùng rác.

## Xóa dữ liệu trong ứng dụng

`DELETE FROM chat_conversations WHERE id = ...` xóa bản ghi hội thoại. Khóa ngoại `ON DELETE CASCADE` có sẵn xóa `chat_messages` và `chat_reads` liên quan. Không thêm bảng archive, cột soft-delete, bản sao nội dung hay lịch sử thao tác xóa. Trạng thái trực của nhân viên thuộc `chat_presence` không phải nội dung hội thoại và được giữ.

Sau commit, backend báo WebSocket cho khách của cuộc bị xóa và đóng kết nối phiên cũ. Khách bỏ credentials, tin nhắn và dữ liệu tìm chuyến đang giữ trong giao diện, rồi khởi tạo phiên mới; các tab dùng chung localStorage đồng bộ đổi phiên. Admin bỏ chi tiết cuộc bị xóa và tải lại hộp thư. Phiên cũ không còn truy cập được bằng API.

Tin nhắn chưa xóa vẫn dùng database chat hiện có để hai phía trao đổi và tải lại trang. Sau thao tác xóa/làm mới, nội dung cuộc cũ không còn trong các bảng chat hoặc lịch sử của ứng dụng. Không tự xóa các cuộc hiện có khi cập nhật code.

Các câu trả lời bot dùng phiên bản và ID hội thoại gốc. Tiếp nhận dừng timer/request bot ở phía khách; backend chặn phản hồi cũ. Reset/xóa làm mất hiệu lực phiên cũ, worker đang chờ AI kiểm tra lại trước khi lưu và không tái tạo hội thoại đã xóa. Phản hồi gửi tin đến trễ không được ghi đè ô nhập hay cuộc mới.

## API

| API | Hành vi |
| --- | --- |
| `POST /api/chat/messages` | Lưu tin khách, tự đưa vào waiting nếu chưa active. |
| `POST /api/chat/reset` với `{id, secret}` | Xóa cứng cuộc thuộc phiên đó, trả snapshot và credentials cuộc mới. |
| `POST /api/chat/admin/:id` với `{action: "delete"}` | Chỉ ADMIN; xóa cứng cuộc được chọn, trả `{deleted: true, id}`. |
| `/request`, `/cancel` cũ | Giữ tương thích client cũ; cancel không còn làm ẩn cuộc khỏi hàng chờ tự động. Giao diện mới không gọi hai API này. |

## Giao diện admin

Trang chat dùng tông tím cùng hệ thống quản trị: trạng thái kết nối, số cuộc chờ/đang hỗ trợ/tin chưa đọc, ô tìm mã khách hoặc nội dung, các bộ lọc hộp thư, danh sách xem trước, khung tin nhắn phân biệt khách/bot/nhân viên và nút Tiếp nhận/Kết thúc/Xóa. Chỉ có nút xóa cho cuộc đang mở. Không tự gán tên hoặc thông tin cá nhân không có trong phiên khách.

## Kiểm chứng

- 15/15 kiểm thử chat với PostgreSQL riêng: tự vào hàng chờ khi nhân viên chưa trực, bot trước/sau tiếp nhận, tranh chấp tiếp nhận, mất mạng/kết nối lại, phân quyền, xóa đúng một cuộc, cascade tin/dấu đã đọc, reset xoay credentials và chặn worker trả lời muộn.
- Backend 52/52 và frontend 10/10 kiểm thử hiện có đạt; ESLint và production build đạt. Build còn cảnh báo bundle trên 500 kB.
- Chrome fixture: đạt 65 lần chờ điều kiện, 87 lượt API giả lập; kiểm tra reset, xóa được chọn và bố cục điện thoại, không có exception ứng dụng.
- Chrome với Express/PostgreSQL riêng kiểm tra tự vào hộp thư không qua nút chuyển, bot trả lời trước tiếp nhận/dừng sau tiếp nhận, chat hai phía, reset khi đang có nhân viên, admin xóa cuộc đang hỗ trợ, reset khi bot đang trả lời và bố cục admin desktop/điện thoại.

Không sửa `.env`, schema hay dữ liệu database ứng dụng. Backend/chat/unit được kiểm tra trong lượt `backend/temp/full-check-20261030145141311`; lint và `npm run test:ui` chạy lại sau các chỉnh sửa frontend cuối đều đạt. Ảnh giao diện và kết quả API thật cuối nằm trong `backend/temp/full-check-20261030145542410` (12 nhóm luồng, không có exception trình duyệt, production gates đạt). Các thư mục kiểm thử được Git bỏ qua.
