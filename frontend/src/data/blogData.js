const blogPosts = [
  {
    id: 1,
    slug: "kinh-nghiem-san-ve-may-bay-gia-re",
    title: "Kinh nghiệm săn vé máy bay giá rẻ cho mọi hành trình",
    summary:
      "Một vài mẹo đơn giản giúp bạn chủ động hơn khi tìm kiếm chuyến bay và lựa chọn mức giá phù hợp.",
    category: "Kinh nghiệm",
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1400&q=85",
    createdAt: "10/10/2026",
    featured: true,
    content: [
      {
        type: "paragraph",
        text: "Giá vé máy bay có thể thay đổi theo thời điểm, chặng bay, hãng hàng không và nhu cầu của hành khách. Vì vậy, việc chủ động lên kế hoạch sớm sẽ giúp bạn có nhiều lựa chọn hơn.",
      },
      {
        type: "heading",
        text: "1. Chủ động tìm vé sớm",
      },
      {
        type: "paragraph",
        text: "Nếu đã xác định được lịch trình, bạn nên tìm kiếm chuyến bay sớm thay vì chờ tới sát ngày khởi hành. Điều này giúp bạn dễ so sánh giờ bay và mức giá giữa các lựa chọn khác nhau.",
      },
      {
        type: "heading",
        text: "2. Linh hoạt về thời gian bay",
      },
      {
        type: "paragraph",
        text: "Các chuyến bay vào sáng sớm, tối muộn hoặc những ngày có nhu cầu thấp đôi khi có mức giá dễ tiếp cận hơn.",
      },
      {
        type: "heading",
        text: "3. Kiểm tra kỹ điều kiện vé",
      },
      {
        type: "paragraph",
        text: "Giá thấp chưa chắc luôn là lựa chọn tối ưu. Bạn nên kiểm tra hành lý, điều kiện đổi vé, hoàn vé và các dịch vụ đi kèm trước khi thanh toán.",
      },
    ],
  },

  {
    id: 2,
    slug: "kinh-nghiem-di-may-bay-lan-dau",
    title: "Đi máy bay lần đầu cần chuẩn bị những gì?",
    summary:
      "Từ giấy tờ, thời gian có mặt tại sân bay đến các bước làm thủ tục trước khi lên máy bay.",
    category: "Kinh nghiệm",
    image:
      "https://images.unsplash.com/photo-1529074963764-98f45c47344b?auto=format&fit=crop&w=1400&q=85",
    createdAt: "08/10/2026",
    featured: true,
    content: [
      {
        type: "paragraph",
        text: "Nếu đây là lần đầu bạn di chuyển bằng máy bay, việc chuẩn bị trước các bước cần thiết sẽ giúp hành trình thuận lợi và bớt căng thẳng hơn.",
      },
      {
        type: "heading",
        text: "1. Chuẩn bị giấy tờ",
      },
      {
        type: "paragraph",
        text: "Hãy kiểm tra giấy tờ tùy thân và thông tin trên vé trước khi đến sân bay. Thông tin hành khách cần chính xác và phù hợp với giấy tờ sử dụng khi làm thủ tục.",
      },
      {
        type: "heading",
        text: "2. Đến sân bay sớm",
      },
      {
        type: "paragraph",
        text: "Bạn nên chủ động đến sân bay sớm để có thời gian làm thủ tục, gửi hành lý và kiểm tra an ninh.",
      },
      {
        type: "heading",
        text: "3. Theo dõi thông tin chuyến bay",
      },
      {
        type: "paragraph",
        text: "Sau khi hoàn tất thủ tục, hãy theo dõi bảng thông báo để biết cửa ra máy bay và các thay đổi liên quan tới chuyến bay.",
      },
    ],
  },

  {
    id: 3,
    slug: "hanh-ly-xach-tay-can-luu-y-gi",
    title: "Hành lý xách tay: Những điều hành khách cần lưu ý",
    summary:
      "Chuẩn bị hành lý hợp lý giúp bạn hạn chế các tình huống phát sinh khi làm thủ tục tại sân bay.",
    category: "Hành lý",
    image:
      "https://images.unsplash.com/photo-1553531384-cc64ac80f931?auto=format&fit=crop&w=1400&q=85",
    createdAt: "06/10/2026",
    featured: false,
    content: [
      {
        type: "paragraph",
        text: "Mỗi hãng hàng không có thể áp dụng quy định hành lý khác nhau. Hành khách nên kiểm tra kỹ thông tin trên vé và điều kiện của hãng trước khi khởi hành.",
      },
      {
        type: "heading",
        text: "Kiểm tra kích thước và khối lượng",
      },
      {
        type: "paragraph",
        text: "Hành lý vượt giới hạn có thể phải chuyển sang hành lý ký gửi hoặc phát sinh thêm chi phí.",
      },
      {
        type: "heading",
        text: "Sắp xếp đồ dùng cần thiết",
      },
      {
        type: "paragraph",
        text: "Giấy tờ, thiết bị điện tử và những vật dụng cần dùng trong hành trình nên được bố trí ở vị trí thuận tiện.",
      },
    ],
  },

  {
    id: 4,
    slug: "du-lich-da-nang-tu-tuc",
    title: "Gợi ý hành trình khám phá Đà Nẵng cho chuyến đi ngắn ngày",
    summary:
      "Biển, ẩm thực và nhiều điểm tham quan nổi bật khiến Đà Nẵng phù hợp với những chuyến du lịch ngắn ngày.",
    category: "Điểm đến",
    image:
      "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1400&q=85",
    createdAt: "04/10/2026",
    featured: true,
    content: [
      {
        type: "paragraph",
        text: "Đà Nẵng là điểm đến phù hợp cho cả nghỉ dưỡng, khám phá và những chuyến đi cùng gia đình.",
      },
      {
        type: "heading",
        text: "Ngày đầu tiên",
      },
      {
        type: "paragraph",
        text: "Bạn có thể bắt đầu bằng khu vực trung tâm thành phố, tham quan các cây cầu nổi bật và thưởng thức ẩm thực địa phương.",
      },
      {
        type: "heading",
        text: "Ngày thứ hai",
      },
      {
        type: "paragraph",
        text: "Dành thời gian cho biển hoặc lựa chọn một điểm tham quan ngoài trung tâm tùy theo sở thích.",
      },
    ],
  },

  {
    id: 5,
    slug: "goi-y-du-lich-phu-quoc",
    title: "Phú Quốc có gì hấp dẫn cho kỳ nghỉ của bạn?",
    summary:
      "Gợi ý những trải nghiệm phù hợp cho hành khách đang lên kế hoạch khám phá đảo ngọc.",
    category: "Điểm đến",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85",
    createdAt: "02/10/2026",
    featured: false,
    content: [
      {
        type: "paragraph",
        text: "Phú Quốc phù hợp với những hành khách muốn kết hợp nghỉ dưỡng, vui chơi và khám phá thiên nhiên.",
      },
      {
        type: "heading",
        text: "Lựa chọn thời gian",
      },
      {
        type: "paragraph",
        text: "Bạn nên tham khảo tình hình thời tiết và kế hoạch cá nhân trước khi quyết định thời gian cho chuyến đi.",
      },
      {
        type: "heading",
        text: "Lên lịch trình vừa phải",
      },
      {
        type: "paragraph",
        text: "Không nên cố gắng ghé quá nhiều địa điểm trong một ngày. Một lịch trình thoải mái thường mang lại trải nghiệm tốt hơn.",
      },
    ],
  },

  {
    id: 6,
    slug: "huong-dan-check-in-online",
    title: "Hướng dẫn chuẩn bị trước khi check-in chuyến bay",
    summary:
      "Một số bước bạn nên kiểm tra trước khi tiến hành làm thủ tục chuyến bay.",
    category: "Hướng dẫn",
    image:
      "https://images.unsplash.com/photo-1515569067071-ec3b51335dd0?auto=format&fit=crop&w=1400&q=85",
    createdAt: "30/09/2026",
    featured: false,
    content: [
      {
        type: "paragraph",
        text: "Làm thủ tục trước chuyến bay giúp hành khách chủ động hơn trong hành trình. Tuy nhiên, bạn vẫn cần kiểm tra các điều kiện áp dụng của chuyến bay.",
      },
      {
        type: "heading",
        text: "Chuẩn bị mã đặt chỗ",
      },
      {
        type: "paragraph",
        text: "Hãy chuẩn bị thông tin đặt chỗ và thông tin hành khách để quá trình kiểm tra diễn ra thuận lợi.",
      },
      {
        type: "heading",
        text: "Kiểm tra lại chuyến bay",
      },
      {
        type: "paragraph",
        text: "Trước khi xác nhận, hãy kiểm tra ngày bay, giờ bay, chặng bay và tên hành khách.",
      },
    ],
  },

  {
    id: 7,
    slug: "cach-dat-ve-tren-airline-booking",
    title: "Hướng dẫn đặt vé trên Airline Booking",
    summary:
      "Tìm chuyến bay, lựa chọn ghế và hoàn tất đặt vé chỉ với một vài bước đơn giản.",
    category: "Hướng dẫn",
    image:
      "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=1400&q=85",
    createdAt: "28/09/2026",
    featured: false,
    content: [
      {
        type: "paragraph",
        text: "Airline Booking được xây dựng nhằm giúp người dùng tìm kiếm và đặt chuyến bay theo quy trình đơn giản.",
      },
      {
        type: "heading",
        text: "Bước 1: Tìm chuyến bay",
      },
      {
        type: "paragraph",
        text: "Nhập điểm đi, điểm đến và ngày bay để hệ thống hiển thị danh sách chuyến bay phù hợp.",
      },
      {
        type: "heading",
        text: "Bước 2: Chọn ghế",
      },
      {
        type: "paragraph",
        text: "Sau khi chọn chuyến bay, bạn có thể lựa chọn ghế còn trống trước khi tiếp tục.",
      },
      {
        type: "heading",
        text: "Bước 3: Thanh toán",
      },
      {
        type: "paragraph",
        text: "Kiểm tra lại thông tin booking và tiến hành thanh toán theo phương thức được hệ thống hỗ trợ.",
      },
    ],
  },

  {
    id: 8,
    slug: "chuong-trinh-uu-dai-ve-may-bay",
    title: "Theo dõi ưu đãi để lên kế hoạch cho hành trình tiết kiệm",
    summary:
      "Những lưu ý khi lựa chọn chương trình khuyến mãi và kiểm tra điều kiện vé trước khi đặt.",
    category: "Khuyến mãi",
    image:
      "https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=1400&q=85",
    createdAt: "25/09/2026",
    featured: false,
    content: [
      {
        type: "paragraph",
        text: "Các chương trình ưu đãi có thể là cơ hội tốt để hành khách tiết kiệm chi phí cho chuyến đi.",
      },
      {
        type: "heading",
        text: "Đọc kỹ điều kiện áp dụng",
      },
      {
        type: "paragraph",
        text: "Một số mức giá ưu đãi có thể giới hạn thời gian mua, thời gian bay hoặc điều kiện thay đổi.",
      },
      {
        type: "heading",
        text: "Không chỉ nhìn vào giá",
      },
      {
        type: "paragraph",
        text: "Bạn nên cân nhắc giờ bay, hành lý và các dịch vụ cần thiết trước khi lựa chọn.",
      },
    ],
  },
];

export const blogCategories = [
  "Tất cả",
  "Kinh nghiệm",
  "Điểm đến",
  "Hành lý",
  "Khuyến mãi",
  "Hướng dẫn",
];

export default blogPosts;
