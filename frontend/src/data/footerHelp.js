export const supportLinks = [
  { id: "booking-guide", label: "Hướng dẫn đặt vé online" },
  { id: "refunds", label: "Chính sách hoàn hủy vé" },
  { id: "baggage", label: "Quy định hành lý" },
  { id: "terms-security", label: "Điều khoản & Bảo mật" },
  { id: "faq", label: "Câu hỏi thường gặp (FAQ)" },
];

export const informationLinks = [
  { id: "terms", label: "Điều khoản dịch vụ" },
  { id: "privacy", label: "Chính sách riêng tư" },
  { id: "partners", label: "Hợp tác đối tác" },
];

export const footerHelpTopics = {
  "booking-guide": {
    title: "Hướng dẫn đặt vé online",
    icon: "booking",
    subtitle: "Từ chọn hành trình đến quản lý vé, cùng bạn đi qua từng bước.",
    steps: [
      {
        title: "Tìm hành trình của bạn",
        text: "Tại Trang chủ, chọn Điểm đi, Điểm đến và Ngày bay, sau đó nhấn Tìm chuyến bay. Điểm đến được hiển thị theo các tuyến đang có. Mỗi đơn hiện áp dụng cho một hành khách trên một chuyến bay một chiều.",
      },
      {
        title: "So sánh và chọn chuyến bay",
        text: "Trong kết quả tìm kiếm, kiểm tra sân bay, ngày bay, giờ khởi hành, giờ đến và giá vé. Chọn chuyến phù hợp để tiếp tục. Nếu chưa có kết quả, hãy thử ngày hoặc tuyến khác.",
      },
      {
        title: "Đăng nhập và nhập thông tin hành khách",
        text: "Đăng nhập tài khoản; nếu chưa có, chọn Đăng ký. Điền đầy đủ họ tên, giới tính, ngày sinh, loại và số giấy tờ, số điện thoại, email. Thông tin có sẵn trong hồ sơ sẽ được điền trước: hãy kiểm tra lại và sửa nếu đặt cho người khác.",
      },
      {
        title: "Chọn hành lý và dịch vụ đi kèm",
        text: "Chọn mức hành lý ký gửi, suất ăn và bảo hiểm nếu cần. Kiểm tra phần tạm tính trước khi tiếp tục sang bước chọn ghế. Các dịch vụ bổ sung được tính vào tổng giá đơn.",
      },
      {
        title: "Chọn ghế và kiểm tra tổng tiền",
        text: "Chọn một ghế còn trống trên sơ đồ. Giá có thể thay đổi theo hạng ghế. Kiểm tra lại chuyến bay, hành khách, ghế, dịch vụ và tổng tiền rồi tiếp tục tới trang thanh toán. Ghế được giữ tạm trong 15 phút; theo dõi thời hạn hiển thị trên đơn.",
      },
      {
        title: "Hoàn tất thanh toán",
        text: "Tại trang thanh toán, chọn phương thức đang được cung cấp. Với MoMo, hoàn tất giao dịch trên trang được chuyển tới rồi quay lại kiểm tra kết quả. Nút Thanh toán Demo ghi nhận đơn đã thanh toán, đặt ghế và cấp vé ngay trong hệ thống, không trừ tiền qua ví hoặc ngân hàng. Không thanh toán lại khi giao dịch trước vẫn đang chờ xác nhận.",
      },
      {
        title: "Xem đơn và vé đã xác nhận",
        text: "Mở Đơn đặt vé của tôi để theo dõi trạng thái hoặc tiếp tục một đơn còn hạn giữ ghế. Sau khi thanh toán thành công, mở Quản lý vé máy bay để xem mã đặt chỗ, thông tin hành khách và hành trình. Nếu cần hỗ trợ, gửi kèm mã đơn hoặc mã đặt chỗ để dễ tra cứu.",
      },
    ],
    note: "Quay lại thanh toán không gia hạn thời gian giữ ghế. Nếu đơn đã hết hạn, hãy tìm lại chuyến và tạo đơn mới.",
  },
  refunds: {
    title: "Chính sách hoàn hủy vé",
    icon: "refunds",
    subtitle: "Kiểm tra trạng thái đơn trước khi yêu cầu thay đổi hoặc xử lý thanh toán.",
    sections: [
      {
        title: "Đơn chưa thanh toán",
        text: "Ghế được giữ tạm trong 15 phút. Khi hết hạn mà chưa thanh toán thành công, lượt giữ ghế sẽ hết hiệu lực. Bạn có thể tạo đơn mới nếu chuyến vẫn còn chỗ; đơn mới áp dụng mức giá tại thời điểm đặt lại.",
      },
      {
        title: "Đơn đã thanh toán",
        text: "Liên hệ bộ phận hỗ trợ, cung cấp mã đơn hoặc mã đặt chỗ, thông tin liên hệ và lý do cần hủy. Việc hủy được người quản trị xử lý trong hệ thống; thao tác này không tự động chuyển tiền hoàn về tài khoản của bạn.",
      },
      {
        title: "Theo dõi khoản cần hoàn hoặc đối soát",
        text: "Đơn đã thu tiền khi bị hủy có thể chuyển sang trạng thái chờ đối soát. Bộ phận phụ trách kiểm tra lịch sử giao dịch, xử lý khoản tiền tương ứng rồi ghi nhận kết quả. Không có cam kết chung về phí hoặc thời hạn hoàn tự động; hãy liên hệ để được xác nhận cho giao dịch cụ thể.",
      },
      {
        title: "Nếu giao dịch bị gián đoạn hoặc bị thu trùng",
        text: "Mở lại Đơn đặt vé của tôi và kiểm tra trạng thái trước khi thử trả tiền lần nữa. Gửi mã giao dịch và ảnh kết quả thanh toán cho bộ phận hỗ trợ nếu trạng thái chưa khớp. Không gửi mật khẩu, mã OTP hoặc thông tin đăng nhập ví.",
      },
    ],
  },
  baggage: {
    title: "Quy định hành lý",
    icon: "baggage",
    subtitle: "Chọn hành lý phù hợp ngay tại bước nhập thông tin hành khách.",
    sections: [
      {
        title: "Hành lý ký gửi trong đơn đặt vé",
        text: "Bạn có thể không thêm hành lý ký gửi hoặc chọn gói 10 kg, 20 kg, 30 kg. Mức phí của từng gói được hiển thị trước khi chọn và cộng vào phần tạm tính. Kiểm tra lại gói đã chọn trong tóm tắt đơn trước khi thanh toán.",
      },
      {
        title: "Hành lý xách tay",
        text: "Lựa chọn Không thêm hành lý ký gửi không có nghĩa là không giới hạn hành lý xách tay. Khối lượng, kích thước, số kiện và vật dụng được mang theo phụ thuộc quy định của hãng và hành trình. Hãy xác nhận trực tiếp với hãng trước chuyến đi; website không áp dụng một định mức xách tay chung cho mọi chuyến.",
      },
      {
        title: "Kiểm tra trước khi xác nhận",
        items: [
          "Chọn đúng số kg cần dùng; kiểm tra tổng tiền sau khi thay đổi gói hành lý.",
          "Đối chiếu hành lý đã chọn trong thông tin đơn và vé của bạn.",
          "Nếu cần thay đổi sau thanh toán, liên hệ hỗ trợ để kiểm tra khả năng xử lý thay vì tạo giao dịch bổ sung không rõ mục đích.",
        ],
      },
    ],
  },
  "terms-security": {
    title: "Điều khoản & Bảo mật",
    icon: "security",
    subtitle: "Sử dụng tài khoản đúng mục đích và giữ an toàn cho thông tin của bạn.",
    sections: [
      {
        title: "Thông tin đặt vé cần chính xác",
        text: "Kiểm tra hành trình, họ tên, giấy tờ và thông tin liên hệ trước khi xác nhận. Không sử dụng thông tin của người khác khi chưa được phép. Theo dõi trạng thái đơn và thời hạn giữ ghế thay vì chỉ dựa vào thông báo trên màn hình thanh toán.",
      },
      {
        title: "Bảo vệ tài khoản",
        items: [
          "Dùng mật khẩu riêng cho tài khoản và không chia sẻ mã xác nhận hoặc mã khôi phục.",
          "Đăng xuất khi dùng xong trên máy dùng chung; không để người khác tiếp tục sử dụng phiên đăng nhập của bạn.",
          "Nếu quên mật khẩu, dùng chức năng Quên mật khẩu và mã được gửi tới email đã đăng ký.",
        ],
      },
      {
        title: "Trao đổi với hỗ trợ",
        text: "Chỉ cung cấp thông tin cần thiết để tra cứu, như mã đơn và mô tả vấn đề. Nhân viên hỗ trợ không cần mật khẩu tài khoản hay OTP thanh toán của bạn. Nội dung trò chuyện có thể được lưu để xử lý yêu cầu; hạn chế gửi thông tin nhạy cảm trong chat.",
      },
    ],
  },
  faq: {
    title: "Câu hỏi thường gặp (FAQ)",
    icon: "faq",
    subtitle: "Một vài giải đáp nhanh để bạn tiếp tục hành trình dễ dàng hơn.",
    questions: [
      {
        title: "Tôi có cần đăng nhập để tìm chuyến bay không?",
        text: "Bạn có thể tìm chuyến và xem điểm đến khi chưa đăng nhập. Khi tiếp tục đặt vé, nhập hành khách, thanh toán hoặc xem đơn của mình, bạn cần đăng nhập tài khoản.",
      },
      {
        title: "Một đơn có thể đặt cho nhiều người hoặc cả khứ hồi không?",
        text: "Hiện mỗi đơn dành cho một hành khách, một ghế và một chuyến một chiều. Nếu đi nhiều người hoặc cần chiều về, hãy tạo các đơn riêng và kiểm tra kỹ từng hành trình.",
      },
      {
        title: "Vì sao tôi không tìm thấy chuyến phù hợp?",
        text: "Kiểm tra lại điểm đi, điểm đến và ngày bay. Chỉ các tuyến đang được hệ thống cung cấp mới xuất hiện; chuyến đã qua giờ, bị hủy hoặc không còn ghế có thể không đặt được. Thử ngày khác hoặc liên hệ hỗ trợ.",
      },
      {
        title: "Tôi đã chọn ghế nhưng chưa trả tiền, có thể quay lại không?",
        text: "Nếu đã tạo đơn và ghế vẫn còn hạn giữ, mở Đơn đặt vé của tôi rồi chọn tiếp tục thanh toán. Thời gian giữ ghế là 15 phút và không bắt đầu lại khi bạn quay về trang thanh toán.",
      },
      {
        title: "MoMo đã trừ tiền nhưng đơn chưa xác nhận thì làm sao?",
        text: "Tải lại trạng thái đơn hoặc kiểm tra tại trang kết quả thanh toán. Không trả tiền lần nữa khi giao dịch còn đang chờ. Liên hệ hỗ trợ kèm mã đơn và mã giao dịch nếu trạng thái vẫn chưa cập nhật.",
      },
      {
        title: "Tôi xem vé và mã đặt chỗ ở đâu?",
        text: "Sau khi thanh toán thành công, mở Quản lý vé máy bay trong menu tài khoản hoặc ở cuối trang. Đơn chờ thanh toán và các trạng thái xử lý khác được theo dõi tại Đơn đặt vé của tôi.",
      },
      {
        title: "Tôi cần liên hệ nhân viên bằng cách nào?",
        text: "Bạn có thể gửi tin nhắn trong khung chat hỗ trợ, gọi 0963176945 hoặc gửi email tới duykhanh1911205@gmail.com. Cung cấp mã đơn và mô tả ngắn gọn để người hỗ trợ kiểm tra đúng trường hợp.",
      },
    ],
  },
  terms: {
    title: "Điều khoản dịch vụ",
    icon: "terms",
    subtitle: "Những thông tin cần kiểm tra khi sử dụng DAMH Shop.",
    sections: [
      {
        title: "Phạm vi chức năng",
        text: "Website hỗ trợ tra cứu chuyến bay, nhập hành khách, chọn dịch vụ, chọn ghế, thanh toán và quản lý đơn trong hệ thống. Mỗi đơn hiện gồm một hành khách trên một chuyến bay một chiều. Các lựa chọn khả dụng được hiển thị tại từng bước đặt vé.",
      },
      {
        title: "Xác nhận giá và dịch vụ",
        text: "Giá có thể thay đổi theo chuyến, hạng ghế và dịch vụ bổ sung. Kiểm tra tổng tiền ở bước thanh toán trước khi xác nhận. Khi tiếp tục một đơn còn hiệu lực, hệ thống sử dụng thông tin và giá đã lưu của đơn đó.",
      },
      {
        title: "Trạng thái đơn và thanh toán",
        text: "Việc chọn ghế hoặc mở cổng thanh toán chưa đồng nghĩa đơn đã thanh toán thành công. Hãy kiểm tra trạng thái đơn và vé sau giao dịch. Nếu đơn hết hạn, chuyến thay đổi hoặc có sai lệch thanh toán, liên hệ hỗ trợ trước khi thao tác lại.",
      },
      {
        title: "Sử dụng có trách nhiệm",
        text: "Cung cấp thông tin chính xác, chỉ truy cập dữ liệu và đơn thuộc quyền của mình, không lạm dụng giữ ghế, không can thiệp hoặc gây gián đoạn hệ thống. Yêu cầu thay đổi và khiếu nại cần kèm thông tin đủ để tra cứu.",
      },
    ],
  },
  privacy: {
    title: "Chính sách riêng tư",
    icon: "privacy",
    subtitle: "Tìm hiểu thông tin được dùng trong quá trình đặt vé và hỗ trợ.",
    sections: [
      {
        title: "Các thông tin bạn cung cấp",
        text: "Tài khoản và đơn đặt vé có thể chứa họ tên, email, số điện thoại, ngày sinh, giới tính, ảnh đại diện và thông tin giấy tờ của hành khách. Hệ thống cũng lưu hành trình, ghế, dịch vụ, trạng thái thanh toán và nội dung trò chuyện phục vụ hỗ trợ.",
      },
      {
        title: "Mục đích sử dụng",
        text: "Các thông tin này được dùng để đăng nhập, quản lý hồ sơ, lập đơn, hiển thị vé, gửi thông báo hoặc mã xác nhận và tra cứu vấn đề khi bạn liên hệ. Khi sử dụng dịch vụ tích hợp như thanh toán, email hoặc chatbot AI, thông tin cần thiết có thể được xử lý qua nhà cung cấp tương ứng.",
      },
      {
        title: "Dữ liệu trên trình duyệt",
        text: "Trình duyệt lưu thông tin phiên đăng nhập và một số trạng thái sử dụng để duy trì trải nghiệm. Hãy đăng xuất trên thiết bị dùng chung và không chia sẻ phiên đăng nhập. Không nhập mật khẩu hoặc OTP ví điện tử vào nội dung trò chuyện.",
      },
      {
        title: "Cập nhật hoặc yêu cầu hỗ trợ dữ liệu",
        text: "Bạn có thể cập nhật các trường được hỗ trợ trong trang Hồ sơ. Nếu cần kiểm tra dữ liệu khác hoặc gửi yêu cầu liên quan đến thông tin cá nhân, liên hệ email hỗ trợ bằng địa chỉ đã đăng ký. Yêu cầu được kiểm tra theo tài khoản và hồ sơ giao dịch liên quan; việc xóa một mục hiển thị không đồng nghĩa mọi lịch sử giao dịch bị xóa.",
      },
    ],
  },
  partners: {
    title: "Hợp tác đối tác",
    icon: "partners",
    subtitle: "Kết nối với DAMH Shop để trao đổi một đề xuất hợp tác cụ thể.",
    sections: [
      {
        title: "Nội dung có thể trao đổi",
        text: "Chúng tôi tiếp nhận đề xuất liên quan đến nội dung du lịch, giới thiệu hành trình, trải nghiệm người dùng và giải pháp kỹ thuật cho hệ thống đặt vé. Các điều kiện và phạm vi hợp tác sẽ được trao đổi trực tiếp cho từng đề xuất.",
      },
      {
        title: "Gửi đề xuất của bạn",
        items: [
          "Giới thiệu tên cá nhân hoặc đơn vị cùng thông tin liên hệ.",
          "Mô tả mục tiêu, phạm vi công việc, kế hoạch và lợi ích dự kiến của đề xuất.",
          "Đính kèm hồ sơ giới thiệu hoặc đường dẫn tham khảo nếu có.",
          "Gửi tới duykhanh1911205@gmail.com với tiêu đề: Đề xuất hợp tác – [Tên cá nhân/đơn vị].",
        ],
      },
      {
        title: "Trao đổi và thống nhất",
        text: "Gửi đề xuất là bước bắt đầu trao đổi, chưa phải xác nhận quan hệ đối tác hay quyền đại diện. Vui lòng thống nhất phạm vi, nội dung công bố và cách sử dụng thương hiệu trước khi triển khai. Có thể gọi 0963176945 nếu cần trao đổi thêm.",
      },
    ],
  },
};
