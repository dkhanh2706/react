import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Calendar,
  Clock,
  ArrowRight,
  Plane,
  X,
  Compass,
  Sparkles,
  Flame,
  LayoutGrid,
} from "lucide-react";

import Header from "../components/Header";
import Footer from "../components/Footer";

import blogPosts, { blogCategories } from "../data/blogData";

import "../styles/Blog.css";

function Blog() {
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Đếm bài viết theo danh mục
  const categoryCounts = useMemo(() => {
    const counts = { "Tất cả": blogPosts.length };
    blogCategories.forEach((cat) => {
      if (cat !== "Tất cả") {
        counts[cat] = blogPosts.filter((p) => p.category === cat).length;
      }
    });
    return counts;
  }, []);

  // Bài viết nổi bật
  const featuredPosts = useMemo(() => {
    return blogPosts.filter((post) => post.featured);
  }, []);

  // Lọc và sắp xếp
  const filteredPosts = useMemo(() => {
    let posts = blogPosts;

    if (selectedCategory !== "Tất cả") {
      posts = posts.filter((post) => post.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      posts = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(q) ||
          post.summary.toLowerCase().includes(q) ||
          post.category.toLowerCase().includes(q)
      );
    }

    return [...posts].sort((a, b) => {
      if (sortBy === "oldest") {
        return a.id - b.id;
      }
      return b.id - a.id;
    });
  }, [selectedCategory, searchQuery, sortBy]);

  const openPost = (slug) => {
    navigate(`/blog/${slug}`);
  };

  const handleQuickTagClick = (tag) => {
    setSearchQuery(tag);
  };

  const isBrowsingAll = selectedCategory === "Tất cả" && !searchQuery.trim();

  return (
    <div className="blog-wrapper">
      <Header />

      <main className="blog-page">
        {/* ========================================================
            KHỐI 1: HERO SECTION - BỐ CỤC 2 CỘT HIỆN ĐẠI & SANG TRỌNG
        ======================================================== */}
        <section className="blog-hero-section">
          <div className="blog-container">
            <div className="blog-hero-grid">
              {/* CỘT TRÁI: TIÊU ĐỀ & TÌM KIẾM */}
              <div className="blog-hero-left">
                <div className="hero-eyebrow-pill">
                  <Sparkles size={14} className="pill-icon" />
                  <span>CẨM NANG BAY & DU LỊCH DAMH SHOP</span>
                </div>

                <h1 className="hero-main-title">
                  Cẩm nang du lịch & <br />
                  <span className="hero-highlight-text">Bí quyết săn vé thông minh</span>
                </h1>

                <p className="hero-lead-text">
                  Tổng hợp kinh nghiệm săn vé máy bay giá rẻ, hướng dẫn thủ tục bay,
                  mẹo hành lý và gợi ý điểm đến hữu ích cho mọi hành trình của bạn.
                </p>

                {/* THANH TÌM KIẾM CHUYÊN NGHIỆP */}
                <div className="hero-search-wrapper">
                  <div className="hero-search-input-box">
                    <Search size={18} className="search-box-icon" />
                    <input
                      type="text"
                      placeholder="Tìm bài viết, điểm đến, kinh nghiệm bay..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="search-clear-btn"
                        onClick={() => setSearchQuery("")}
                        aria-label="Xóa tìm kiếm"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                  <button type="button" className="hero-search-btn">
                    Tìm kiếm
                  </button>
                </div>

                {/* TỪ KHÓA GỢI Ý NHANH */}
                <div className="hero-suggest-tags">
                  <span className="suggest-title">Từ khóa gợi ý:</span>
                  <div className="suggest-tag-list">
                    {["Săn vé rẻ", "Lần đầu đi máy bay", "Quy định hành lý", "Đà Nẵng"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="suggest-chip"
                        onClick={() => handleQuickTagClick(tag)}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI: BÀI NỔI BẬT HOT NHẤT (HERO SHOWCASE) */}
              {featuredPosts.length > 0 && (
                <div className="blog-hero-right">
                  <div
                    className="hero-spotlight-card"
                    onClick={() => openPost(featuredPosts[0].slug)}
                  >
                    <div className="spotlight-image-wrap">
                      <img
                        src={featuredPosts[0].image}
                        alt={featuredPosts[0].title}
                      />
                      <span className="spotlight-tag">
                        <Flame size={13} /> Nổi bật nhất
                      </span>
                    </div>

                    <div className="spotlight-card-body">
                      <div className="spotlight-meta">
                        <span className="spotlight-category">
                          {featuredPosts[0].category}
                        </span>
                        <span className="spotlight-time">
                          <Clock size={12} /> 4 phút đọc
                        </span>
                      </div>

                      <h3 className="spotlight-title">
                        {featuredPosts[0].title}
                      </h3>

                      <p className="spotlight-summary">
                        {featuredPosts[0].summary}
                      </p>

                      <div className="spotlight-cta">
                        <span>Đọc ngay bài viết</span>
                        <ArrowRight size={15} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="blog-container">
          {/* ========================================================
              KHỐI 2: BÀI VIẾT ĐÁNG CHÚ Ý (FEATURED POSTS)
              (Hiển thị khi duyệt "Tất cả" & không gõ tìm kiếm)
          ======================================================== */}
          {isBrowsingAll && featuredPosts.length > 1 && (
            <section className="featured-block">
              <div className="block-title-row">
                <div className="block-title-left">
                  <span className="block-tag">
                    <Compass size={14} /> GỢI Ý ĐẶC BIỆT
                  </span>
                  <h2 className="block-heading">Bài viết đáng chú ý</h2>
                </div>
                <p className="block-desc">
                  Những nội dung hữu ích giúp chuyến bay của bạn thuận lợi hơn
                </p>
              </div>

              <div className="featured-cards-grid">
                {featuredPosts.slice(1, 4).map((post) => (
                  <article
                    key={post.id}
                    className="featured-sub-card"
                    onClick={() => openPost(post.slug)}
                  >
                    <div className="featured-sub-img">
                      <img src={post.image} alt={post.title} />
                      <span className="featured-sub-badge">{post.category}</span>
                    </div>

                    <div className="featured-sub-body">
                      <div className="featured-sub-meta">
                        <span><Calendar size={12} /> {post.createdAt}</span>
                        <span>•</span>
                        <span><Clock size={12} /> 3 phút đọc</span>
                      </div>

                      <h3 className="featured-sub-title">{post.title}</h3>

                      <p className="featured-sub-desc">{post.summary}</p>

                      <div className="featured-sub-footer">
                        <span className="featured-sub-link">
                          Đọc tiếp <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* ========================================================
              KHỐI 3: DANH SÁCH BÀI VIẾT & BỘ LỌC CHUYÊN MỤC
          ======================================================== */}
          <section className="articles-explorer-block">
            {/* THANH TIÊU ĐỀ & SẮP XẾP */}
            <div className="explorer-header-bar">
              <div className="explorer-header-left">
                <span className="block-tag">
                  <LayoutGrid size={14} /> KHÁM PHÁ CHỦ ĐỀ
                </span>
                <h2 className="block-heading">
                  {searchQuery
                    ? `Kết quả cho "${searchQuery}"`
                    : selectedCategory === "Tất cả"
                    ? "Tất cả bài viết"
                    : `Chuyên mục: ${selectedCategory}`}
                  <span className="count-pill">({filteredPosts.length})</span>
                </h2>
              </div>

              <div className="explorer-header-right">
                <span className="sort-title">Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-dropdown"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                </select>
              </div>
            </div>

            {/* THANH TAB DANH MỤC */}
            <div className="category-pills-bar">
              {blogCategories.map((cat) => {
                const count = categoryCounts[cat] || 0;
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`category-pill-btn ${isActive ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <span className="pill-name">{cat}</span>
                    <span className="pill-badge">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* LƯỚI BÀI VIẾT */}
            {filteredPosts.length > 0 ? (
              <div className="articles-grid">
                {filteredPosts.map((post) => (
                  <article
                    key={post.id}
                    className="article-card"
                    onClick={() => openPost(post.slug)}
                  >
                    <div className="article-card-thumb">
                      <img src={post.image} alt={post.title} loading="lazy" />
                      <span className="article-category-tag">{post.category}</span>
                      {post.featured && (
                        <span className="article-featured-tag">Nổi bật</span>
                      )}
                    </div>

                    <div className="article-card-body">
                      <div className="article-meta-info">
                        <span className="meta-time">
                          <Calendar size={13} /> {post.createdAt}
                        </span>
                        <span className="meta-divider">•</span>
                        <span className="meta-time">
                          <Clock size={13} /> 3-5 phút đọc
                        </span>
                      </div>

                      <h3 className="article-card-title">{post.title}</h3>

                      <p className="article-card-summary">{post.summary}</p>

                      <div className="article-card-footer">
                        <div className="article-author">
                          <span className="author-circle">✈</span>
                          <span className="author-label">DAMH Shop</span>
                        </div>

                        <span className="article-read-btn">
                          Đọc bài viết <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-search-panel">
                <div className="empty-icon-circle">
                  <Search size={28} />
                </div>
                <h3>Không tìm thấy bài viết nào</h3>
                <p>
                  Không có nội dung nào khớp với từ khóa "
                  <strong>{searchQuery}</strong>" trong danh mục{" "}
                  <strong>{selectedCategory}</strong>.
                </p>
                <button
                  type="button"
                  className="empty-reset-btn"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("Tất cả");
                  }}
                >
                  Xem lại tất cả bài viết
                </button>
              </div>
            )}
          </section>

          {/* ========================================================
              KHỐI 4: BANNER ĐẶT VÉ HÀNH TRÌNH CUỐI TRANG
          ======================================================== */}
          <section className="blog-cta-banner">
            <div className="cta-banner-content">
              <div className="cta-banner-left">
                <div className="cta-icon-box">
                  <Plane size={28} />
                </div>
                <div className="cta-text-box">
                  <h3>Sẵn sàng cho chuyến bay tiếp theo?</h3>
                  <p>
                    Tìm kiếm chuyến bay giá rẻ, so sánh giá các hãng hàng không và đặt vé tiện lợi tại DAMH Shop.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="cta-book-btn"
                onClick={() => navigate("/home")}
              >
                Tìm vé máy bay ngay
                <ArrowRight size={16} />
              </button>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Blog;
