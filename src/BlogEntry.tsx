import { useEffect, useState, useLayoutEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Container from "react-bootstrap/Container";
import { db } from "./firebase-config";
import { getDocs, collection } from "firebase/firestore";
import staticPosts, { slugify, stripHtmlExcerpt, estimateReadMinutes, BlogPost } from "./blogPosts";

import "./blogEntry.css";

const SITE_URL = "https://enigma-labs.com";
const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ""}/api`;

const originalTitle = document.title;
const metaOriginals: Record<string, string | null> = {};

// Capture each tag's true site-default value the first time it is ever
// touched, so unmount can restore it exactly instead of guessing.
function captureOriginal(selector: string, attr: string) {
  const key = `${selector}::${attr}`;
  if (!(key in metaOriginals)) {
    metaOriginals[key] = document.querySelector(selector)?.getAttribute(attr) ?? null;
  }
}

function setMeta(selector: string, attr: string, value: string) {
  captureOriginal(selector, attr);
  document.querySelector(selector)?.setAttribute(attr, value);
}

function restoreMeta(selector: string, attr: string) {
  const key = `${selector}::${attr}`;
  const original = metaOriginals[key];
  if (original != null) {
    document.querySelector(selector)?.setAttribute(attr, original);
  }
}

const BlogEntry = () => {
  const { Title: slug } = useParams();
  const staticMatch = staticPosts.find((p) => slugify(p.Title) === slug);
  const [post, setPost] = useState<(BlogPost & Record<string, any>) | undefined>(staticMatch);
  const [notFound, setNotFound] = useState(false);
  // Firestore + admin-authored (backend) posts, fetched once for "Keep
  // Reading" enrichment and as a fallback match when the slug isn't one of
  // the static posts. Neither source stores a slug — matched client-side
  // the same way staticPosts is, via slugify(Title).
  const [otherPosts, setOtherPosts] = useState<(BlogPost & Record<string, any>)[]>([]);

  useLayoutEffect(() => {
    if (staticMatch) {
      setPost(staticMatch);
      setNotFound(false);
    }

    const ref = collection(db, "blogs");
    Promise.allSettled([getDocs(ref), fetch(`${API_BASE_URL}/blog`).then((res) => res.json())]).then(
      ([firestoreResult, backendResult]) => {
        const firestorePosts =
          firestoreResult.status === "fulfilled" ? firestoreResult.value.docs.map((doc) => doc.data()) : [];
        const backendPosts =
          backendResult.status === "fulfilled" && backendResult.value?.ok ? backendResult.value.posts : [];
        const combined = [...backendPosts, ...firestorePosts] as (BlogPost & Record<string, any>)[];
        setOtherPosts(combined);

        if (!staticMatch) {
          const match = combined.find((p) => slugify(p.Title) === slug);
          setPost(match);
          setNotFound(!match);
        }
      }
    );
  }, [slug, staticMatch]);

  useEffect(() => {
    if (!post) return;

    const title = `${post.Title} | Enigma Labs Blog`;
    const description = post.Excerpt || stripHtmlExcerpt(post.Body || "");
    const url = `${SITE_URL}/Blog/${slugify(post.Title)}`;
    const image = post.Image?.startsWith("http") ? post.Image : `${SITE_URL}${post.Image}`;

    document.title = title;
    setMeta('meta[name="description"]', "content", description);
    setMeta('link[rel="canonical"]', "href", url);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[property="og:image"]', "content", image);
    setMeta('meta[property="og:type"]', "content", "article");
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);
    setMeta('meta[name="twitter:image"]', "content", image);

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.Title,
      description,
      image,
      author: { "@type": "Person", name: post.Author },
      datePublished: post.datee,
      publisher: {
        "@type": "Organization",
        name: "Enigma Labs",
        logo: { "@type": "ImageObject", url: `${SITE_URL}/LOGO_100x400.png` },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
    });
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
      // Restore every tag this effect touched to its true site-default
      // value, not just og:type, so navigating away never leaves the
      // last-viewed post's title/image/description behind.
      document.title = originalTitle;
      restoreMeta('meta[name="description"]', "content");
      restoreMeta('link[rel="canonical"]', "href");
      restoreMeta('meta[property="og:title"]', "content");
      restoreMeta('meta[property="og:description"]', "content");
      restoreMeta('meta[property="og:url"]', "content");
      restoreMeta('meta[property="og:image"]', "content");
      restoreMeta('meta[property="og:type"]', "content");
      restoreMeta('meta[name="twitter:title"]', "content");
      restoreMeta('meta[name="twitter:description"]', "content");
      restoreMeta('meta[name="twitter:image"]', "content");
    };
  }, [post]);

  if (notFound) {
    return (
      <Container className="aboutContainer blog-page text-center">
        <h1 className="subpage-title">Post not found</h1>
        <p style={{ color: "#aaa" }}>That post does not exist, or the link is broken.</p>
        <Link to="/Blog" className="socialLinks">← Back to Blog</Link>
      </Container>
    );
  }

  if (!post) {
    return <Container className="aboutContainer" />;
  }

  const readMinutes = estimateReadMinutes(post.Body || "");
  const related = [...otherPosts, ...staticPosts]
    .filter((p) => p.Title !== post.Title)
    .sort((a, b) => (a.Category === post.Category ? -1 : 0) - (b.Category === post.Category ? -1 : 0))
    .slice(0, 2);

  return (
    <Container className="aboutContainer blog-page">
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <div className="blog-entry-hero blog-entry-hero--compact">
          <img src="/blog-hero.jpg" alt="Enigma Labs Blog" />
          <div className="blog-entry-hero-overlay" />
          <div className="blog-entry-hero-content">
            <div className="blog-entry-breadcrumb">
              <Link to="/Blog">← Blog</Link>
              {post.Category && <span> / {post.Category}</span>}
            </div>
            <h1 className="blog-entry-title">{post.Title}</h1>
            <p className="blog-entry-meta">
              {post.datee} · {readMinutes} min read
            </p>
          </div>
        </div>

        <article className="blog-entry-article">
          <section className="blogArticleBody" dangerouslySetInnerHTML={{ __html: post.Body }}></section>
          <div style={{ marginTop: "50px", borderTop: "1px solid #333", paddingTop: "1rem" }}>
            <p style={{ marginBottom: 0 }}>@_enigmalabs</p>
            <p style={{ marginBottom: 0, color: "#999" }}>{post.datee}</p>
          </div>
        </article>
      </div>

      {related.length > 0 && (
        <div style={{ maxWidth: "960px", margin: "3rem auto 0" }}>
          <h2 style={{ fontSize: "1.1rem", color: "#fff", marginBottom: "1rem" }}>Keep Reading</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "3rem" }}>
            {related.map((r) => (
              <Link
                key={r.Title}
                to={`/Blog/${slugify(r.Title)}`}
                className="keep-reading-card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem 1.25rem",
                  backgroundColor: "#111",
                  borderLeft: "3px solid #68FF00",
                  border: "1px solid #262626",
                  borderRadius: "12px",
                  textDecoration: "none",
                  color: "#fff",
                }}
              >
                <div style={{ flex: 1 }}>
                  {r.Category && (
                    <div style={{ color: "#68FF00", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>
                      {r.Category}
                    </div>
                  )}
                  <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{r.Title}</span>
                </div>
                <span style={{ color: "#68FF00", fontWeight: 600, whiteSpace: "nowrap" }}>Read →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </Container>
  );
};

export default BlogEntry;
