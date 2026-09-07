import { useEffect, useState, useLayoutEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Container from "react-bootstrap/Container";
import { db } from "./firebase-config";
import { getDocs, collection } from "firebase/firestore";
import staticPosts, { slugify, stripHtmlExcerpt, BlogPost } from "./blogPosts";

import "./blogEntry.css";

const SITE_URL = "https://enigma-labs.com";

function setMeta(selector: string, attr: string, value: string) {
  document.querySelector(selector)?.setAttribute(attr, value);
}

const BlogEntry = () => {
  const { Title: slug } = useParams();
  const staticMatch = staticPosts.find((p) => slugify(p.Title) === slug);
  const [post, setPost] = useState<(BlogPost & Record<string, any>) | undefined>(staticMatch);
  const [notFound, setNotFound] = useState(false);

  useLayoutEffect(() => {
    if (staticMatch) {
      setPost(staticMatch);
      setNotFound(false);
      return;
    }

    // Firestore posts have no stored slug — fetch everything and match by a
    // slugified Title client-side (the collection is small; this mirrors
    // what the old query-by-raw-Title code did, since it also fetched every
    // doc rather than actually applying its own where() filter).
    const ref = collection(db, "blogs");
    getDocs(ref).then((data) => {
      const match = data.docs
        .map((doc) => doc.data())
        .find((p) => slugify(p.Title) === slug) as (BlogPost & Record<string, any>) | undefined;
      setPost(match);
      setNotFound(!match);
    });
  }, [slug]);

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
      // Restore the site-wide default so a back-navigation to another page
      // does not keep this post's og:type="article" etc.
      setMeta('meta[property="og:type"]', "content", "website");
    };
  }, [post]);

  if (notFound) {
    return (
      <Container className="aboutContainer text-center" style={{ marginTop: "10%" }}>
        <h1 className="subpage-title">Post not found</h1>
        <p style={{ color: "#aaa" }}>That post does not exist, or the link is broken.</p>
        <Link to="/Blog" className="socialLinks">← Back to Blog</Link>
      </Container>
    );
  }

  if (!post) {
    return <Container style={{ marginTop: "10%" }} />;
  }

  return (
    <Container className="aboutContainer" style={{ marginTop: "6%" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto 2rem" }}>
        <Link to="/Blog" className="socialLinks" style={{ display: "inline-block", marginBottom: "1.5rem" }}>
          ← Back to Blog
        </Link>
      </div>

      <article
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          backgroundColor: "rgb(250, 250, 250)",
          color: "black",
          boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px",
          padding: "2rem",
          borderRadius: "15px",
        }}
      >
        {post.Category && (
          <span
            style={{
              color: "#45ab01",
              fontSize: "0.8rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {post.Category}
          </span>
        )}
        <h1 style={{ marginTop: "0.5rem" }}>{post.Title}</h1>
        {post.Image && (
          <div style={{ width: "100%", maxHeight: "360px", overflow: "hidden", borderRadius: "10px", margin: "1rem 0" }}>
            <img src={post.Image} alt={post.Title} id="coverImage" style={{ width: "100%", objectFit: "cover" }} />
          </div>
        )}
        <section dangerouslySetInnerHTML={{ __html: post.Body }}></section>
        <div style={{ marginTop: "50px", borderTop: "1px solid #ddd", paddingTop: "1rem" }}>
          <p style={{ marginBottom: 0 }}>@{post.Author}</p>
          <p style={{ marginBottom: 0, color: "#777" }}>{post.datee}</p>
        </div>
      </article>
    </Container>
  );
};

export default BlogEntry;
