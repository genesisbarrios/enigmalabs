import { useEffect } from "react";
import { Row, Col, Container } from "react-bootstrap";
import { PLUGINS } from "./Plugins";
import { RNB_VOCAL } from "./Templates";
import { SAMPLE_PACKS } from "./samplePacks";

// Producer Tools ("Vault" in the nav) — the hub for every product category.
// Each item links to its own page (/plugins, /templates) or, for sample
// packs, straight to the pack on BeatStars. Product pages handle signup and
// download. Items read from shared data (Plugins, Templates, samplePacks.ts)
// so names and images stay in sync. `price` empty = FREE badge; set it (e.g.
// "$29") when paid products arrive.

// external = opens in a new tab (e.g. BeatStars).
type Item = { name: string; tagline: string; image: string; imageAlt: string; href: string; price?: string; square?: boolean; external?: boolean };
type Category = { id: string; title: string; blurb: string; href?: string; hrefLabel?: string; items: Item[]; comingSoon?: string };

const CATEGORIES: Category[] = [
  {
    id: "plugins",
    title: "Plugins",
    blurb: "Effects for your mixes and vocals.",
    href: "/plugins",
    items: PLUGINS.map((p) => ({
      name: p.name,
      tagline: p.tagline,
      image: p.image,
      imageAlt: p.imageAlt,
      href: `/plugins#${p.id}`
    }))
  },
  {
    id: "sample-packs",
    title: "Sample Packs",
    blurb: "Loops, one-shots, and songstarters by gen.wav.",
    href: "https://www.beatstars.com/genwav/sound-kits",
    hrefLabel: "View all on BeatStars →",
    items: SAMPLE_PACKS.map((p) => ({
      name: p.name,
      tagline: p.description.length > 140 ? `${p.description.slice(0, 137).replace(/\s+\S*$/, "")}…` : p.description,
      image: p.image,
      imageAlt: `${p.name} sample pack cover`,
      href: p.url,
      price: p.price || undefined,
      square: true,
      external: true
    }))
  },
  {
    id: "templates",
    title: "Templates",
    blurb: "Ready-to-record vocal chains for your DAW.",
    href: "/templates",
    items: [
      {
        name: "R&B Vocal Template",
        tagline: "A Logic Pro X vocal chain with FX buses — stock plugins and UAD & Waves versions.",
        image: RNB_VOCAL.image,
        imageAlt: "FREE R&B Vocal Template for Logic Pro X",
        href: "/templates"
      }
    ]
  }
];

const GREEN = "#68FF00";

const ProducerTools = () => {
  useEffect(() => {
    document.title = "Producer Tools: Free Plugins, Vocal Templates & Sample Packs | Enigma Labs Vault";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "The Enigma Labs Vault: producer tools including free plugins (Enigma Texture Console, Enigma Vocal Sauce), a free R&B vocal template for Logic Pro X, and sample packs coming soon."
    );
  }, []);

  const jumpTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <Container className="aboutContainer">
      <Row style={{ margin: "1%", marginTop: "1rem" }}>
        <Col xs={12} style={{ textAlign: "center" }}>
          <p style={{ color: GREEN, letterSpacing: "0.3em", textTransform: "uppercase", fontSize: "0.8rem", marginBottom: "0.25rem" }}>The Vault</p>
          <h1 className="subpage-title aboutTitle" style={{ marginTop: 0 }}>Producer Tools</h1>
          <p style={{ color: "#d4d4d4", maxWidth: 600, margin: "0 auto" }}>Plugins, templates, and sample packs from Enigma Labs.</p>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0.5rem", marginTop: "1.25rem" }}>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => jumpTo(c.id)}
                style={{
                  background: "transparent",
                  color: GREEN,
                  border: `1px solid ${GREEN}`,
                  borderRadius: "2rem",
                  padding: "0.4rem 1.1rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {c.title}
              </button>
            ))}
          </div>
        </Col>
      </Row>

      {CATEGORIES.map((c) => (
        <section key={c.id} id={c.id} style={{ scrollMarginTop: 90, marginTop: "3rem" }}>
          <Row style={{ margin: "1%", alignItems: "flex-end" }}>
            <Col>
              <h2 className="subsection-title" style={{ color: GREEN, margin: 0 }}>{c.title}</h2>
              <p style={{ color: "#aaa", margin: "0.25rem 0 0" }}>{c.blurb}</p>
            </Col>
            {c.href ? (
              <Col xs="auto">
                <a
                  href={c.href}
                  {...(c.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  style={{ color: GREEN, fontWeight: 600, textDecoration: "none" }}
                >
                  {c.hrefLabel || "View all →"}
                </a>
              </Col>
            ) : null}
          </Row>

          <Row style={{ margin: "1%", marginTop: "1rem" }}>
            {c.items.map((item) => (
              <Col key={item.href + item.name} xs={12} sm={6} lg={4} style={{ marginBottom: "1.5rem" }}>
                <a
                  href={item.href}
                  {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    background: "#111",
                    border: "1px solid #2b2b2b",
                    borderRadius: 16,
                    padding: "0.85rem",
                    color: "inherit",
                    textDecoration: "none",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = GREEN;
                    e.currentTarget.style.boxShadow = "0 0 24px rgba(104, 255, 0, 0.15)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#2b2b2b";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  <span style={{ position: "relative", display: "block" }}>
                    <img
                      src={item.image}
                      alt={item.imageAlt}
                      loading="lazy"
                      style={{ display: "block", width: "100%", aspectRatio: item.square ? "1 / 1" : "4 / 3", objectFit: "cover", borderRadius: 10 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        background: item.price ? "#fff" : GREEN,
                        color: "#000",
                        fontWeight: 800,
                        fontSize: "0.75rem",
                        letterSpacing: "0.08em",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "2rem"
                      }}
                    >
                      {item.price || "FREE"}
                    </span>
                  </span>
                  <span style={{ display: "block", color: "#fff", fontSize: "1.2rem", fontWeight: 700, marginTop: "0.85rem" }}>{item.name}</span>
                  <span style={{ display: "block", color: "#c9c9c9", lineHeight: 1.55, marginTop: "0.3rem", flexGrow: 1 }}>{item.tagline}</span>
                  <span style={{ display: "block", color: GREEN, fontWeight: 600, marginTop: "0.75rem" }}>
                    {item.external
                      ? item.price
                        ? `Buy on BeatStars — ${item.price} →`
                        : "Download free on BeatStars →"
                      : item.price
                      ? "View →"
                      : "Download free →"}
                  </span>
                </a>
              </Col>
            ))}
            {c.comingSoon ? (
              <Col xs={12} sm={6} lg={4} style={{ marginBottom: "1.5rem" }}>
                <div
                  style={{
                    height: "100%",
                    minHeight: 200,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    border: "1px dashed #3a3a3a",
                    borderRadius: 16,
                    padding: "1.5rem",
                    color: "#c9c9c9"
                  }}
                >
                  <span style={{ color: GREEN, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "0.8rem" }}>
                    Coming soon
                  </span>
                  <span style={{ display: "block", marginTop: "0.5rem", lineHeight: 1.6 }}>{c.comingSoon}</span>
                  <a href="/newsletter" style={{ color: GREEN, fontWeight: 600, marginTop: "0.75rem", textDecoration: "none" }}>
                    Join the newsletter →
                  </a>
                </div>
              </Col>
            ) : null}
          </Row>
        </section>
      ))}

      <div style={{ height: "4rem" }} />
    </Container>
  );
};

export default ProducerTools;
