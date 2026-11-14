import { useEffect } from "react";
import { Row, Col, Container } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import serviceAreas from "./serviceAreas.json";
import { workProjects, pricingCards, infoCardStyle } from "./webOffer";
import PricingItem from "./PricingItem";

// Service-area pages: /web-design (index) and /web-design/:city.
// Content comes from src/serviceAreas.json. After `npm run build`,
// scripts/prerender-service-areas.js writes a static HTML file per URL with
// the same title/description/canonical, so crawlers don't need to run JS.

const SITE = "https://enigma-labs.com";
const { basePath, areas } = serviceAreas;
type Area = typeof areas[number];

export const areaTitle = (area: Area) => `Web Design & Development in ${area.name}, FL | Enigma Labs`;
const INDEX_TITLE = "Web Design & Development in South Florida | Enigma Labs";
const INDEX_DESCRIPTION =
  "Custom websites, SEO, Google Business Profile setup, hosting and a built-in CRM for businesses in Miami, Fort Lauderdale, Kendall, Brickell, Doral, Hialeah, Homestead and Boca Raton.";

const rowStyle = { margin: "1%" };
const linkStyle = { color: "#68FF00" };
const ctaStyle = {
  display: "inline-block",
  backgroundColor: "#68FF00",
  color: "#000",
  borderRadius: "2rem",
  fontWeight: 700,
  padding: "0.6rem 1.5rem",
  textDecoration: "none"
};
const ctaOutlineStyle = { ...ctaStyle, backgroundColor: "transparent", color: "#68FF00", border: "1px solid #68FF00" };
const workImgStyle = {
  width: "100%",
  height: "100%",
  display: "block" as const,
  objectFit: "cover" as const,
  objectPosition: "top" as const
};

// Sets title, description, canonical and og tags for this route, and puts the
// originals back on the way out (the static index.html canonicals to "/").
function usePageMeta(title: string, description: string, path: string) {
  useEffect(() => {
    const url = `${SITE}${path}`;
    const setAttr = (selector: string, attr: string, value: string) => {
      const el = document.querySelector(selector);
      const previous = el?.getAttribute(attr) ?? null;
      el?.setAttribute(attr, value);
      return () => {
        if (el && previous !== null) el.setAttribute(attr, previous);
      };
    };
    const previousTitle = document.title;
    document.title = title;
    const restores = [
      setAttr('meta[name="description"]', "content", description),
      setAttr('link[rel="canonical"]', "href", url),
      setAttr('meta[property="og:url"]', "content", url),
      setAttr('meta[property="og:title"]', "content", title),
      setAttr('meta[property="og:description"]', "content", description)
    ];
    return () => {
      document.title = previousTitle;
      restores.forEach((restore) => restore());
    };
  }, [title, description, path]);
}

const services = [
  "Custom web design & web development (no templates)",
  "Search engine optimization (SEO) for your city and neighborhoods",
  "Google Business Profile setup & optimization",
  "Hosting, domain setup, updates & support",
  "Built-in CRM for your contacts, mailing list & newsletters",
  "Branding, logos, business cards & ads"
];

const Ctas = () => (
  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
    <Link to="/mockup" style={ctaStyle}>Get a free website mockup →</Link>
    <Link to="/audit" style={ctaOutlineStyle}>Free website audit</Link>
  </div>
);

const AreaLinks = ({ current }: { current?: string }) => (
  <p style={{ lineHeight: 1.9 }}>
    {areas
      .filter((a) => a.slug !== current)
      .map((a, i) => (
        <span key={a.slug}>
          {i > 0 && " · "}
          <Link to={`${basePath}/${a.slug}`} style={linkStyle}>Web Design {a.name}</Link>
        </span>
      ))}
  </p>
);

const Pricing = () => (
  <Row style={rowStyle}>
    <Col sm={12}>
      <h2 id="pricing" className="subsection-title" style={{ marginTop: "5%" }}>Pricing</h2>
    </Col>
    {pricingCards.map((card) => (
      <Col sm={6} key={card.title} style={{ marginBottom: "1.5rem" }}>
        <div style={infoCardStyle}>
          <h3 style={{ color: "#68FF00", fontWeight: 700, marginBottom: "0.75rem", fontSize: "1rem" }}>{card.title}</h3>
          <ul style={{ marginBottom: 0 }}>
            {card.items.map((item) => <PricingItem key={item} item={item} />)}
          </ul>
        </div>
      </Col>
    ))}
  </Row>
);

const Work = () => (
  <>
    <Row style={rowStyle}>
      <Col sm={12}>
        <h2 className="subsection-title" style={{ marginTop: "5%" }}>Recent Work</h2>
      </Col>
    </Row>
    <Row style={rowStyle}>
      {workProjects.map((project) => (
        <Col xs={12} sm={6} md={4} key={project.name} style={{ marginBottom: "1.5rem" }}>
          <a href={project.url} target="_blank" rel="noreferrer" style={{ display: "block", color: "white", textDecoration: "none" }}>
            <div className="work-img-wrap">
              <img style={workImgStyle} alt={project.alt} src={project.image} loading="lazy" />
            </div>
            <h3 style={{ margin: "0.75rem 0 0", fontSize: "1.1rem" }}>{project.name}</h3>
          </a>
        </Col>
      ))}
    </Row>
  </>
);

const Contact = () => (
  <Row style={rowStyle}>
    <Col sm={12}>
      <h2 className="subsection-title mt-5">Ready to get started?</h2>
      <p style={{ maxWidth: "700px", lineHeight: 1.7 }}>
        Already know what you want? <Link to="/onboard" style={linkStyle}>Start your onboarding</Link>, or email us at{" "}
        <a href="mailto:info@enigma-labs.com" className="text-white">info@enigma-labs.com</a>.
      </p>
      <Ctas />
      <div style={{ marginBottom: "8%" }}></div>
    </Col>
  </Row>
);

export const ServiceAreasIndex = () => {
  usePageMeta(INDEX_TITLE, INDEX_DESCRIPTION, basePath);
  return (
    <Container className="aboutContainer">
      <Row style={rowStyle}>
        <Col sm={12}>
          <h1 className="subpage-title aboutTitle">Web Design in South Florida</h1>
          <p style={{ maxWidth: "760px", lineHeight: 1.7, marginTop: "1rem" }}>
            Enigma Labs is a Miami-based digital growth agency building custom websites for South Florida businesses, with SEO, Google
            Business Profile setup, hosting and a built-in CRM included. Pick your area:
          </p>
        </Col>
      </Row>
      <Row style={rowStyle}>
        {areas.map((area) => (
          <Col xs={12} sm={6} md={3} key={area.slug} style={{ marginBottom: "1.5rem" }}>
            <Link to={`${basePath}/${area.slug}`} style={{ textDecoration: "none", color: "white" }}>
              <div style={{ ...infoCardStyle, padding: "1.5rem 1.25rem" }}>
                <h2 style={{ color: "#68FF00", fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.25rem" }}>{area.name}</h2>
                <p style={{ margin: 0, color: "#aaa", fontSize: "0.9rem" }}>{area.county}</p>
              </div>
            </Link>
          </Col>
        ))}
      </Row>
      <Work />
      <Pricing />
      <Contact />
    </Container>
  );
};

export const ServiceAreaPage = () => {
  const { city } = useParams();
  const area = areas.find((a) => a.slug === city);
  usePageMeta(
    area ? areaTitle(area) : INDEX_TITLE,
    area ? area.intro : INDEX_DESCRIPTION,
    area ? `${basePath}/${area.slug}` : basePath
  );

  if (!area) {
    return (
      <Container className="aboutContainer">
        <Row style={rowStyle}>
          <Col sm={12}>
            <h1 className="subpage-title aboutTitle">Web Design in South Florida</h1>
            <p style={{ marginTop: "1rem" }}>We don&apos;t have a page for that area yet. Here are the ones we do:</p>
            <AreaLinks />
            <Link to={basePath} style={linkStyle}>All service areas →</Link>
            <div style={{ marginBottom: "8%" }}></div>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="aboutContainer">
      <Row style={rowStyle}>
        <Col sm={12}>
          <p style={{ color: "#68FF00", letterSpacing: "0.2em", textTransform: "uppercase", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
            {area.county}
          </p>
          <h1 className="subpage-title aboutTitle">Web Design &amp; Development in {area.name}, FL</h1>
          <p style={{ maxWidth: "760px", lineHeight: 1.7, marginTop: "1rem" }}>{area.intro}</p>
          <Ctas />
        </Col>
      </Row>

      <Work />

      <Row style={rowStyle}>
        <Col md={6}>
          <h2 className="subsection-title" style={{ marginTop: "5%" }}>What we do for {area.name} businesses</h2>
          <ul style={{ lineHeight: 1.8 }}>
            {services.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </Col>
        <Col md={6}>
          <h2 className="subsection-title" style={{ marginTop: "5%" }}>Why a website matters in {area.name}</h2>
          <p style={{ lineHeight: 1.7 }}>{area.local}</p>
          <p style={{ lineHeight: 1.7, color: "#aaa" }}>
            Also serving {area.nearby.join(", ")} and the rest of {area.county}.
          </p>
        </Col>
      </Row>

      <Pricing />

      <Row style={rowStyle}>
        <Col sm={12}>
          <h2 className="subsection-title" style={{ marginTop: "5%" }}>Other areas we serve</h2>
          <AreaLinks current={area.slug} />
          <Link to={basePath} style={linkStyle}>All of South Florida →</Link>
        </Col>
      </Row>

      <Contact />
    </Container>
  );
};
