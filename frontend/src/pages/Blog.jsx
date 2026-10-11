import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";

import blogPosts, { blogCategories } from "../data/blogData";

import "../styles/Blog.css";

function Blog() {
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState("Tất cả");

  const featuredPosts = useMemo(() => {
    return blogPosts.filter((post) => post.featured);
  }, []);

  const filteredPosts = useMemo(() => {
    if (selectedCategory === "Tất cả") {
      return blogPosts;
    }

    return blogPosts.filter((post) => post.category === selectedCategory);
  }, [selectedCategory]);

  const openPost = (slug) => {
    navigate(`/blog/${slug}`);
  };

  return (
    <>
      <Header />

      <main className="blog-page">
        {/* =========================================
            HERO
        ========================================= */}
        <section className="blog-hero">
          <div className="blog-container">
            <div className="blog-hero-content">
              <span className="blog-eyebrow">BLOG DU LỊCH</span>

              <h1>Cảm hứng cho mọi hành trình</h1>

              <p>
                Kinh nghiệm bay, điểm đến, hành lý và những hướng dẫn hữu ích
                giúp bạn chuẩn bị tốt hơn cho mỗi chuyến đi.
              </p>
            </div>
          </div>
        </section>

        <div className="blog-container">
          {/* =========================================
              FEATURED
          ========================================= */}
          {featuredPosts.length > 0 && (
            <section className="featured-section">
              <div className="blog-section-heading">
                <div>
                  <span className="section-kicker">GỢI Ý DÀNH CHO BẠN</span>

                  <h2>Bài viết nổi bật</h2>
                </div>

                <p>Những nội dung đáng chú ý giúp chuyến đi thuận tiện hơn.</p>
              </div>

              <div className="featured-layout">
                {/* BÀI NỔI BẬT CHÍNH */}
                <article
                  className="featured-main"
                  onClick={() => openPost(featuredPosts[0].slug)}
                >
                  <img
                    src={featuredPosts[0].image}
                    alt={featuredPosts[0].title}
                  />

                  <div className="featured-overlay" />

                  <div className="featured-content">
                    <span className="blog-category light">
                      {featuredPosts[0].category}
                    </span>

                    <h3>{featuredPosts[0].title}</h3>

                    <p>{featuredPosts[0].summary}</p>

                    <button type="button" className="featured-read-button">
                      Đọc bài viết
                      <span>→</span>
                    </button>
                  </div>
                </article>

                {/* BÀI NỔI BẬT PHỤ */}
                <div className="featured-side">
                  {featuredPosts.slice(1, 3).map((post) => (
                    <article
                      key={post.id}
                      className="featured-small"
                      onClick={() => openPost(post.slug)}
                    >
                      <div className="featured-small-image">
                        <img src={post.image} alt={post.title} />
                      </div>

                      <div className="featured-small-info">
                        <span className="blog-category">{post.category}</span>

                        <h3>{post.title}</h3>

                        <p>{post.summary}</p>

                        <div className="featured-small-footer">
                          <span>{post.createdAt}</span>

                          <strong>Đọc tiếp →</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* =========================================
              CATEGORY
          ========================================= */}
          <section className="blog-list-section">
            <div className="blog-section-heading list-heading">
              <div>
                <span className="section-kicker">KHÁM PHÁ</span>

                <h2>Bài viết mới</h2>
              </div>
            </div>

            <div className="blog-category-filter">
              {blogCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={
                    selectedCategory === category
                      ? "category-button active"
                      : "category-button"
                  }
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* =========================================
                LIST
            ========================================= */}
            {filteredPosts.length > 0 ? (
              <div className="blog-grid">
                {filteredPosts.map((post) => (
                  <article
                    key={post.id}
                    className="blog-card"
                    onClick={() => openPost(post.slug)}
                  >
                    <div className="blog-card-image">
                      <img src={post.image} alt={post.title} />

                      {post.featured && (
                        <span className="featured-badge">Nổi bật</span>
                      )}
                    </div>

                    <div className="blog-card-body">
                      <div className="blog-card-meta">
                        <span className="blog-category">{post.category}</span>

                        <span className="blog-date">{post.createdAt}</span>
                      </div>

                      <h3>{post.title}</h3>

                      <p>{post.summary}</p>

                      <button
                        type="button"
                        className="blog-read-more"
                        onClick={(event) => {
                          event.stopPropagation();

                          openPost(post.slug);
                        }}
                      >
                        Đọc tiếp
                        <span>→</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="blog-empty">
                <div className="blog-empty-icon">✈</div>

                <h3>Chưa có bài viết</h3>

                <p>Danh mục này hiện chưa có bài viết.</p>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default Blog;
