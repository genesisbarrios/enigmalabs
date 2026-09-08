import { useEffect, useState, useLayoutEffect } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Link } from "react-router-dom";
import { db } from "./firebase-config";
import { getDocs, collection } from "firebase/firestore";
import staticPosts, { slugify, stripHtmlExcerpt, BlogPost } from "./blogPosts";

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ""}/api`;

const cardStyle: React.CSSProperties = {
  display: "block",
  height: "100%",
  backgroundColor: "#111",
  border: "1px solid #262626",
  borderRadius: "16px",
  overflow: "hidden",
  textDecoration: "none",
  color: "#fff",
  transition: "border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
};

const bodyStyle: React.CSSProperties = {
  padding: "1.25rem",
};

const categoryStyle: React.CSSProperties = {
  color: "#68FF00",
  fontSize: "0.75rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "0.5rem",
  display: "block",
};

const titleStyle: React.CSSProperties = {
  fontSize: "1.15rem",
  fontWeight: 700,
  marginBottom: "0.5rem",
  color: "#fff",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const excerptStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  color: "#aaa",
  marginBottom: "1rem",
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const metaRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: "0.8rem",
  color: "#777",
};

// A BlogPost card class carries a hover rule (border glow + lift) that plain
// inline styles cannot express — scoped to this component with a unique
// class name instead of a separate stylesheet. The blog-title rule is a
// smaller, page-specific override so the shared .subpage-title size (used
// by About, Wallpapers, etc.) stays untouched.
const hoverStyleTag = `
  .blog-card:hover {
    border-color: #68FF00 !important;
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(104, 255, 0, 0.15);
  }

  .blog-title {
    font-size: 2rem;
    letter-spacing: -0.01em;
  }

  @media only screen and (max-width: 900px) {
    .blog-title { font-size: 1.6rem; }
  }

  @media only screen and (max-width: 600px) {
    .blog-title { font-size: 1.35rem; }
  }
`;

function excerptFor(post: BlogPost | Record<string, any>): string {
  return post.Excerpt || stripHtmlExcerpt(post.Body || "");
}

const Blog = () => {
  // Three sources render together: static posts (see blogPosts.ts for why),
  // legacy Firestore docs, and admin-authored posts from the enigma-node
  // backend (see the Blog section on /admin). Admin posts are shown first
  // since that is now the active way new posts get added.
  const [posts, setPosts] = useState<any[]>(staticPosts);

  useEffect(() => {
    document.title = "Blog | Enigma Labs";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "Web development, marketing, and social media advice for small businesses from Enigma Labs."
    );
  }, []);

  useLayoutEffect(() => {
    const ref = collection(db, "blogs");

    const getBlogs = async () => {
      const [firestoreResult, backendResult] = await Promise.allSettled([
        getDocs(ref),
        fetch(`${API_BASE_URL}/blog`).then((res) => res.json()),
      ]);

      const firestorePosts = firestoreResult.status === "fulfilled" ? firestoreResult.value.docs.map((doc) => ({ ...doc.data() })) : [];
      const backendPosts = backendResult.status === "fulfilled" && backendResult.value?.ok ? backendResult.value.posts : [];

      setPosts([...backendPosts, ...staticPosts, ...firestorePosts]);
    };

    getBlogs();
  }, []);

  return (
    <Container className="aboutContainer">
      <style>{hoverStyleTag}</style>

      <div
        style={{
          width: "100%",
          aspectRatio: "5 / 1",
          borderRadius: "20px",
          overflow: "hidden",
          border: "1px solid #262626",
          marginTop: "2%",
          position: "relative",
        }}
      >
        <img
          src="/blog-hero.jpg"
          alt="Enigma Labs blog — web development and digital marketing insights"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>

      <div className="text-center mb-2" style={{ marginTop: "2rem" }}>
        <h1 className="subpage-title blog-title">Blog</h1>
        <p style={{ color: "#aaa" }}>
          Web development, marketing, and social media advice for small businesses.
        </p>
      </div>

      <Row style={{ margin: "2% 0" }}>
        {posts.map((post) => (
          <Col key={post.Title} xs={12} sm={6} lg={4} className="mb-4">
            <Link to={`/Blog/${slugify(post.Title)}`} className="blog-card" style={cardStyle}>
              <div style={bodyStyle}>
                {post.Category && <span style={categoryStyle}>{post.Category}</span>}
                <h2 style={titleStyle}>{post.Title}</h2>
                <p style={excerptStyle}>{excerptFor(post)}</p>
                <div style={metaRowStyle}>
                  <span>@_enigmalabs</span>
                  <span style={{ color: "#68FF00", fontWeight: 600 }}>Read More →</span>
                </div>
              </div>
            </Link>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Blog;
