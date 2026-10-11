import { useMemo } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";

import blogPosts from "../data/blogData";

import "../styles/BlogDetail.css";

function BlogDetail() {
  const { slug } = useParams();

  const navigate = useNavigate();

  const post = useMemo(() => {
    return blogPosts.find((item) => item.slug === slug);
  }, [slug]);

  const relatedPosts = useMemo(() => {
    if (!post) {
      return [];
    }

    return blogPosts
      .filter((item) => item.category === post.category && item.id !== post.id)
      .slice(0, 3);
  }, [post]);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <>
      <Header />

      <main className="blog-detail-page">
        <div className="blog-detail-container">
          {/* =========================================
              BREADCRUMB
          ========================================= */}
          <div className="blog-breadcrumb">
            <button type="button" onClick={() => navigate("/home")}>
              Trang chủ
            </button>

            <span>/</span>

            <button type="button" onClick={() => navigate("/blog")}>
              Blog
            </button>

            <span>/</span>

            <strong>{post.category}</strong>
          </div>

          {/* =========================================
              HEADER
          ========================================= */}
          <section className="blog-detail-header">
            <span className="detail-category">{post.category}</span>

            <h1>{post.title}</h1>

            <p>{post.summary}</p>

            <div className="detail-meta">
              <div className="detail-author">
                <span className="detail-author-avatar">✈</span>

                <div>
                  <strong>Airline Booking</strong>

                  <small>Cẩm nang hành trình</small>
                </div>
              </div>

              <span className="detail-date">{post.createdAt}</span>
            </div>
          </section>

          {/* =========================================
              COVER
          ========================================= */}
          <div className="blog-detail-cover">
            <img src={post.image} alt={post.title} />
          </div>

          {/* =========================================
              CONTENT
          ========================================= */}
          <div className="blog-detail-layout">
            <article className="blog-article">
              {post.content.map((item, index) => {
                if (item.type === "heading") {
                  return <h2 key={index}>{item.text}</h2>;
                }

                return <p key={index}>{item.text}</p>;
              })}

              <div className="article-note">
                <div className="article-note-icon">i</div>

                <div>
                  <strong>Lưu ý</strong>

                  <p>
                    Thông tin trong bài viết mang tính tham khảo. Quy định thực
                    tế có thể thay đổi tùy hãng hàng không, chuyến bay và thời
                    điểm.
                  </p>
                </div>
              </div>
            </article>

            {/* =====================================
                SIDEBAR
            ===================================== */}
            <aside className="blog-detail-sidebar">
              <div className="sidebar-card">
                <span className="sidebar-label">AIRLINE BOOKING</span>

                <h3>Sẵn sàng cho chuyến đi?</h3>

                <p>Tìm chuyến bay phù hợp và bắt đầu hành trình của bạn.</p>

                <button type="button" onClick={() => navigate("/home")}>
                  Tìm chuyến bay
                  <span>→</span>
                </button>
              </div>
            </aside>
          </div>

          {/* =========================================
              RELATED
          ========================================= */}
          {relatedPosts.length > 0 && (
            <section className="related-posts">
              <div className="related-heading">
                <span>CÓ THỂ BẠN QUAN TÂM</span>

                <h2>Bài viết liên quan</h2>
              </div>

              <div className="related-grid">
                {relatedPosts.map((item) => (
                  <article
                    key={item.id}
                    className="related-card"
                    onClick={() => navigate(`/blog/${item.slug}`)}
                  >
                    <img src={item.image} alt={item.title} />

                    <div className="related-card-content">
                      <span>{item.category}</span>

                      <h3>{item.title}</h3>

                      <p>{item.summary}</p>

                      <strong>Đọc tiếp →</strong>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <div className="back-blog">
            <button type="button" onClick={() => navigate("/blog")}>
              ← Quay lại Blog
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default BlogDetail;
